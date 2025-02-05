// scoring-types.ts

export interface ScoringResult {
    totalScore: number;
    breakdown: {
        age: number;
        proof: number;
        mashbill: number;
    };
    explanations: {
        age: string;
        proof: string;
        mashbill: string;
    };
}

export interface ScoreCalculationInput {
    actual: {
        age: number;
        proof: number;
        mashbill: string;
    };
    guess: {
        age: number;
        proof: number;
        mashbill: string;
    };
}

export interface ScoringBoundaries {
    age: {
        min: number;
        max: number;
        gracePeriod: number;
    };
    proof: {
        min: number;
        max: number;
        gracePeriod: number;
    };
}

// Extended from the base game.types ScoringRules
export interface AdminScoringConfig {
    enabled: boolean;  // Whether to use admin config or defaults
    rules?: {
        age: {
            points: number;
            maxPoints: number;
            penaltyPerYear: number;
            exactMatchBonus: number;
            gracePeriod: number;
        };
        proof: {
            points: number;
            maxPoints: number;
            penaltyPerPoint: number;
            exactMatchBonus: number;
            gracePeriod: number;
        };
        mashbill: {
            points: number;
            maxPoints: number;
            exactMatchBonus: number;
        };
    };
}