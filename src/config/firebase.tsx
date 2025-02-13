// src/config/firebase.tsx
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Safety check for Firebase configuration
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  throw new Error('Firebase configuration is missing');
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;
let analyticsInstance: Analytics | null = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  rtdb = getDatabase(app);

  // Initialize analytics safely
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        analyticsInstance = getAnalytics(app);
      }
    }).catch(err => {
      console.warn('Analytics initialization error:', err);
    });
  }

} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Export a function to get analytics that won't fail if analytics isn't initialized
const getAnalyticsInstance = () => analyticsInstance;

export { 
  app, 
  auth, 
  db, 
  rtdb, 
  getAnalyticsInstance as analytics,
  firebaseConfig 
};