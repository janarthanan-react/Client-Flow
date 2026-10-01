// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBcvRapHyPSNE5h8n2daosknMMuuGNLI8U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "client-flow-cae99.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "client-flow-cae99",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "client-flow-cae99.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "648496987808",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:648496987808:web:a9daff5083799c2a2bd3c5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5ZZDYC6Y9W"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (conditionally in browser environments)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

