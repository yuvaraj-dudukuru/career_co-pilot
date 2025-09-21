/**
 * Career Co-Pilot - Dashboard JavaScript (Demo Version)
 * Handles dashboard-specific functionality like learning plans and PDF export
 */

// Global variables for dashboard
let currentRecommendations = [];
let currentRecommendationIndex = null;

/**
 * Initialize dashboard functionality
 */
function initDashboard() {
  // Set up modal event listeners
  setupModalEventListeners();
  
  // Set up dashboard-specific event listeners
  setupDashboardEventListeners();
  
  // Load recommendations from localStorage
  loadRecommendationsFromStorage();
  
  console.log('Dashboard initialized');
}

/**
 * Load recommendations from localStorage
 */
function loadRecommendationsFromStorage() {
  const recommendations = localStorage.getItem('recommendations');
  if (recommendations) {
    try {
      const data = JSON.parse(recommendations);
      currentRecommendations = data.recommendations;
      displayRecommendations(currentRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      showErrorState('Failed to load recommendations');
    }
  } else {
    showNoDataState();
  }
}

/**
 * Display recommendations on the dashboard
 */
function displayRecommendations(recommendations) {
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
  
  // Extract data with fallbacks for different response formats
  const fit = recommendation.fitScore ?? 0;
  const overlap = recommendation.overlapSkills || recommendation.skills?.overlapping || [];
  const gaps = recommendation.gapSkills || recommendation.skills?.gaps || [];
  const why = recommendation.why || recommendation.description || '';
  const title = recommendation.title || recommendation.role || 'Role';
  const isFallback = recommendation.fallback || false;
  
  // Determine fit score color and label
  let fitScoreClass = 'fit-score';
  let fitScoreLabel = 'Fit Score';
  
  if (fit >= 80) {
    fitScoreClass += ' excellent';
    fitScoreLabel = 'Excellent Match';
  } else if (fit >= 60) {
    fitScoreClass += ' good';
    fitScoreLabel = 'Good Match';
  } else {
    fitScoreClass += ' fair';
    fitScoreLabel = 'Fair Match';
  }

  card.innerHTML = `
    <div class="recommendation-header">
      <div>
        <h3 class="recommendation-title">${title}</h3>
        <p class="recommendation-why">${why}</p>
        <p class="method-note">
          <small>Score based on skill matching and overlap analysis. <a href="#" class="methodology-open">View Methodology</a></small>
          ${isFallback ? '<br/><small>📋 Using deterministic fallback plan</small>' : ''}
        </p>
      </div>
      <div class="fit-score">
        <div class="fit-score-value">${fit}%</div>
        <div class="fit-score-label">${fitScoreLabel}</div>
        <div class="fit-score-bar">
          <div class="fit-score-fill" style="width:${Math.max(0, Math.min(100, fit))}%"></div>
        </div>
      </div>
    </div>
    
    <div class="skills-section">
      <h4 class="skills-title">✅ Your Matching Skills (${overlap.length})</h4>
      <div class="skills-tags">
        ${overlap.length > 0 
          ? overlap.map(skill => `<span class="skill-tag overlap">${skill}</span>`).join('')
          : '<span class="skill-tag overlap">Foundational skills</span>'
        }
      </div>
    </div>
    
    <div class="skills-section">
      <h4 class="skills-title">🎯 Skills to Learn (${gaps.length})</h4>
      <div class="skills-tags">
        ${gaps.length > 0 
          ? gaps.slice(0, 6).map(skill => `<span class="skill-tag gap">${skill}</span>`).join('')
          : '<span class="skill-tag gap">No critical gaps identified</span>'
        }
      </div>
    </div>
    
    <div class="recommendation-actions">
      <button class="btn btn-primary view-plan-btn" data-index="${index}">📚 View 4-Week Plan</button>
      <button class="btn btn-secondary download-plan-btn" data-index="${index}">📄 Download PDF</button>
    </div>
  `;

  // Add event listeners
  const methodologyLink = card.querySelector('.methodology-open');
  if (methodologyLink) {
    methodologyLink.addEventListener('click', (e) => { 
      e.preventDefault(); 
      showMethodologyModal(); 
    });
  }
  
  const viewBtn = card.querySelector('.view-plan-btn');
  if (viewBtn) {
    viewBtn.addEventListener('click', () => viewLearningPlan(index));
  }
  
  const downloadBtn = card.querySelector('.download-plan-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => downloadLearningPlanPDF(index));
  }
  
  return card;
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
function viewLearningPlan(index) {
  if (index < 0 || index >= currentRecommendations.length) {
    console.error('Invalid recommendation index:', index);
    return;
  }
  
  currentRecommendationIndex = index;
  const recommendation = currentRecommendations[index];
  
  // Populate modal content
  populateLearningPlanModal(recommendation);
  
  // Show modal
  showPlanModal();
}

/**
 * Populate learning plan modal with content
 */
function populateLearningPlanModal(recommendation) {
  const modalTitle = document.getElementById('planModalTitle');
  const modalContent = document.getElementById('planModalContent');
  
  if (modalTitle) {
    const title = recommendation.title || recommendation.role || 'Career Role';
    modalTitle.textContent = `${title} - 4-Week Learning Plan`;
  }
  
  if (modalContent) {
    modalContent.innerHTML = createLearningPlanHTML(recommendation);
  }
}

/**
 * Create HTML for learning plan
 */
function createLearningPlanHTML(recommendation) {
  const title = recommendation.title || recommendation.role || 'Career Role';
  const fitScore = recommendation.fitScore || 0;
  const why = recommendation.why || recommendation.description || '';
  const isFallback = recommendation.fallback || false;
  
  // Get the plan data - handle both old and new formats
  const plan = recommendation.plan || recommendation.learningPlan;
  const weeks = plan?.weeks || [];
  
  let html = `
    <div class="learning-plan-header">
      <h3>${title}</h3>
      <div class="fit-score-display">
        <span class="fit-score-badge">${fitScore}% Match</span>
        ${isFallback ? '<span class="fallback-badge">📋 Fallback Plan</span>' : ''}
      </div>
      <p class="plan-description">${why}</p>
    </div>
    
    <div class="learning-plan-weeks">
  `;
  
  if (weeks.length === 0) {
    html += `
      <div class="no-plan-message">
        <p>No learning plan available for this role.</p>
      </div>
    `;
  } else {
    weeks.forEach((week, index) => {
      const topics = Array.isArray(week.topics) ? week.topics : [week.topics];
      const practice = Array.isArray(week.practice) ? week.practice : [week.practice];
      
      html += `
        <div class="week-card">
          <div class="week-header">
            <div class="week-number">${week.week || index + 1}</div>
            <h4 class="week-title">Week ${week.week || index + 1}</h4>
          </div>
          <div class="week-content">
            <div class="plan-section">
              <h5 class="plan-section-title">📚 Topics to Learn</h5>
              <div class="plan-section-content">
                <ul>
                  ${topics.map(topic => `<li>${topic}</li>`).join('')}
                </ul>
              </div>
            </div>
            <div class="plan-section">
              <h5 class="plan-section-title">💻 Practice Activities</h5>
              <div class="plan-section-content">
                <ul>
                  ${practice.map(p => `<li>${p}</li>`).join('')}
                </ul>
              </div>
            </div>
            <div class="plan-section">
              <h5 class="plan-section-title">✅ Assessment</h5>
              <div class="plan-section-content">
                <p>${week.assessment || 'Complete the practice activities and demonstrate understanding.'}</p>
              </div>
            </div>
            <div class="plan-section">
              <h5 class="plan-section-title">🎯 Project</h5>
              <div class="plan-section-content">
                <p>${week.project || 'Apply what you\'ve learned in a practical project.'}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  html += `
    </div>
    
    <div class="learning-plan-footer">
      <p class="plan-note">
        💡 This is a structured 4-week learning plan. Adjust the pace based on your schedule and learning style.
        ${isFallback ? '<br/>📋 This plan was generated using our deterministic fallback system to ensure you always get actionable guidance.' : ''}
      </p>
    </div>
  `;
  
  return html;
}

/**
 * Setup modal event listeners
 */
function setupModalEventListeners() {
  // Plan modal
  const planModal = document.getElementById('planModal');
  if (planModal) {
    // Close on outside click
    planModal.addEventListener('click', (event) => {
      if (event.target === planModal) {
        hidePlanModal();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hidePlanModal();
      }
    });
  }
}

// Methodology modal control
function showMethodologyModal() {
  const m = document.getElementById('methodologyModal');
  if (!m) return;
  m.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function hideMethodologyModal() {
  const m = document.getElementById('methodologyModal');
  if (!m) return;
  m.style.display = 'none';
  document.body.style.overflow = 'auto';
}

/**
 * Setup dashboard-specific event listeners
 */
function setupDashboardEventListeners() {
  // Close modal buttons
  const closeModalBtns = document.querySelectorAll('[id*="closeModalBtn"]');
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      hidePlanModal();
    });
  });
  
  // Download PDF button
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', downloadLearningPlanPDF);
  }
  
  // Regenerate button
  const regenerateBtn = document.getElementById('regenerateBtn');
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', regenerateLearningPlan);
  }

  const methodologyLink = document.getElementById('methodologyLink');
  if (methodologyLink) methodologyLink.addEventListener('click', (e) => { e.preventDefault(); showMethodologyModal(); });
  const closeMethodologyBtn = document.getElementById('closeMethodologyBtn');
  if (closeMethodologyBtn) closeMethodologyBtn.addEventListener('click', hideMethodologyModal);
  const closeMethodologyBtn2 = document.getElementById('closeMethodologyBtn2');
  if (closeMethodologyBtn2) closeMethodologyBtn2.addEventListener('click', hideMethodologyModal);

  const shareBtn = document.getElementById('sharePlanBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      try {
        if (currentRecommendationIndex === null) return alert('Open a learning plan first');
        const recId = getCurrentRecommendationId();
        if (!recId) return alert('Recommendation ID not available');
        const { token } = await window.api.createShareToken(recId);
        const shareUrl = `${window.location.origin}/dashboard.html?token=${encodeURIComponent(token)}`;
        await copyToClipboard(shareUrl);
        alert('Share link copied to clipboard!');
      } catch (e) {
        console.error('Share failed', e);
        alert('Failed to create share link');
      }
    });
  }

  // Delete data button
  const deleteDataBtn = document.getElementById('deleteDataBtn');
  if (deleteDataBtn) {
    deleteDataBtn.addEventListener('click', () => {
      showDeleteConfirmationModal();
    });
  }

  // Delete confirmation modal
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleDeleteUserData);
  }

  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', hideDeleteConfirmationModal);
  }

  const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
  if (closeDeleteModalBtn) {
    closeDeleteModalBtn.addEventListener('click', hideDeleteConfirmationModal);
  }
}

function getCurrentRecommendationId() {
  // If recommendationId was stored alongside recommendations, use it
  try {
    const data = JSON.parse(localStorage.getItem('recommendations') || '{}');
    return data.recommendationId || null;
  } catch (_) { return null; }
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  }
}

// Support viewing via share token (read-only)
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    try {
      const { recommendation } = await window.api.viewSharedPlan(token);
      currentRecommendations = recommendation.top3Recommendations || [];
      displayRecommendations(currentRecommendations);
      // Hide header actions for read-only view
      const userMenu = document.getElementById('userMenu');
      if (userMenu) userMenu.style.display = 'none';
    } catch (e) {
      console.error('Failed to load shared plan', e);
      showErrorState('Invalid or expired share link');
    }
  }
});

/**
 * Show plan modal
 */
function showPlanModal() {
  const modal = document.getElementById('planModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide plan modal
 */
function hidePlanModal() {
  const modal = document.getElementById('planModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

/**
 * Download learning plan as PDF
 */
function downloadLearningPlanPDF(index = null) {
  const targetIndex = index !== null ? index : currentRecommendationIndex;
  
  if (targetIndex === null || targetIndex < 0 || targetIndex >= currentRecommendations.length) {
    alert('No learning plan selected');
    return;
  }
  
  // Set the current recommendation index for the modal
  currentRecommendationIndex = targetIndex;
  
  // Open the modal first to populate it
  viewLearningPlan(targetIndex);
  
  // Wait a moment for the modal to render, then trigger print
  setTimeout(() => {
    window.print();
  }, 500);
}

/**
 * Regenerate learning plan
 */
function regenerateLearningPlan() {
  alert('This feature would regenerate the learning plan with AI. In the demo version, this shows the same plan.');
  
  // In a real implementation, this would call the AI API
  // For demo purposes, just show the current plan again
  if (currentRecommendationIndex !== null) {
    viewLearningPlan(currentRecommendationIndex);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmationModal() {
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide delete confirmation modal
 */
function hideDeleteConfirmationModal() {
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

/**
 * Handle delete user data
 */
async function handleDeleteUserData() {
  try {
    // Show loading state
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Deleting...';
    }

    // Call API to delete user data
    await window.api.deleteUserData();

    // Clear local storage
    localStorage.clear();

    // Show success message
    showToast('All your data has been deleted successfully', 'success');

    // Hide modal
    hideDeleteConfirmationModal();

    // Redirect to home page
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);

  } catch (error) {
    console.error('Delete user data error:', error);
    showToast('Failed to delete data: ' + error.message, 'error');
    
    // Reset button
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Yes, Delete Everything';
    }
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  toastContainer.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// Export functions for use in other modules
window.displayRecommendations = displayRecommendations;
window.showErrorState = showErrorState;
window.showNoDataState = showNoDataState;
window.viewLearningPlan = viewLearningPlan;
