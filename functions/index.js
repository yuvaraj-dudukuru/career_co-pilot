/**
 * Enhanced Cloud Functions - Career Co-Pilot
 * Advanced error handling, retry mechanisms, and modular architecture
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors')({ origin: true });
const { 
  deterministicPlanForRole, 
  buildDeterministicWhy, 
  calculateFitScore, 
  getOverlapAndGapSkills 
} = require('./fallbackPlan');
const { 
  validatePlan, 
  validateProfile, 
  sanitizeProfile 
} = require('./validation');
const { 
  safeInitializeFirestore, 
  handleFirestoreError 
} = require('./firestore-safeguards');

// Initialize Firebase Admin with safeguards
let db;
try {
  db = safeInitializeFirestore();
} catch (error) {
  console.error('Failed to initialize Firestore:', error);
  const solution = handleFirestoreError(error, 'initialization');
  throw new Error(`Firestore initialization failed: ${solution.message}`);
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || functions.config().gemini?.key);

// Configuration
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  REQUEST_TIMEOUT: 30000, // 30 seconds
  ALLOWED_ORIGINS: [
    'http://localhost:5000',
    'https://career-compass-2pbvp.web.app',
    'https://career-compass-2pbvp.firebaseapp.com'
  ]
};

// Utility Functions
class ErrorHandler {
  static handle(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    // Log to Firestore for debugging
    this.logError(error, context);
    
    // Return user-friendly error
    if (error.code === 'functions/out-of-memory') {
      return { error: 'Service temporarily unavailable. Please try again.' };
    }
    
    if (error.code === 'functions/timeout') {
      return { error: 'Request timed out. Please try again.' };
    }
    
    if (error.message?.includes('API key')) {
      return { error: 'Service configuration error. Please contact support.' };
    }
    
    return { error: 'An unexpected error occurred. Please try again.' };
  }
  
  static async logError(error, context) {
    try {
      await admin.firestore().collection('error_logs').add({
        error: error.message || error.toString(),
        code: error.code,
        context,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        stack: error.stack
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
}

class RetryHandler {
  static async withRetry(operation, maxRetries = CONFIG.MAX_RETRIES) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

class ValidationService {
  static validateProfile(profile) {
    const result = validateProfile(profile);
    return {
      isValid: result.isValid,
      errors: result.isValid ? [] : [result.error]
    };
  }
  
  static sanitizeProfile(profile) {
    return sanitizeProfile(profile);
  }
}

class AIService {
  static async generateRecommendations(profile) {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY && !functions.config().gemini?.key) {
      console.warn('Gemini API key not configured, using deterministic fallback');
      return this.generateDeterministicRecommendations(profile);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Try 1: Standard prompt
    let planText = await this.callGeminiWithRetry(model, this.buildPrompt(profile));
    let planJson = this.attemptParseResponse(planText);
    
    // Try 2: If parsing failed, use stricter prompt
    if (!planJson) {
      console.warn('First LLM attempt failed, trying with stricter prompt');
      const strictPrompt = this.buildStrictPrompt(profile);
      planText = await this.callGeminiWithRetry(model, strictPrompt);
      planJson = this.attemptParseResponse(planText);
    }
    
    // Fallback: Use deterministic plan if LLM still fails
    if (!planJson || !this.validatePlan(planJson)) {
      console.warn('LLM plan invalid, using deterministic fallback');
      return this.generateDeterministicRecommendations(profile);
    }
    
    return planJson;
  }

  static async callGeminiWithRetry(model, prompt, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        lastError = error;
        console.warn(`Gemini attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  }

  static attemptParseResponse(text) {
    try {
      const cleanedText = this.cleanupResponse(text);
      const data = JSON.parse(cleanedText);
      
      // Validate response structure
      if (!data.recommendations || !Array.isArray(data.recommendations)) {
        return null;
      }
      
      // Validate each recommendation
      for (const rec of data.recommendations) {
        if (!rec.title || !rec.fitScore || !rec.why) {
          return null;
        }
        
        // Validate plan structure
        if (!rec.plan || !Array.isArray(rec.plan.weeks) || rec.plan.weeks.length !== 4) {
          return null;
        }
      }
      
      return data;
    } catch (error) {
      console.warn('Response parsing failed:', error.message);
      return null;
    }
  }

  static cleanupResponse(text) {
    if (!text) return '';
    return text
      .replace(/```json|```/gi, '')
      .replace(/\n+/g, '\n')
      .trim();
  }

  static validatePlan(plan) {
    const result = validatePlan(plan);
    return result.isValid;
  }

  static generateDeterministicRecommendations(profile) {
    // Define common roles with their typical skills
    const roles = [
      {
        title: "Frontend Developer",
        skills: ["JavaScript", "HTML", "CSS", "React", "TypeScript", "Node.js", "Git", "Web Development"]
      },
      {
        title: "Data Analyst", 
        skills: ["SQL", "Python", "Excel", "Statistics", "Data Visualization", "R", "Tableau", "Analytics"]
      },
      {
        title: "UI/UX Designer",
        skills: ["Figma", "Adobe XD", "Sketch", "User Research", "Wireframing", "Prototyping", "Design Systems"]
      },
      {
        title: "Backend Developer",
        skills: ["Python", "Java", "Node.js", "SQL", "API Development", "Database Design", "Cloud Computing"]
      },
      {
        title: "Product Manager",
        skills: ["Project Management", "User Research", "Analytics", "Communication", "Strategy", "Agile", "Leadership"]
      }
    ];

    // Calculate fit scores and generate recommendations
    const recommendations = roles.map(role => {
      const { overlapSkills, gapSkills } = getOverlapAndGapSkills(profile.skills, role.skills);
      const fitScore = calculateFitScore(profile.skills, role.skills);
      const why = buildDeterministicWhy(role.title, overlapSkills, gapSkills);
      const plan = deterministicPlanForRole(role.title, gapSkills, profile);
      
      return {
        roleId: role.title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        title: role.title,
        fitScore,
        why,
        overlapSkills,
        gapSkills,
        plan,
        fallback: true
      };
    });

    // Sort by fit score and return top 3
    return {
      recommendations: recommendations
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 3)
    };
  }
  
  static buildPrompt(profile) {
    return `
You are an expert career advisor. Analyze this student profile and provide 3 career recommendations.

Student Profile:
- Name: ${profile.name}
- Education: ${profile.education}
- Skills: ${profile.skills.join(', ')}
- Interests: ${profile.interests.join(', ')}
- Weekly Time Available: ${profile.weeklyTime} hours
- Budget: ${profile.budget}
- Language: ${profile.language}

Provide recommendations in this EXACT JSON format:
{
  "recommendations": [
    {
      "roleId": "frontend-dev",
      "title": "Frontend Developer",
      "fitScore": 85,
      "why": "Explanation of why this role fits",
      "overlapSkills": ["JavaScript", "HTML"],
      "gapSkills": ["React", "TypeScript"],
      "plan": {
        "weeks": [
          {
            "week": 1,
            "topics": ["Topic 1", "Topic 2"],
            "practice": ["Practice activity"],
            "assessment": "Assessment task",
            "project": "Project description"
          },
          {
            "week": 2,
            "topics": ["Topic 3", "Topic 4"],
            "practice": ["Practice activity 2"],
            "assessment": "Assessment task 2",
            "project": "Project description 2"
          },
          {
            "week": 3,
            "topics": ["Topic 5", "Topic 6"],
            "practice": ["Practice activity 3"],
            "assessment": "Assessment task 3",
            "project": "Project description 3"
          },
          {
            "week": 4,
            "topics": ["Topic 7", "Topic 8"],
            "practice": ["Practice activity 4"],
            "assessment": "Assessment task 4",
            "project": "Capstone project"
          }
        ]
      }
    }
  ]
}

Focus on:
1. Fairness - ignore gender, caste, college ranking
2. Skills-based matching using cosine similarity
3. Practical learning paths
4. Realistic time commitments
5. Budget-appropriate resources

Return ONLY valid JSON, no other text.
    `.trim();
  }

  static buildStrictPrompt(profile) {
    return `
CRITICAL: You MUST return ONLY valid JSON. No explanations, no markdown, no extra text.

Generate 3 career recommendations for this profile:

Name: ${profile.name}
Education: ${profile.education}
Skills: ${profile.skills.join(', ')}
Interests: ${profile.interests.join(', ')}
Weekly Time: ${profile.weeklyTime} hours
Budget: ${profile.budget}
Language: ${profile.language}

REQUIRED JSON FORMAT (EXACTLY 4 WEEKS PER ROLE):
{
  "recommendations": [
    {
      "roleId": "role-id",
      "title": "Role Title",
      "fitScore": 85,
      "why": "Brief explanation",
      "overlapSkills": ["skill1", "skill2"],
      "gapSkills": ["skill3", "skill4"],
      "plan": {
        "weeks": [
          {"week": 1, "topics": ["topic1"], "practice": ["practice1"], "assessment": "assessment1", "project": "project1"},
          {"week": 2, "topics": ["topic2"], "practice": ["practice2"], "assessment": "assessment2", "project": "project2"},
          {"week": 3, "topics": ["topic3"], "practice": ["practice3"], "assessment": "assessment3", "project": "project3"},
          {"week": 4, "topics": ["topic4"], "practice": ["practice4"], "assessment": "assessment4", "project": "capstone"}
        ]
      }
    }
  ]
}

JSON ONLY. NO OTHER TEXT.
    `.trim();
  }
  
}

class SkillAnalysisService {
  static analyzeSkills(profile) {
    const skillCategories = {
      technical: ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS'],
      soft: ['Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management'],
      industry: ['Web Development', 'Data Science', 'AI/ML', 'Cybersecurity', 'Cloud Computing'],
      tools: ['Git', 'Docker', 'AWS', 'Azure', 'Figma', 'Slack', 'Jira'],
      communication: ['Writing', 'Presentation', 'Public Speaking', 'Negotiation'],
      leadership: ['Project Management', 'Team Leadership', 'Strategic Thinking', 'Decision Making']
    };
    
    const analysis = {
      current: [],
      target: [5, 5, 5, 5, 5, 5],
      gaps: [],
      strengths: []
    };
    
    Object.values(skillCategories).forEach((skills, index) => {
      const userSkills = profile.skills || [];
      const matchingSkills = skills.filter(skill => 
        userSkills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      
      const score = Math.min(5, Math.round((matchingSkills.length / skills.length) * 5));
      analysis.current.push(score);
      
      if (score < 3) {
        analysis.gaps.push(...skills.filter(skill => !matchingSkills.includes(skill)));
      } else if (score >= 4) {
        analysis.strengths.push(...matchingSkills);
      }
    });
    
    // Remove duplicates and limit gaps
    analysis.gaps = [...new Set(analysis.gaps)].slice(0, 8);
    analysis.strengths = [...new Set(analysis.strengths)];
    
    return analysis;
  }
}

class ResumeAnalysisService {
  static async extractSkillsFromResume(fileBuffer, mimeType) {
    // This is a mock implementation
    // In production, you would use a proper PDF/DOC parsing library
    const mockSkills = [
      'JavaScript', 'Python', 'React', 'Node.js', 'MongoDB', 'Git',
      'HTML', 'CSS', 'SQL', 'AWS', 'Docker', 'Agile'
    ];
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return random subset of skills
    const shuffled = mockSkills.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 6) + 3);
  }
}

// Main API Functions
exports.app = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, path } = req;
      
      // Route handling
      if (method === 'POST' && path === '/api/recommend') {
        return await handleRecommendations(req, res);
      }
      
      if (method === 'POST' && path === '/api/analyze-resume') {
        return await handleResumeAnalysis(req, res);
      }
      
      if (method === 'POST' && path === '/api/delete_user_data') {
        return await handleDeleteUserData(req, res);
      }
      
      if (method === 'GET' && path === '/health') {
        return await handleHealthCheck(req, res);
      }
      
      res.status(404).json({ error: 'Endpoint not found' });
      
    } catch (error) {
      console.error('Request handling error:', error);
      const errorResponse = ErrorHandler.handle(error, 'request_handler');
      res.status(500).json(errorResponse);
    }
  });
});

async function handleRecommendations(req, res) {
  try {
    const { profile, idToken } = req.body;
    
    // Validate authentication
    if (!idToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Validate profile data
    const validation = ValidationService.validateProfile(profile);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid profile data', 
        details: validation.errors 
      });
    }
    
    // Sanitize profile
    const sanitizedProfile = ValidationService.sanitizeProfile(profile);
    
    // Generate recommendations with built-in retry and fallback
    const recommendations = await AIService.generateRecommendations(sanitizedProfile);
    
    // Add skill analysis
    const skillAnalysis = SkillAnalysisService.analyzeSkills(sanitizedProfile);

    // Save to Firestore with error handling
    try {
      await db.collection('users').doc(userId).set({
        profile: sanitizedProfile,
        recommendations: recommendations.recommendations,
        skillAnalysis,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Log analytics
      await db.collection('analytics').add({
        userId,
        event: 'recommendations_generated',
        data: {
          skillsCount: sanitizedProfile.skills.length,
          interestsCount: sanitizedProfile.interests.length,
          recommendationsCount: recommendations.recommendations.length
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (firestoreError) {
      console.error('Firestore save error:', firestoreError);
      const solution = handleFirestoreError(firestoreError, 'save_user_data');
      // Continue execution - don't fail the entire request for Firestore issues
      console.warn('Continuing without Firestore save due to:', solution.message);
    }
    
    res.json({
      success: true,
      recommendations: recommendations.recommendations,
      skillAnalysis,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Recommendations error:', error);
    const errorResponse = ErrorHandler.handle(error, 'recommendations');
    res.status(500).json(errorResponse);
  }
}

async function handleResumeAnalysis(req, res) {
  try {
    const { idToken, fileData, mimeType } = req.body;
    
    // Validate authentication
    if (!idToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Validate file data
    if (!fileData || !mimeType) {
      return res.status(400).json({ error: 'File data and MIME type required' });
    }
    
    // Extract skills from resume
    const extractedSkills = await ResumeAnalysisService.extractSkillsFromResume(
      Buffer.from(fileData, 'base64'), 
      mimeType
    );
    
    // Update user profile with extracted skills
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const existingSkills = userData.profile?.skills || [];
        const updatedSkills = [...new Set([...existingSkills, ...extractedSkills])];
        
        await userRef.update({
          'profile.skills': updatedSkills,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (firestoreError) {
      console.error('Firestore update error:', firestoreError);
      const solution = handleFirestoreError(firestoreError, 'update_user_skills');
      console.warn('Continuing without Firestore update due to:', solution.message);
    }
    
    res.json({
      success: true,
      extractedSkills,
      message: 'Resume analyzed successfully'
    });
    
  } catch (error) {
    console.error('Resume analysis error:', error);
    const errorResponse = ErrorHandler.handle(error, 'resume_analysis');
    res.status(500).json(errorResponse);
  }
}

async function handleDeleteUserData(req, res) {
  try {
    const { idToken } = req.body;
    
    // Validate authentication
    if (!idToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Delete user data from Firestore with error handling
    try {
      await db.collection('users').doc(userId).delete();
      
      // Delete analytics data
      const analyticsQuery = db
        .collection('analytics')
        .where('userId', '==', userId);
      
      const analyticsSnapshot = await analyticsQuery.get();
      const batch = db.batch();
      
      analyticsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (firestoreError) {
      console.error('Firestore delete error:', firestoreError);
      const solution = handleFirestoreError(firestoreError, 'delete_user_data');
      throw new Error(`Failed to delete user data: ${solution.message}`);
    }
    
    res.json({ 
      success: true, 
      message: 'All user data deleted successfully' 
    });
    
  } catch (error) {
    console.error('Delete user data error:', error);
    const errorResponse = ErrorHandler.handle(error, 'delete_user_data');
    res.status(500).json(errorResponse);
  }
}

async function handleHealthCheck(req, res) {
  try {
    // Check Firebase connection with error handling
    let firestoreStatus = 'healthy';
    try {
      await db.collection('health').doc('check').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (firestoreError) {
      console.error('Firestore health check error:', firestoreError);
      const solution = handleFirestoreError(firestoreError, 'health_check');
      firestoreStatus = 'error';
    }
    
    // Check Gemini API (if key is available)
    let geminiStatus = 'not_configured';
    if (process.env.GEMINI_API_KEY || functions.config().gemini?.key) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        await model.generateContent('test');
        geminiStatus = 'healthy';
      } catch (error) {
        geminiStatus = 'error';
      }
    }
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      version: 'v2.0',
      services: {
        firestore: firestoreStatus,
        gemini: geminiStatus
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

// Scheduled Functions
exports.cleanupOldLogs = functions.pubsub.schedule('0 2 * * *').onRun(async (context) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oldLogsQuery = admin.firestore()
      .collection('error_logs')
      .where('timestamp', '<', thirtyDaysAgo);
    
    const oldLogsSnapshot = await oldLogsQuery.get();
    const batch = admin.firestore().batch();
    
    oldLogsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log(`Cleaned up ${oldLogsSnapshot.docs.length} old error logs`);
    
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

// Export individual functions for testing
module.exports = {
  ErrorHandler,
  RetryHandler,
  ValidationService,
  AIService,
  SkillAnalysisService,
  ResumeAnalysisService
};
