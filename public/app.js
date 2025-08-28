/**
 * Career Co-Pilot - Main Application File
 * Handles Firebase initialization, authentication, and core app logic
 */

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const firestore = firebase.firestore();

// Global state
let currentUser = null;
let userProfile = null;

/**
 * Initialize the application
 */
function initApp() {
  // Set up authentication state listener
  auth.onAuthStateChanged(handleAuthStateChanged);
  
  // Set up UI event listeners
  setupEventListeners();
  
  // Log analytics event
  logAnalytics('app_initialized');
}

/**
 * Handle authentication state changes
 */
function handleAuthStateChanged(user) {
  currentUser = user;
  
  if (user) {
    console.log('User signed in:', user.email);
    showAuthenticatedUI(user);
    loadUserProfile();
  } else {
    console.log('User signed out');
    showUnauthenticatedUI();
  }
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
 * Load user profile from Firestore
 */
async function loadUserProfile() {
  if (!currentUser) return;
  
  try {
    const profileDoc = await firestore
      .collection('users')
      .doc(currentUser.uid)
      .collection('profile')
      .doc('latest')
      .get();
    
    if (profileDoc.exists) {
      userProfile = profileDoc.data();
      console.log('User profile loaded:', userProfile);
      
      // Pre-fill form if on home page
      if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        prefillProfileForm(userProfile);
      }
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
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
 * Save user profile to Firestore
 */
async function saveUserProfile(profileData) {
  if (!currentUser) throw new Error('User not authenticated');
  
  try {
    const profileRef = firestore
      .collection('users')
      .doc(currentUser.uid)
      .collection('profile')
      .doc('latest');
    
    await profileRef.set({
      ...profileData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    userProfile = profileData;
    console.log('Profile saved successfully');
    
    // Log analytics
    logAnalytics('profile_saved', { profileSize: JSON.stringify(profileData).length });
    
    return true;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}

/**
 * Load user recommendations from Firestore
 */
async function loadRecommendations() {
  if (!currentUser) return;
  
  try {
    const recommendationsQuery = await firestore
      .collection('users')
      .doc(currentUser.uid)
      .collection('recommendations')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (!recommendationsQuery.empty) {
      const latestRecommendation = recommendationsQuery.docs[0].data();
      console.log('Latest recommendation loaded:', latestRecommendation);
      
      // Render recommendations
      renderRecommendations(latestRecommendation.top3Recommendations);
      
      // Log analytics
      logAnalytics('recommendations_viewed', { 
        rolesCount: latestRecommendation.top3Recommendations.length 
      });
    } else {
      // No recommendations yet
      showNoDataState();
    }
  } catch (error) {
    console.error('Error loading recommendations:', error);
    showErrorState('Failed to load recommendations: ' + error.message);
  }
}

/**
 * Render recommendations on dashboard
 */
function renderRecommendations(recommendations) {
  const grid = document.getElementById('recommendationsGrid');
  const loadingSection = document.getElementById('loadingSection');
  const errorSection = document.getElementById('errorSection');
  const noDataSection = document.getElementById('noDataSection');
  
  // Hide all sections first
  if (loadingSection) loadingSection.style.display = 'none';
  if (errorSection) errorSection.style.display = 'none';
  if (noDataSection) noDataSection.style.display = 'none';
  
  if (!grid) return;
  
  // Clear existing content
  grid.innerHTML = '';
  
  // Render each recommendation
  recommendations.forEach((rec, index) => {
    const card = createRecommendationCard(rec, index);
    grid.appendChild(card);
  });
  
  // Show recommendations section
  const recommendationsSection = document.getElementById('recommendationsSection');
  if (recommendationsSection) recommendationsSection.style.display = 'block';
}

/**
 * Create a recommendation card element
 */
function createRecommendationCard(recommendation, index) {
  const card = document.createElement('div');
  card.className = 'recommendation-card';
  card.innerHTML = `
    <div class="recommendation-header">
      <div>
        <h3 class="recommendation-title">${recommendation.title}</h3>
        <p class="recommendation-why">${recommendation.why}</p>
      </div>
      <div class="fit-score">${recommendation.fitScore}</div>
    </div>
    
    <div class="skills-section">
      <h4 class="skills-title">Your Matching Skills</h4>
      <div class="skills-tags">
        ${recommendation.overlapSkills.map(skill => 
          `<span class="skill-tag overlap">${skill}</span>`
        ).join('')}
      </div>
    </div>
    
    <div class="skills-section">
      <h4 class="skills-title">Skills to Learn</h4>
      <div class="skills-tags">
        ${recommendation.gapSkills.slice(0, 6).map(skill => 
          `<span class="skill-tag gap">${skill}</span>`
        ).join('')}
      </div>
    </div>
    
    <div class="recommendation-actions">
      <button class="btn btn-primary" onclick="viewLearningPlan('${index}', ${JSON.stringify(recommendation).replace(/"/g, '&quot;')})">
        📚 View Learning Plan
      </button>
    </div>
  `;
  
  return card;
}

/**
 * Show loading state
 */
function showLoadingState() {
  const loadingSection = document.getElementById('loadingSection');
  const recommendationsSection = document.getElementById('recommendationsSection');
  const errorSection = document.getElementById('errorSection');
  const noDataSection = document.getElementById('noDataSection');
  
  if (loadingSection) loadingSection.style.display = 'block';
  if (recommendationsSection) recommendationsSection.style.display = 'none';
  if (errorSection) errorSection.style.display = 'none';
  if (noDataSection) noDataSection.style.display = 'none';
}

/**
 * Show error state
 */
function showErrorState(message) {
  const loadingSection = document.getElementById('loadingSection');
  const recommendationsSection = document.getElementById('recommendationsSection');
  const errorSection = document.getElementById('errorSection');
  const noDataSection = document.getElementById('noDataSection');
  const errorMessage = document.getElementById('errorMessage');
  
  if (loadingSection) loadingSection.style.display = 'none';
  if (recommendationsSection) recommendationsSection.style.display = 'none';
  if (errorSection) errorSection.style.display = 'block';
  if (noDataSection) noDataSection.style.display = 'none';
  
  if (errorMessage) errorMessage.textContent = message;
}

/**
 * Show no data state
 */
function showNoDataState() {
  const loadingSection = document.getElementById('loadingSection');
  const recommendationsSection = document.getElementById('recommendationsSection');
  const errorSection = document.getElementById('errorSection');
  const noDataSection = document.getElementById('noDataSection');
  
  if (loadingSection) loadingSection.style.display = 'none';
  if (recommendationsSection) recommendationsSection.style.display = 'none';
  if (errorSection) errorSection.style.display = 'none';
  if (noDataSection) noDataSection.style.display = 'block';
}

/**
 * View learning plan modal
 */
function viewLearningPlan(index, recommendation) {
  // This function will be implemented in dashboard.js
  if (typeof window.viewLearningPlan === 'function') {
    window.viewLearningPlan(index, recommendation);
  } else {
    console.log('Learning plan for:', recommendation.title);
  }
}

/**
 * Delete user data
 */
async function deleteUserData() {
  if (!currentUser) throw new Error('User not authenticated');
  
  try {
    // Call the delete API
    const response = await fetch('/api/delete_user_data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await currentUser.getIdToken()}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user data');
    }
    
    // Sign out user
    await auth.signOut();
    
    // Show success message
    showToast('All your data has been deleted successfully', 'success');
    
    // Redirect to home page
    window.location.href = '/';
    
  } catch (error) {
    console.error('Error deleting user data:', error);
    showToast('Failed to delete user data: ' + error.message, 'error');
  }
}

/**
 * Log analytics events
 */
function logAnalytics(event, data = {}) {
  try {
    // Log to console for MVP (replace with actual analytics service)
    console.log('Analytics Event:', event, data);
    
    // Optionally send to Firestore
    if (currentUser) {
      firestore.collection('analytics').add({
        uid: currentUser.uid,
        event,
        data,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent
      }).catch(error => {
        console.error('Failed to log analytics:', error);
      });
    }
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Get Started button
  const getStartedBtn = document.getElementById('getStartedBtn');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
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
  if (signInBtn) {
    signInBtn.addEventListener('click', signInWithGoogle);
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
  
  // Delete data button
  const deleteDataBtn = document.getElementById('deleteDataBtn');
  if (deleteDataBtn) {
    deleteDataBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
        deleteUserData();
      }
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
    weeklyTime: parseInt(formData.get('weeklyTime')),
    budget: formData.get('budget'),
    language: formData.get('language')
  };
  
  try {
    // Save profile
    await saveUserProfile(profileData);
    
    // Show loading state
    showLoadingState();
    
    // Generate recommendations
    const recommendations = await generateRecommendations(profileData);
    
    // Save recommendations
    await saveRecommendations(recommendations);
    
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
    
  } catch (error) {
    console.error('Error processing profile:', error);
    showToast('Failed to process profile: ' + error.message, 'error');
  }
}

/**
 * Sign in with Google
 */
async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error('Sign in error:', error);
    showToast('Sign in failed: ' + error.message, 'error');
  }
}

/**
 * Sign out
 */
async function signOut() {
  try {
    await auth.signOut();
    window.location.href = '/';
  } catch (error) {
    console.error('Sign out error:', error);
    showToast('Sign out failed: ' + error.message, 'error');
  }
}

/**
 * Generate recommendations using the API
 */
async function generateRecommendations(profileData) {
  try {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await currentUser.getIdToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ profile: profileData })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate recommendations');
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Save recommendations to Firestore
 */
async function saveRecommendations(recommendationsData) {
  if (!currentUser) throw new Error('User not authenticated');
  
  try {
    const recommendationRef = firestore
      .collection('users')
      .doc(currentUser.uid)
      .collection('recommendations')
      .doc();
    
    await recommendationRef.set({
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      inputProfileSnapshot: userProfile,
      top3Recommendations: recommendationsData.recommendations,
      modelVersion: 'v1.0'
    });
    
    console.log('Recommendations saved successfully');
    
    // Log analytics
    logAnalytics('recommendations_generated', { 
      rolesCount: recommendationsData.recommendations.length 
    });
    
    return true;
  } catch (error) {
    console.error('Error saving recommendations:', error);
    throw error;
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for use in other modules
window.app = {
  currentUser,
  userProfile,
  saveUserProfile,
  loadUserProfile,
  deleteUserData,
  logAnalytics,
  showToast
};
