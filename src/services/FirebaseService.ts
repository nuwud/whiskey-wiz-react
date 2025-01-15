import { db, auth } from '../firebaseConfig';
import { collection, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';

export const FirebaseService = {
  async getQuarterData(quarterId: string) {
    try {
      const quarterRef = doc(db, 'quarters', quarterId);
      const quarterSnap = await getDoc(quarterRef);
      return quarterSnap.exists() ? quarterSnap.data() : null;
    } catch (error) {
      console.error('Error fetching quarter data', error);
      throw error;
    }
  },

  async validateGuess(quarterId: string, guess: any) {
    try {
      // Implement guess validation logic
      const quarterData = await this.getQuarterData(quarterId);
      // Calculate points based on guess accuracy
      const points = this.calculatePoints(quarterData, guess);
      return { points, correct: points > 0 };
    } catch (error) {
      console.error('Guess validation failed', error);
      throw error;
    }
  },

  calculatePoints(quarterData: any, guess: any): number {
    // Implement point calculation logic
    let points = 0;
    if (Math.abs(quarterData.age - guess.age) <= 2) points += 25;
    if (Math.abs(quarterData.proof - guess.proof) <= 5) points += 25;
    if (quarterData.mashbillType === guess.mashbillType) points += 50;
    return points;
  },

  async submitScore(userId: string, quarterId: string, score: number) {
    try {
      const scoresRef = collection(db, 'scores');
      await addDoc(scoresRef, {
        userId,
        quarterId,
        score,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Score submission failed', error);
      throw error;
    }
  }
};