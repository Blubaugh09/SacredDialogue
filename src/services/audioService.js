/**
 * Audio service for text-to-speech and speech-to-text functionality
 */

import { ENV } from '../utils/env';
import { uploadAudioToStorage, getAudioBlobFromFirebase } from '../firebase/services';

// Audio cache to store generated audio blobs
const audioCache = new Map();

/**
 * Converts text to speech using the OpenAI Text-to-Speech API
 * 
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use (default: 'onyx')
 * @param {number} speed - The speaking speed (1.0 is normal, higher is faster)
 * @param {string} characterName - The name of the character for storage purposes
 * @returns {Promise<{blob: Blob, url: string}>} - Audio blob and Firebase URL
 */
export const textToSpeech = async (text, voice = 'onyx', speed = 1.3, characterName = null) => {
  // Create a cache key from the text, voice, and speed
  const cacheKey = `${text}|${voice}|${speed}`;
  
  // Check if we already have this audio in the cache
  if (audioCache.has(cacheKey)) {
    return { blob: audioCache.get(cacheKey), url: null };
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        speed: speed // Increase speaking speed
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('TTS API Error:', error);
      throw new Error(`TTS API Error: ${error.error?.message || 'Unknown error'}`);
    }

    // Get the audio data as a blob
    const audioBlob = await response.blob();
    
    // Cache the audio for future use
    audioCache.set(cacheKey, audioBlob);
    
    // If character name is provided, upload to Firebase Storage
    let firebaseUrl = null;
    if (characterName) {
      try {
        firebaseUrl = await uploadAudioToStorage(audioBlob, characterName);
      } catch (storageError) {
        console.error('Firebase Storage upload error:', storageError);
        // Continue with local blob even if Firebase upload fails
      }
    }
    
    return { blob: audioBlob, url: firebaseUrl };
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw error;
  }
};

/**
 * Converts speech to text using the OpenAI Whisper API
 * 
 * @param {Blob} audioBlob - The audio blob to transcribe
 * @returns {Promise<string>} - The transcribed text
 */
export const speechToText = async (audioBlob) => {
  try {
    // Create a FormData object to send the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Set to English for Biblical context
    formData.append('response_format', 'json');
    
    // Send the request to the OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV.AI_API_KEY}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Speech-to-text API Error:', error);
      throw new Error(`Speech-to-text API Error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Speech-to-text error:', error);
    throw error;
  }
};

/**
 * Start recording audio from the microphone
 * 
 * @returns {Promise<{stream: MediaStream, recorder: MediaRecorder}>} - MediaStream and MediaRecorder objects
 */
export const startRecording = async () => {
  try {
    // Request permission and access to the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create a MediaRecorder instance
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    
    // Start recording
    recorder.start();
    
    return { stream, recorder };
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

/**
 * Stop recording and get the audio blob
 * 
 * @param {MediaRecorder} recorder - The MediaRecorder instance
 * @param {MediaStream} stream - The MediaStream to stop
 * @returns {Promise<Blob>} - The recorded audio as a Blob
 */
export const stopRecording = (recorder, stream) => {
  return new Promise((resolve, reject) => {
    // Audio data chunks
    const chunks = [];
    
    // Event listener for data available
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    // Event listener for recording stopped
    recorder.onstop = () => {
      // Stop all tracks in the stream
      stream.getTracks().forEach(track => track.stop());
      
      // Create a blob from all chunks
      const blob = new Blob(chunks, { type: 'audio/webm' });
      resolve(blob);
    };
    
    // Event listener for errors
    recorder.onerror = (event) => {
      reject(event.error);
    };
    
    // Stop recording
    recorder.stop();
  });
};

/**
 * Get the appropriate voice for a character
 * 
 * @param {Object} character - The character object
 * @returns {string} - The voice to use
 */
export const getVoiceForCharacter = (character) => {
  const voiceMap = {
    'Abraham': 'onyx', // Deep, wise voice
    'Moses': 'echo',   // Authoritative voice
    'David': 'nova',   // Poetic, expressive voice
    'Daniel': 'onyx',
    'Esther': 'shimmer',
    'Mary': 'shimmer', // Female voice
    'Paul': 'echo'
  };
  
  return voiceMap[character.name] || 'onyx'; // Default to onyx
};

/**
 * Create an audio element from a character's greeting
 * 
 * @param {Object} character - The character data
 * @returns {Promise<HTMLAudioElement>} - The audio element ready to play
 */
export const prepareGreetingAudio = async (character) => {
  if (!character || !character.greeting) return null;
  
  try {
    const voice = getVoiceForCharacter(character);
    const { blob: audioBlob } = await textToSpeech(character.greeting, voice);
    
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Set up cleanup
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
    
    return audio;
  } catch (error) {
    console.error('Failed to prepare greeting audio:', error);
    return null;
  }
};

/**
 * Fetches an audio file from a URL and converts it to a blob
 * This helps overcome CORS and format issues with Firebase Storage URLs
 * 
 * @param {string} url - The URL of the audio file
 * @returns {Promise<Blob>} - Audio blob that can be played
 */
export const fetchAudioAsBlob = async (url) => {
  try {
    console.log('Attempting to fetch audio from URL:', url);
    
    // Check if it's a Firebase Storage URL
    if (url.includes('firebasestorage.googleapis.com')) {
      console.log('Detected Firebase Storage URL, using SDK to fetch');
      // Use Firebase SDK directly to avoid CORS issues
      return await getAudioBlobFromFirebase(url);
    }
    
    // For non-Firebase URLs, use regular fetch with cache busting
    const cacheBustUrl = `${url}&_cb=${Date.now()}`;
    
    const response = await fetch(cacheBustUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Accept': 'audio/mpeg, audio/*;q=0.8'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('Successfully fetched audio blob, size:', blob.size, 'bytes, type:', blob.type);
    return blob;
  } catch (error) {
    console.error('Error fetching audio as blob:', error);
    throw error;
  }
}; 