// scoring.utils.ts
// @deprecated - Use ScoringCalculator from ./scoring/scoring-calculation.utils.ts instead
// This file is maintained for backward compatibility and will be removed in future versions

import { ScoringCalculator } from './scoring/scoring-calculation.utils';

const calculator = new ScoringCalculator();

export const calculateAgeScore = (actual: number, guess: number): number => {
    const result = calculator.calculate({
        actual: { age: actual, proof: 0, mashbill: '' },
        guess: { age: guess, proof: 0, mashbill: '' }
    });
    return result.breakdown.age;
};

export const calculateProofScore = (actual: number, guess: number): number => {
    const result = calculator.calculate({
        actual: { age: 0, proof: actual, mashbill: '' },
        guess: { age: 0, proof: guess, mashbill: '' }
    });
    return result.breakdown.proof;
};

export const calculateMashbillScore = (actual: string, guess: string): number => {
    const result = calculator.calculate({
        actual: { age: 0, proof: 0, mashbill: actual },
        guess: { age: 0, proof: 0, mashbill: guess }
    });
    return result.breakdown.mashbill;
};

export const calculateTotalScore = (
    actual: { age: number; proof: number; mashbill: string },
    guess: { age: number; proof: number; mashbill: string }
): { total: number; breakdown: { age: number; proof: number; mashbill: number } } => {
    const result = calculator.calculate({ actual, guess });
    return {
        total: result.totalScore,
        breakdown: result.breakdown
    };
};

export const getScoreExplanation = (
    actual: { age: number; proof: number; mashbill: string },
    guess: { age: number; proof: number; mashbill: string }
): { age: string; proof: string; mashbill: string } => {
    const result = calculator.calculate({ actual, guess });
    return result.explanations;
};

export const getAgeExplanation = (actual: number, guess: number): string => {
    const diff = Math.abs(actual - guess);
    if (diff === 0) return "Perfect guess! Full points awarded.";
    if (diff <= 2) return "Very close! Small deduction for minor difference.";
    return `Off by ${diff} years. Points deducted based on difference.`;
};

export const getProofExplanation = (actual: number, guess: number): string => {
    const diff = Math.abs(actual - guess);
    if (diff === 0) return "Perfect proof guess! Full points awarded.";
    if (diff <= 5) return "Very close! Small deduction for minor difference.";
    return `Off by ${diff} proof points. Points deducted proportionally.`;
};

export const getMashbillExplanation = (actual: string, guess: string): string => {
    return actual.toLowerCase() === guess.toLowerCase()
    ? "Correct mashbill type! Full points awarded."
    : "Incorrect mashbill type. No points awarded for this category.";
};