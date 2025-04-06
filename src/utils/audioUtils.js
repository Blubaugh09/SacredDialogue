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
 * Creates an audio element from a URL, handling Firebase Storage URLs
 * 
 * @param {string} url - The URL to the audio file
 * @returns {HTMLAudioElement} - The prepared audio element
 */
export const createAudioFromUrl = (url) => {
  if (!url) {
    console.error('Invalid URL provided to createAudioFromUrl');
    return null;
  }

  try {
    // Fix Firebase storage URLs if needed
    const fixedUrl = fixFirebaseStorageUrl(url);
    console.log('Fixing Firebase storage URL');
    
    // Create a new audio element
    const audio = new Audio(fixedUrl);
    
    // Add error handling
    audio.onerror = (e) => {
      console.error('Error with audio playback:', e);
    };
    
    // Add loadeddata handler to check if audio is valid
    audio.addEventListener('loadeddata', () => {
      console.log('Audio can play through');
    });
    
    return audio;
  } catch (error) {
    console.error('Error creating audio from URL:', error);
    return null;
  }
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