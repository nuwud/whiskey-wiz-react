import { create } from 'zustand';
import { 
    Quarter, 
    SampleId, 
    Challenge,
    GameState,
    WhiskeySample,
    SampleGuess,
    ScoringRules,
    INITIAL_STATE
} from '../types/game.types';
import { PlayerStats } from '../components/player/player-stats.component';

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

// Extend GameState to include stats
interface ExtendedGameState extends GameState {
    stats: PlayerStats;
}

// Define the store interface
interface GameProgressionStore extends ExtendedGameState {
    // Update methods
    setCurrentSample: (sample: SampleId) => void;
    updateQuarter: (quarter: Quarter) => void;
    updateSample: (sample: SampleId) => void;
    updateCompletedSamples: (samples: string[]) => void;
    updateChallenges: (challenges: Challenge[]) => void;
    updateStats: (stats: PlayerStats) => void;
    
    // Game progression methods
    calculateAverageScorePerQuarter: () => number;
    resetGameProgression: () => void;
    
    // Guessing and scoring
    submitGuess: (sampleId: SampleId, guessData: SampleGuess) => Promise<void>;
    
    // Game state checks
    isGameCompleted: () => boolean;
    hasCompletedAllQuarters: () => boolean;
    canUnlockNextQuarter: () => boolean;
    canUnlockPreviousQuarter: () => boolean;
    
    // Challenge methods
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

    // Basic setters
    setCurrentSample: (sample: SampleId) => 
        set({ currentSample: sample }),

    updateQuarter: (quarter: Quarter) => 
        set({ currentQuarter: quarter }),

    updateSample: (sample: SampleId) => 
        set({ currentSampleId: sample }),

    updateCompletedSamples: (samples: string[]) => 
        set({ completedSamples: samples }),

    updateChallenges: (challenges: Challenge[]) => 
        set({ challenges }),

    updateStats: (stats: PlayerStats) => 
        set(state => ({
            ...state,
            stats: {
                ...state.stats,
                ...stats
            }
        })),

    // Main game mechanics
    submitGuess: async (sampleId: SampleId, guessData: SampleGuess) => {
        const state = get();
        const sample = state.samples.find(s => s.id === sampleId);
        
        if (!sample || !state.scoringRules) return;

        const score = calculateScore(sample, guessData, state.scoringRules);

        set(state => ({
            guesses: {
                ...state.guesses,
                [sampleId]: { ...guessData, score }
            },
            score: {
                ...state.score,
                [sampleId]: state.score[sampleId as SampleId] + score
            },
            completedSamples: [
                ...state.completedSamples,
                sampleId
            ].filter((value, index, self) => self.indexOf(value) === index), // Ensure uniqueness
            stats: {
                ...state.stats,
                totalScore: state.stats.totalScore + score
            }
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
        return state.completedSamples.length === state.samples.length;
    },

    hasCompletedAllQuarters: () => {
        const state = get();
        if (!state.currentQuarter) return false;
        return state.challenges.length > 0 && 
               state.challenges.every(challenge => challenge.completed);
    },

    canUnlockNextQuarter: () => {
        const state = get();
        if (!state.currentQuarter) return false;
        return state.progress >= 100;
    },

    canUnlockPreviousQuarter: () => {
        const state = get();
        return state.currentSampleId !== null;
    },

    hasCompletedChallenge: (challengeId: string) => {
        const state = get();
        return state.challenges.some(challenge => 
            challenge.id === challengeId && challenge.completed
        );
    },

    canUnlockChallenge: (challengeId: string) => {
        const state = get();
        return state.challenges.some(challenge => 
            challenge.id === challengeId
        );
    },

    hasCompletedChallengeOfType: (type: Challenge['type']) => {
        const state = get();
        return state.challenges.some(challenge => 
            challenge.type === type && challenge.completed
        );
    },

    canUnlockChallengeOfType: (type: Challenge['type']) => {
        const state = get();
        return state.challenges.some(challenge => 
            challenge.type === type
        );
    }
}));

// Export both ways to maintain compatibility
export const useGameProgression = useGameProgressionStore;
export default useGameProgressionStore;