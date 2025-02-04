import { PlayerProfile } from "./auth.types";
import { LeaderboardEntry } from "../services/leaderboard.service";
import { Timestamp } from 'firebase/firestore';

// Sample and basic types

export type Score = 'score' | 'score A' | 'score B' | 'score C' | 'score D';
export type SampleKey = 'A' | 'B' | 'C' | 'D';
export type SampleId = 'A' | 'B' | 'C' | 'D';

export const MODE_OPTIONS = ['standard', 'default'] as const;
export const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const;
export const SAMPLE_OPTIONS = ['Sample A', 'Sample B', 'Sample C', 'Sample D'] as const;

// Define the type based on the options
export type Difficulty = typeof DIFFICULTY_OPTIONS[number];
export type Mode = typeof MODE_OPTIONS[number];
export type Sample = typeof SAMPLE_OPTIONS[number];

export enum DifficultyEnum {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced'
}

export interface Whiskey {
  id: string;
  name: string;
  type: 'whiskey';
  properties: {
    age?: number;
    proof?: number;
    mashbill?: string;
    description?: string;
  };
  connections: string[];
}

export interface WhiskeySample {
  id: string;
  name: string;
  age: number;
  proof: number;
  mashbill: 'bourbon' | 'rye' | 'wheat' | 'corn' | 'malted barley';
  mashbillComposition?: {
    corn: number;
    rye: number;
    wheat: number;
    barley: number;
  };
  hints: string[];
  distillery: string;
  description: string;
  notes: string[];
  difficulty: Difficulty;
  score: Score;
  challengeQuestions: ChallengeQuestion[];
  image: string;
}

export interface SampleGuess {
  age: number;
  proof: number;
  mashbill: string;
  score?: number;
  rating: number;
  notes: string;
  submitted: boolean;
}

export const isValidSampleGuess = (guess: unknown): guess is SampleGuess => {
  const g = guess as SampleGuess;
  return (
    typeof g?.age === 'number' &&
    typeof g?.proof === 'number' &&
    typeof g?.mashbill === 'string' &&
    typeof g?.rating === 'number' &&
    typeof g?.notes === 'string' &&
    typeof g?.score === 'number' &&
    typeof g?.submitted === 'boolean'
  );
};

// Challenge types
export interface Challenge {
  id: string;
  type: 'blind' | 'comparison' | 'identification';
  samples: string[];
  completed: boolean;
  score?: number;
  question: string;    // Added
  options: string[];   // Added
  hint?: string;       // Added
  sample: WhiskeySample; // Added
  createdAt: Date;
  updatedAt: Date;
  correctAnswer: string;
  points: number;
}

export interface ChallengeQuestion {
  id: string;
  question: string;
  possibleAnswers: string[];
  correctAnswer: string;
  points: number;
}

export interface ChallengeRules {
  maxAttempts: number;
  timeLimit: number; // in minutes
  passingScore: number;
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
    maxPoints: number;
    pointDeductionPerType: number;  // Changed from pointDeductionPerYear
    exactMatchBonus: number;
  };
}

export interface Quarter {
  id: string;
  name: string;
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  duration: number;
  startTime: Timestamp | Date;
  endTime: Timestamp | Date;
  difficulty: Difficulty;
  minimumScore: number;
  maximumScore: number;
  minimumChallengesCompleted: number;
  isActive: boolean;
  samples: WhiskeySample[];
  description: string;
  challenges: Challenge[];
  scoringRules: ScoringRules;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Game state tracking
export interface GameState {
  // User and session info
  userId: string;
  quarterId: string;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
  startTime: Date;
  endTime: Date;
  currentSampleId: string | null;
  samples: WhiskeySample[]; 
  currentRound: number;
  totalRounds: number;

  // Game Configuration
  currentQuarter: Quarter | null;
  scoringRules: ScoringRules;
  difficulty: Difficulty;
  mode: Mode;

