import { create } from 'zustand';
import { GameState, Challenge, WhiskeySample } from '../types/game';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface GameStore extends GameState {
  startGame: () => Promise<void>;
  submitAnswer: (challengeId: string, answer: string) => void;
  useHint: (challengeId: string) => void;
  endGame: () => void;
  resetGame: () => void;
}

const INITIAL_STATE: GameState = {
  isPlaying: false,
  currentChallengeIndex: 0,
  challenges: [],
  score: 0,
  answers: {},
  timeRemaining: 300, // 5 minutes
  lives: 3,
  hints: 3
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  startGame: async () => {
    // Fetch challenges from Firestore
    const challengesRef = collection(db, 'challenges');
    const q = query(challengesRef, where('active', '==', true));
    const querySnapshot = await getDocs(q);
    
    const challenges: Challenge[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      challenges.push({
        id: doc.id,
        ...data as Omit<Challenge, 'id'>
      });
    });

    set({
      isPlaying: true,
      challenges: challenges.sort(() => Math.random() - 0.5).slice(0, 5), // Get 5 random challenges
      currentChallengeIndex: 0,
      score: 0,
      answers: {},
      timeRemaining: 300,
      lives: 3,
      hints: 3
    });
  },

  submitAnswer: (challengeId: string, answer: string) => {
    const state = get();
    const challenge = state.challenges.find(c => c.id === challengeId);
    
    if (!challenge) return;

    const isCorrect = answer === challenge.correctAnswer;
    const newScore = isCorrect ? state.score + challenge.points : state.score;
    const newLives = isCorrect ? state.lives : state.lives - 1;

    set({
      score: newScore,
      lives: newLives,
      answers: { ...state.answers, [challengeId]: answer },
      currentChallengeIndex: state.currentChallengeIndex + 1
    });

    if (newLives === 0 || state.currentChallengeIndex + 1 >= state.challenges.length) {
      get().endGame();
    }
  },

  useHint: (challengeId: string) => {
    const state = get();
    if (state.hints <= 0) return;

    set({ hints: state.hints - 1 });
  },

  endGame: () => {
    const state = get();
    // TODO: Save game results to Firestore
    set({ isPlaying: false });
  },

  resetGame: () => {
    set(INITIAL_STATE);
  }
}));