import { PlayerProfile } from "./auth.types";
import { LeaderboardEntry } from "@/services/leaderboard.service";

// Sample and basic types
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface WhiskeySample {
  id: string;
  name: string;
  age: number;
  proof: number;
  mashbillType: string;
  hints: string[];
  distillery: string;
  description: string;
  notes: string[];
}

// Challenge types
export interface Challenge {
  id: string;
  type: 'taste' | 'nose' | 'history' | 'pairing';
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  hint?: string;
  explanation?: string;
  sample: WhiskeySample;
}

// Scoring configuration
export interface ScoringRules {
  age: {
    maxPoints: number;
    pointDeductionPerYear: number;
    exactMatchBonus: number;
  };
  proof: {
    maxPoints: number;
    pointDeductionPerProof: number;
    exactMatchBonus: number;
  };
  mashbill: {
    correctGuessPoints: number;
  };
}

// Quarter and sample handling
export interface Quarter {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  difficulty: Difficulty;
  samples: WhiskeySample[];
  isActive: boolean;
  scoringRules: ScoringRules;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Game state tracking
export interface SampleGuess {
  age: number;
  proof: number;
  mashbill: string;
  score?: number;
}

export interface GameState {
  // User and session info
  userId: string;
  quarterId: string;
  isPlaying: boolean;
  lastUpdated: Date;

  totalScore: number;

  // Progress tracking
  completedSamples: string[];
  progress: number;
  hasSubmitted: boolean;
  currentChallengeIndex: number;
  totalChallenges: number;

  // Game elements
  challenges: Challenge[];
  currentSample: 'A' | 'B' | 'C' | 'D';
  samples: WhiskeySample[];

  // Player input and scoring
  guesses: Record<'A' | 'B' | 'C' | 'D', SampleGuess>;
  score: number;
  answers: Record<string, string | boolean>;

  // Game mechanics
  timeRemaining: number;
  lives: number;
  hints: number;
  isComplete: boolean;
}
// Player metrics
export interface GameMetrics {
  totalGames: number;
  averageScore: number;
  bestScore: number;
  totalChallengesCompleted: number;
  correctAnswers: number;
  hintsUsed: number;
  favoriteWhiskey?: string;
  totalSamples: number;
  perfectScores: number;
  lastPlayed?: Date;
  quarterHistory: {
    quarterId: string;
    score: number;
    date: Date;
  }[];
}

export interface TimeseriesData {
  date: string;
  timestamp: Date;
  players: number;
  averageScore: number;
  completionRate: number;
}


export interface QuarterAnalytics {

  // Basic metrics
  totalPlayers: number;
  totalGames: number;
  averageScore: number;
  hintUsageStats: {
    total: number;
    averagePerGame: number;
  };
  completionRate: number;
  totalChallengesCompleted: number;
  bestScore: number;
  correctAnswers: number;
  hintsUsed: number;
  favoriteWhiskey?: string;
  totalSamples: number;
  perfectScores: number;
  lastPlayed?: Date;
  quarterHistory: {
    quarterId: string;
    score: number;
    date: Date;
  }[];
  timeseriesData: TimeseriesData[];
  leaderboard: LeaderboardEntry[];
  samplingAccuracy: {
    age: number;
    proof: number;
    mashbill: number;
    ageAccuracy: number;
    proofAccuracy: number;
    mashbillAccuracy: number;
  };
  completionTime: {
    min: number;
    max: number;
    average: number;
  };
  playerRetention: {
    totalPlayers: number;
    newPlayers: number;
    returningPlayers: number;
  };
  challengeCompletion: {
    progressionRate: number;
    difficultyRating: {
      beginner: number;
      intermediate: number;
      advanced: number;
    };
    playerProgression: number;
    totalChallenges: number;
    totalCorrect: number;
    accuracy: number;
  };
  difficultyRating: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };

  // Performance metrics
  accuracy: {
    age: number;
    proof: number;
    mashbill: number;
    sampleAccuracy: {
      age: number;
      proof: number;
      mashbill: number;
    };
    totalAttempts: {
      age: number;
      proof: number;
      mashbill: number;
    };
    difficulty: {
      beginner: number;
      intermediate: number;
      advanced: number;
    };
    averageAttempts: number;
    averageTimeToComplete: number;
    completionRateByDifficulty: {
      beginner: number;
      intermediate: number;
      advanced: number;
      overall: number;
    };
    averageCompletionRate: number;
  };

  // Sample analytics
  sampleAnalytics: Array<{
    sampleId: string;
    totalAttempts: number;
    averageAccuracy: {
      age: number;
      proof: number;
      mashbill: number;
    };
    performance: {
      totalCorrect: number;
      accuracy: number;
    };
  }>;

