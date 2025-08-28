import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import admin from 'firebase-admin';
import { 
  cleanupJsonString, 
  cosine, 
  buildUserVector, 
  buildRoleVector, 
  calculateSkillOverlap,
  sanitizeProfile,
  logAnalytics
} from './utils.js';
import { 
  buildExplainPrompt, 
  buildPlanPrompt, 
  buildRetryPrompt 
} from './prompts.js';
import { 
  PlanSchema, 
  RecommendationResponseSchema,
  UserProfileSchema 
} from './schema.js';
import roles from './roles.json' assert { type: 'json' };

// Initialize Firebase Admin
admin.initializeApp();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Configure CORS
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ 
  origin: allowedOrigin,
  credentials: true 
}));

/**
 * Verify Firebase ID token middleware
 */
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }
    
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (error) {
    console.error('Auth verification failed:', error);
    return res.status(401).json({ error: 'Invalid authorization token' });
  }
}

/**
 * Get Gemini API key from environment or Firebase config
 */
function getGeminiApiKey() {
  // Try environment variable first
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  
  // Fallback to Firebase config
  try {
    const config = admin.functions().config();
    return config.gemini?.key;
  } catch (error) {
    console.error('Failed to get Firebase config:', error);
    return null;
  }
}

/**
 * Make API call to Gemini
 */
async function geminiCall(messages, model = 'gemini-1.5-flash-latest') {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const body = {
    contents: messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }))
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return text;
}

/**
 * Calculate top 3 role recommendations based on skill matching
 */
