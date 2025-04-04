/**
 * Environment variable handling utility
 */

/**
 * Get an environment variable with a fallback value
 * 
 * @param {string} key - Environment variable key
 * @param {any} fallback - Fallback value if environment variable is not set
 * @returns {string|any} - Environment variable value or fallback
 */
export const getEnv = (key, fallback = '') => {
  const value = process.env[`REACT_APP_${key}`];
  return value !== undefined ? value : fallback;
};

/**
 * Check if an environment variable is set
 * 
 * @param {string} key - Environment variable key
 * @returns {boolean} - Whether the environment variable is set
 */
export const hasEnv = (key) => {
  const value = process.env[`REACT_APP_${key}`];
  return value !== undefined && value.trim() !== '';
};

// Export important environment variables with fallbacks
export const ENV = {
  // OpenAI configuration
  AI_API_KEY: process.env.REACT_APP_AI_API_KEY,
  AI_API_ENDPOINT: process.env.REACT_APP_AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions',
  AI_MODEL: process.env.REACT_APP_AI_MODEL || 'gpt-3.5-turbo',
  
  // Firebase configuration
  FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  
  // App configuration
  APP_NAME: process.env.REACT_APP_APP_NAME || 'Biblical Character Dialogue'
}; 