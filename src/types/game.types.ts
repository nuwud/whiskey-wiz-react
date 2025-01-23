// Sample and basic types
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface WhiskeySample {
  id: string;
  name: string;
  age: number;
  proof: number;
  mashbillType: string;
  distillery: string;
  description?: string;
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
}

// Game state tracking
export interface GameState {
  isPlaying: boolean;
  currentChallengeIndex: number;
  challenges: Challenge[];
  currentSample: 'A' | 'B' | 'C' | 'D';
  samples: WhiskeySample[];
  guesses: {
    [key in 'A' | 'B' | 'C' | 'D']: {
      age: number;
      proof: number;
      mashbill: string;
      score?: number;
    }
  };
  score: number;
  answers: Record<string, string>;
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