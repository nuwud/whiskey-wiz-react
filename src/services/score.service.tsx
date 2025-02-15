import { Timestamp } from 'firebase/firestore';
import { SampleGuess, WhiskeySample } from '../types/game.types'

// Score interfaces
export interface ScoreSubmission {
  playerId: string;
  quarterId: string;
  totalScore: number;
  guesses: {
    [key: string]: {
      age: number;
      proof: number;
      mashbill: string;
      score?: number;
      breakdown?: {
        age: number;
        proof: number;
        mashbill: number;
      };
      explanations?: {
        age: string;
        proof: string;
        mashbill: string;
      };
    }
  };
  createdAt?: Timestamp;
}

export interface ScoreDocument extends ScoreSubmission {
  id: string;
}

export interface ScoreBreakdown {
  age: number;
  proof: number;
  mashbill: number;
}

export interface ScoringResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  explanations: {
    age: string;
    proof: string;
    mashbill: string;
  };
}

// Core scoring configuration
const SCORING_CONFIG = {
  age: {
    maxPoints: 35,
    penaltyPerYear: 6,
    exactMatchBonus: 20,
    gracePeriod: 2
  },
  proof: {
    maxPoints: 35,
    penaltyPerPoint: 3,
    exactMatchBonus: 20,
    gracePeriod: 5
  },
  mashbill: {
    maxPoints: 30,
    exactMatchBonus: 20
  }
};

export class ScoreService {
  private static instance: ScoreService;
  private constructor() { }

  static getInstance(): ScoreService {
    if (!ScoreService.instance) {
      ScoreService.instance = new ScoreService();
    }
    return ScoreService.instance;
  }

  static calculateScore(guess: SampleGuess, sample: WhiskeySample): { totalScore: number; breakdown: ScoreBreakdown; explanations: string[] } {
    // Validate inputs
    if (!this.validateInputs(guess, sample)) {
        return {
            totalScore: 0,
            breakdown: { age: 0, proof: 0, mashbill: 0 },
            explanations: ['Invalid data', 'Invalid data', 'Invalid data']
        };
    }

    // Sanitize inputs
    const sanitizedGuess = {
        age: Number(guess.age),
        proof: Number(guess.proof),
        mashbill: String(guess.mashbill).toLowerCase()
    };

    const sanitizedSample = {
        age: Number(sample.age),
        proof: Number(sample.proof),
        mashbill: String(sample.mashbill).toLowerCase()
    };

    // Calculate scores with sanitized data
    const ageScore = this.calculateAgeScore(sanitizedGuess.age, sanitizedSample.age);
    const proofScore = this.calculateProofScore(sanitizedGuess.proof, sanitizedSample.proof);
    const mashbillScore = this.calculateMashbillScore(sanitizedGuess.mashbill, sanitizedSample.mashbill);

    const totalScore = ageScore + proofScore + mashbillScore;

    return {
      totalScore,
      breakdown: { age: ageScore, proof: proofScore, mashbill: mashbillScore },
      explanations: [
        this.getAgeExplanation(sanitizedGuess.age, sanitizedSample.age),
        this.getProofExplanation(sanitizedGuess.proof, sanitizedSample.proof),
        this.getMashbillExplanation(sanitizedGuess.mashbill, sanitizedSample.mashbill)
      ]
    };
  }

  private static validateInputs(guess: SampleGuess, sample: WhiskeySample): boolean {
    return Boolean(
        guess &&
        sample &&
        !isNaN(Number(guess.age)) &&
        !isNaN(Number(guess.proof)) &&
        typeof guess.mashbill === 'string' &&
        !isNaN(Number(sample.age)) &&
        !isNaN(Number(sample.proof)) &&
        typeof sample.mashbill === 'string'
    );
  }

  // Individual scoring calculations
  static calculateAgeScore(guessed: number, actual: number): number {
    const diff = Math.abs(guessed - actual);
    const config = SCORING_CONFIG.age;

    if (diff === 0) return config.maxPoints + config.exactMatchBonus;
    if (diff <= config.gracePeriod) {
      return Math.round(config.maxPoints * (1 - (diff / (config.gracePeriod + 1))));
    }
    return Math.max(0, config.maxPoints - (diff * config.penaltyPerYear));
  }

  static calculateProofScore(guessed: number, actual: number): number {
    const diff = Math.abs(guessed - actual);
    const config = SCORING_CONFIG.proof;

    if (diff === 0) return config.maxPoints + config.exactMatchBonus;
    if (diff <= config.gracePeriod) {
      return Math.round(config.maxPoints * (1 - (diff / (config.gracePeriod + 1))));
    }
    return Math.max(0, config.maxPoints - (diff * config.penaltyPerPoint));
  }

  static calculateMashbillScore(guessed: string, actual: string): number {
    const config = SCORING_CONFIG.mashbill;
    return guessed.toLowerCase() === actual.toLowerCase()
      ? config.maxPoints + config.exactMatchBonus
      : 0;
  }

  // Helper methods
  static calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    const editDistance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return Math.max(0, 1 - editDistance / maxLength);
  }

  static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str2.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + (str2[i - 1] === str1[j - 1] ? 0 : 1)
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Explanation generators
  static getAgeExplanation(guessed: number, actual: number): string {
    const diff = Math.abs(guessed - actual);
    if (diff === 0) return "Perfect match! Full points awarded.";
    if (diff <= SCORING_CONFIG.age.gracePeriod) {
      return `Close! Off by ${diff} years. Partial points awarded.`;
    }
    return `Off by ${diff} years. Points deducted based on difference.`;
  }

  static getProofExplanation(guessed: number, actual: number): string {
    const diff = Math.abs(guessed - actual);
    if (diff === 0) return "Perfect proof guess! Full points awarded.";
    if (diff <= SCORING_CONFIG.proof.gracePeriod) {
      return `Very close! Off by ${diff} proof points. Partial points awarded.`;
    }
    return `Off by ${diff} proof points. Points deducted proportionally.`;
  }

  static getMashbillExplanation(guessed: string, actual: string): string {
    return guessed.toLowerCase() === actual.toLowerCase()
      ? "Correct mashbill type! Full points awarded."
      : "Incorrect mashbill type. No points awarded.";
  }

  // Rank calculation
  static getRank(score: number): string {
    const maxScore = this.getMaxPossibleScore();
    const percentage = (score / maxScore) * 100;

    if (percentage >= 90) return 'Whiskey Wizard';
    if (percentage >= 80) return 'Oak Overlord';
    if (percentage >= 60) return 'Cask Commander';
    if (percentage >= 40) return 'Whiskey Explorer';
    if (percentage >= 20) return 'Whiskey Rookie';
    return 'Barrel Beginner';
  }

  static getMaxPossibleScore(): number {
    return Object.values(SCORING_CONFIG).reduce((total, config) =>
      total + config.maxPoints + (config.exactMatchBonus || 0), 0);
  }
}

export const scoreService = ScoreService.getInstance();