// src/components/game/game-results.component.tsx
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/game.store';
import { SampleResult } from './sample-result.component';
import ShareResults from './share-results.component';
import { useScoreAnalysis } from '../../hooks/use-score-analysis.hook';
import { Accordion } from '../ui/accordion-ui.component';
import { quarterService } from '../../services/quarter.service';
import { WhiskeySample } from '../../types/game.types';

export const GameResults: React.FC = () => {
    const { guesses, totalScore } = useGameStore();
    const [samples, setSamples] = useState<WhiskeySample[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const loadQuarterData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('Loading quarter data...');
                const quarter = await quarterService.getCurrentQuarter();
                console.log('Quarter data:', quarter);
                
                if (!quarter) {
                    console.error('No active quarter found');
                    setError('No active quarter found');
                    return;
                }
                
                if (!quarter.samples || quarter.samples.length === 0) {
                    console.error('Quarter has no samples:', quarter);
                    setError('No samples found for this quarter');
                    return;
                }

                console.log('Setting samples:', quarter.samples);
                setSamples(quarter.samples);
            } catch (error) {
                console.error('Error loading quarter data:', error);
                setError('Failed to load game data');
            } finally {
                setLoading(false);
            }
        };

        loadQuarterData();
    }, []);

    const scoreAnalysis = useScoreAnalysis({
        samples,
        guesses,
        totalScore,
    });

    console.log('Debug state:', { 
        samplesCount: samples.length, 
        guessesCount: Object.keys(guesses).length,
        samples,
        guesses,
        currentQuarter: quarterService.getCurrentQuarter()
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
                    <p className="text-gray-600">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <p className="text-red-600 mb-4">{error}</p>
                <p className="text-gray-600">Please try refreshing the page</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900">Results Analysis</h2>
                <p className="text-xl text-gray-600">Total Score: {scoreAnalysis.totalScore}</p>
            </div>

            <div className="mb-8">
                <ShareResults
                    score={scoreAnalysis.totalScore}
                    totalSamples={scoreAnalysis.totalSamples}
                    bestGuess={scoreAnalysis.bestGuess}
                />
            </div>

            {guesses && Object.keys(guesses).length > 0 && (
                <div className="mt-8 border rounded-lg overflow-hidden">
                    <Accordion type="single" collapsible defaultValue="sample-A" className="bg-white divide-y divide-gray-200">
                        {Object.entries(guesses).map(([sampleId, guess]) => {
                            console.log('Trying to find sample for id:', sampleId, 'in samples:', samples);
                            const sample = samples.find(s => {
                                console.log('Comparing', s.id, 'with', sampleId);
                                return s.id === sampleId;
                            });
                            
                            if (!sample) {
                                console.log('No sample found for id:', sampleId);
                                return null;
                            }
                            
                            return (
                                <SampleResult
                                    key={sampleId}
                                    sampleId={sampleId}
                                    sample={sample}
                                    guess={guess}
                                />
                            );
                        })}
                    </Accordion>
                </div>
            )}

            {(!guesses || Object.keys(guesses).length === 0) && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No guesses available to display</p>
                </div>
            )}
        </div>
    );
};