function calculateTop3Roles(profile) {
  const userVector = buildUserVector(profile.skills);
  
  const scoredRoles = roles.map(role => {
    const roleVector = buildRoleVector(role);
    const cosineScore = cosine(userVector, roleVector);
    
    const { overlap } = calculateSkillOverlap(profile.skills, role);
    const overlapRatio = overlap.length / Math.max(1, role.skills.length);
    
    // Base score: 60% cosine similarity + 40% overlap ratio
    const baseScore = 0.6 * cosineScore + 0.4 * overlapRatio;
    
    return {
      role,
      score: Math.round(baseScore * 100),
      overlap
    };
  });

  // Sort by score descending and return top 3
  return scoredRoles
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Generate recommendation explanation using Gemini
 */
async function generateExplanation(profile, role, overlapSkills, gapSkills) {
  try {
    const prompt = buildExplainPrompt(profile, role, overlapSkills, gapSkills);
    const response = await geminiCall(prompt, 'gemini-1.5-flash-latest');
    return response.trim();
  } catch (error) {
    console.error('Explanation generation failed:', error);
    // Fallback explanation
    return `This role fits your profile based on your ${overlapSkills.length} matching skills. Focus on learning ${gapSkills.slice(0, 3).join(', ')} to excel in this career path.`;
  }
}

/**
 * Generate learning plan using Gemini with retry logic
 */
async function generateLearningPlan(profile, gapSkills, roleTitle) {
  try {
    // First attempt with Flash model for speed
    const prompt = buildPlanPrompt(profile, gapSkills, roleTitle);
    let response = await geminiCall(prompt, 'gemini-1.5-flash-latest');
    
    // Clean up response
    let cleaned = cleanupJsonString(response);
    let planJson;
    
    try {
      planJson = JSON.parse(cleaned);
    } catch (parseError) {
      console.log('First JSON parse failed, attempting retry...');
      
      // Retry with Pro model for better JSON generation
      const retryPrompt = buildRetryPrompt(cleaned);
      const retryResponse = await geminiCall(retryPrompt, 'gemini-1.5-pro-latest');
      cleaned = cleanupJsonString(retryResponse);
      
      try {
        planJson = JSON.parse(cleaned);
      } catch (retryParseError) {
        console.error('Retry JSON parse failed:', retryParseError);
        throw new Error('Failed to generate valid learning plan JSON');
      }
    }

    // Validate against schema
    const validation = PlanSchema.safeParse(planJson);
    if (!validation.success) {
      console.error('Plan validation failed:', validation.error);
      throw new Error('Generated plan does not match required schema');
    }

    return validation.data;
  } catch (error) {
    console.error('Learning plan generation failed:', error);
    throw error;
  }
}

/**
 * Main recommendation endpoint
 */
app.post('/api/recommend', verifyAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validate API key
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Server not configured. Please contact administrator.' 
      });
    }

    // Get and validate profile
    const rawProfile = req.body?.profile || {};
    const profileValidation = UserProfileSchema.safeParse(rawProfile);
    
    if (!profileValidation.success) {
      return res.status(400).json({ 
        error: 'Invalid profile data',
        details: profileValidation.error.errors
      });
    }

    const profile = sanitizeProfile(rawProfile);
    
    // Calculate top 3 roles
    const topRoles = calculateTop3Roles(profile);
    
    if (topRoles.length === 0) {
      return res.status(500).json({ 
        error: 'No suitable roles found. Please try with different skills.' 
      });
    }

    // Generate recommendations for each role
    const recommendations = [];
    
    for (const { role, score, overlap } of topRoles) {
      try {
        const { gaps } = calculateSkillOverlap(profile.skills, role);
        
        // Generate explanation
        const why = await generateExplanation(profile, role, overlap, gaps);
        
        // Generate learning plan
        const plan = await generateLearningPlan(profile, gaps, role.title);
        
        recommendations.push({
          roleId: role.roleId,
          title: role.title,
          fitScore: score,
          why: why,
          overlapSkills: overlap,
          gapSkills: gaps,
          plan: plan
        });
        
      } catch (error) {
        console.error(`Failed to generate recommendation for ${role.title}:`, error);
        // Continue with other roles
      }
    }

    if (recommendations.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to generate any recommendations. Please try again.' 
      });
    }

    // Validate final response
    const finalResponse = { recommendations };
    const responseValidation = RecommendationResponseSchema.safeParse(finalResponse);
    
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      return res.status(500).json({ 
        error: 'Generated recommendations are invalid. Please try again.' 
      });
    }

    // Save to Firestore
    const firestore = admin.firestore();
    const userRef = firestore.collection('users').doc(req.uid);
    const profileRef = userRef.collection('profile').doc('latest');
    const recommendationRef = userRef.collection('recommendations').doc();

    const batch = firestore.batch();
    
    // Save profile
    batch.set(profileRef, {
      ...profile,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Save recommendation
    batch.set(recommendationRef, {
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      inputProfileSnapshot: profile,
      top3Recommendations: recommendations,
      modelVersion: 'v1.0'
    });

    await batch.commit();

    // Log analytics
    await logAnalytics(firestore, req.uid, 'recommendation_generated', {
      processingTime: Date.now() - startTime,
      rolesCount: recommendations.length,
      userAgent: req.headers['user-agent']
    });

    // Return response
    res.json(finalResponse);
    
  } catch (error) {
    console.error('Recommendation generation failed:', error);
    
    // Log analytics for failure
    try {
      const firestore = admin.firestore();
      await logAnalytics(firestore, req.uid, 'recommendation_failed', {
        error: error.message,
        processingTime: Date.now() - startTime
      });
    } catch (analyticsError) {
      console.error('Failed to log analytics:', analyticsError);
    }
    
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * Delete user data endpoint
 */
app.post('/api/delete_user_data', verifyAuth, async (req, res) => {
  try {
    const firestore = admin.firestore();
    const userRef = firestore.collection('users').doc(req.uid);
    
    // Get all user documents
    const [profileDocs, recommendationDocs, analyticsDocs] = await Promise.all([
      userRef.collection('profile').get(),
      userRef.collection('recommendations').get(),
      firestore.collection('analytics').where('uid', '==', req.uid).get()
    ]);
    
    // Create batch delete
    const batch = firestore.batch();
    
    // Delete profile documents
    profileDocs.forEach(doc => batch.delete(doc.ref));
    
    // Delete recommendation documents
    recommendationDocs.forEach(doc => batch.delete(doc.ref));
    
    // Delete analytics documents
    analyticsDocs.forEach(doc => batch.delete(doc.ref));
    
    // Delete user document
    batch.delete(userRef);
    
    // Execute batch
    await batch.commit();
    
    res.json({ 
      success: true, 
      message: 'All user data deleted successfully' 
    });
    
  } catch (error) {
    console.error('User data deletion failed:', error);
    res.status(500).json({ 
      error: 'Failed to delete user data',
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: 'v1.0'
  });
});

/**
 * Error handling middleware
 */
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

/**
 * 404 handler
 */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Career Co-Pilot API running on port ${PORT}`);
  console.log(`📝 Recommendation endpoint: /api/recommend`);
  console.log(`🗑️  Delete data endpoint: /api/delete_user_data`);
  console.log(`🏥 Health check: /health`);
});

export default app;
