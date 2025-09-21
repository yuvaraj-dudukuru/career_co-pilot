/**
 * Career Co-Pilot - Main Application File
 * Firebase init, auth flows, and API wiring for recommendations
 */

// Firebase configuration (PLACEHOLDER - fill via Firebase Console/project config)
const firebaseConfig = {
  apiKey: "AIzaSyCZ-0sEOwTFKcBPUG57lfJZcKPZqxg9fh8",
  authDomain: "career-compass-2pbvp.firebaseapp.com",
  projectId: "career-compass-2pbvp",
  storageBucket: "career-compass-2pbvp.firebasestorage.app",
  messagingSenderId: "302412499404",
  appId: "1:302412499404:web:98989eacf9dddc8ff5f569",
  measurementId: "G-L1D2E1762E"
};

// Initialize Firebase (safe guard if SDK loaded)
if (typeof firebase !== 'undefined' && !firebase.apps?.length) {
  try { firebase.initializeApp(firebaseConfig); } catch (e) { console.warn('Firebase init failed:', e); }
}       

// Global state
let currentUser = null;
let userProfile = null;

/**
 * Initialize the application
 */
function initApp() {
  console.log('Initializing Career Co-Pilot...');
  
  // Auth state listener
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
      currentUser = user || null;
      if (currentUser) {
        showAuthenticatedUI(currentUser);
      } else {
        showUnauthenticatedUI();
      }
    });
  }
  
  // Set up UI event listeners
  setupEventListeners();
}

/**
 * Show UI for authenticated users
 */
function showAuthenticatedUI(user) {
  // Update header
  const signInBtn = document.getElementById('signInBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const userMenu = document.getElementById('userMenu');
  const userName = document.getElementById('userName');
  
  if (signInBtn) signInBtn.style.display = 'none';
  if (signOutBtn) signOutBtn.style.display = 'inline-flex';
  if (userMenu) userMenu.style.display = 'flex';
  if (userName) userName.textContent = user.displayName || user.email;
  
  // Show appropriate content based on current page
  const currentPage = window.location.pathname;
  
  if (currentPage === '/' || currentPage === '/index.html') {
    // On home page, show profile form
    showProfileSection();
  } else if (currentPage === '/dashboard.html') {
    // On dashboard, load recommendations
    loadRecommendations();
  }
}

/**
 * Show UI for unauthenticated users
 */
function showUnauthenticatedUI() {
  // Update header
  const signInBtn = document.getElementById('signInBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const userMenu = document.getElementById('userMenu');
  
  if (signInBtn) signInBtn.style.display = 'inline-flex';
  if (signOutBtn) signOutBtn.style.display = 'none';
  if (userMenu) userMenu.style.display = 'none';
  
  // Show welcome section on home page
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    showWelcomeSection();
  }
}

/**
 * Show welcome section
 */
function showWelcomeSection() {
  const welcomeSection = document.getElementById('welcomeSection');
  const profileSection = document.getElementById('profileSection');
  
  if (welcomeSection) welcomeSection.style.display = 'block';
  if (profileSection) profileSection.style.display = 'none';
}

/**
 * Show profile section
 */
function showProfileSection() {
  const welcomeSection = document.getElementById('welcomeSection');
  const profileSection = document.getElementById('profileSection');
  
  if (welcomeSection) welcomeSection.style.display = 'none';
  if (profileSection) profileSection.style.display = 'block';
}

/**
 * Pre-fill profile form with existing data
 */
function prefillProfileForm(profile) {
  const form = document.getElementById('profileForm');
  if (!form) return;
  
  // Basic fields
  const nameInput = form.querySelector('#name');
  const educationSelect = form.querySelector('#education');
  const skillsTextarea = form.querySelector('#skills');
  const weeklyTimeSelect = form.querySelector('#weeklyTime');
  const budgetSelect = form.querySelector('#budget');
  const languageSelect = form.querySelector('#language');
  
  if (nameInput) nameInput.value = profile.name || '';
  if (educationSelect) educationSelect.value = profile.education || '';
  if (skillsTextarea) skillsTextarea.value = profile.skills?.join(', ') || '';
  if (weeklyTimeSelect) weeklyTimeSelect.value = profile.weeklyTime || '';
  if (budgetSelect) budgetSelect.value = profile.budget || '';
  if (languageSelect) languageSelect.value = profile.language || '';
  
  // Interests checkboxes
  const interestCheckboxes = form.querySelectorAll('input[name="interests"]');
  interestCheckboxes.forEach(checkbox => {
    checkbox.checked = profile.interests?.includes(checkbox.value) || false;
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Get Started button
  const getStartedBtn = document.getElementById('getStartedBtn');
  console.log('Get Started button found:', getStartedBtn);
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      console.log('Get Started button clicked');
      if (currentUser) {
        showProfileSection();
      } else {
        // Trigger sign in
        signInWithGoogle();
      }
    });
  }
  
  // Sign In button
  const signInBtn = document.getElementById('signInBtn');
  console.log('Sign In button found:', signInBtn);
  if (signInBtn) {
    signInBtn.addEventListener('click', () => {
      console.log('Sign In button clicked');
      signInWithGoogle();
    });
  }
  
  // Sign Out button
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', signOut);
  }
  
  // Profile form submission
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
  }
  
  // Profile button (dashboard)
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }
  
  // Retry button (error state)
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (window.location.pathname === '/dashboard.html') {
        loadRecommendations();
      } else {
        window.location.reload();
      }
    });
  }
  
  // Go home button (error state)
  const goHomeBtn = document.getElementById('goHomeBtn');
  if (goHomeBtn) {
    goHomeBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }
  
  // Create profile button (no data state)
  const createProfileBtn = document.getElementById('createProfileBtn');
  if (createProfileBtn) {
    createProfileBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }
}

