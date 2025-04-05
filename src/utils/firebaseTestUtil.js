import { db, storage } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * Test Firebase connectivity by writing a test document and uploading a test file
 * @returns {Promise<Object>} Result of the test with status
 */
export const testFirebaseConnection = async () => {
  const result = {
    firestore: {
      success: false,
      message: '',
      error: null
    },
    storage: {
      success: false,
      message: '',
      error: null,
      url: null
    }
  };
  
  // Test Firestore
  try {
    const testCollection = collection(db, 'test');
    const docRef = await addDoc(testCollection, {
      message: 'Test connection successful',
      timestamp: serverTimestamp(),
      testId: `test_${Date.now()}`
    });
    
    result.firestore.success = true;
    result.firestore.message = `Test document created with ID: ${docRef.id}`;
  } catch (error) {
    result.firestore.success = false;
    result.firestore.error = error;
    result.firestore.message = `Firestore test failed: ${error.message}`;
  }
  
  // Test Storage
  try {
    const testFileRef = ref(storage, `test/test_${Date.now()}.txt`);
    const testContent = 'This is a test file for Firebase Storage';
    
    await uploadString(testFileRef, testContent);
    const downloadUrl = await getDownloadURL(testFileRef);
    
    result.storage.success = true;
    result.storage.message = 'Test file uploaded successfully';
    result.storage.url = downloadUrl;
  } catch (error) {
    result.storage.success = false;
    result.storage.error = error;
    result.storage.message = `Storage test failed: ${error.message}`;
  }
  
  return result;
};

export default testFirebaseConnection; 