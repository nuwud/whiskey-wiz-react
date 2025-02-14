import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Ensure environment variables are loaded
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  throw new Error('Firebase configuration is missing. Ensure .env variables are correctly set.');
}

// Firebase Configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Ensure all required environment variables are loaded
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID'
];

const missingVars = requiredVars.filter(
  varName => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  throw new Error(`Firebase configuration is missing: ${missingVars.join(', ')}`);
}

// Ensure Firebase initializes only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export Firebase services
const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);
let analytics = null;

// Ensure Analytics runs only in the browser
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        // Here you might want to trigger any function that depends on analytics
      }
    })
    .catch((err) => {
      console.warn('Analytics initialization error:', err);
    });
}

// Export initialized Firebase modules
export { app, db, auth, rtdb, analytics };
export default app;
