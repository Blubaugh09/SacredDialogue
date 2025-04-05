import { db, storage } from './config';
import { collection, serverTimestamp, query, limit, setDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import crypto from 'crypto-js';

/**
 * Create a consistent ID for a question-character pair
 * @param {string} question The normalized question
 * @param {string} characterName The character name
 * @returns {string} A hash ID for this question-character combination
 */
const createQuestionId = (question, characterName) => {
  // Normalize the question (lowercase, remove extra spaces)
  const normalizedQuestion = question.toLowerCase().trim();
  // Create a hash of the question and character name for consistent IDs
  return crypto.SHA256(normalizedQuestion + '|' + characterName).toString().substring(0, 20);
};

/**
 * Save a question and response to Firestore, including the audio URL
 * @param {string} question The user's question
 * @param {string} response The character's response text
 * @param {Blob} audioBlob The audio response as a blob
 * @param {string} characterName The name of the character
 * @returns {Promise<string>} The ID of the saved document
 */
export const saveInteraction = async (question, response, audioBlob, characterName) => {
  try {
    // First upload the audio to Firebase Storage
    const audioURL = await uploadAudioToStorage(audioBlob, characterName);
    
    // Create a unique ID based on question content and character
    const questionId = createQuestionId(question, characterName);
    
    // First ensure the character document exists
    const characterDocRef = doc(db, "characters", characterName);
    await setDoc(characterDocRef, { name: characterName }, { merge: true });
    
    // We'll store interactions in a specific subcollection for better organization
    const docRef = doc(db, "characters", characterName, "questions", questionId);
    
    // Save with setDoc instead of addDoc to use our custom ID
    await setDoc(docRef, {
      question: question.toLowerCase().trim(), // Store normalized question
      originalQuestion: question, // Also store original for display purposes
      response,
      audioURL,
      characterName,
      timestamp: serverTimestamp(),
      accessCount: 1 // Track how many times this Q&A has been accessed
    });
    
    console.log("Interaction saved with ID:", questionId);
    return questionId;
  } catch (error) {
    console.error("Error saving interaction:", error);
    throw error;
  }
};

/**
 * Upload audio blob to Firebase Storage
 * @param {Blob} audioBlob Audio blob to upload
 * @param {string} characterName Character name for folder organization
 * @returns {Promise<string>} The download URL for the uploaded audio
 */
export const uploadAudioToStorage = async (audioBlob, characterName) => {
  try {
    // Create a unique filename using timestamp
    const timestamp = new Date().getTime();
    const filename = `${characterName.toLowerCase()}_${timestamp}.mp3`;
    
    // Create a reference to the file location
    const audioRef = ref(storage, `character-audio/${characterName}/${filename}`);
    
    // Upload the blob
    const snapshot = await uploadBytes(audioRef, audioBlob);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log("Audio uploaded successfully, URL:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw error;
  }
};

/**
 * Find existing response for a similar question to avoid duplicate API calls
 * @param {string} question The user's question
 * @param {string} characterName The name of the character
 * @returns {Promise<Object|null>} The existing response object or null if not found
 */
export const findExistingResponse = async (question, characterName) => {
  try {
    // Normalize the question and generate a consistent ID
    const normalizedQuestion = question.toLowerCase().trim();
    const questionId = createQuestionId(normalizedQuestion, characterName);
    
    // Try to get the document directly by ID first (most efficient)
    const docRef = doc(db, "characters", characterName, "questions", questionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log("Found exact match for question:", normalizedQuestion);
      
      // Update access count
      await setDoc(docRef, {
        accessCount: (docSnap.data().accessCount || 0) + 1
      }, { merge: true });
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    
    // If no direct match by ID, try a simplified query approach
    // This avoids index requirements by not using orderBy
    const questionsRef = collection(db, "characters", characterName, "questions");
    const simpleQuery = query(
      questionsRef,
      limit(10)
    );
    
    const querySnapshot = await getDocs(simpleQuery);
    
    // Look for similar questions in the results
    // We could implement a more sophisticated text similarity algorithm here
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      if (data.question && 
        (data.question.includes(normalizedQuestion) || 
         normalizedQuestion.includes(data.question))) {
        
        console.log("Found similar question match:", data.question);
        
        // Update access count
        await setDoc(doc.ref, {
          accessCount: (data.accessCount || 0) + 1
        }, { merge: true });
        
        return {
          id: doc.id,
          ...data
        };
      }
    }
    
    // No match found
    return null;
  } catch (error) {
    console.error("Error finding existing response:", error);
    return null; // Return null instead of throwing to ensure API call still works as fallback
  }
}; 