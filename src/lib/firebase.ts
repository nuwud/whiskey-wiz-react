import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCqZMaGpJGf5veYgTXmytg1bLerva-of0U",
  authDomain: "whiskeywiz2.firebaseapp.com",
  projectId: "whiskeywiz2",
  storageBucket: "whiskeywiz2.appspot.com",
  messagingSenderId: "555320797929",
  appId: "1:555320797929:web:0d4b062d7f2ab330fc1e78",
  measurementId: "G-SK0TJJEPF5",
  databaseURL: "https://whiskeywiz2-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;