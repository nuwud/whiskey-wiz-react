import { db } from '../config/firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Quarter } from '../models/Quarter';

export const quarterService = {
  async getActiveQuarters(): Promise<Quarter[]> {
    const q = query(collection(db, 'quarters'), where('active', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Quarter));
  },

  async createQuarter(quarter: Omit<Quarter, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'quarters'), quarter);
    return docRef.id;
  },

  async updateQuarter(quarterId: string, updates: Partial<Quarter>): Promise<void> {
    const quarterRef = doc(db, 'quarters', quarterId);
    await updateDoc(quarterRef, updates);
  }
};
