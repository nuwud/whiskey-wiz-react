import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache,
  type Firestore,
  type FirestoreSettings
} from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getFunctions, type Functions } from 'firebase/functions';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: Functions;
let analytics: Analytics;
let storage: FirebaseStorage;

const firestoreSettings: FirestoreSettings = {
  localCache: persistentLocalCache()
};

// Initialize Firebase
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, firestoreSettings);
    auth = getAuth(app);
    functions = getFunctions(app);
    storage = getStorage(app);
    
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
} else {
  app = getApps()[0];
  db = initializeFirestore(app, firestoreSettings);
  auth = getAuth(app);
  functions = getFunctions(app);
  storage = getStorage(app);
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
}

export { app, db, auth, functions, analytics, storage };