import { useMemo } from 'react';
import { SampleId, WhiskeySample } from '../types/game.types';

interface GuessAccuracy {
    accuracy: number;
    sampleId: SampleId;
    name: string;
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

export const useScoreAnalysis = ({
    samples,
    guesses,
    totalScore,
}: UseScoreAnalysisProps): ScoreAnalysis => {
    return useMemo(() => {
        const totalSamples = samples.length;
        const finalScore = Object.values(totalScore).reduce((sum, score) => sum + score, 0);

        // Calculate accuracy for each guess
        const accuracies = samples
            .map(sample => {
                // Type guard to ensure we only process valid SampleIds
                if (!isSampleId(sample.id)) {
                    return null;
                }

                const guess = guesses[sample.id];
                if (!guess) {
                    return null;
                }

                const ageAccuracy = Math.max(0, 100 - (Math.abs(sample.age - guess.age) * 10));
                const proofAccuracy = Math.max(0, 100 - (Math.abs(sample.proof - guess.proof) * 2));
                const mashbillAccuracy = sample.mashbill === guess.mashbill ? 100 : 0;

                return {
                    accuracy: (ageAccuracy + proofAccuracy + mashbillAccuracy) / 3,
                    sampleId: sample.id,
                    name: sample.name
                } as GuessAccuracy;
            })
            .filter((item): item is GuessAccuracy => item !== null);

        // Find the best guess
        const bestGuessResult = accuracies.reduce(
            (best, current) => current.accuracy > best.accuracy ? current : best,
            { accuracy: 0, sampleId: 'A' as SampleId, name: 'No valid guesses' }
        );

        const bestGuess = {
            sampleId: bestGuessResult.sampleId,
            accuracy: Math.round(bestGuessResult.accuracy),
            name: bestGuessResult.name
        };

        const averageAccuracy = Math.round(
            accuracies.reduce((sum, acc) => sum + acc.accuracy, 0) / totalSamples
        );

        return {
            totalScore: finalScore,
            totalSamples,
            bestGuess,
            averageAccuracy,
        };
    }, [samples, guesses, totalScore]);
};