import { create } from 'zustand';
import { GameState, Challenge, ScoringRules, WhiskeySample, SampleGuess, SampleKey, INITIAL_STATE } from '../types/game.types';
import { db } from '../config/firebase';
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
  if (sample.mashbill === guess.mashbill) {
    score += rules.mashbill.exactMatchBonus;
  }

  return score;
};

interface GameStore extends GameState {
  // Actions only
  startGame: () => Promise<void>;
  submitAnswer: (challengeId: string, answer: string) => void;
  useHint: (challengeId: string) => void;
  endGame: () => Promise<void>;
  resetGame: () => void;
  navigateSample: (direction: 'next' | 'prev') => void;
  setSample: (id: string) => void;
  submitSampleGuess: (
    sampleId: 'A' | 'B' | 'C' | 'D',
    guess: SampleGuess
  ) => void;
  loadSamples: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  startGame: async () => {
    try {
      const quarter = await quarterService.getCurrentQuarter();
      if (!quarter) throw new Error('No active quarter found');

      const config = await quarterService.getGameConfiguration(quarter.id);
      if (!config) throw new Error('Game configuration not found');

      // Map database samples to A/B/C/D format
      const mappedSamples = quarter.samples.map((sample: WhiskeySample, index: number) => ({
        ...sample,
        id: String.fromCharCode(65 + index) // Converts 0->A, 1->B, etc.
      }));

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
        samples: mappedSamples, // Use our mapped samples
        currentChallengeIndex: 0,
        score: {
          'A': 0, 'B': 0, 'C': 0, 'D': 0
        } as Record<SampleKey, number>,
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
    const sampleKey = challengeId as SampleKey;  // Type assertion

    const newScore = { ...state.score };
    newScore[challengeId as SampleKey] = isCorrect ? 
      (state.score[challengeId as SampleKey] || 0) + challenge.points : 
      (state.score[challengeId as SampleKey] || 0);

    
    newScore[sampleKey] = isCorrect 
      ? (state.score[sampleKey] || 0) + challenge.points 
      : (state.score[sampleKey] || 0);
  
    set(state => ({
      score: newScore,
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
      score: {
        ...state.score,
        [sampleId]: state.score[sampleId] + sampleScore
      }
    }));
  },

  navigateSample: (direction: 'next' | 'prev') => {
    const { currentSampleId, samples } = get();
    const sampleIds = Object.keys(samples);
    
    if (sampleIds.length === 0) {
      console.warn('No samples available to navigate');
      return;
    }
    
    const currentIndex = currentSampleId ? sampleIds.indexOf(currentSampleId) : -1;
    if (currentIndex === -1) {
      console.warn('Current sample not found in samples list');
      set({ currentSampleId: sampleIds[0] });
      return;
    }
    
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % sampleIds.length
      : (currentIndex - 1 + sampleIds.length) % sampleIds.length;
    
    set({ currentSampleId: sampleIds[newIndex] });
  },

  setSample: (id: string) => {
    set({ currentSampleId: id });
  },

  loadSamples: async () => {
    try {
      set({ isLoading: true, error: null });
      const quarter = await quarterService.getCurrentQuarter();
      if (!quarter) throw new Error('No active quarter found');
      
      set({ 
        samples: quarter.samples || [],  // Ensure it's an array
        currentSampleId: quarter.samples[0]?.id || null 
      });
    } catch (error) {
      console.error('Failed to load samples:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load samples' });
    } finally {
      set({ isLoading: false });
    }
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