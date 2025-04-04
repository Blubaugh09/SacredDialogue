// Firebase services for storing messages and audio
import { db, storage } from './config';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  query,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { areSimilarQuestions } from '../utils/conversationUtils';

/**
 * Saves a conversation message and response to Firestore
 * Also handles uploading audio file to Firebase Storage if provided
 * 
 * @param {string} characterName - The name of the character
 * @param {string} userMessage - The user's message
 * @param {string} aiResponse - The AI's response
 * @param {Blob} audioBlob - The audio blob of the response
 * @param {string} sessionId - The unique session ID
 * @returns {Promise<Object>} - The saved document reference
 */
export const saveConversation = async (characterName, userMessage, aiResponse, audioBlob, sessionId) => {
  try {
    // Create conversation data object
    const conversationData = {
      sessionId,
      character: characterName,
      message: userMessage,
      response: aiResponse,
      timestamp: serverTimestamp(),
    };

    // Handle audio file if provided
    if (audioBlob) {
      const audioUrl = await uploadAudio(characterName, audioBlob, sessionId);
      conversationData.audioUrl = audioUrl;
    }

    // Save to Firestore
    const characterCollection = collection(db, 'characters', characterName.toLowerCase(), 'conversations');
    const docRef = await addDoc(characterCollection, conversationData);
    
    return {
      id: docRef.id,
      ...conversationData
    };
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
};

/**
 * Uploads an audio file to Firebase Storage
 * 
 * @param {string} characterName - The name of the character
 * @param {Blob} audioBlob - The audio blob to upload
 * @param {string} sessionId - The unique session ID
 * @returns {Promise<string>} - The download URL
 */
export const uploadAudio = async (characterName, audioBlob, sessionId) => {
  try {
    const timestamp = new Date().getTime();
    const filename = `${sessionId}_${timestamp}.mp3`;
    const audioRef = ref(storage, `audio/${characterName.toLowerCase()}/${filename}`);
    
    // Upload the audio blob
    await uploadBytes(audioRef, audioBlob);
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(audioRef);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
};

/**
 * Saves session data to Firestore
 * 
 * @param {string} sessionId - The unique session ID
 * @param {Object} sessionData - The session data to save
 * @param {boolean} shouldMerge - Whether to merge with existing data
 * @returns {Promise<void>}
 */
export const saveSession = async (sessionId, sessionData, shouldMerge = false) => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    
    // Check if the document exists
    const sessionDoc = await getDoc(sessionRef);
    
    if (sessionDoc.exists() && shouldMerge) {
      // Update the existing document with new data
      await updateDoc(sessionRef, sessionData);
    } else {
      // Create a new document
      await setDoc(sessionRef, {
        ...sessionData,
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

/**
 * Fetches previous conversations for a character
 * 
 * @param {string} characterName - The name of the character
 * @param {number} limit - Maximum number of conversations to fetch
 * @returns {Promise<Array>} - Array of conversation objects
 */
export const getPreviousConversations = async (characterName, limitCount = 50) => {
  try {
    const characterCollection = collection(db, 'characters', characterName.toLowerCase(), 'conversations');
    const q = query(
      characterCollection,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const conversations = [];
    
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data(),
        // Convert server timestamp to JS Date if it exists
        timestamp: doc.data().timestamp?.toDate?.() || null
      });
    });
    
    return conversations;
  } catch (error) {
    console.error('Error fetching previous conversations:', error);
    return [];
  }
};

/**
 * Find a similar previous conversation for a given question
 * 
 * @param {string} characterName - The name of the character
 * @param {string} question - The user's question
 * @param {number} similarityThreshold - Threshold for determining similarity (0-1)
 * @returns {Promise<Object|null>} - The most similar previous conversation or null
 */
export const findSimilarConversation = async (characterName, question, similarityThreshold = 0.7) => {
  try {
    // Get previous conversations for this character
    const conversations = await getPreviousConversations(characterName, 100);
    
    // Don't cache empty questions
    if (!question || question.trim() === '') {
      return null;
    }
    
    // Try to find an exact match first (faster than similarity calculation)
    const normalizedQuestion = question.toLowerCase().trim();
    
    const exactMatch = conversations.find(conv => 
      conv.message && conv.message.toLowerCase().trim() === normalizedQuestion
    );
    
    if (exactMatch) {
      console.log('Found exact match for question:', question);
      
      // Validate the audio URL if it exists
      if (exactMatch.audioUrl) {
        try {
          // Check if the URL is accessible by making a HEAD request
          const response = await fetch(exactMatch.audioUrl, { method: 'HEAD' });
          if (!response.ok) {
            console.log('Cached audio URL is no longer valid, will regenerate audio');
            // If URL is no longer valid, set it to null so new audio will be generated
            exactMatch.audioUrl = null;
          }
        } catch (error) {
          console.error('Error checking cached audio URL:', error);
          // If there's an error accessing the URL, set it to null
          exactMatch.audioUrl = null;
        }
      }
      
      return exactMatch;
    }
    
    // If no exact match, try to find similar questions
    for (const conv of conversations) {
      if (conv.message && areSimilarQuestions(question, conv.message, similarityThreshold)) {
        console.log('Found similar question:', conv.message, 'for', question);
        
        // Validate the audio URL if it exists
        if (conv.audioUrl) {
          try {
            // Check if the URL is accessible by making a HEAD request
            const response = await fetch(conv.audioUrl, { method: 'HEAD' });
            if (!response.ok) {
              console.log('Cached audio URL is no longer valid, will regenerate audio');
              // If URL is no longer valid, set it to null so new audio will be generated
              conv.audioUrl = null;
            }
          } catch (error) {
            console.error('Error checking cached audio URL:', error);
            // If there's an error accessing the URL, set it to null
            conv.audioUrl = null;
          }
        }
        
        return conv;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding similar conversation:', error);
    return null;
  }
}; 