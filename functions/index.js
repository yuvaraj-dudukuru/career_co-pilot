/**
 * Enhanced Cloud Functions - Career Co-Pilot
 * Advanced error handling, retry mechanisms, and modular architecture
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

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
    const errors = [];
    
    if (!profile.name || typeof profile.name !== 'string' || profile.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!profile.education || typeof profile.education !== 'string') {
      errors.push('Education level is required');
    }
    
    if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
      errors.push('At least one skill is required');
    }
    
    if (!Array.isArray(profile.interests) || profile.interests.length === 0) {
      errors.push('At least one interest is required');
    }
    
    if (!profile.weeklyTime || isNaN(profile.weeklyTime) || profile.weeklyTime < 1) {
      errors.push('Weekly time commitment must be at least 1 hour');
    }
    
    if (!profile.budget || !['free', 'low', 'any'].includes(profile.budget)) {
      errors.push('Budget preference is required');
    }
    
    if (!profile.language || !['en', 'hi'].includes(profile.language)) {
      errors.push('Language must be English or Hindi');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static sanitizeProfile(profile) {
    return {
      name: profile.name?.trim(),
      education: profile.education?.trim(),
      skills: profile.skills?.map(skill => skill.trim()).filter(skill => skill.length > 0),
      interests: profile.interests?.map(interest => interest.trim()).filter(interest => interest.length > 0),
      weeklyTime: parseInt(profile.weeklyTime),
      budget: profile.budget,
      language: profile.language
    };
  }
}

class AIService {
  static async generateRecommendations(profile) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = this.buildPrompt(profile);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseResponse(text);
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error('Failed to generate recommendations');
    }
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
            "practice": "Practice activity",
            "assessment": "Assessment task",
            "project": "Project description"
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
  
  static parseResponse(text) {
    try {
      // Clean the response text
      const cleanedText = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanedText);
      
      // Validate response structure
      if (!data.recommendations || !Array.isArray(data.recommendations)) {
        throw new Error('Invalid response structure');
      }
      
      // Validate each recommendation
      data.recommendations.forEach((rec, index) => {
        if (!rec.title || !rec.fitScore || !rec.why) {
          throw new Error(`Invalid recommendation at index ${index}`);
        }
      });
      
      return data;
    } catch (error) {
      console.error('Response parsing error:', error);
      throw new Error('Failed to parse AI response');
    }
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
    
    // Generate recommendations with retry
    const recommendations = await RetryHandler.withRetry(async () => {
      return await AIService.generateRecommendations(sanitizedProfile);
    });
    
    // Add skill analysis
    const skillAnalysis = SkillAnalysisService.analyzeSkills(sanitizedProfile);
    
    // Save to Firestore
    await admin.firestore().collection('users').doc(userId).set({
      profile: sanitizedProfile,
      recommendations: recommendations.recommendations,
      skillAnalysis,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Log analytics
    await admin.firestore().collection('analytics').add({
      userId,
      event: 'recommendations_generated',
      data: {
        skillsCount: sanitizedProfile.skills.length,
        interestsCount: sanitizedProfile.interests.length,
        recommendationsCount: recommendations.recommendations.length
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
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
    const userRef = admin.firestore().collection('users').doc(userId);
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
    
    // Delete user data from Firestore
    await admin.firestore().collection('users').doc(userId).delete();
    
    // Delete analytics data
    const analyticsQuery = admin.firestore()
      .collection('analytics')
      .where('userId', '==', userId);
    
    const analyticsSnapshot = await analyticsQuery.get();
    const batch = admin.firestore().batch();
    
    analyticsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
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
    // Check Firebase connection
    await admin.firestore().collection('health').doc('check').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
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
        firestore: 'healthy',
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
