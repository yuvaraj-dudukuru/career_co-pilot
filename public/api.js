/**
 * Career Co-Pilot - API Utilities
 * Handles all HTTP requests to the backend Cloud Functions
 */

// API base URL (will be replaced by Firebase hosting proxy)
const API_BASE_URL = '/api';

/**
 * Make authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
async function makeAuthenticatedRequest(endpoint, options = {}) {
  try {
    // Get current user
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get ID token
    const token = await currentUser.getIdToken();
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    // Make request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Parse response
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error(`API request failed (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Generate career recommendations
 * @param {Object} profile - User profile data
 * @returns {Promise<Object>} Recommendations response
 */
async function generateRecommendations(profile) {
  return makeAuthenticatedRequest('/recommend', {
    method: 'POST',
    body: JSON.stringify({ profile })
  });
}

/**
 * Delete user data
 * @returns {Promise<Object>} Deletion response
 */
async function deleteUserData() {
  return makeAuthenticatedRequest('/delete_user_data', {
    method: 'POST'
  });
}

/**
 * Create a time-limited share token for a recommendation
 * @param {string} recommendationId
 */
async function createShareToken(recommendationId) {
  return makeAuthenticatedRequest(`/share/${recommendationId}`, {
    method: 'POST'
  });
}

/**
 * View a shared recommendation by token (public)
 * @param {string} token
 */
async function viewSharedPlan(token) {
  const response = await fetch(`/api/share/view/${token}`);
  if (!response.ok) throw new Error('Failed to fetch shared plan');
  return response.json();
}

/**
 * Request printable HTML for a recommendation (server-side generation)
 * @param {string} recommendationId
 */
async function requestPrintableHtml(recommendationId) {
  return makeAuthenticatedRequest('/generate_pdf', {
    method: 'POST',
    body: JSON.stringify({ recommendationId })
  });
}

/**
 * Health check
 * @returns {Promise<Object>} Health status
 */
async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

/**
 * Test API connectivity
 * @returns {Promise<boolean>} Connection status
 */
async function testAPIConnectivity() {
  try {
    const health = await healthCheck();
    return health.status === 'OK';
  } catch (error) {
    console.error('API connectivity test failed:', error);
    return false;
  }
}

/**
 * Retry API request with exponential backoff
 * @param {Function} apiCall - API function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<Object>} API response
 */
async function retryAPIRequest(apiCall, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`API request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Batch API requests
 * @param {Array<Function>} apiCalls - Array of API functions to call
 * @param {number} concurrency - Maximum concurrent requests
 * @returns {Promise<Array>} Array of responses
 */
async function batchAPIRequests(apiCalls, concurrency = 3) {
  const results = [];
  const chunks = [];
  
  // Split into chunks
  for (let i = 0; i < apiCalls.length; i += concurrency) {
    chunks.push(apiCalls.slice(i, i + concurrency));
  }
  
  // Process chunks sequentially
  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(chunk.map(call => call()));
    results.push(...chunkResults);
  }
  
  return results;
}

/**
 * Validate API response
 * @param {Object} response - API response to validate
 * @param {Object} schema - Expected schema
 * @returns {boolean} Validation result
 */
function validateAPIResponse(response, schema) {
  try {
    // Basic validation - in production, use a proper validation library
    if (!response || typeof response !== 'object') {
      return false;
    }
    
    // Check required fields based on schema
    for (const [field, required] of Object.entries(schema)) {
      if (required && !(field in response)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Response validation failed:', error);
    return false;
  }
}

/**
 * Handle API errors gracefully
 * @param {Error} error - Error to handle
 * @param {string} context - Context where error occurred
 * @returns {Object} User-friendly error message
 */
function handleAPIError(error, context = 'API request') {
  console.error(`${context} failed:`, error);
  
  // Extract user-friendly message
  let userMessage = 'Something went wrong. Please try again.';
  
  if (error.message) {
    if (error.message.includes('401')) {
      userMessage = 'Please sign in again to continue.';
    } else if (error.message.includes('403')) {
      userMessage = 'You don\'t have permission to perform this action.';
    } else if (error.message.includes('404')) {
      userMessage = 'The requested resource was not found.';
    } else if (error.message.includes('429')) {
      userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('500')) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.message.includes('network')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else {
      // Use the actual error message if it's user-friendly
      userMessage = error.message;
    }
  }
  
  return {
    message: userMessage,
    technical: error.message || 'Unknown error',
    context
  };
}

/**
 * Rate limit API requests
 * @param {Function} apiCall - API function to rate limit
 * @param {number} minInterval - Minimum interval between requests in milliseconds
 * @returns {Function} Rate-limited function
 */
function rateLimitAPI(apiCall, minInterval = 1000) {
  let lastCall = 0;
  
  return async function(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall < minInterval) {
      const waitTime = minInterval - timeSinceLastCall;
      console.log(`Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastCall = Date.now();
    return apiCall(...args);
  };
}

/**
 * Cache API responses
 * @param {Function} apiCall - API function to cache
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Function} Cached function
 */
function cacheAPIResponse(apiCall, ttl = 5 * 60 * 1000) { // 5 minutes default
  const cache = new Map();
  
  return async function(...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log('Using cached API response');
      return cached.data;
    }
    
    const data = await apiCall(...args);
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  };
}

/**
 * Monitor API performance
 * @param {Function} apiCall - API function to monitor
 * @param {string} name - Name for monitoring
 * @returns {Function} Monitored function
 */
function monitorAPI(apiCall, name = 'API Call') {
  return async function(...args) {
    const start = performance.now();
    
    try {
      const result = await apiCall(...args);
      const duration = performance.now() - start;
      
      console.log(`${name} completed in ${duration.toFixed(2)}ms`);
      
      // Log to analytics if available
      if (window.app && window.app.logAnalytics) {
        window.app.logAnalytics('api_performance', {
          endpoint: name,
          duration: Math.round(duration),
          success: true
        });
      }
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - start;
      
      console.error(`${name} failed after ${duration.toFixed(2)}ms:`, error);
      
      // Log to analytics if available
      if (window.app && window.app.logAnalytics) {
        window.app.logAnalytics('api_performance', {
          endpoint: name,
          duration: Math.round(duration),
          success: false,
          error: error.message
        });
      }
      
      throw error;
    }
  };
}

// Export functions for use in other modules
window.api = {
  generateRecommendations,
  deleteUserData,
  healthCheck,
  testAPIConnectivity,
  retryAPIRequest,
  batchAPIRequests,
  validateAPIResponse,
  handleAPIError,
  rateLimitAPI,
  cacheAPIResponse,
  monitorAPI
};
