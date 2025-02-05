// scoring-calculation.utils.ts
import { ScoringResult, ScoreCalculationInput, AdminScoringConfig } from './scoring-types';

// Default configuration - moved from scoring-config.utils.ts
export const DEFAULT_SCORING_CONFIG = {
    age: {
        points: 35,
        maxPoints: 35,
        penaltyPerYear: 6,
        exactMatchBonus: 20,
        gracePeriod: 2
    },
    proof: {
        points: 35,
        maxPoints: 35,
        penaltyPerPoint: 3,
        exactMatchBonus: 20,
        gracePeriod: 5
    },
    mashbill: {
        points: 30,
        maxPoints: 30,
        exactMatchBonus: 20
    }
};

export class ScoringCalculator {
    private config: typeof DEFAULT_SCORING_CONFIG;
    private isAdminConfig: boolean;

    constructor(adminConfig?: AdminScoringConfig) {
        this.isAdminConfig = adminConfig?.enabled ?? false;
        this.config = adminConfig?.enabled && adminConfig.rules 
            ? adminConfig.rules 
            : DEFAULT_SCORING_CONFIG;
    }

    public calculate(input: ScoreCalculationInput): ScoringResult {
        const ageScore = this.calculateAgeScore(input.actual.age, input.guess.age);
        const proofScore = this.calculateProofScore(input.actual.proof, input.guess.proof);
        const mashbillScore = this.calculateMashbillScore(input.actual.mashbill, input.guess.mashbill);

        const totalScore = ageScore + proofScore + mashbillScore;

        return {
            totalScore,
            breakdown: {
                age: ageScore,
                proof: proofScore,
                mashbill: mashbillScore
            },
            explanations: {
                age: this.getAgeExplanation(input.actual.age, input.guess.age),
                proof: this.getProofExplanation(input.actual.proof, input.guess.proof),
                mashbill: this.getMashbillExplanation(input.actual.mashbill, input.guess.mashbill)
            }
        };
    }

    private calculateAgeScore(actual: number, guess: number): number {
        const { points, exactMatchBonus, gracePeriod, penaltyPerYear } = this.config.age;
        const difference = Math.abs(actual - guess);

        if (difference === 0) return points + exactMatchBonus;
        if (difference <= gracePeriod) {
            return Math.round(points * (1 - (difference / (gracePeriod + 1))));
        }
        return Math.max(0, points - (difference * penaltyPerYear));
    }

    private calculateProofScore(actual: number, guess: number): number {
        const { points, exactMatchBonus, gracePeriod, penaltyPerPoint } = this.config.proof;
        const difference = Math.abs(actual - guess);

        if (difference === 0) return points + exactMatchBonus;
        if (difference <= gracePeriod) {
            return Math.round(points * (1 - (difference / (gracePeriod + 1))));
        }
        return Math.max(0, points - (difference * penaltyPerPoint));
    }

    private calculateMashbillScore(actual: string, guess: string): number {
        const { points, exactMatchBonus } = this.config.mashbill;
        return actual.toLowerCase() === guess.toLowerCase() ? points + exactMatchBonus : 0;
    }

    private getAgeExplanation(actual: number, guess: number): string {
        const difference = Math.abs(actual - guess);
        if (difference === 0) return "Perfect match! Full points awarded.";
        if (difference <= this.config.age.gracePeriod) {
            return `Close! Off by ${difference} years. Partial points awarded.`;
        }
        return `Off by ${difference} years. No points awarded.`;
    }

    private getProofExplanation(actual: number, guess: number): string {
        const difference = Math.abs(actual - guess);
        if (difference === 0) return "Perfect match! Full points awarded.";
        if (difference <= this.config.proof.gracePeriod) {
            return `Close! Off by ${difference} proof points. Partial points awarded.`;
        }
        return `Off by ${difference} proof points. No points awarded.`;
    }

    private getMashbillExplanation(actual: string, guess: string): string {
        return actual.toLowerCase() === guess.toLowerCase()
            ? "Correct mashbill type! Full points awarded."
            : "Incorrect mashbill type. No points awarded.";
    }

    public getMaxPossibleScore(): number {
        return (this.config.age.points + this.config.age.exactMatchBonus) +
               (this.config.proof.points + this.config.proof.exactMatchBonus) +
               (this.config.mashbill.points + this.config.mashbill.exactMatchBonus);
    }

    public isEnabled(): boolean {
        return this.isAdminConfig;
    }

    public getCurrentConfig() {
        return this.config;
    }
}