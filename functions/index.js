import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { 
  cleanupJsonString,
  cleanLLMOutput,
  cosine, 
  buildUserVector, 
  buildRoleVector, 
  calculateSkillOverlap,
  overlapRatio,
  formatFitScore,
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
async function geminiCall(messages, model = 'gemini-1.5-flash') {
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

  // Timeout controller (15s max)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  clearTimeout(timeout);

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
    const { overlap, gaps } = calculateSkillOverlap(profile.skills, role);
    const oRatio = overlapRatio(profile.skills, role);
    // Fit score formula
    const score = formatFitScore(cosineScore, oRatio);

    return {
      role,
      score,
      overlap,
      gaps,
      metrics: {
        cosine: Number(cosineScore.toFixed(4)),
        overlapRatio: Number(oRatio.toFixed(4))
      }
    };
  });

  // Sort by score descending and return top 3
  return scoredRoles
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Deterministic fallback learning plan based on top gaps
 */
function deterministicFallbackPlan(profile, gapSkills, roleTitle) {
  const topGaps = (gapSkills || []).slice(0, 6);
  const hours = profile.weeklyTime || 6;
  const weeks = [1,2,3,4].map((w, i) => ({
    week: w,
    topics: [
      i === 0 ? `Foundations of ${roleTitle}` : `Deep dive: ${topGaps[i % Math.max(1, topGaps.length)]}`,
      i < topGaps.length ? `Concepts: ${topGaps[i]}` : 'Practice & review'
    ],
    practice: [
      'Hands-on exercises (free tutorials, official docs)',
      'Implement small features or scripts'
    ],
    assessment: 'Self-check with quizzes or coding challenges',
    project: i === 3 ? `Capstone: Build a small ${roleTitle} portfolio piece` : 'Mini project applying weekly topics'
  }));
  return { weeks };
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
    let response = await geminiCall(prompt, 'gemini-1.5-flash');
    
    // Clean up response
    let cleaned = cleanLLMOutput(response);
    let planJson;
    
    try {
      planJson = JSON.parse(cleaned);
    } catch (parseError) {
      console.log('First JSON parse failed, attempting retry...');
      
      // Retry with Pro model for better JSON generation
      const retryPrompt = buildRetryPrompt(cleaned);
      const retryResponse = await geminiCall(retryPrompt, 'gemini-1.5-pro');
      cleaned = cleanLLMOutput(retryResponse);
      
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
    // Fallback to deterministic template
    return deterministicFallbackPlan(profile, gapSkills, roleTitle);
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
    
    for (const { role, score, overlap, gaps, metrics } of topRoles) {
      try {
        // Generate explanation
        const why = await generateExplanation(profile, role, overlap, gaps);
        
        // Generate learning plan
        const plan = await generateLearningPlan(profile, gaps, role.title);
        
        recommendations.push({
          roleId: role.roleId,
          title: role.title,
          fitScore: score,
          metrics,
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

    // Return response including recommendationId for client share links
    res.json({ recommendationId: recommendationRef.id, ...finalResponse });
    
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
 * Create time-limited share token for a recommendation (24h expiry)
 */
app.post('/api/share/:recommendationId', verifyAuth, async (req, res) => {
  try {
    const firestore = admin.firestore();
    const { recommendationId } = req.params;

    // Generate random token
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    const tokenDoc = firestore.collection('shareTokens').doc(token);
    await tokenDoc.set({
      uid: req.uid,
      recommendationId,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ token, expiresAt });
  } catch (error) {
    console.error('Create share token failed:', error);
    res.status(500).json({ error: 'Failed to create share token' });
  }
});

/**
 * View shared plan via token (read-only, no auth required)
 */
app.get('/api/share/view/:token', async (req, res) => {
  try {
    const firestore = admin.firestore();
    const { token } = req.params;
    const doc = await firestore.collection('shareTokens').doc(token).get();
    if (!doc.exists) return res.status(404).json({ error: 'Invalid token' });
    const data = doc.data();
    if (!data.expiresAt || Date.now() > data.expiresAt) {
      return res.status(410).json({ error: 'Token expired' });
    }

    const recRef = firestore
      .collection('users').doc(data.uid)
      .collection('recommendations').doc(data.recommendationId);
    const recDoc = await recRef.get();
    if (!recDoc.exists) return res.status(404).json({ error: 'Recommendation not found' });

    res.json({ recommendation: recDoc.data() });
  } catch (error) {
    console.error('View shared plan failed:', error);
    res.status(500).json({ error: 'Failed to fetch shared plan' });
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
 * Generate printable HTML for a recommendation plan (optional server-side PDF flow)
 */
app.post('/api/generate_pdf', verifyAuth, async (req, res) => {
  try {
    const { recommendationId } = req.body || {};
    if (!recommendationId) {
      return res.status(400).json({ error: 'recommendationId is required' });
    }

    const firestore = admin.firestore();
    const recRef = firestore
      .collection('users').doc(req.uid)
      .collection('recommendations').doc(recommendationId);
    const recDoc = await recRef.get();
    if (!recDoc.exists) return res.status(404).json({ error: 'Recommendation not found' });

    const rec = recDoc.data();
    const title = 'Career Roadmap';
    const dateStr = new Date().toLocaleDateString();

    // Build simple printable HTML
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 16mm; }
    h1 { margin: 0 0 8px 0; }
    .meta { color: #666; margin-bottom: 16px; }
    .card { border: 1px solid #ddd; padding: 12px; margin-bottom: 16px; }
    .skills { margin: 8px 0; }
    .chip { display: inline-block; padding: 3px 8px; border-radius: 12px; margin: 2px; font-size: 12px; border: 1px solid #ccc; }
    .overlap { background: #e8f7ef; border-color: #a8e0c5; }
    .gap { background: #fdecea; border-color: #f5b5ae; }
    .week { border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px; }
    @page { size: A4; margin: 12mm; }
  </style>
  <script>window.onload = function(){ window.print(); }</script>
  </head>
<body>
  <h1>${title}</h1>
  <div class="meta">Generated on ${dateStr}</div>
  ${(rec.top3Recommendations || []).map(r => `
    <div class="card">
      <h2>${r.title} — Fit ${r.fitScore}%</h2>
      ${r.metrics ? `<div class="meta">cosine: ${Number(r.metrics.cosine).toFixed(2)}, overlap: ${Number(r.metrics.overlapRatio).toFixed(2)}</div>` : ''}
      <p>${r.why || ''}</p>
      <div class="skills">
        <div><strong>Matching Skills:</strong> ${(r.overlapSkills||[]).map(s=>`<span class="chip overlap">${s}</span>`).join(' ')}</div>
        <div><strong>Skills to Learn:</strong> ${(r.gapSkills||[]).map(s=>`<span class="chip gap">${s}</span>`).join(' ')}</div>
      </div>
      ${(r.plan?.weeks || []).map(w => `
        <div class="week">
          <h3>Week ${w.week}</h3>
          <p><strong>Topics:</strong> ${(w.topics||[]).join(', ')}</p>
          <p><strong>Practice:</strong> ${(Array.isArray(w.practice)?w.practice:[w.practice]).join(', ')}</p>
          <p><strong>Assessment:</strong> ${w.assessment || ''}</p>
          <p><strong>Project:</strong> ${w.project || ''}</p>
        </div>
      `).join('')}
    </div>
  `).join('')}
</body>
</html>`;

    res.json({ html });
  } catch (error) {
    console.error('Generate PDF failed:', error);
    res.status(500).json({ error: 'Failed to generate printable HTML' });
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
