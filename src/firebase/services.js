import { db, storage } from './config';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
    
    // Then save the interaction data to Firestore
    const docRef = await addDoc(collection(db, "interactions"), {
      question,
      response,
      audioURL,
      characterName,
      timestamp: serverTimestamp()
    });
    
    console.log("Interaction saved with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving interaction: ", error);
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
    
    console.log("Audio uploaded successfully, URL: ", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading audio: ", error);
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
    // Normalize the question (lowercase, remove extra spaces)
    const normalizedQuestion = question.toLowerCase().trim();
    
    // Query Firestore for exact matches first
    const exactMatchesQuery = query(
      collection(db, "interactions"),
      where("characterName", "==", characterName),
      where("question", "==", normalizedQuestion),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    
    const exactMatchesSnapshot = await getDocs(exactMatchesQuery);
    
    // If we found an exact match, return it
    if (!exactMatchesSnapshot.empty) {
      const doc = exactMatchesSnapshot.docs[0];
      console.log("Found exact match for question:", normalizedQuestion);
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    
    // If no exact match, we could implement a more fuzzy search here
    // For example, checking if the query contains similar keywords
    // This would be more complex and might require a specialized search solution
    // For now, we'll just return null if no exact match is found
    
    return null;
  } catch (error) {
    console.error("Error finding existing response:", error);
    return null; // Return null instead of throwing to ensure API call still works as fallback
  }
}; 