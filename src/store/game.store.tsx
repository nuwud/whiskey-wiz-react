import { create } from 'zustand';
import { GameState, Challenge, ScoringRules, WhiskeySample, SampleGuess, SampleKey, SampleId, INITIAL_STATE, Quarter } from '../types/game.types';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { quarterService } from '../services/quarter.service';
import { transformQuarterSamples } from '../utils/data-transform.utils';
import { loadGameState, saveGameState, clearGameState } from '../utils/storage.utils';

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

const defaultSamples: Record<SampleId, WhiskeySample> = {
    A: { id: 'A', name: '', age: 0, proof: 0, mashbill: 'Bourbon', rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' },
    B: { id: 'B', name: '', age: 0, proof: 0, mashbill: 'Bourbon', rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' },
    C: { id: 'C', name: '', age: 0, proof: 0, mashbill: 'Bourbon', rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' },
    D: { id: 'D', name: '', age: 0, proof: 0, mashbill: 'Bourbon', rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' }
};

interface GameStore extends Omit<GameState, 'totalScore'> {
    setSamples: (samples: Record<SampleId, WhiskeySample>) => void;
    setCurrentSampleId: (id: SampleId | null) => void;
    startGame: () => Promise<void>;
    submitAnswer: (challengeId: string, answer: string) => void;
    useHint: (challengeId: string) => void;
    endGame: () => Promise<void>;
    resetGame: () => void;
    navigateSample: (direction: 'next' | 'prev') => void;
    setSample: (id: string) => void;
    submitSampleGuess: (sampleId: SampleId, guess: SampleGuess) => void;
    loadSamples: () => Promise<void>;
    isInitialized: boolean;
    currentQuarter: Quarter | null;
    currentSampleId: SampleId | null;
    samples: Record<SampleId, WhiskeySample>;
    guesses: Record<SampleId, SampleGuess>;
    score: Record<SampleId, number>;
    totalScore: number;
    quarters: Quarter[];
    setQuarters: (quarters: Quarter[]) => void;
}

export const useGameStore = create<GameStore>((set, get) => {
    const savedState = loadGameState();
    const initialState = savedState ? {
        ...INITIAL_STATE,
        ...savedState,
        samples: (savedState.samples && Object.values(savedState.samples).some(s => s.age > 0 || s.proof > 0)) 
            ? savedState.samples 
            : defaultSamples,
        isInitialized: true,
        currentSampleId: savedState.currentSampleId as SampleId || 'A',
        currentQuarter: savedState.currentQuarter as Quarter | null
    } : {
        ...INITIAL_STATE,
        samples: defaultSamples,
        isInitialized: false,
        currentSampleId: null,
        currentQuarter: null
    };

    return {
        ...initialState,
        quarters: [],
        setQuarters: (quarters: Quarter[]) => set({ quarters }),
        setSamples: (samples: Record<SampleId, WhiskeySample>) => {
            set({ samples, isInitialized: true });
            saveGameState(get());
        },

        setCurrentSampleId: (id: SampleId | null) =>
            set({ currentSampleId: id }),

        setSample: (id: string) =>
            set({ currentSampleId: id as SampleId }),

        loadSamples: async () => {
            const state = get();
            if (state.samples && Object.keys(state.samples).length > 0) {
                return;
            }

            try {
                set({ isLoading: true, error: null });
                const activeQuarter = await quarterService.getCurrentQuarter();
                if (!activeQuarter) throw new Error('No active quarter found');

                const transformedSamples = transformQuarterSamples(activeQuarter.samples);

                const newState = {
                    samples: transformedSamples,
                    currentSampleId: state.currentSampleId || 'A',
                    isInitialized: true
                };

                set(newState);
                saveGameState({ ...state, ...newState });

            } catch (error) {
                console.error('Failed to load samples:', error);
                set({
                    error: error instanceof Error ? error.message : 'Failed to load samples',
                    isInitialized: false
                });
            } finally {
                set({ isLoading: false });
            }
        },

        startGame: async () => {
            try {
                const state = get();
                const activeQuarter = await quarterService.getCurrentQuarter();
                if (!activeQuarter) throw new Error('No active quarter found');

                const config = await quarterService.getGameConfiguration(activeQuarter.id);
                if (!config) throw new Error('Game configuration not found');

                const challengesRef = collection(db, 'challenges');
                const q = query(
                    challengesRef,
                    where('quarterId', '==', activeQuarter.id),
                    where('active', '==', true)
                );

                const querySnapshot = await getDocs(q);
                const challenges = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Challenge));

                const newState = {
                    isPlaying: true,
                    currentQuarter: activeQuarter,
                    scoringRules: config.scoringRules,
                    challenges: challenges.sort(() => Math.random() - 0.5).slice(0, 5),
                    currentChallengeIndex: 0,
                    score: state.score || {
                        'A': 0, 'B': 0, 'C': 0, 'D': 0
                    } as Record<SampleKey, number>,
                    answers: {},
                    timeRemaining: 300,
                    hints: 3,
                    isComplete: false,
                    samples: state.samples
                };

                set(newState);
                saveGameState({ ...state, ...newState });

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
            const sampleKey = challengeId as SampleKey;

            const newScore = { ...state.score };
            newScore[sampleKey] = isCorrect
                ? (state.score[sampleKey] || 0) + challenge.points
                : (state.score[sampleKey] || 0);

            const newState = {
                score: newScore,
                lives: isCorrect ? state.lives : state.lives - 1,
                answers: { ...state.answers, [challengeId]: answer },
                currentChallengeIndex: state.currentChallengeIndex + 1
            };

            set(newState);
            saveGameState({ ...state, ...newState });

            if (newState.lives === 0 || newState.currentChallengeIndex >= state.challenges.length) {
                get().endGame();
            }
        },

        submitSampleGuess: (sampleId: SampleId, guess: SampleGuess) => {
            const state = get();
            if (!state.scoringRules) return;

            const sample = state.samples[sampleId];
            if (!sample) {
                console.warn('No sample found for:', sampleId);
                return;
            }

            const sampleScore = calculateScore(sample, guess, state.scoringRules);
            console.log('Calculated score for sample:', sampleId, sampleScore);

            const newGuesses = {
                ...state.guesses,
                [sampleId]: { ...guess, score: sampleScore }
            };

            const newScore = {
                ...state.score,
                [sampleId]: sampleScore
            };

            const newTotal = Object.values(newScore).reduce((sum, score) => sum + score, 0);

            const newState = {
                guesses: newGuesses,
                score: newScore,
                totalScore: newTotal,
                samples: state.samples
            };

            saveGameState({
                ...state,
                ...newState
            });

            set(newState);
            console.log('Updated game state:', newState);
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
                set({ currentSampleId: sampleIds[0] as SampleId });
                return;
            }

            const newIndex = direction === 'next'
                ? (currentIndex + 1) % sampleIds.length
                : (currentIndex - 1 + sampleIds.length) % sampleIds.length;

            const newState = { currentSampleId: sampleIds[newIndex] as SampleId };
            set(newState);
            saveGameState({ ...get(), ...newState });
        },

        useHint: (challengeId: string) => {
            const state = get();
            if (state.hints <= 0) return;

            const challenge = state.challenges.find(c => c.id === challengeId);
            if (!challenge) return;

            const newState = {
                hints: state.hints - 1,
                answers: { ...state.answers, [`${challengeId}_hint`]: true }
            };

            set(newState);
            saveGameState({ ...state, ...newState });
        },

        endGame: async () => {
            const state = get();
            if (!state.currentQuarter) return;

            try {
                await addDoc(collection(db, 'game_results'), {
                    quarterId: state.currentQuarter.id,
                    challengeResults: state.answers,
                    sampleResults: state.guesses,
                    totalScore: state.totalScore,
                    individualScores: state.score,
                    hintsUsed: 3 - state.hints,
                    livesRemaining: state.lives,
                    completedAt: new Date()
                });

                clearGameState();
                set({ isPlaying: false });

            } catch (error) {
                console.error('Failed to save game results:', error);
                throw error;
            }
        },

        resetGame: () => {
            const resetState = {
                ...INITIAL_STATE,
                isInitialized: false,
                currentQuarter: null,
                currentSampleId: null,
                samples: defaultSamples,
                guesses: {} as Record<SampleId, SampleGuess>,
                score: {} as Record<SampleId, number>,
                totalScore: 0
            };

            set(resetState);
            saveGameState(resetState);
        }
    };
});        