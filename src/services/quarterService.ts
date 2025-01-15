import { db } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { Quarter } from '../models/Quarter';

export const quarterService = {
  async getActiveQuarters(): Promise<Quarter[]> {
    const q = query(
      collection(db, 'quarters'), 
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Quarter));
  },

  async getAllQuarters(): Promise<Quarter[]> {
    const q = query(collection(db, 'quarters'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Quarter));
  },

  async createQuarter(quarter: Omit<Quarter, 'id'>): Promise<string> {
    const quarterWithTimestamp = {
      ...quarter,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'quarters'), quarterWithTimestamp);
    return docRef.id;
  },

  async updateQuarter(quarterId: string, updates: Partial<Quarter>): Promise<void> {
    const quarterRef = doc(db, 'quarters', quarterId);
    await updateDoc(quarterRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async getGameConfiguration() {
    const configRef = doc(db, 'game_configurations', 'default');
    const configSnap = await getDocs(query(collection(db, 'game_configurations')));
    
    if (configSnap.empty) {
      throw new Error('No game configuration found');
    }

    return configSnap.docs[0].data();
  }
};