/**
 * Handle profile form submission
 */
async function handleProfileSubmit(event) {
  event.preventDefault();
  
  if (!currentUser) {
    showToast('Please sign in to continue', 'error');
    return;
  }
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Extract form data
  const profileData = {
    name: formData.get('name'),
    education: formData.get('education'),
    skills: formData.get('skills').split(',').map(s => s.trim()).filter(s => s),
    interests: Array.from(formData.getAll('interests')),
    weeklyTime: formData.get('weeklyTime'),
    budget: formData.get('budget'),
    language: formData.get('language')
  };
  
  // Validate required fields
  if (!profileData.name || !profileData.education || !profileData.skills.length) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    // Show loading
    showLoadingSection();

    // Analytics: profile submitted
    logAnalytics('profile_submitted', { skillsCount: profileData.skills.length });

    // Call backend API
    const response = await window.api.generateRecommendations(profileData);

    // Persist in memory/local for dashboard rendering fallback
    localStorage.setItem('recommendations', JSON.stringify(response));

    // Analytics: recommendation generated
    logAnalytics('recommendation_generated', { rolesCount: response.recommendations?.length || 0 });
    
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
    
  } catch (error) {
    console.error('Error processing profile:', error);
    showToast('Error processing your profile. Please try again.', 'error');
    hideLoadingSection();
  }
}

/**
 * Generate mock recommendations for demo
 */
