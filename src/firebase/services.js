import { db, storage } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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