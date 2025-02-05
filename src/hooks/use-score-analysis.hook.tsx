import { useMemo } from 'react';
import { SampleId, WhiskeySample } from '../types/game.types';

interface GuessAccuracy {
    accuracy: number;
    sampleId: SampleId;
    name: string;
    scores: {
        age: number;
        proof: number;
        mashbill: number;
        total: number;
    };
}

interface ScoreAnalysis {
    totalScore: number;
    totalSamples: number;
    bestGuess: {
        sampleId: SampleId;
        accuracy: number;
        name: string;
    };
    averageAccuracy: number;
    individualScores: Record<SampleId, {
        age: number;
        proof: number;
        mashbill: number;
        total: number;
    }>;
}

interface UseScoreAnalysisProps {
    samples: WhiskeySample[];
    guesses: Record<SampleId, {
        age: number;
        proof: number;
        mashbill: string;
        score?: number;
    }>;
    totalScore: Record<SampleId, number>;
}

function isSampleId(id: string): id is SampleId {
    return ['A', 'B', 'C', 'D'].includes(id);
}

const calculateAgeScore = (actual: number, guess: number): number => {
    return Math.round(Math.max(0, 100 - (Math.abs(actual - guess) * 10)) / 2);
};

const calculateProofScore = (actual: number, guess: number): number => {
    return Math.round(Math.max(0, 100 - (Math.abs(actual - guess) * 2)) / 2);
};

const calculateMashbillScore = (actual: string, guess: string): number => {
    return actual.toLowerCase() === guess.toLowerCase() ? 50 : 0;
};

export const useScoreAnalysis = ({
    samples,
    guesses,
    totalScore,
}: UseScoreAnalysisProps): ScoreAnalysis => {
    return useMemo(() => {
        // Handle empty states
        if (!samples.length) {
            return {
                totalScore: 0,
                totalSamples: 0,
                bestGuess: {
                    sampleId: 'A',
                    accuracy: 0,
                    name: 'No samples available'
                },
                averageAccuracy: 0,
                individualScores: {} as Record<SampleId, any>
            };
        }

        const totalSamples = samples.length;
        const finalScore = Object.values(totalScore).reduce((sum, score) => sum + score, 0);
        const individualScores: Record<SampleId, any> = {};

        // Calculate accuracy and scores for each guess
        const accuracies = samples
            .map(sample => {
                // Type guard to ensure we only process valid SampleIds
                if (!isSampleId(sample.id)) {
                    console.warn(`Invalid sample ID: ${sample.id}`);
                    return null;
                }

                const guess = guesses[sample.id];
                if (!guess) {
                    console.warn(`No guess found for sample: ${sample.id}`);
                    return null;
                }

                // Calculate individual scores using the same logic as sample-result
                const ageScore = calculateAgeScore(sample.age, guess.age);
                const proofScore = calculateProofScore(sample.proof, guess.proof);
                const mashbillScore = calculateMashbillScore(sample.mashbill, guess.mashbill);
                const totalScore = ageScore + proofScore + mashbillScore;

                // Store individual scores
                individualScores[sample.id] = {
                    age: ageScore,
                    proof: proofScore,
                    mashbill: mashbillScore,
                    total: totalScore
                };

                // Calculate accuracy as a percentage of total possible points (150)
                const accuracy = (totalScore / 150) * 100;

                return {
                    accuracy,
                    sampleId: sample.id,
                    name: sample.name,
                    scores: individualScores[sample.id]
                } as GuessAccuracy;
            })
            .filter((item): item is GuessAccuracy => item !== null);

        // Find best guess, defaulting to first sample if no accuracies
        const defaultBestGuess = samples[0] ? {
            accuracy: 0,
            sampleId: samples[0].id as SampleId,
            name: samples[0].name
        } : {
            accuracy: 0,
            sampleId: 'A' as SampleId,
            name: 'No valid guesses'
        };

        const bestGuessResult = accuracies.reduce(
            (best, current) => current.accuracy > best.accuracy ? current : best,
            defaultBestGuess
        );

        const bestGuess = {
            sampleId: bestGuessResult.sampleId,
            accuracy: Math.round(bestGuessResult.accuracy),
            name: bestGuessResult.name
        };

        // Calculate average accuracy only if we have valid guesses
        const averageAccuracy = accuracies.length 
            ? Math.round(accuracies.reduce((sum, acc) => sum + acc.accuracy, 0) / accuracies.length)
            : 0;

        return {
            totalScore: finalScore,
            totalSamples,
            bestGuess,
            averageAccuracy,
            individualScores
        };
    }, [samples, guesses, totalScore]);
};