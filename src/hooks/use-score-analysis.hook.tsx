import { useMemo, useState, useEffect } from 'react';
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
    playerId?: string;  
    quarterId?: string; 
}

function isSampleId(id: string): id is SampleId {
    return ['A', 'B', 'C', 'D'].includes(id);
}

const calculateAgeScore = (actual: number, guess: number): number => {
    const diff = Math.abs(actual - guess);
    if (diff === 0) return 35 + 20; // maxPoints + exactMatchBonus
    if (diff <= 2) return Math.round(35 * (1 - (diff / 3))); // gracePeriod handling
    return Math.max(0, 35 - (diff * 6));
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
    playerId,
    quarterId
}: UseScoreAnalysisProps): ScoreAnalysis => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            try {
                if (!playerId) return;
                
                setLoading(true);
            } catch (err) {
                console.error("Failed to fetch scores", err);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, [playerId, quarterId]);

    return useMemo(() => {
        if (loading) {
            return {
                totalScore: 0,
                totalSamples: 0,
                bestGuess: {
                    sampleId: 'A',
                    accuracy: 0,
                    name: 'Loading...'
                },
                averageAccuracy: 0,
                individualScores: {
                    'A': { age: 0, proof: 0, mashbill: 0, total: 0 },
                    'B': { age: 0, proof: 0, mashbill: 0, total: 0 },
                    'C': { age: 0, proof: 0, mashbill: 0, total: 0 },
                    'D': { age: 0, proof: 0, mashbill: 0, total: 0 }
                }
            };
        }
    
        const totalSamples = samples.length;
        console.log(`Total samples analyzed: ${totalSamples}`);

        if (totalSamples === 0) {
            console.warn("No samples available for scoring.");
            return {
                totalScore: 0,
                totalSamples: 0,
                bestGuess: { sampleId: 'A', accuracy: 0, name: 'No Data' },
                averageAccuracy: 0,
                individualScores: {
                    'A': { age: 0, proof: 0, mashbill: 0, total: 0 },
                    'B': { age: 0, proof: 0, mashbill: 0, total: 0 },
                    'C': { age: 0, proof: 0, mashbill: 0, total: 0 },
                    'D': { age: 0, proof: 0, mashbill: 0, total: 0 }
                }
            };
        }

        const finalScore = Object.values(guesses).reduce((sum, guess) => sum + (guess.score || 0), 0);
        const normalizedScore = totalSamples > 0 ? finalScore / totalSamples : 0;

        const individualScores: Record<SampleId, any> = {
            'A': { age: 0, proof: 0, mashbill: 0, total: 0 },
            'B': { age: 0, proof: 0, mashbill: 0, total: 0 },
            'C': { age: 0, proof: 0, mashbill: 0, total: 0 },
            'D': { age: 0, proof: 0, mashbill: 0, total: 0 }
        };

        const accuracies = samples
            .map(sample => {
                if (!isSampleId(sample.id)) {
                    console.warn(`Invalid sample ID: ${sample.id}`);
                    return null;
                }
    
                const guess = guesses[sample.id];
                if (!guess) {
                    console.warn(`No guess found for sample: ${sample.id}`);
                    return null;
                }
    
                const ageScore = calculateAgeScore(sample.age, guess.age);
                const proofScore = calculateProofScore(sample.proof, guess.proof);
                const mashbillScore = calculateMashbillScore(sample.mashbill, guess.mashbill);
                const totalScore = ageScore + proofScore + mashbillScore;
    
                if (totalScore === 0 && ageScore === 0 && proofScore === 0 && mashbillScore === 0) {
                    console.error('All scores are zero for sample:', {
                        sampleId: sample.id,
                        sample,
                        guess,
                        scores: { ageScore, proofScore, mashbillScore }
                    });
                }
    
                individualScores[sample.id] = {
                    age: ageScore,
                    proof: proofScore,
                    mashbill: mashbillScore,
                    total: totalScore
                };
    
                const accuracy = (totalScore / 150) * 100;
    
                return {
                    accuracy,
                    sampleId: sample.id,
                    name: sample.name,
                    scores: individualScores[sample.id]
                } as GuessAccuracy;
            })
            .filter((item): item is GuessAccuracy => item !== null);

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

        const averageAccuracy = accuracies.length
            ? Math.round(accuracies.reduce((sum, acc) => sum + acc.accuracy, 0) / accuracies.length)
            : 0;

        return {
            totalScore: normalizedScore,
            totalSamples,
            bestGuess,
            averageAccuracy,
            individualScores
        } as ScoreAnalysis; 
    }, [samples, guesses, totalScore, loading]);
};
