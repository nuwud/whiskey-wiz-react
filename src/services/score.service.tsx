import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  deleteField
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase/firestore';

// Score submission structure
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
  createdAt?: Timestamp;
}

// Firebase Score Document
interface ScoreDocument extends ScoreSubmission {
  id: string;
}

// Core Score Service
export class ScoreService {
  static calculateScore(userGuess: any, correctAnswer: any): number {
    let totalScore = 0;

    // ✅ Mashbill Scoring (Correct or Incorrect)
    if (userGuess.mashbill === correctAnswer.mashbill) {
      totalScore += 30;
    }

    // ✅ Proof Scoring
    const proofDifference = Math.abs(userGuess.proof - correctAnswer.proof);
    if (proofDifference === 0) {
      totalScore += 35;
    } else if (proofDifference === 1) {
      totalScore += 30;
    } else if (proofDifference <= 11) {
      totalScore += Math.max(0, 30 - (proofDifference - 1) * 3);
    }

    // ✅ Age Scoring
    const ageDifference = Math.abs(userGuess.age - correctAnswer.age);
    if (ageDifference === 0) {
      totalScore += 35;
    } else if (ageDifference === 1) {
      totalScore += 30;
    } else if (ageDifference <= 6) {
      totalScore += Math.max(0, 30 - (ageDifference - 1) * 6);
    }

    return totalScore;
  }

  // ✅ Rank based on Score
  static getRank(score: number): string {
    if (score >= 90) return 'Whiskey Wizard';
    if (score >= 80) return 'Oak Overlord';
    if (score >= 60) return 'Cask Commander';
    if (score >= 40) return 'Whiskey Explorer';
    if (score >= 20) return 'Whiskey Rookie';
    return 'Barrel Beginner';
  }
}

// Firebase Score Service
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

  async getScore(scoreId: string): Promise<ScoreDocument> {
    try {
      const docRef = doc(db, 'scores', scoreId);
      const docSnap = await getDoc(docRef);  // <-- Ensure this is still being used
      if (!docSnap.exists()) {
        throw new Error('Score not found');
      }
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ScoreDocument;
    } catch (error) {
      console.error('Error fetching score:', error);
      throw error;
    }
  },  

  async getPlayerScores(playerId: string, quarterId?: string): Promise<ScoreDocument[]> {
    try {
      let baseQuery = query(collection(db, 'scores'), where('playerId', '==', playerId));
      if (quarterId) {
        baseQuery = query(baseQuery, where('quarterId', '==', quarterId));
      }

      const snapshot = await getDocs(baseQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(), // Convert Timestamp to Date
      })) as ScoreDocument[];
    } catch (error) {
      console.error('Error fetching player scores:', error);
      throw error;
    }
  },

  async getLeaderboard(quarterId?: string): Promise<ScoreDocument[]> {
    try {
      let leaderboardQuery = query(collection(db, 'scores'), orderBy('totalScore', 'desc'));
      if (quarterId) {
        leaderboardQuery = query(leaderboardQuery, where('quarterId', '==', quarterId));
      }

      const snapshot = await getDocs(leaderboardQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(), // Convert Timestamp to Date
      })) as ScoreDocument[];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },

  async getLeaderboardRank(playerId: string, quarterId?: string): Promise<number> {
    try {
      const scores = await this.getLeaderboard(quarterId);
      const playerIndex = scores.findIndex(score => score.playerId === playerId);
      return playerIndex === -1 ? -1 : playerIndex + 1;
    } catch (error) {
      console.error('Error getting leaderboard rank:', error);
      throw error;
    }
  },

  async updateScoreGuess(scoreId: string, guessIndex: number, guessData: Partial<ScoreSubmission['guesses'][string]>): Promise<void> {
    try {
      const docRef = doc(db, 'scores', scoreId);
      await updateDoc(docRef, { [`guesses.${guessIndex}`]: guessData });  // <-- Ensure this is still being used
    } catch (error) {
      console.error('Error updating score guess:', error);
      throw error;
    }
  },

  async deleteScoreGuess(scoreId: string, guessIndex: number): Promise<void> {
    try {
      const docRef = doc(db, 'scores', scoreId);
      await updateDoc(docRef, { [`guesses.${guessIndex}`]: deleteField() });  // <-- Ensure this is still being used
    } catch (error) {
      console.error('Error deleting score guess:', error);
      throw error;
    }
  },

  async deleteScore(scoreId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'scores', scoreId));
    } catch (error) {
      console.error('Error deleting score:', error);
      throw error;
    }
  }
};
