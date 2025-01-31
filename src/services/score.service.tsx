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

interface ScoreDocument extends ScoreSubmission {
  id: string;
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

  async getPlayerScores(playerId: string, quarterId?: string): Promise<ScoreDocument[]> {
    try {
      const baseQuery = query(collection(db, 'scores'), where('playerId', '==', playerId));
      const finalQuery = quarterId
        ? query(baseQuery, where('quarterId', '==', quarterId))
        : baseQuery;

      const snapshot = await getDocs(finalQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScoreDocument));
    } catch (error) {
      console.error('Error fetching player scores:', error);
      throw error;
    }
  },

  async getQuarterScores(quarterId: string): Promise<ScoreDocument[]> {
    try {
      const q = query(
        collection(db, 'scores'),
        where('quarterId', '==', quarterId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScoreDocument));
    } catch (error) {
      console.error('Error fetching quarter scores:', error);
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

  async updateScoreGuess(scoreId: string, guessIndex: number, guessData: Partial<ScoreSubmission['guesses'][string]>): Promise<void> {
    try {
      const docRef = doc(db, 'scores', scoreId);
      await updateDoc(docRef, {
        [`guesses.${guessIndex}`]: guessData
      });
    } catch (error) {
      console.error('Error updating score guess:', error);
      throw error;
    }
  },

  async calculateScore(scoreData: ScoreSubmission): Promise<number> {
    // TODO: Implement scoring logic based on the provided data
    return scoreData.totalScore;
  },

  async deleteScoreGuess(scoreId: string, guessIndex: number): Promise<void> {
    try {
      const docRef = doc(db, 'scores', scoreId);
      await updateDoc(docRef, {
        [`guesses.${guessIndex}`]: deleteField()
      });
    } catch (error) {
      console.error('Error deleting score guess:', error);
      throw error;
    }
  },

  async getLeaderboardSnapshot(quarterId?: string): Promise<ScoreDocument[]> {
    try {
      const baseQuery = query(collection(db, 'scores'), orderBy('totalScore', 'desc'));
      const finalQuery = quarterId
        ? query(baseQuery, where('quarterId', '==', quarterId))
        : baseQuery;

      const snapshot = await getDocs(finalQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ScoreDocument));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },

  async getLeaderboard(quarterId?: string): Promise<ScoreDocument[]> {
    try {
      const scores = await this.getLeaderboardSnapshot(quarterId);
      return scores.sort((a, b) => b.totalScore - a.totalScore);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
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

  async updateScore(scoreId: string, scoreData: Partial<ScoreSubmission>): Promise<void> {
    try {
      const docRef = doc(db, 'scores', scoreId);
      await updateDoc(docRef, scoreData);
    } catch (error) {
      console.error('Error updating score:', error);
      throw error;
    }
  },

  async deleteScore(scoreId: string): Promise<void> {
    try {
      const docRef = doc(db, 'scores', scoreId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting score:', error);
      throw error;
    }
  }
};