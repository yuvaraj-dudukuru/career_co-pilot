/**
 * Career Co-Pilot - UI Utilities
 * Handles toast notifications, modals, and other UI interactions
 */

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
function showToast(message, type = 'info', duration = 5000) {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Get icon based on type
  const icon = getToastIcon(type);
  
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, duration);
  
  // Log to console for debugging
  console.log(`Toast [${type}]:`, message);
}

/**
 * Get appropriate icon for toast type
 * @param {string} type - Toast type
 * @returns {string} Icon emoji
 */
function getToastIcon(type) {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '💬';
  }
}

/**
 * Show modal
 * @param {string} modalId - ID of modal element
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

/**
 * Hide modal
 * @param {string} modalId - ID of modal element
 */
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }
}

/**
 * Close modal when clicking outside
 * @param {Event} event - Click event
 * @param {string} modalId - ID of modal element
 */
function closeModalOnOutsideClick(event, modalId) {
  const modal = document.getElementById(modalId);
  if (modal && event.target === modal) {
    hideModal(modalId);
  }
}

/**
 * Close modal when pressing Escape key
 * @param {Event} event - Keydown event
 * @param {string} modalId - ID of modal element
 */
function closeModalOnEscape(event, modalId) {
  if (event.key === 'Escape') {
    hideModal(modalId);
  }
}

/**
 * Show loading spinner
 * @param {string} elementId - ID of element to show spinner in
 * @param {string} text - Loading text (optional)
 */
function showSpinner(elementId, text = 'Loading...') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.innerHTML = `
    <div class="loading-spinner"></div>
    <p>${text}</p>
  `;
}

/**
 * Hide loading spinner
 * @param {string} elementId - ID of element to restore
 * @param {string} originalContent - Original content to restore
 */
function hideSpinner(elementId, originalContent) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.innerHTML = originalContent;
}

/**
 * Disable button and show loading state
 * @param {string} buttonId - ID of button to disable
 * @param {string} loadingText - Text to show while loading
 */
function disableButton(buttonId, loadingText = 'Loading...') {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  button.disabled = true;
  button.dataset.originalText = button.innerHTML;
  button.innerHTML = `
    <span class="loading-spinner"></span>
    ${loadingText}
  `;
}

/**
 * Enable button and restore original state
 * @param {string} buttonId - ID of button to enable
 */
function enableButton(buttonId) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  button.disabled = false;
  if (button.dataset.originalText) {
    button.innerHTML = button.dataset.originalText;
    delete button.dataset.originalText;
  }
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  showToast(message, 'success');
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  showToast(message, 'error');
}

/**
 * Show warning message
 * @param {string} message - Warning message
 */
function showWarning(message) {
  showToast(message, 'warning');
}

/**
 * Show info message
 * @param {string} message - Info message
 */
function showInfo(message) {
  showToast(message, 'info');
}

/**
 * Confirm action with user
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title (optional)
 * @returns {Promise<boolean>} User's choice
 */
function confirmAction(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    const result = confirm(message);
    resolve(result);
  });
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format number with appropriate suffix
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (err) {
        textArea.remove();
        return false;
      }
    }
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}

/**
 * Download data as file
 * @param {string} data - Data to download
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
function downloadFile(data, filename, mimeType = 'text/plain') {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate PDF from HTML content
 * @param {string} content - HTML content to convert
 * @param {string} filename - Output filename
 */
function generatePDF(content, filename = 'career-roadmap.pdf') {
  // For MVP, we'll use the browser's print functionality
  // In production, you might want to use a library like jsPDF or html2pdf
  
  // Create a new window with the content
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

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Validity status
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Validity status
 */
function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Sanitize HTML content
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Scroll to element smoothly
 * @param {string} elementId - ID of element to scroll to
 * @param {number} offset - Offset from top (optional)
 */
function scrollToElement(elementId, offset = 0) {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
}

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @returns {boolean} Visibility status
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Add intersection observer for animations
 * @param {string} selector - CSS selector for elements
 * @param {string} animationClass - CSS class to add when visible
 */
function addIntersectionObserver(selector, animationClass) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add(animationClass);
      }
    });
  }, { threshold: 0.1 });
  
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => observer.observe(element));
}

/**
 * Show/hide element with fade effect
 * @param {string} elementId - ID of element
 * @param {boolean} show - Whether to show or hide
 * @param {number} duration - Animation duration in milliseconds
 */
function toggleElementWithFade(elementId, show, duration = 300) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  if (show) {
    element.style.display = 'block';
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    
    setTimeout(() => {
      element.style.opacity = '1';
    }, 10);
  } else {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    
    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  }
}

// Export functions for use in other modules
window.ui = {
  showToast,
  showModal,
  hideModal,
  closeModalOnOutsideClick,
  closeModalOnEscape,
  showSpinner,
  hideSpinner,
  disableButton,
  enableButton,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  confirmAction,
  formatDate,
  formatNumber,
  debounce,
  throttle,
  copyToClipboard,
  downloadFile,
  generatePDF,
  isValidEmail,
  isValidPhone,
  sanitizeHTML,
  scrollToElement,
  isInViewport,
  addIntersectionObserver,
  toggleElementWithFade
};
