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

export interface GameState {
  isPlaying: boolean;
  currentChallengeIndex: number;
  challenges: Challenge[];
  score: number;
  answers: Record<string, string>;
  timeRemaining: number;
  lives: number;
  hints: number;
}

export interface GameMetrics {
  totalGames: number;
  averageScore: number;
  bestScore: number;
  totalChallengesCompleted: number;
  correctAnswers: number;
  hintsUsed: number;
  favoriteWhiskey?: string;
  lastPlayed?: Date;
}