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
  card.innerHTML = `
    <div class="recommendation-header">
      <div>
        <h3 class="recommendation-title">${recommendation.role}</h3>
        <p class="recommendation-why">${recommendation.description}</p>
      </div>
      <div class="fit-score">${recommendation.fitScore}%</div>
    </div>
    
    <div class="skills-section">
      <h4 class="skills-title">Your Matching Skills</h4>
      <div class="skills-tags">
        ${recommendation.skills.overlapping.map(skill => 
          `<span class="skill-tag overlap">${skill}</span>`
        ).join('')}
      </div>
    </div>
    
    <div class="skills-section">
      <h4 class="skills-title">Skills to Learn</h4>
      <div class="skills-tags">
        ${recommendation.skills.gaps.slice(0, 6).map(skill => 
          `<span class="skill-tag gap">${skill}</span>`
        ).join('')}
      </div>
    </div>
    
    <div class="recommendation-actions">
      <button class="btn btn-primary" onclick="viewLearningPlan(${index})">
        📚 View Learning Plan
      </button>
    </div>
  `;
  
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
}

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
  
  const recommendation = currentRecommendations[currentRecommendationIndex];
  
  // Create a simple text-based PDF content
  let pdfContent = `
Career Co-Pilot - Learning Plan
${recommendation.role}
Generated on: ${new Date().toLocaleDateString()}

Fit Score: ${recommendation.fitScore}%
Description: ${recommendation.description}

LEARNING PLAN:

`;

  recommendation.learningPlan.weeks.forEach(week => {
    pdfContent += `
Week ${week.week}:
Topics to Learn:
${week.topics.map(topic => `- ${topic}`).join('\n')}

Practice Activities:
${week.practice}

Assessment:
${week.assessment}

`;
  });
  
  // Create and download file
  const blob = new Blob([pdfContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${recommendation.role.replace(/\s+/g, '_')}_Learning_Plan.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  alert('Learning plan downloaded successfully!');
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
