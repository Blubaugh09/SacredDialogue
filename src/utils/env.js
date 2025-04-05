/**
 * Environment variable handling utility
 */

// Environment configuration utilities

// Helper function to get environment variables with fallbacks
const getEnv = (key, fallback = '') => {
  const fullKey = `REACT_APP_${key}`;
  return process.env[fullKey] || fallback;
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
  AI_API_ENDPOINT: process.env.REACT_APP_AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions',
  AI_API_KEY: process.env.REACT_APP_AI_API_KEY || '',
  AI_MODEL: process.env.REACT_APP_AI_MODEL || 'gpt-3.5-turbo',
  APP_NAME: getEnv('APP_NAME', 'Biblical Character Dialogue'),
};

// Check if an environment variable exists
export const hasEnv = (key) => {
  return ENV[key] && ENV[key].length > 0;
};

// Get the API endpoint
export const getApiEndpoint = () => {
  return ENV.AI_API_ENDPOINT;
};

// Get the API key
export const getApiKey = () => {
  return ENV.AI_API_KEY;
};

// Get the AI model
export const getModel = () => {
  return ENV.AI_MODEL;
}; 