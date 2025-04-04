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
  AI_API_KEY: getEnv('AI_API_KEY'),
  AI_API_ENDPOINT: getEnv('AI_API_ENDPOINT', 'https://api.openai.com/v1/chat/completions'),
  AI_MODEL: getEnv('AI_MODEL', 'gpt-3.5-turbo'),
  APP_NAME: getEnv('APP_NAME', 'Biblical Character Dialogue'),
}; 