/**
 * Career Co-Pilot - Dashboard JavaScript
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
  
  // Log analytics
  if (window.app && window.app.logAnalytics) {
    window.app.logAnalytics('dashboard_viewed');
  }
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
  
  // Delete modal
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    // Close on outside click
    deleteModal.addEventListener('click', (event) => {
      if (event.target === deleteModal) {
        hideDeleteModal();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hideDeleteModal();
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
  
  // Delete confirmation button
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDeleteUserData);
  }
  
  // Cancel delete button
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
  }
}

/**
 * View learning plan modal
 * @param {number} index - Index of the recommendation
 * @param {Object} recommendation - Recommendation object
 */
function viewLearningPlan(index, recommendation) {
  currentRecommendationIndex = index;
  
  // Update modal title
  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) {
    modalTitle.textContent = `Learning Plan: ${recommendation.title}`;
  }
  
  // Render learning plan content
  const planContent = document.getElementById('planContent');
  if (planContent) {
    planContent.innerHTML = createLearningPlanHTML(recommendation);
  }
  
  // Show modal
  if (window.ui && window.ui.showModal) {
    window.ui.showModal('planModal');
  } else {
    showModal('planModal');
  }
  
  // Log analytics
  if (window.app && window.app.logAnalytics) {
    window.app.logAnalytics('plan_viewed', { 
      roleTitle: recommendation.title,
      roleId: recommendation.roleId 
    });
  }
}

/**
 * Create HTML for learning plan
 * @param {Object} recommendation - Recommendation object
 * @returns {string} HTML string for the learning plan
 */
function createLearningPlanHTML(recommendation) {
  const { plan, title, why, overlapSkills, gapSkills } = recommendation;
  
  let html = `
    <div class="plan-summary">
      <h4>📋 Plan Overview</h4>
      <p><strong>Role:</strong> ${title}</p>
      <p><strong>Why this fits:</strong> ${why}</p>
      
      <div class="skills-overview">
        <div class="skills-section">
          <h5>✅ Your Matching Skills (${overlapSkills.length})</h5>
          <div class="skills-tags">
            ${overlapSkills.map(skill => 
              `<span class="skill-tag overlap">${skill}</span>`
            ).join('')}
          </div>
        </div>
        
        <div class="skills-section">
          <h5>🎯 Skills to Learn (${gapSkills.length})</h5>
          <div class="skills-tags">
            ${gapSkills.map(skill => 
              `<span class="skill-tag gap">${skill}</span>`
            ).join('')}
          </div>
        </div>
      </div>
    </div>
    
    <div class="plan-timeline">
      <h4>📅 4-Week Learning Roadmap</h4>
  `;
  
  // Add each week
  if (plan && plan.weeks) {
    plan.weeks.forEach(week => {
      html += createWeekHTML(week);
    });
  }
  
  html += `
    </div>
    
    <div class="plan-actions">
      <p class="plan-note">
        💡 <strong>Pro Tip:</strong> Focus on one skill at a time and practice regularly. 
        Consistency is key to building expertise in any field.
      </p>
    </div>
  `;
  
  return html;
}

/**
 * Create HTML for a single week
 * @param {Object} week - Week object from the plan
 * @returns {string} HTML string for the week
 */
