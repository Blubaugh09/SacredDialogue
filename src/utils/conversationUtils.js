/**
 * Utility functions for working with conversations
 * Used to find similar messages and determine if a cached response should be used
 */

/**
 * Simple text normalization function to improve matching
 * @param {string} text - The text to normalize
 * @returns {string} - Normalized text
 */
export const normalizeText = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,?!;:'"()\-_]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
};

/**
 * Calculate similarity between two strings
 * This is a simple implementation of Jaccard similarity
 * For production use, consider more sophisticated NLP methods
 * 
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} - Similarity score between 0 and 1
 */
export const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  // Normalize both strings
  const normalizedStr1 = normalizeText(str1);
  const normalizedStr2 = normalizeText(str2);
  
  // Check for exact match
  if (normalizedStr1 === normalizedStr2) return 1;
  
  // Split into word arrays
  const words1 = normalizedStr1.split(' ').filter(word => word.length > 0);
  const words2 = normalizedStr2.split(' ').filter(word => word.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Count common words
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // Create intersection and union for Jaccard similarity
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

/**
 * Determines if a question is similar enough to use a cached response
 * 
 * @param {string} newQuestion - The new question from the user
 * @param {string} cachedQuestion - The question from cache
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {boolean} - Whether questions are similar enough
 */
export const areSimilarQuestions = (newQuestion, cachedQuestion, threshold = 0.7) => {
  // Check for null or empty strings
  if (!newQuestion || !cachedQuestion) return false;
  
  // Calculate similarity
  const similarity = calculateSimilarity(newQuestion, cachedQuestion);
  
  return similarity >= threshold;
}; 