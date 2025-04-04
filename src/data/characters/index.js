/**
 * Export all character data from a central location
 */

import abraham from './abraham';
import moses from './moses';
import david from './david';
import mary from './mary';
import esther from './esther';

// Add the rest of your characters here as you implement them
const characters = [
  abraham,
  moses,
  david,
  mary,
  esther,
  // Other characters will be added here
];

export default characters;

// Also export individual characters for direct access
export {
  abraham,
  moses, 
  david,
  mary,
  esther,
}; 