import { create } from 'zustand';
import {
    Quarter,
    SampleId,
    Challenge,
    GameState,
    SampleGuess,
    INITIAL_STATE
} from '../types/game.types';
import { PlayerStats } from '../components/player/player-stats.component';
import { DEFAULT_WHISKEY_SAMPLE } from '../utils/data-transform.utils';
import { ScoreService } from '../services/score.service';
import { WhiskeySample } from '../types/game.types';

// Extend GameState to include stats
interface ExtendedGameState extends GameState {
    stats: PlayerStats;
}

// Define the store interface
interface GameProgressionStore extends ExtendedGameState {
    setCurrentSample: (sample: SampleId) => void;
    updateQuarter: (quarter: Quarter) => void;
    updateSample: (sample: SampleId) => void;
    updateCompletedSamples: (samples: string[]) => void;
    updateChallenges: (challenges: Challenge[]) => void;
    updateStats: (stats: PlayerStats) => void;
    calculateAverageScorePerQuarter: () => number;
    resetGameProgression: () => void;
    submitGuess: (sampleId: SampleId, guessData: SampleGuess) => Promise<void>;
    isGameCompleted: () => boolean;
    hasCompletedAllQuarters: () => boolean;
    canUnlockNextQuarter: () => boolean;
    canUnlockPreviousQuarter: () => boolean;
    hasCompletedChallenge: (challengeId: string) => boolean;
    canUnlockChallenge: (challengeId: string) => boolean;
    hasCompletedChallengeOfType: (type: Challenge['type']) => boolean;
    canUnlockChallengeOfType: (type: Challenge['type']) => boolean;
}

const useGameProgressionStore = create<GameProgressionStore>((set, get) => ({
    ...INITIAL_STATE,
    stats: {
        totalScore: 0,
        totalGames: 0,
        averageScore: 0,
        recentResults: [],
        bestQuarterScore: 0,
        totalQuartersCompleted: 0,
        averageScorePerQuarter: 0
    },

    setCurrentSample: (sample: SampleId) => set({ currentSample: sample }),
    
    updateQuarter: (quarter: Quarter) => {
        const samplesRecord = quarter.samples.reduce((acc, sample, index) => {
            const sampleId = String.fromCharCode(65 + index) as SampleId; // Convert 0,1,2,3 to A,B,C,D
            acc[sampleId] = sample;
            return acc;
        }, {} as Record<SampleId, WhiskeySample>);

        if (Object.keys(samplesRecord).length < 4) {
            console.warn("Not enough samples in quarter data, adding defaults.");
            ['A', 'B', 'C', 'D'].forEach(id => {
                if (!samplesRecord[id as SampleId]) {
                    samplesRecord[id as SampleId] = {
                        ...DEFAULT_WHISKEY_SAMPLE,
                        id,
                        name: `Sample ${id}`
                    };
                }
            });
        }

        set(state => ({
            ...state,
            currentQuarter: quarter,
            samples: samplesRecord
        }));
        localStorage.setItem("currentQuarter", JSON.stringify(quarter));
    },

    updateSample: (sample: SampleId) => set({ currentSampleId: sample }),

    updateCompletedSamples: (samples: string[]) => set({ completedSamples: samples }),

    updateChallenges: (challenges: Challenge[]) => set({ challenges }),

    updateStats: (stats: PlayerStats) => set(state => ({
        ...state,
        stats: { ...state.stats, ...stats }
    })),

    submitGuess: async (sampleId: SampleId, guessData: SampleGuess) => {
        const state = get();

        if (!state.samples || Object.keys(state.samples).length === 0) {
            console.error('No samples available');
            return;
        }

        const sample = state.samples[sampleId];
        console.log(`Submitting guess for sample: ${sampleId}`, guessData);
        console.log(`Sample data from store:`, sample);

        if (!sample) {
            console.error(`Sample ${sampleId} not found`);
            return;
        }

        const scoreResult = ScoreService.calculateScore(guessData, sample);
        console.log("Score result:", scoreResult);

        set(state => ({
            guesses: {
                ...state.guesses,
                [sampleId]: { ...guessData, score: scoreResult.totalScore }
            },
            score: {
                ...state.score,
                [sampleId]: (state.score[sampleId] || 0) + scoreResult.totalScore // ISSUE HERE
            },
        }));
    },

    calculateAverageScorePerQuarter: () => {
        const state = get();
        if (!state.stats.totalQuartersCompleted) return 0;
        return state.stats.totalScore / state.stats.totalQuartersCompleted;
    },

    resetGameProgression: () => set({
        ...INITIAL_STATE,
        stats: {
            totalScore: 0,
            totalGames: 0,
            averageScore: 0,
            recentResults: [],
            bestQuarterScore: 0,
            totalQuartersCompleted: 0,
            averageScorePerQuarter: 0
        }
    }),

    isGameCompleted: () => {
        const state = get();
        return Object.keys(state.samples).length > 0 && state.completedSamples.length === Object.keys(state.samples).length;
    },

    hasCompletedAllQuarters: () => {
        const state = get();
        return Boolean(state.currentQuarter && state.challenges.length > 0 && state.challenges.every(challenge => challenge.completed));
    },

    canUnlockNextQuarter: () => {
        const state = get();
        return state.progress >= 100;
    },

    canUnlockPreviousQuarter: () => {
        const state = get();
        return state.currentSampleId !== null;
    },

    hasCompletedChallenge: (challengeId: string) => {
        const state = get();
        return state.challenges.some(challenge => challenge.id === challengeId && challenge.completed);
    },

    canUnlockChallenge: (challengeId: string) => {
        const state = get();
        return state.challenges.some(challenge => challenge.id === challengeId);
    },

    hasCompletedChallengeOfType: (type: Challenge['type']) => {
        const state = get();
        return state.challenges.some(challenge => challenge.type === type && challenge.completed);
    },

    canUnlockChallengeOfType: (type: Challenge['type']) => {
        const state = get();
        return state.challenges.some(challenge => challenge.type === type);
    }
}));

export const useGameProgression = useGameProgressionStore;
export default useGameProgressionStore;
