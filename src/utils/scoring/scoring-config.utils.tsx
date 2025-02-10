// scoring-config.utils.ts
import { ScoringRules } from '../../types/game.types';

// Default configuration
export const DEFAULT_SCORING_CONFIG: ScoringRules = {
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