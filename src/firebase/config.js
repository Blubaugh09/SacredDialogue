import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhqUc_iceq1Mvz69SrPZ8NpX4TJeouajQ",
  authDomain: "echos-of-logos.firebaseapp.com",
  projectId: "echos-of-logos",
  storageBucket: "echos-of-logos.firebasestorage.app",
  messagingSenderId: "378931027200",
  appId: "1:378931027200:web:202c72f968419cf862e7e5",
  measurementId: "G-N2NWSHDX8G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { db, storage }; 