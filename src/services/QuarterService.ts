import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface Quarter {
  id?: string;
  name: string;
  startDate: Date;
  endDate: Date;
  whiskeySamples: WhiskeySample[];
  active: boolean;
}

export interface WhiskeySample {
  id: string;
  name: string;
  age: number;
  proof: number;
  mashbillType: string;
  challengeQuestions: ChallengeQuestion[];
}

export interface ChallengeQuestion {
  id: string;
  question: string;
  possibleAnswers: string[];
  correctAnswer: string;
  points: number;
}

export class QuarterService {
  private quartersCollection = collection(db, 'quarters');

  async createQuarter(quarterData: Quarter): Promise<string> {
    try {
      const docRef = await addDoc(this.quartersCollection, quarterData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating quarter', error);
      throw error;
    }
  }

  async getCurrentQuarter(): Promise<Quarter | null> {
    try {
      const querySnapshot = await getDocs(
        query(
          this.quartersCollection, 
          where('active', '==', true), 
          orderBy('startDate', 'desc'), 
          limit(1)
        )
      );
      
      if (!querySnapshot.empty) {
        const quarterDoc = querySnapshot.docs[0];
        return { 
          id: quarterDoc.id, 
          ...quarterDoc.data() 
        } as Quarter;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching current quarter', error);
      throw error;
    }
  }

  async getQuarterById(quarterId: string): Promise<Quarter | null> {
    try {
      const quarterDoc = await getDoc(doc(db, 'quarters', quarterId));
      return quarterDoc.exists() 
        ? { id: quarterDoc.id, ...quarterDoc.data() } as Quarter 
        : null;
    } catch (error) {
      console.error('Error fetching quarter', error);
      throw error;
    }
  }

  async updateQuarter(quarterId: string, quarterData: Partial<Quarter>): Promise<void> {
    try {
      const quarterRef = doc(db, 'quarters', quarterId);
      await updateDoc(quarterRef, quarterData);
    } catch (error) {
      console.error('Error updating quarter', error);
      throw error;
    }
  }

  async deleteQuarter(quarterId: string): Promise<void> {
    try {
      const quarterRef = doc(db, 'quarters', quarterId);
      await deleteDoc(quarterRef);
    } catch (error) {
      console.error('Error deleting quarter', error);
      throw error;
    }
  }

  // Dynamic Quarter Component Generation
  generateQuarterComponent(quarter: Quarter) {
    const componentTemplate = `
      import React from 'react';
      import { BaseQuarterComponent } from './BaseQuarterComponent';

      export const Quarter${quarter.id}Component: React.FC = () => {
        return (
          <BaseQuarterComponent 
            quarterId="${quarter.id}"
            quarterName="${quarter.name}"
          >
            {/* Quarter ${quarter.name} Specific Rendering */}
          </BaseQuarterComponent>
        );
      };
    `;

    return componentTemplate;
  }
}