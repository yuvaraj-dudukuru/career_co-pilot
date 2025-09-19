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
  const fit = recommendation.fitScore ?? 0;
  const cosine = recommendation.metrics?.cosine ?? null;
  const overlapRatio = recommendation.metrics?.overlapRatio ?? null;
  const overlap = recommendation.overlapSkills || recommendation.skills?.overlapping || [];
  const gaps = recommendation.gapSkills || recommendation.skills?.gaps || [];
  const why = recommendation.why || recommendation.description || '';
  const title = recommendation.title || recommendation.role || 'Role';

  card.innerHTML = `
    <div class="recommendation-header">
      <div>
        <h3 class="recommendation-title">${title}</h3>
        <p class="recommendation-why">${why}</p>
        <p class="method-note">
          <small>Score derived from cosine similarity & skill overlap. <a href="#" class="methodology-open">Methodology</a></small>
          ${cosine !== null && overlapRatio !== null ? `<br/><small>cosine: ${cosine.toFixed(2)}, overlap: ${overlapRatio.toFixed(2)}</small>` : ''}
        </p>
      </div>
      <div class="fit-score">
        <div class="fit-score-value">${fit}</div>
        <div class="fit-score-bar">
          <div class="fit-score-fill" style="width:${Math.max(0, Math.min(100, fit))}%"></div>
        </div>
      </div>
    </div>
    
    <div class="skills-section">
      <h4 class="skills-title">Your Matching Skills</h4>
      <div class="skills-tags">
        ${overlap.map(skill => `<span class="skill-tag overlap">${skill}</span>`).join('')}
      </div>
    </div>
    
    <div class="skills-section">
      <h4 class="skills-title">Skills to Learn</h4>
      <div class="skills-tags">
        ${gaps.slice(0, 8).map(skill => `<span class="skill-tag gap">${skill}</span>`).join('')}
      </div>
    </div>
    
    <div class="recommendation-actions">
      <button class="btn btn-primary view-plan-btn" data-index="${index}">📚 View Learning Plan</button>
    </div>
  `;

  // link methodology
  const link = card.querySelector('.methodology-open');
  if (link) link.addEventListener('click', (e) => { e.preventDefault(); showMethodologyModal(); });
  const viewBtn = card.querySelector('.view-plan-btn');
  if (viewBtn) viewBtn.addEventListener('click', () => viewLearningPlan(index));
  
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
    modalTitle.textContent = `${recommendation.role} - Learning Plan`;
  }
  
  if (modalContent) {
    modalContent.innerHTML = createLearningPlanHTML(recommendation);
  }
}

/**
 * Create HTML for learning plan
 */
function createLearningPlanHTML(recommendation) {
  let html = `
    <div class="learning-plan-header">
      <h3>${recommendation.role}</h3>
      <p class="fit-score-display">Fit Score: ${recommendation.fitScore}%</p>
      <p class="plan-description">${recommendation.description}</p>
    </div>
    
    <div class="learning-plan-weeks">
  `;
  
  recommendation.learningPlan.weeks.forEach((week, index) => {
    html += `
      <div class="week-card">
        <div class="week-header">
          <h4>Week ${week.week}</h4>
        </div>
        <div class="week-content">
          <div class="topics-section">
            <h5>📚 Topics to Learn</h5>
            <ul>
              ${week.topics.map(topic => `<li>${topic}</li>`).join('')}
            </ul>
          </div>
          <div class="practice-section">
            <h5>💻 Practice Activities</h5>
            <p>${week.practice}</p>
          </div>
          <div class="assessment-section">
            <h5>✅ Assessment</h5>
            <p>${week.assessment}</p>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `
    </div>
    
    <div class="learning-plan-footer">
      <p class="plan-note">
        💡 This is a structured 4-week learning plan. Adjust the pace based on your schedule and learning style.
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
function downloadLearningPlanPDF() {
  if (currentRecommendationIndex === null) {
    alert('No learning plan selected');
    return;
  }
  const recId = getCurrentRecommendationId();
  if (!recId) {
    window.print();
    return;
  }
  window.api.requestPrintableHtml(recId)
    .then(({ html }) => {
      const w = window.open('', '_blank');
      if (!w) return window.print();
      w.document.open();
      w.document.write(html);
      w.document.close();
    })
    .catch(() => window.print());
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

// Export functions for use in other modules
window.displayRecommendations = displayRecommendations;
window.showErrorState = showErrorState;
window.showNoDataState = showNoDataState;
window.viewLearningPlan = viewLearningPlan;
