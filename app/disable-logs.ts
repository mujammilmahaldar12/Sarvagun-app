// Controlled logging - only disable non-essential logs in production
(() => {
  // Only disable certain console methods in production
  if (__DEV__ === false) {
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
    console.trace = noop;
    console.time = noop;
    console.timeEnd = noop;
    console.group = noop;
    console.groupEnd = noop;
    console.count = noop;
    console.clear = noop;
    
    // Keep console.warn and console.error for debugging
  }

  // Gentle error handling - don't suppress all errors
  if (typeof global !== 'undefined') {
    // Only prevent uncaught errors from crashing the app
    global.addEventListener?.('error', (e) => {
      console.warn('Caught error:', e.error);
      // Don't prevent the error from being logged
      return false;
    });
    
    global.addEventListener?.('unhandledrejection', (e) => {
      console.warn('Caught unhandled promise rejection:', e.reason);
      // Don't prevent the error from being logged
      return false;
    });
  }
})();

export default {};

// Import and disable Alert
try {
  const { Alert } = require('react-native');
  if (Alert) {
    Alert.alert = () => {};
  }
} catch (e) {
  // Ignore import errors
}

export {};
