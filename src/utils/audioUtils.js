/**
 * Utility functions for handling audio playback, especially with Firebase Storage URLs
 */

/**
 * Fix Firebase Storage URL by adding required parameters
 * 
 * @param {string} url - The Firebase Storage URL to fix
 * @returns {string} - The fixed URL with proper parameters
 */
export const fixFirebaseStorageUrl = (url) => {
  if (!url) return url;
  
  // Check if the source is from a Firebase Storage URL
  if (url.includes('firebasestorage.googleapis.com')) {
    console.log('Fixing Firebase storage URL');
    
    // Add token and alt parameter if not present
    if (!url.includes('alt=media')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}alt=media`;
    }
  }
  
  return url;
};

/**
 * Create an audio element from a URL, with special handling for Firebase Storage
 * 
 * @param {string} url - The URL to the audio file
 * @param {Function} onEnded - Callback for when audio ends
 * @returns {Promise<HTMLAudioElement|null>} - Promise resolving to an audio element or null
 */
export const createAudioFromUrl = (url, onEnded = () => {}) => {
  return new Promise((resolve, reject) => {
    if (!url) {
      console.error('No URL provided for audio');
      return resolve(null);
    }
    
    try {
      // Fix the URL if it's from Firebase Storage
      const fixedUrl = fixFirebaseStorageUrl(url);
      
      // Create audio element
      const audio = new Audio();
      
      // Set up event listeners
      audio.addEventListener('canplaythrough', () => {
        console.log('Audio can play through');
        resolve(audio);
      }, { once: true });
      
      audio.addEventListener('error', (error) => {
        console.error('Error loading audio:', error);
        reject(error);
      }, { once: true });
      
      // Set onended callback
      audio.onended = onEnded;
      
      // Set the source last, after all event listeners
      audio.src = fixedUrl;
      audio.load();
      
      // Timeout to prevent hanging
      setTimeout(() => {
        if (audio.readyState === 0) {
          console.warn('Audio loading timed out, trying to resolve anyway');
          resolve(audio);
        }
      }, 5000);
    } catch (error) {
      console.error('Error creating audio element:', error);
      reject(error);
    }
  });
};

/**
 * Play an audio URL with proper error handling
 * 
 * @param {string} url - The URL to play
 * @param {Function} onEnded - Function to call when audio ends
 * @returns {Promise<HTMLAudioElement|null>} - The audio element or null if failed
 */
export const playAudioUrl = async (url, onEnded = () => {}) => {
  try {
    if (!url) {
      console.error('No URL provided for audio');
      return null;
    }
    
    const audio = await createAudioFromUrl(url, onEnded);
    
    if (!audio) {
      console.error('Failed to create audio element');
      return null;
    }
    
    // Try to play the audio
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Error playing audio:', error);
      });
    }
    
    return audio;
  } catch (error) {
    console.error('Error playing audio URL:', error);
    return null;
  }
}; 