  // Player statistics
  playerStats: {
    totalGames: number;
    averageScore: number;
    bestScore: number;
    totalChallengesCompleted: number;
    correctAnswers: number;
    hintsUsed: number;
    favoriteWhiskey?: string;
    totalSamples: number;
    perfectScores: number;
    lastPlayed?: Date;
    quarterHistory: Array<{
      quarterId: string;
      score: number;
      date: Date;
    }>;
  };

  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  averageCompletionRate: number;
  dailyStats: {
    date: string;
    players: number;
    averageScore: number;
    completionRate: number;
  }[];
  weeklyStats: {
    week: number;
    players: number;
    averageScore: number;
    completionRate: number;
  }[];
  monthlyStats: {
    month: string;
    players: number;
    averageScore: number;
    completionRate: number;
  }[];
  yearlyStats: {
    year: number;
    players: number;
    averageScore: number;
    completionRate: number;
  }[];
  quarterlyStats: {
    quarter: string;
    players: number;
    averageScore: number;
    completionRate: number;
  }[];
  playerActivity: {
    userId: string;
    timestamp: Date;
    action: string;
    details?: Record<string, any>;
  }[];
  gameStats: {
    totalGamesPlayed: number;
    uniquePlayers: number;
    averagePlaytime: number;
    completionRate: number;
  };
  challengeStats: {
    totalAttempted: number;
    totalCompleted: number;
    averageTimePerChallenge: number;
    successRate: number;
  };
  rewardStats: {
    totalRewarded: number;
    rewardTypes: Record<string, number>;
    claimRate: number;
  };
  sessionStats: {
    averageLength: number;
    totalSessions: number;
    bounceRate: number;
    returnRate: number;
  };
  quarterPerformance: {
    quarterId: string;
    averageScore: number;
    totalPlayers: number;
    topPerformer?: {
      userId: string;
      username: string;
      score: number;
      badges?: string[];
      timestamp: Date;
      rank?: number;
    };
  }[];
  machineLearningSuggestions: {
    recommendedMerchandise: string[];
    potentialSubscriptionTargets: string[];
    marketingSegments: string[];
  };
  playerDemographics: {
    authMethodBreakdown: Record<string, number>;
    ageBreakdown: Record<string, number>;
    regionDistribution: Record<string, number>;
    countryDistribution: Record<string, number>;
    favoriteWhiskey?: string;
  };
  playerEngagement: {
    totalTimeSpent: number;
    averageTimeSpentPerGame: number;
    totalHintsUsed: number;
    averageHintsUsedPerGame: number;
    averageHintsUsedPerPlayer: number;
    averageHintsUsedPerChallenge: number;
  };
  flavorProfile: {
    preferredFlavors: string[];
    mostPopularFlavors: string[];
    flavorDensity: number;
  };
  samplePerformance: {
    sampleId: string;
    totalAttempts: number;
    totalCorrect: number;
    accuracy: number;
  }[];
  challengePerformance: {
    challengeId: string;
    totalAttempts: number;
    totalCorrect: number;
    accuracy: number;
  };
  playerChallenges: {
    challengeId: string;
    totalAttempts: number;
    totalCorrect: number;
    accuracy: number;
  };
  playerProfile: {
    userId: string;
    username: string;
    totalChallengesCompleted: number;
    totalScore: number;
    favoriteWhiskey?: string;
    totalSamples: number;
    perfectScores: number;
    lastPlayed?: Date;
  };
  playerLeaderboard: {
    global: PlayerProfile[];
    quarterly: PlayerProfile[];
  };

  // Engagement metrics
  engagement: {
    dailyActive: number;
    monthlyActive: number;
    totalTimeSpent: number;
    averageTimeSpentPerGame: number;
  };

  // Player progression
  progression: {
    averageLevel: number;
    levelDistribution: Record<string, number>;
  };

  // Achievement tracking
  achievements: {
    total: number;
    distribution: Record<string, number>;
  };

  // User feedback
  feedback: {
    averageRating: number;
    comments: string[];
  };

  // Business metrics
  monetization: {
    revenue: number;
    transactions: number;
  };

  // Retention metrics
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };

  // Social engagement
  socialMetrics: {
    shares: number;
    invites: number;
  };

  // Technical performance
  technicalMetrics: {
    errors: number;
    loadTime: number;
  };

  // Marketing data
  marketingMetrics: {
    acquisition: Record<string, number>;
    conversion: number;
  };

  // Testing and events
  customEvents: Array<{
    name: string;
    count: number;
    data?: Record<string, any>;
  }>;

  abTestResults: Record<string, {
    variant: string;
    conversion: number;
    engagement: number;
  }>;

  // Trends and patterns
  seasonalTrends: {
    quarterly: Array<{
      quarter: string;
      metrics: Record<string, number>;
    }>;
    monthly: Array<{
      month: string;
      metrics: Record<string, number>;
    }>;
  };

  // Geographic distribution
  geographicData: {
    regions: Record<string, number>;
    countries: Record<string, number>;
  };
}

export interface SampleFormData {
  name: string;
  age: number;
  proof: number;
  mashbillType: string;
  notes: string[];
  hints: string[];
  distillery: string;
  description: string;
}

export const defaultSampleData: SampleFormData = {
  name: '',
  age: 0,
  proof: 0,
  mashbillType: '',
  notes: [],
  hints: [],
  distillery: '',
  description: ''
};