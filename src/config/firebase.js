// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD6z6_LfGDHP1f0eW4exsXvZRLy9f859N4",
  authDomain: "progress-tracker-4a064.firebaseapp.com",
  projectId: "progress-tracker-4a064",
  storageBucket: "progress-tracker-4a064.firebasestorage.app",
  messagingSenderId: "487085960289",
  appId: "1:487085960289:web:517436463ec6f801028e20",
  measurementId: "G-14T1T5L0CT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
