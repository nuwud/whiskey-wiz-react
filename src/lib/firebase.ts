import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCqZMaGpJGf5veYgTXmytg1bLerva-of0U",
  authDomain: "whiskeywiz2.firebaseapp.com",
  databaseURL: "https://whiskeywiz2-default-rtdb.firebaseio.com",
  projectId: "whiskeywiz2",
  storageBucket: "whiskeywiz2.appspot.com",
  messagingSenderId: "555320797929",
  appId: "1:555320797929:web:0d4b062d7f2ab330fc1e78",
  measurementId: "G-SK0TJJEPF5"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics conditionally (not available during SSR)
export const initializeAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;