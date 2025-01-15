import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ScoreSubmission {
  playerId: string;
  quarterId: string;
  totalScore: number;
  guesses: {
    [key: string]: {
      age: number;
      proof: number;
      mashbill: string;
      score?: number;
    }
  };
  createdAt?: any;
}

export const scoreService = {
  async submitScore(scoreData: ScoreSubmission): Promise<string> {
    try {
      const scoreRef = await addDoc(collection(db, 'scores'), {
        ...scoreData,
        createdAt: serverTimestamp()
      });
      return scoreRef.id;
    } catch (error) {
      console.error('Error submitting score:', error);
      throw error;
    }
  },

  async getPlayerScores(playerId: string, quarterId?: string) {
    // TODO: Implement score retrieval with optional quarter filtering
    // This will mirror the Angular version's leaderboard functionality
  },

  calculateLeaderboard: async (quarterId: string) => {
    // TODO: Implement leaderboard calculation
    // Similar to Angular implementation with ranking and comparisons
  }
};