  // Progress tracking
  completedSamples: string[];
  progress: number;
  hasSubmitted: boolean;
  currentChallengeIndex: number;
  totalChallenges: number;
  
  // Game elements
  challenges: Challenge[];
  currentSample: 'A' | 'B' | 'C' | 'D';
  
  // Player input and scoring
  guesses: Record<SampleKey, SampleGuess>;
  score: Record<SampleKey, number>;
  totalScore: Record<SampleKey, number>;
  scores: Record<SampleKey, SampleKey>;
  answers: Record<string, string | boolean>;

  // Game mechanics
  timeRemaining: number;
  lives: number;
  hints: number;
  isComplete: boolean;
}

export const DEFAULT_SCORING_RULES: ScoringRules = {
  age: {
    maxPoints: 100,
    pointDeductionPerYear: 10,
    exactMatchBonus: 20
  },
  proof: {
    maxPoints: 100,
    pointDeductionPerProof: 5,
    exactMatchBonus: 20
  },
  mashbill: {
    maxPoints: 100,
    pointDeductionPerType: 10,
    exactMatchBonus: 20
  }
} as const;

export const INITIAL_STATE: GameState = {
  // User and session info
  userId: '',
  quarterId: '',
  isLoading: false,
  isPlaying: false,
  lastUpdated: new Date(),
  startTime: new Date(),
  endTime: new Date(),
  currentRound: 0,
  totalRounds: 0,
  currentChallengeIndex: 0,

  // Game state
  error: null,
  currentSampleId: null,
  currentQuarter: null,
  scoringRules: DEFAULT_SCORING_RULES,
  
  // Add the missing challenges property
  challenges: [],  // or {} depending on your type definition

  // Game elements
  currentSample: 'A',
  samples: [],
  difficulty: 'beginner',
  mode: 'standard',
  totalScore: {
    'A': 0,
    'B': 0,
    'C': 0,
    'D': 0
  },

  // Progress tracking
  completedSamples: [],
  progress: 0,
  hasSubmitted: false,
  totalChallenges: 0,

  // Player input and scoring
  guesses: {
    'A': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
    'B': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
    'C': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
    'D': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false }
  },
  score: {
    'A': 0,
    'B': 0,
    'C': 0,
    'D': 0
  },
  scores: {
    'A': 'A',
    'B': 'B',
    'C': 'C',
    'D': 'D'
  },
  answers: {},

  // Game mechanics
  timeRemaining: 300,
  lives: 3,
  hints: 3,
  isComplete: false,
};

export interface SampleAttempt {
  id: string;
  sampleId: string;
  userId: string;
  guess: SampleGuess;
  score: number;
  timestamp: Date;
}

export interface ChallengeAttempt {
  id: string;
  challengeId: string;
  userId: string;
  answer: string;
  isCorrect: boolean;
  score: number;
  timestamp: Date;
}

export interface PlayerChallenge {
  challengeId: string;
  userId: string;
  status: 'completed' | 'in-progress' | 'failed';
  attempts: number;
  score: number;
  completedAt?: Date;
}

export interface GameInteractionData {
  quarterId?: string;
  userId?: string;
  actionType: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
  playerProfile?: PlayerProfile;
  challenge?: Challenge;
  sample?: WhiskeySample;
  sampleAttempt?: SampleAttempt;
  challengeAttempt?: ChallengeAttempt;
  playerLeaderboard?: LeaderboardEntry;
  gameMetrics?: GameMetrics;
  quarterAnalytics?: QuarterAnalytics;
  playerChallenges?: PlayerChallenge;
  gameState?: GameState;
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

  // Machine learning insights
  machineLearning: {
    recommendations: Record<string, number>;
    predictions: Record<string, number>;
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

export const isValidGameState = (state: Partial<GameState>): state is GameState => {
  return (
    'userId' in state &&
    'quarterId' in state &&
    'scoringRules' in state &&
    // ...other required properties
    true
  );
};