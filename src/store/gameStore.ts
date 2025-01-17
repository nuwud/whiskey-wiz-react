import { create } from 'zustand';
import type { GameState, Challenge } from '@/types/game';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { gameStateService } from '@/services/game';
import { analyticsService } from '@/services/analytics';

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
  hints: 3,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  startGame: async () => {
    try {
      // Fetch challenges
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

      const initialState = {
        isPlaying: true,
        challenges: challenges.sort(() => Math.random() - 0.5).slice(0, 5),
        currentChallengeIndex: 0,
        score: 0,
        answers: {},
        timeRemaining: 300,
        lives: 3,
        hints: 3
      };

      // Initialize game state in Firestore
      const userId = 'current-user-id'; // TODO: Get from auth service
      await gameStateService.initializeGameState(userId, 'current-quarter');

      analyticsService.trackEvent('game_started', {
        challengeCount: challenges.length,
      });

      set(initialState);
    } catch (error) {
      console.error('Failed to start game:', error);
      analyticsService.trackEvent('game_start_error', { error: error.message });
    }
  },

  submitAnswer: (challengeId: string, answer: string) => {
    const state = get();
    const challenge = state.challenges.find(c => c.id === challengeId);
    
    if (!challenge) return;

    const isCorrect = answer === challenge.correctAnswer;
    const newScore = isCorrect ? state.score + challenge.points : state.score;
    const newLives = isCorrect ? state.lives : state.lives - 1;

    // Track answer in analytics
    analyticsService.trackEvent('answer_submitted', {
      challengeId,
      isCorrect,
      timeSpent: 300 - state.timeRemaining,
    });

    // Update game state
    const newState = {
      score: newScore,
      lives: newLives,
      answers: { ...state.answers, [challengeId]: answer },
      currentChallengeIndex: state.currentChallengeIndex + 1
    };

    set(newState);

    // Update Firestore
    const userId = 'current-user-id'; // TODO: Get from auth service
    gameStateService.updateGameState(userId, {
      score: newScore,
      completedSamples: [...Object.keys(state.answers), challengeId],
      progress: ((state.currentChallengeIndex + 1) / state.challenges.length) * 100,
    });

    if (newLives === 0 || state.currentChallengeIndex + 1 >= state.challenges.length) {
      get().endGame();
    }
  },

  useHint: (challengeId: string) => {
    const state = get();
    if (state.hints <= 0) return;

    analyticsService.trackEvent('hint_used', { challengeId });
    set({ hints: state.hints - 1 });
  },

  endGame: () => {
    const state = get();
    const userId = 'current-user-id'; // TODO: Get from auth service

    // Update final state
    gameStateService.updateGameState(userId, {
      score: state.score,
      progress: 100,
    });

    analyticsService.trackEvent('game_completed', {
      finalScore: state.score,
      livesRemaining: state.lives,
      hintsRemaining: state.hints,
    });

    set({ isPlaying: false });
  },

  resetGame: () => {
    analyticsService.trackEvent('game_reset');
    set(INITIAL_STATE);
  }
}));