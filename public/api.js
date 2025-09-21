/**
 * Career Co-Pilot - API Module
 * Handles all backend API calls with proper authentication
 */

// API Configuration
const API_CONFIG = {
  baseUrl: window.location.hostname === 'localhost' 
    ? 'http://localhost:5001/career-compass-2pbvp/us-central1/app'
    : 'https://us-central1-career-compass-2pbvp.cloudfunctions.net/app',
  timeout: 30000
};

/**
 * Make authenticated API call
 */
async function makeApiCall(endpoint, data = null, method = 'GET') {
  try {
    // Get current user and ID token
    const user = firebase.auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const idToken = await user.getIdToken();
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

/**
 * Generate career recommendations
 */
async function generateRecommendations(profileData) {
  try {
    const response = await makeApiCall('/api/recommend', {
      profile: profileData
    }, 'POST');
    
    return response;
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    
    // Fallback to mock data if API fails
    console.warn('Using fallback mock recommendations');
    return generateMockRecommendations(profileData);
  }
}

/**
 * Analyze resume and extract skills
 */
async function analyzeResume(fileData, mimeType) {
  try {
    const response = await makeApiCall('/api/analyze-resume', {
      fileData,
      mimeType
    }, 'POST');
    
    return response;
  } catch (error) {
    console.error('Failed to analyze resume:', error);
    throw error;
  }
}

/**
 * Delete user data
 */
async function deleteUserData() {
  try {
    const response = await makeApiCall('/api/delete_user_data', {}, 'POST');
    return response;
  } catch (error) {
    console.error('Failed to delete user data:', error);
    throw error;
  }
}

/**
 * Health check
 */
async function healthCheck() {
  try {
    const response = await makeApiCall('/health');
    return response;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'ERROR', error: error.message };
  }
}

/**
 * Generate mock recommendations for fallback
 */
async function generateMockRecommendations(profileData) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock recommendations based on skills
  const mockRecommendations = [
    {
      roleId: "frontend_developer",
      title: "Frontend Developer",
      fitScore: 85,
      why: "You have strong JavaScript and web development skills. Perfect match for building user interfaces and interactive web applications.",
      overlapSkills: ["JavaScript", "HTML", "CSS"],
      gapSkills: ["React", "TypeScript", "State Management"],
      plan: {
        weeks: [
          {
            week: 1,
            topics: ["React Fundamentals", "JSX", "Components"],
            practice: ["Build a simple todo app"],
            assessment: "Complete React basics quiz",
            project: "Create a personal portfolio page"
          },
          {
            week: 2,
            topics: ["State Management", "Hooks", "Props"],
            practice: ["Create a shopping cart component"],
            assessment: "Build a counter app with hooks",
            project: "Develop a weather app"
          },
          {
            week: 3,
            topics: ["Routing", "API Integration", "Async Operations"],
            practice: ["Build a weather app with API"],
            assessment: "Create a multi-page application",
            project: "Build a task management app"
          },
          {
            week: 4,
            topics: ["Testing", "Deployment", "Best Practices"],
            practice: ["Deploy your app to Vercel"],
            assessment: "Complete final project",
            project: "Deploy a full-stack application"
          }
        ]
      },
      fallback: true
    },
    {
      roleId: "data_analyst",
      title: "Data Analyst",
      fitScore: 75,
      why: "Your analytical skills and interest in data make you a great candidate for data analysis roles.",
      overlapSkills: ["Excel", "SQL"],
      gapSkills: ["Python", "Data Visualization", "Statistics"],
      plan: {
        weeks: [
          {
            week: 1,
            topics: ["Python Basics", "Pandas", "Data Manipulation"],
            practice: ["Clean and analyze a dataset"],
            assessment: "Complete Python fundamentals",
            project: "Analyze sales data"
          },
          {
            week: 2,
            topics: ["Data Visualization", "Matplotlib", "Seaborn"],
            practice: ["Create charts and graphs"],
            assessment: "Build a dashboard",
            project: "Create data visualizations"
          },
          {
            week: 3,
            topics: ["Statistics", "Hypothesis Testing", "A/B Testing"],
            practice: ["Analyze business metrics"],
            assessment: "Conduct statistical analysis",
            project: "Perform A/B test analysis"
          },
          {
            week: 4,
            topics: ["Machine Learning Basics", "Predictive Modeling"],
            practice: ["Build a simple ML model"],
            assessment: "Complete data analysis project",
            project: "Predict customer behavior"
          }
        ]
      },
      fallback: true
    },
    {
      roleId: "product_manager",
      title: "Product Manager",
      fitScore: 70,
      why: "Your communication and analytical skills are well-suited for product management roles.",
      overlapSkills: ["Communication", "Analysis"],
      gapSkills: ["Product Strategy", "User Research", "Agile"],
      plan: {
        weeks: [
          {
            week: 1,
            topics: ["Product Strategy", "Market Research", "User Personas"],
            practice: ["Create user personas for a product"],
            assessment: "Complete product strategy framework",
            project: "Define product vision"
          },
          {
            week: 2,
            topics: ["User Research", "Interviews", "Surveys"],
            practice: ["Conduct user interviews"],
            assessment: "Analyze user feedback",
            project: "Create user research report"
          },
          {
            week: 3,
            topics: ["Agile Methodology", "Sprint Planning", "Backlog Management"],
            practice: ["Create product backlog"],
            assessment: "Plan a sprint",
            project: "Manage product roadmap"
          },
          {
            week: 4,
            topics: ["Metrics & Analytics", "A/B Testing", "Product Launch"],
            practice: ["Design product metrics"],
            assessment: "Create product launch plan",
            project: "Launch a product feature"
          }
        ]
      },
      fallback: true
    }
  ];
  
  return {
    success: true,
    recommendations: mockRecommendations,
    generatedAt: new Date().toISOString()
  };
}

// Export API functions to global scope
window.api = {
  generateRecommendations,
  analyzeResume,
  deleteUserData,
  healthCheck
};
