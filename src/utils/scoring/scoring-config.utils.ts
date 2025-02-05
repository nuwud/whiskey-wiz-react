// scoring-config.utils.ts
import { ScoringRules } from '../types/game.types';

// Default rules that work without admin panel
export const DEFAULT_SCORING_CONFIG = {
    age: {
        points: 35,
        maxPoints: 35,
        penaltyPerYear: 6,
        pointDeductionPerYear: 6,
        exactMatchBonus: 20,
        minValue: 1,
        maxValue: 10,
        hasLowerLimit: true,
        hasUpperLimit: false,
        gracePeriod: 2
    },
    proof: {
        points: 35,
        maxPoints: 35,
        penaltyPerPoint: 3,
        pointDeductionPerProof: 3,
        exactMatchBonus: 20,
        minValue: 80,
        maxValue: 120,
        hasLowerLimit: true,
        hasUpperLimit: false,
        gracePeriod: 5
    },
    mashbill: {
        points: 30,
        maxPoints: 30,
        pointDeductionPerType: 10,
        exactMatchBonus: 20
    }
};

// Function to merge admin config with defaults
export const getMergedScoringConfig = (adminConfig?: Partial<ScoringRules>): ScoringRules => {
    if (!adminConfig) return DEFAULT_SCORING_CONFIG;

    return {
        age: {
            ...DEFAULT_SCORING_CONFIG.age,
            ...adminConfig.age
        },
        proof: {
            ...DEFAULT_SCORING_CONFIG.proof,
            ...adminConfig.proof
        },
        mashbill: {
            ...DEFAULT_SCORING_CONFIG.mashbill,
            ...adminConfig.mashbill
        }
    };
};

// Wrapper for our simpler scoring utils
export const getActiveScoring = (adminConfig?: Partial<ScoringRules>) => {
    const config = getMergedScoringConfig(adminConfig);

    return {
        calculateAgeScore: (actual: number, guess: number): number => {
            const difference = Math.abs(actual - guess);
            if (difference === 0) return config.age.points + config.age.exactMatchBonus;
            if (difference <= config.age.gracePeriod) {
                return Math.round(config.age.points * (1 - (difference / (config.age.gracePeriod + 1))));
            }
            return 0;
        },

        calculateProofScore: (actual: number, guess: number): number => {
            const difference = Math.abs(actual - guess);
            if (difference === 0) return config.proof.points + config.proof.exactMatchBonus;
            if (difference <= config.proof.gracePeriod) {
                return Math.round(config.proof.points * (1 - (difference / (config.proof.gracePeriod + 1))));
            }
            return 0;
        },

        calculateMashbillScore: (actual: string, guess: string): number => {
            return actual.toLowerCase() === guess.toLowerCase() ? 
                   config.mashbill.points + config.mashbill.exactMatchBonus : 
                   0;
        },

        getMaxPossibleScore: () => {
            return config.age.points + config.age.exactMatchBonus +
                   config.proof.points + config.proof.exactMatchBonus +
                   config.mashbill.points + config.mashbill.exactMatchBonus;
        },

        config // Expose the active config for reference
    };
};

// Helper to validate admin config when it exists
export const validateScoringConfig = (config: Partial<ScoringRules>): boolean => {
    try {
        // Basic validation
        if (config.age) {
            if (config.age.points < 0 || config.age.maxPoints < config.age.points) return false;
            if (config.age.gracePeriod < 0) return false;
        }
        if (config.proof) {
            if (config.proof.points < 0 || config.proof.maxPoints < config.proof.points) return false;
            if (config.proof.gracePeriod < 0) return false;
        }
        if (config.mashbill) {
            if (config.mashbill.points < 0 || config.mashbill.maxPoints < config.mashbill.points) return false;
        }
        return true;
    } catch (error) {
        console.error('Scoring config validation error:', error);
        return false;
    }
};