function createWeekHTML(week) {
  return `
    <div class="week-card">
      <div class="week-header">
        <div class="week-number">${week.week}</div>
        <h5 class="week-title">Week ${week.week}</h5>
      </div>
      
      <div class="plan-section">
        <div class="plan-section-title">
          📚 Topics to Cover
        </div>
        <div class="plan-section-content">
          <ul>
            ${week.topics.map(topic => `<li>${topic}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <div class="plan-section">
        <div class="plan-section-title">
          🛠️ Practice Activities
        </div>
        <div class="plan-section-content">
          <ul>
            ${week.practice.map(activity => `<li>${activity}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <div class="plan-section">
        <div class="plan-section-title">
          📝 Assessment
        </div>
        <div class="plan-section-content">
          ${week.assessment}
        </div>
      </div>
      
      <div class="plan-section">
        <div class="plan-section-title">
          🎯 Project
        </div>
        <div class="plan-section-content">
          ${week.project}
        </div>
      </div>
    </div>
  `;
}

/**
 * Hide learning plan modal
 */
function hidePlanModal() {
  if (window.ui && window.ui.hideModal) {
    window.ui.hideModal('planModal');
  } else {
    hideModal('planModal');
  }
  
  // Reset current recommendation index
  currentRecommendationIndex = null;
}

/**
 * Download learning plan as PDF
 */
function downloadLearningPlanPDF() {
  if (currentRecommendationIndex === null) {
    showToast('No learning plan selected', 'error');
    return;
  }
  
  try {
    // Get current recommendation
    const recommendation = currentRecommendations[currentRecommendationIndex];
    if (!recommendation) {
      showToast('Recommendation not found', 'error');
      return;
    }
    
    // Create PDF content
    const pdfContent = createPDFContent(recommendation);
    
    // Generate PDF
    if (window.ui && window.ui.generatePDF) {
      window.ui.generatePDF(pdfContent, `career-roadmap-${recommendation.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } else {
      generatePDF(pdfContent, `career-roadmap-${recommendation.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    }
    
    // Log analytics
    if (window.app && window.app.logAnalytics) {
      window.app.logAnalytics('pdf_exported', { 
        roleTitle: recommendation.title,
        roleId: recommendation.roleId 
      });
    }
    
    showToast('PDF download started', 'success');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    showToast('Failed to generate PDF: ' + error.message, 'error');
  }
}

/**
 * Create content for PDF export
 * @param {Object} recommendation - Recommendation object
 * @returns {string} HTML content for PDF
 */
function createPDFContent(recommendation) {
  const { plan, title, why, overlapSkills, gapSkills } = recommendation;
  
  let html = `
    <div class="pdf-header">
      <h1>🎯 Career Learning Roadmap</h1>
      <h2>${title}</h2>
      <p class="pdf-date">Generated on: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="pdf-section">
      <h3>📋 Why This Role Fits You</h3>
      <p>${why}</p>
    </div>
    
    <div class="pdf-section">
      <h3>✅ Your Current Skills</h3>
      <div class="skills-list">
        ${overlapSkills.map(skill => `<span class="skill-item">${skill}</span>`).join('')}
      </div>
    </div>
    
    <div class="pdf-section">
      <h3>🎯 Skills to Develop</h3>
      <div class="skills-list">
        ${gapSkills.map(skill => `<span class="skill-item">${skill}</span>`).join('')}
      </div>
    </div>
    
    <div class="pdf-section">
      <h3>📅 4-Week Learning Plan</h3>
  `;
  
  // Add each week
  if (plan && plan.weeks) {
    plan.weeks.forEach(week => {
      html += createPDFWeekContent(week);
    });
  }
  
  html += `
    </div>
    
    <div class="pdf-footer">
      <p>Generated by Career Co-Pilot - AI-Powered Career Guidance</p>
      <p>Visit: career-co-pilot.com</p>
    </div>
  `;
  
  return html;
}

/**
 * Create PDF content for a single week
 * @param {Object} week - Week object from the plan
 * @returns {string} HTML string for the week in PDF format
 */
function createPDFWeekContent(week) {
  return `
    <div class="pdf-week">
      <h4>Week ${week.week}</h4>
      
      <div class="pdf-week-section">
        <strong>📚 Topics:</strong>
        <ul>
          ${week.topics.map(topic => `<li>${topic}</li>`).join('')}
        </ul>
      </div>
      
      <div class="pdf-week-section">
        <strong>🛠️ Practice:</strong>
        <ul>
          ${week.practice.map(activity => `<li>${activity}</li>`).join('')}
        </ul>
      </div>
      
      <div class="pdf-week-section">
        <strong>📝 Assessment:</strong>
        <p>${week.assessment}</p>
      </div>
      
      <div class="pdf-week-section">
        <strong>🎯 Project:</strong>
        <p>${week.project}</p>
      </div>
    </div>
  `;
}

/**
 * Regenerate learning plan
 */
async function regenerateLearningPlan() {
  if (currentRecommendationIndex === null) {
    showToast('No learning plan selected', 'error');
    return;
  }
  
  try {
    // Disable regenerate button
    if (window.ui && window.ui.disableButton) {
      window.ui.disableButton('regenerateBtn', 'Regenerating...');
    } else {
      disableButton('regenerateBtn', 'Regenerating...');
    }
    
    // Get current recommendation
    const recommendation = currentRecommendations[currentRecommendationIndex];
    if (!recommendation) {
      showToast('Recommendation not found', 'error');
      return;
    }
    
    // Get user profile
    if (!window.app || !window.app.userProfile) {
      showToast('User profile not found', 'error');
      return;
    }
    
    // Call API to regenerate plan
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await firebase.auth().currentUser.getIdToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        profile: window.app.userProfile,
        regenerateFor: recommendation.roleId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to regenerate plan');
    }
    
    const data = await response.json();
    
    // Find the updated recommendation
    const updatedRecommendation = data.recommendations.find(r => r.roleId === recommendation.roleId);
    if (updatedRecommendation) {
      // Update the current recommendations array
      currentRecommendations[currentRecommendationIndex] = updatedRecommendation;
      
      // Update the modal content
      const planContent = document.getElementById('planContent');
      if (planContent) {
        planContent.innerHTML = createLearningPlanHTML(updatedRecommendation);
      }
      
      showToast('Learning plan regenerated successfully', 'success');
      
      // Log analytics
      if (window.app && window.app.logAnalytics) {
        window.app.logAnalytics('plan_regenerated', { 
          roleTitle: updatedRecommendation.title,
          roleId: updatedRecommendation.roleId 
        });
      }
    } else {
      throw new Error('Updated recommendation not found');
    }
    
  } catch (error) {
    console.error('Error regenerating plan:', error);
    showToast('Failed to regenerate plan: ' + error.message, 'error');
  } finally {
    // Re-enable regenerate button
    if (window.ui && window.ui.enableButton) {
      window.ui.enableButton('regenerateBtn');
    } else {
      enableButton('regenerateBtn');
    }
  }
}

/**
 * Show delete confirmation modal
 */
function showDeleteModal() {
  if (window.ui && window.ui.showModal) {
    window.ui.showModal('deleteModal');
  } else {
    showModal('deleteModal');
  }
}

/**
 * Hide delete confirmation modal
 */
function hideDeleteModal() {
  if (window.ui && window.ui.hideModal) {
    window.ui.hideModal('deleteModal');
  } else {
    hideModal('deleteModal');
  }
}

/**
 * Confirm and execute user data deletion
 */
async function confirmDeleteUserData() {
  try {
    // Hide modal first
    hideDeleteModal();
    
    // Show loading state
    if (window.ui && window.ui.showToast) {
      window.ui.showToast('Deleting your data...', 'info');
    } else {
      showToast('Deleting your data...', 'info');
    }
    
    // Call the delete function from app.js
    if (window.app && window.app.deleteUserData) {
      await window.app.deleteUserData();
    } else {
      throw new Error('Delete function not available');
    }
    
  } catch (error) {
    console.error('Error deleting user data:', error);
    if (window.ui && window.ui.showToast) {
      window.ui.showToast('Failed to delete data: ' + error.message, 'error');
    } else {
      showToast('Failed to delete data: ' + error.message, 'error');
    }
  }
}

/**
 * Show modal (fallback function)
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Hide modal (fallback function)
 */
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

/**
 * Show toast (fallback function)
 */
function showToast(message, type = 'info') {
  if (window.ui && window.ui.showToast) {
    window.ui.showToast(message, type);
  } else {
    console.log(`Toast [${type}]:`, message);
  }
}

/**
 * Disable button (fallback function)
 */
function disableButton(buttonId, loadingText = 'Loading...') {
  const button = document.getElementById(buttonId);
  if (button) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `
      <span class="loading-spinner"></span>
      ${loadingText}
    `;
  }
}

/**
 * Enable button (fallback function)
 */
function enableButton(buttonId) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

/**
 * Generate PDF (fallback function)
 */
function generatePDF(content, filename = 'career-roadmap.pdf') {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Career Roadmap</title>
      <link rel="stylesheet" href="styles.css">
      <style>
        @media print {
          body { margin: 1.2cm; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = function() {
          window.print();
          window.close();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Export functions for use in other modules
window.viewLearningPlan = viewLearningPlan;
window.downloadLearningPlanPDF = downloadLearningPlanPDF;
window.regenerateLearningPlan = regenerateLearningPlan;
window.showDeleteModal = showDeleteModal;
window.hideDeleteModal = hideDeleteModal;
window.confirmDeleteUserData = confirmDeleteUserData;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);
