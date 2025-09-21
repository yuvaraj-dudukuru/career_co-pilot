/**
 * Firestore Safeguards
 * Prevents common Firestore initialization errors
 */

const admin = require('firebase-admin');

/**
 * Safely initialize Firestore with error handling
 */
function safeInitializeFirestore() {
  try {
    // Check if Firebase Admin is already initialized
    if (admin.apps.length > 0) {
      console.log('Firebase Admin already initialized, using existing instance');
      return admin.firestore();
    }

    // Initialize Firebase Admin if not already done
    admin.initializeApp();
    console.log('Firebase Admin initialized successfully');
    
    return admin.firestore();
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    
    // Handle specific error cases
    if (error.code === 'app/duplicate-app') {
      console.log('Firebase app already exists, using existing instance');
      return admin.firestore();
    }
    
    if (error.message && error.message.includes('Database already exists')) {
      console.log('Firestore database already exists, using existing database');
      return admin.firestore();
    }
    
    throw error;
  }
}

/**
 * Safely get Firestore instance
 */
function getFirestoreInstance() {
  try {
    return admin.firestore();
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
    return safeInitializeFirestore();
  }
}

/**
 * Test Firestore connection
 */
async function testFirestoreConnection() {
  try {
    const db = getFirestoreInstance();
    
    // Test write operation
    const testDoc = db.collection('health').doc('connection-test');
    await testDoc.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      test: true
    });
    
    // Test read operation
    const doc = await testDoc.get();
    if (doc.exists) {
      console.log('✅ Firestore connection test successful');
      return true;
    } else {
      console.log('❌ Firestore connection test failed: Document not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    return false;
  }
}

/**
 * Common Firestore error messages and solutions
 */
const FIRESTORE_ERROR_SOLUTIONS = {
  'Database already exists': {
    message: 'The Firestore database already exists. This is normal for the default database.',
    solution: 'Use the existing database - no action needed.',
    code: 'FIRESTORE_DB_EXISTS'
  },
  'app/duplicate-app': {
    message: 'Firebase app is already initialized.',
    solution: 'Use the existing app instance.',
    code: 'FIREBASE_DUPLICATE_APP'
  },
  'permission-denied': {
    message: 'Insufficient permissions to access Firestore.',
    solution: 'Check Firebase project permissions and service account keys.',
    code: 'FIRESTORE_PERMISSION_DENIED'
  },
  'unavailable': {
    message: 'Firestore service is temporarily unavailable.',
    solution: 'Retry the operation after a short delay.',
    code: 'FIRESTORE_UNAVAILABLE'
  }
};

/**
 * Handle Firestore errors with appropriate solutions
 */
function handleFirestoreError(error, context = '') {
  const errorMessage = error.message || error.toString();
  const errorCode = error.code || 'UNKNOWN';
  
  console.error(`Firestore error in ${context}:`, error);
  
  // Check for known error patterns
  for (const [pattern, solution] of Object.entries(FIRESTORE_ERROR_SOLUTIONS)) {
    if (errorMessage.includes(pattern) || errorCode.includes(pattern)) {
      console.log(`Known error detected: ${solution.code}`);
      console.log(`Message: ${solution.message}`);
      console.log(`Solution: ${solution.solution}`);
      return solution;
    }
  }
  
  // Generic error handling
  console.log('Unknown Firestore error, using generic handling');
  return {
    message: 'An unexpected Firestore error occurred',
    solution: 'Check Firebase configuration and network connectivity',
    code: 'FIRESTORE_UNKNOWN_ERROR'
  };
}

module.exports = {
  safeInitializeFirestore,
  getFirestoreInstance,
  testFirestoreConnection,
  handleFirestoreError,
  FIRESTORE_ERROR_SOLUTIONS
};
