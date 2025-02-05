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
import { ScoringCalculator, AdminScoringConfig } from '../utils/scoring';

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
      breakdown?: {
        age: number;
        proof: number;
        mashbill: number;
      };
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
  private static calculator: ScoringCalculator;

  static initializeScoring(config?: AdminScoringConfig) {
    this.calculator = new ScoringCalculator(config);
  }

  static calculateScore(userGuess: any, correctAnswer: any): number {
    if (!this.calculator) {
      this.initializeScoring();
    }
    
    const result = this.calculator.calculate({
      actual: correctAnswer,
      guess: userGuess
    });

    return result.totalScore;
  }

  // ✅ Rank based on Score
  static getRank(score: number): string {
    if (!this.calculator) {
      this.initializeScoring();
    }

    const maxScore = this.calculator.getMaxPossibleScore();
    const percentage = (score / maxScore) * 100;

    if (percentage >= 90) return 'Whiskey Wizard';
    if (percentage >= 80) return 'Oak Overlord';
    if (percentage >= 60) return 'Cask Commander';
    if (percentage >= 40) return 'Whiskey Explorer';
    if (percentage >= 20) return 'Whiskey Rookie';
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
      const docSnap = await getDoc(docRef);
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
      let baseQuery = query(collection(db, 'scores'), 
                           where('playerId', '==', playerId),
                           orderBy('createdAt', 'desc'));
      if (quarterId) {
        baseQuery = query(baseQuery, where('quarterId', '==', quarterId));
      }

      const snapshot = await getDocs(baseQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
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
        createdAt: doc.data().createdAt?.toDate(),
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

  async updateScoreGuess(scoreId: string, guessIndex: number, 
    guessData: Partial<ScoreSubmission['guesses'][string]>): Promise<void> {
    try {
      const docRef = doc(db, 'scores', scoreId);
      await updateDoc(docRef, { [`guesses.${guessIndex}`]: guessData });
    } catch (error) {
      console.error('Error updating score guess:', error);
      throw error;
    }
  },

  async deleteScoreGuess(scoreId: string, guessIndex: number): Promise<void> {
    try {
      const docRef = doc(db, 'scores', scoreId);
      await updateDoc(docRef, { [`guesses.${guessIndex}`]: deleteField() });
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