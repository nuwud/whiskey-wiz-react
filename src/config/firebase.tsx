import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

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

const app = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);

let auth: Auth | null = null;
let rtdb: Database | null = null;
let analyticsInstance: Analytics | null = null;

try {
  auth = getAuth(app);
  rtdb = getDatabase(app);

  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        analyticsInstance = getAnalytics(app!);
      }
    }).catch(err => {
      console.warn('Analytics initialization error:', err);
    });
  }

} catch (error) {
  console.error('Firebase initialization error:', error);
}

const getAuthInstance = (): Auth => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  return auth;
};

const getDatabaseInstance = (): Database => {
  if (!rtdb) throw new Error('Realtime Database not initialized');
  return rtdb;
};

export { 
  app, 
  getAuthInstance as auth, 
  getDatabaseInstance as rtdb, 
  analyticsInstance as analytics,
  firebaseConfig 
};
