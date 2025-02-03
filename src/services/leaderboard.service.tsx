import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  score: number;
  quarterId: string;
  timestamp: Date;
  completedAt: Date;
  totalChallengesCompleted: number;
  totalScore: number;
  rank?: number;
  badges?: string[];
  accuracy: {
    age: number;
    proof: number;
    mashbill: number;
  };
}

export interface LeaderboardSnapshot {
  global: LeaderboardEntry[];
  quarterly: LeaderboardEntry[];
  userRank: {
    global: number;
    quarterly: number;
  };
}

export class LeaderboardService {
  private leaderboardCollection = collection(db, 'leaderboard');
  private userStatsCollection = collection(db, 'user_stats');

  async getGlobalLeaderboard(
    timeframe: 'all-time' | 'monthly' | 'weekly' = 'all-time',
    limitCount: number = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      let q = query(
        this.leaderboardCollection,
        orderBy('score', 'desc'),
        limit(limitCount)
      );

      if (timeframe !== 'all-time') {
        const cutoffDate = new Date();
        if (timeframe === 'monthly') {
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        } else {
          cutoffDate.setDate(cutoffDate.getDate() - 7);
        }

        q = query(
          this.leaderboardCollection,
          where('timestamp', '>=', cutoffDate),
          orderBy('timestamp', 'desc'),
          orderBy('score', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc, index) => ({
        ...doc.data() as LeaderboardEntry,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Failed to fetch global leaderboard:', error);
      return [];
    }
  }

  async getQuarterlyLeaderboard(
    quarterId: string,
    limitCount: number = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        this.leaderboardCollection,
        where('quarterId', '==', quarterId),
        orderBy('score', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc, index) => ({
        ...doc.data() as LeaderboardEntry,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Failed to fetch quarterly leaderboard:', error);
      return [];
    }
  }

  async getUserRank(userId: string, quarterId?: string): Promise<number> {
    try {
      let q = query(
        this.leaderboardCollection,
        orderBy('score', 'desc')
      );

      if (quarterId) {
        q = query(
          this.leaderboardCollection,
          where('quarterId', '==', quarterId),
          orderBy('score', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const userIndex = snapshot.docs.findIndex(
        doc => doc.data().userId === userId
      );

      return userIndex >= 0 ? userIndex + 1 : -1;
    } catch (error) {
      console.error('Failed to fetch user rank:', error);
      return -1;
    }
  }

  async updateLeaderboard(entry: Omit<LeaderboardEntry, 'timestamp' | 'rank'>): Promise<void> {
    try {
      const docRef = doc(this.leaderboardCollection);
      await updateDoc(docRef, {
        ...entry,
        timestamp: serverTimestamp()
      });

      // Update user stats
      const userStatsRef = doc(this.userStatsCollection, entry.userId);
      await updateDoc(userStatsRef, {
        lastScore: entry.score,
        quarterId: entry.quarterId,
        lastPlayed: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
      throw error;
    }
  }

  async getLeaderboardSnapshot(
    userId: string,
    quarterId?: string
  ): Promise<LeaderboardSnapshot> {
    try {
      const [global, quarterly, globalRank, quarterlyRank] = await Promise.all([
        this.getGlobalLeaderboard('all-time', 10),
        quarterId ? this.getQuarterlyLeaderboard(quarterId, 10) : [],
        this.getUserRank(userId),
        quarterId ? this.getUserRank(userId, quarterId) : -1
      ]);

      return {
        global,
        quarterly,
        userRank: {
          global: globalRank,
          quarterly: quarterlyRank
        }
      };
    } catch (error) {
      console.error('Failed to get leaderboard snapshot:', error);
      throw error;
    }
  }
}