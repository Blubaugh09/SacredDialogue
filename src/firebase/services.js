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
 * @returns {Promise<Object>} - The saved document reference with ID
 */
export const saveConversation = async (characterName, userMessage, aiResponse, audioBlob, sessionId) => {
  try {
    // Create conversation data object
    const conversationData = {
      sessionId,
      character: characterName,
      message: userMessage,
      response: aiResponse,
      // Add fields with the same names used in SharedConversation.js
      userMessage: userMessage,
      aiResponse: aiResponse,
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
    
    // Return conversation data with the document ID
    return {
      id: docRef.id,
      ...conversationData,
      timestamp: new Date() // Replace serverTimestamp with actual date for immediate use
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
      
      // Return the exact match immediately without validation
      // This avoids the slow HEAD request to Firebase Storage
      return exactMatch;
    }
    
    // If no exact match, try to find similar questions
    for (const conv of conversations) {
      if (conv.message && areSimilarQuestions(question, conv.message, similarityThreshold)) {
        console.log('Found similar question:', conv.message, 'for', question);
        
        // Return the similar match immediately without validation
        return conv;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding similar conversation:', error);
    return null;
  }
};

/**
 * Retrieves a specific conversation by its ID
 * 
 * @param {string} characterName - The name of the character
 * @param {string} conversationId - The ID of the conversation document
 * @returns {Promise<Object|null>} - The conversation data or null if not found
 */
export const getConversationById = async (characterName, conversationId) => {
  try {
    const characterCollection = collection(db, 'characters', characterName.toLowerCase(), 'conversations');
    const conversationRef = doc(characterCollection, conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      console.log('Conversation not found:', conversationId);
      return null;
    }
    
    // Get conversation data
    const data = conversationDoc.data();
    const conversationData = {
      id: conversationDoc.id,
      ...data,
      // Ensure we have both naming conventions for backward compatibility
      userMessage: data.userMessage || data.message,
      aiResponse: data.aiResponse || data.response,
      // Convert server timestamp to JS Date if it exists
      timestamp: data.timestamp?.toDate?.() || null
    };
    
    return conversationData;
  } catch (error) {
    console.error('Error getting conversation by ID:', error);
    return null;
  }
};

/**
 * Creates a shareable version of a conversation
 * This saves the essential data in a dedicated 'shares' collection for reliability
 * 
 * @param {string} characterName - The name of the character
 * @param {string} userMessage - The user's message
 * @param {string} aiResponse - The AI's response
 * @param {string} audioUrl - URL to the audio file (if any)
 * @returns {Promise<string>} - The share ID
 */
export const createShareableConversation = async (characterName, userMessage, aiResponse, audioUrl) => {
  try {
    // Create share data object with all necessary information
    const shareData = {
      characterName,
      userMessage,
      aiResponse,
      audioUrl,
      timestamp: serverTimestamp(),
    };

    // Save to dedicated 'shares' collection
    const sharesCollection = collection(db, 'shares');
    const docRef = await addDoc(sharesCollection, shareData);
    
    console.log('Created shareable conversation with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating shareable conversation:', error);
    throw error;
  }
};

/**
 * Retrieves a shared conversation by its ID
 * 
 * @param {string} shareId - The ID of the shared conversation
 * @returns {Promise<Object|null>} - The shared conversation data or null if not found
 */
export const getSharedConversation = async (shareId) => {
  try {
    const shareRef = doc(db, 'shares', shareId);
    const shareDoc = await getDoc(shareRef);
    
    if (!shareDoc.exists()) {
      console.log('Shared conversation not found:', shareId);
      return null;
    }
    
    // Get share data
    const shareData = {
      id: shareDoc.id,
      ...shareDoc.data(),
      // Convert server timestamp to JS Date if it exists
      timestamp: shareDoc.data().timestamp?.toDate?.() || null
    };
    
    return shareData;
  } catch (error) {
    console.error('Error getting shared conversation:', error);
    return null;
  }
}; 