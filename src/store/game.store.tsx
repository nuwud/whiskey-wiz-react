import { create } from 'zustand';
import { GameState, Challenge, Quarter, ScoringRules, WhiskeySample } from '../types/game.types';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { quarterService } from '../services/quarter.service';

// Calculate score based on scoring rules
const calculateScore = (
  sample: WhiskeySample,
  guess: { age: number; proof: number; mashbill: string },
  rules: ScoringRules
) => {
  let score = 0;

  // Age scoring
  const ageDeviation = Math.abs(sample.age - guess.age);
  if (ageDeviation === 0) {
    score += rules.age.maxPoints + rules.age.exactMatchBonus;
  } else {
    score += Math.max(
      rules.age.maxPoints - (ageDeviation * rules.age.pointDeductionPerYear),
      0
    );
  }

  // Proof scoring
  const proofDeviation = Math.abs(sample.proof - guess.proof);
  if (proofDeviation === 0) {
    score += rules.proof.maxPoints + rules.proof.exactMatchBonus;
  } else {
    score += Math.max(
      rules.proof.maxPoints - (proofDeviation * rules.proof.pointDeductionPerProof),
      0
    );
  }

  // Mashbill scoring
  if (sample.mashbillType === guess.mashbill) {
    score += rules.mashbill.exactMatchBonus;
  }

  return score;
};

interface GameStore {
  // State properties
  isPlaying: boolean;
  currentQuarter: Quarter | null;
  scoringRules: ScoringRules | null;
  currentChallengeIndex: number;
  challenges: Challenge[];
  currentSample: string;
  samples: WhiskeySample[];
  guesses: Record<string, any>;
  score: number;
  answers: Record<string, any>;
  timeRemaining: number;
  lives: number;
  hints: number;
  isComplete: boolean;
  userId: string;
  quarterId: string;
  lastUpdated: Date;
  completedSamples: string[];
  totalScore: number;
  hasSubmitted: boolean;
  progress: number;
  totalChallenges: number;

  // Game actions
  startGame: () => Promise<void>;
  submitAnswer: (challengeId: string, answer: string) => void;
  useHint: (challengeId: string) => void;
  endGame: () => Promise<void>;
  resetGame: () => void;

  // Sample actions
  submitSampleGuess: (
    sampleId: 'A' | 'B' | 'C' | 'D',
    guess: { age: number; proof: number; mashbill: string }
  ) => void;
  navigateSample: (direction: 'next' | 'previous') => void;
}

const INITIAL_STATE: GameState = {
  isPlaying: false,
  currentChallengeIndex: 0,
  challenges: [],
  currentSample: 'A',
  samples: [],
  guesses: {
    A: { age: 0, proof: 0, mashbill: '' },
    B: { age: 0, proof: 0, mashbill: '' },
    C: { age: 0, proof: 0, mashbill: '' },
    D: { age: 0, proof: 0, mashbill: '' }
  },
  score: 0,
  answers: {},
  timeRemaining: 300, // 5 minutes
  lives: 3,
  hints: 3,
  isComplete: false,
  userId: '',
  quarterId: '',
  lastUpdated: new Date(),
  completedSamples: [],
  totalScore: 0,
  hasSubmitted: false,
  progress: 0,
  totalChallenges: 0
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,
  currentQuarter: null,
  scoringRules: null,
  totalChallenges: 0,

  startGame: async () => {
    try {
      const quarter = await quarterService.getCurrentQuarter();
      if (!quarter) throw new Error('No active quarter found');

      const config = await quarterService.getGameConfiguration(quarter.id);
      if (!config) throw new Error('Game configuration not found');

      const challengesRef = collection(db, 'challenges');
      const q = query(
        challengesRef,
        where('quarterId', '==', quarter.id),
        where('active', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const challenges = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Challenge));

      set({
        isPlaying: true,
        currentQuarter: quarter,
        scoringRules: config.scoringRules,
        challenges: challenges.sort(() => Math.random() - 0.5).slice(0, 5),
        samples: quarter.samples,
        currentChallengeIndex: 0,
        score: 0,
        answers: {},
        timeRemaining: 300,
        lives: 3,
        hints: 3,
        isComplete: false
      });
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  },

  submitAnswer: (challengeId: string, answer: string) => {
    const state = get();
    const challenge = state.challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const isCorrect = answer === challenge.correctAnswer;
    set(state => ({
      score: isCorrect ? state.score + challenge.points : state.score,
      lives: isCorrect ? state.lives : state.lives - 1,
      answers: { ...state.answers, [challengeId]: answer },
      currentChallengeIndex: state.currentChallengeIndex + 1
    }));

    const newState = get();
    if (newState.lives === 0 || newState.currentChallengeIndex >= newState.challenges.length) {
      newState.endGame();
    }
  },

  submitSampleGuess: (sampleId, guess) => {
    const state = get();
    if (!state.scoringRules) return;

    const sample = state.samples.find(s => s.id === sampleId);
    if (!sample) return;

    const sampleScore = calculateScore(sample, guess, state.scoringRules);
    set(state => ({
      guesses: {
        ...state.guesses,
        [sampleId]: { ...guess, score: sampleScore }
      },
      score: state.score + sampleScore
    }));
  },

  navigateSample: (direction) => {
    const sampleOrder: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const state = get();
    const currentIndex = sampleOrder.indexOf(state.currentSample);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex < 0) return;
    if (newIndex >= sampleOrder.length) {
      set({ isComplete: true });
      return;
    }

    set({ currentSample: sampleOrder[newIndex] });
  },

  useHint: (challengeId: string) => {
    const state = get();
    if (state.hints <= 0) return;

    const challenge = state.challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    set({
      hints: state.hints - 1,
      answers: { ...state.answers, [`${challengeId}_hint`]: true }
    });
  },
  endGame: async () => {
    const state = get();
    if (!state.currentQuarter) return;

    try {
      await addDoc(collection(db, 'game_results'), {
        quarterId: state.currentQuarter.id,
        challengeResults: state.answers,
        sampleResults: state.guesses,
        finalScore: state.score,
        hintsUsed: 3 - state.hints,
        livesRemaining: state.lives,
        completedAt: new Date()
      });
      set({ isPlaying: false });
    } catch (error) {
      console.error('Failed to save game results:', error);
      throw error;
    }
  },

  resetGame: () => set(INITIAL_STATE)
}));