async function generateMockRecommendations(profileData) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock recommendations based on skills
  const mockRecommendations = [
    {
      role: "Frontend Developer",
      fitScore: 85,
      description: "Perfect for your JavaScript and web development skills",
      skills: {
        overlapping: ["JavaScript", "HTML", "CSS"],
        gaps: ["React", "TypeScript", "State Management"]
      },
      learningPlan: {
        weeks: [
          {
            week: 1,
            topics: ["React Fundamentals", "JSX", "Components"],
            practice: "Build a simple todo app",
            assessment: "Complete React basics quiz"
          },
          {
            week: 2,
            topics: ["State Management", "Hooks", "Props"],
            practice: "Create a shopping cart component",
            assessment: "Build a counter app with hooks"
          },
          {
            week: 3,
            topics: ["Routing", "API Integration", "Async Operations"],
            practice: "Build a weather app with API",
            assessment: "Create a multi-page application"
          },
          {
            week: 4,
            topics: ["Testing", "Deployment", "Best Practices"],
            practice: "Deploy your app to Vercel",
            assessment: "Complete final project"
          }
        ]
      }
    },
    {
      role: "Data Analyst",
      fitScore: 75,
      description: "Great match for your analytical skills",
      skills: {
        overlapping: ["Excel", "SQL"],
        gaps: ["Python", "Data Visualization", "Statistics"]
      },
      learningPlan: {
        weeks: [
          {
            week: 1,
            topics: ["Python Basics", "Pandas", "Data Manipulation"],
            practice: "Clean and analyze a dataset",
            assessment: "Complete Python fundamentals"
          },
          {
            week: 2,
            topics: ["Data Visualization", "Matplotlib", "Seaborn"],
            practice: "Create charts and graphs",
            assessment: "Build a dashboard"
          },
          {
            week: 3,
            topics: ["Statistics", "Hypothesis Testing", "A/B Testing"],
            practice: "Analyze business metrics",
            assessment: "Conduct statistical analysis"
          },
          {
            week: 4,
            topics: ["Machine Learning Basics", "Predictive Modeling"],
            practice: "Build a simple ML model",
            assessment: "Complete data analysis project"
          }
        ]
      }
    },
    {
      role: "Product Manager",
      fitScore: 70,
      description: "Good fit for your communication and analytical skills",
      skills: {
        overlapping: ["Communication", "Analysis"],
        gaps: ["Product Strategy", "User Research", "Agile"]
      },
      learningPlan: {
        weeks: [
          {
            week: 1,
            topics: ["Product Strategy", "Market Research", "User Personas"],
            practice: "Create user personas for a product",
            assessment: "Complete product strategy framework"
          },
          {
            week: 2,
            topics: ["User Research", "Interviews", "Surveys"],
            practice: "Conduct user interviews",
            assessment: "Analyze user feedback"
          },
          {
            week: 3,
            topics: ["Agile Methodology", "Sprint Planning", "Backlog Management"],
            practice: "Create product backlog",
            assessment: "Plan a sprint"
          },
          {
            week: 4,
            topics: ["Metrics & Analytics", "A/B Testing", "Product Launch"],
            practice: "Design product metrics",
            assessment: "Create product launch plan"
          }
        ]
      }
    }
  ];
  
  return {
    recommendations: mockRecommendations,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Show loading section
 */
function showLoadingSection() {
  const loadingSection = document.getElementById('loadingSection');
  const profileSection = document.getElementById('profileSection');
  
  if (loadingSection) loadingSection.style.display = 'block';
  if (profileSection) profileSection.style.display = 'none';
}

/**
 * Hide loading section
 */
function hideLoadingSection() {
  const loadingSection = document.getElementById('loadingSection');
  if (loadingSection) loadingSection.style.display = 'none';
}

/**
 * Mock sign in with Google
 */
async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithPopup(provider);
    showToast('Signed in successfully!', 'success');
  } catch (error) {
    console.error('Sign in error:', error);
    showToast('Sign in failed: ' + (error.message || 'Unknown error'), 'error');
  }
}

/**
 * Sign out
 */
async function signOut() {
  try {
    await firebase.auth().signOut();
    localStorage.removeItem('userProfile');
    localStorage.removeItem('recommendations');
    showToast('Signed out successfully!', 'success');
    window.location.href = '/';
  } catch (error) {
    console.error('Sign out error:', error);
    showToast('Sign out failed: ' + error.message, 'error');
  }
}

/**
 * Load recommendations from localStorage
 */
function loadRecommendations() {
  const recommendations = localStorage.getItem('recommendations');
  if (recommendations) {
    try {
      const data = JSON.parse(recommendations);
      displayRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      showErrorState('Failed to load recommendations');
    }
  } else {
    showNoDataState();
  }
}

/**
 * Display recommendations on dashboard
 */
function displayRecommendations(recommendations) {
  // This will be handled by dashboard.js
  if (typeof window.displayRecommendations === 'function') {
    window.displayRecommendations(recommendations);
  }
}

/**
 * Show error state
 */
function showErrorState(message) {
  // This will be handled by dashboard.js
  if (typeof window.showErrorState === 'function') {
    window.showErrorState(message);
  }
}

/**
 * Show no data state
 */
function showNoDataState() {
  // This will be handled by dashboard.js
  if (typeof window.showNoDataState === 'function') {
    window.showNoDataState();
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  } else {
    console.log(`Toast [${type}]:`, message);
  }
}

/**
 * Minimal client-side analytics (writes to Firestore if available)
 */
function logAnalytics(event, data = {}) {
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth().currentUser) {
      firebase.firestore().collection('analytics').add({
        uid: firebase.auth().currentUser.uid,
        event,
        data,
        timestamp: new Date(),
        userAgent: navigator.userAgent
      }).catch(() => {});
    }
  } catch (_) {}
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
