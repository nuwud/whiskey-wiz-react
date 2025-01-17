export interface Challenge {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  hint?: string;
  category: 'taste' | 'history' | 'production' | 'general';
}

export interface WhiskeySample {
  id: string;
  name: string;
  age: number;
  proof: number;
  type: string;
  description: string;
  challenges: Challenge[];
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