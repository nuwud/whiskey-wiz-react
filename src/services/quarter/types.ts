import { TimeseriesData } from '../../types/game.types';
import { Quarter, WhiskeySample, QuarterAnalytics } from '../../types/game.types';
import { DocumentData } from 'firebase/firestore';

export interface QuarterServiceInterface {
  getCurrentQuarter(): Promise<Quarter | null>;
  getActiveQuarters(): Promise<Quarter[]>;
  getGameConfiguration(quarterId: string): Promise<Quarter | null>;
  getQuarterStats: (quarterId: string) => Promise<QuarterStats | null>;
  getQuarterLeaderboard(quarterId: string, top?: number): Promise<LeaderboardEntry[]>;
  getQuarterAnalytics(quarterId: string): Promise<QuarterAnalytics | null>;
  updateQuarter(quarterId: string, data: Partial<Quarter>): Promise<void>;
  createQuarter(data: Omit<Quarter, 'id'>): Promise<string>;
  getQuarterById(quarterId: string): Promise<Quarter | null>;
  getAllQuarters(): Promise<Quarter[]>;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  totalScore: number;
  quarterId: string;
  timestamp: Date;
  completedAt: Date;
  totalChallengesCompleted: number;
  accuracy: {
    age: number;
    proof: number;
    mashbill: number;
  };
  score: number;
  hintUsageStats: Record<string, any>;
  timeseriesData: TimeseriesData[];
  leaderboard: any[];
  samplingAccuracy: Record<string, any>;
  imageUrl: string;
  image: string;
  challengeQuestions: any[];
}

export interface QuarterStats {
  topScore: number;
  totalPlayers: number;
  averageScore: number;
  completionRate: number;
  sampleAccuracy: {
    age: number;
    proof: number;
    mashbill: number;
  };
  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  lastPlayed?: Date;
}

export interface DailyStats {
  date: string;
  players: number;
  averageScore: number;
  completionRate: number;
}