import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '../../store/game.store';
import { SampleResult } from './sample-result.component';
import ShareResults from './share-results.component';
import { useScoreAnalysis } from '../../hooks/use-score-analysis.hook';
import { Accordion } from '../ui/accordion-ui.component';
import { quarterService } from '../../services/quarter';
import { WhiskeySample, SampleId } from '../../types/game.types';
import { transformQuarterSamples } from '../../utils/data-transform.utils';
import { AnalyticsService } from '../../services/analytics.service';
import { loadGameState } from '../../utils/storage.utils';

export const GameResults: React.FC = () => {
    const { quarterId } = useParams<{ quarterId: string }>();  
    const { guesses, score } = useGameStore();
    const [samplesMap, setSamplesMap] = useState<Record<SampleId, WhiskeySample>>({} as Record<SampleId, WhiskeySample>);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load saved game state
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Try to load from localStorage first
                const savedState = loadGameState();
                if (savedState) {
                    console.log('Loading saved game state:', savedState);
                    setSamplesMap(savedState?.samples || {} as Record<SampleId, WhiskeySample>);
                    return; // Successfully loaded from local storage
                }
                
                // If no saved state and we have a quarterId, load from service
                if (!quarterId) {
                    throw new Error('No quarter ID found');
                }
                
                console.log('Loading quarter data...');
                const quarter = await quarterService.getQuarterById(quarterId);
                
                if (!quarter?.samples) {
                    throw new Error('No samples found for this quarter');
                }

                const transformedSamples = transformQuarterSamples(quarter.samples);
                if (Object.keys(transformedSamples).length === 0) {
                    throw new Error('No valid samples found after transformation');
                }

                console.log('Setting transformed samples:', transformedSamples);
                setSamplesMap(transformedSamples);
                
                // Track successful load
                AnalyticsService.trackEvent('game_results_loaded', {
                    quarterId,
                    sampleCount: Object.keys(transformedSamples).length
                });
            } catch (error) {
                console.error('Error loading data:', error);
                setError(error instanceof Error ? error.message : 'Failed to load game data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [quarterId]);

    const scoreAnalysis = useScoreAnalysis({
        samples: Object.values(samplesMap),
        guesses,
        totalScore: score
    });

    console.log('Score Analysis:', {
        samples: Object.values(samplesMap).length,
        guessCount: Object.keys(guesses).length,
        score,
        analysis: scoreAnalysis
    });

    // Render states
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (Object.keys(samplesMap).length === 0) return <NoSamplesMessage />;

    if (scoreAnalysis.totalScore === 0 && Object.keys(guesses).length > 0) {
        console.error('Zero score detected with valid guesses:', {
            samples: samplesMap,
            guesses,
            score,
            analysis: scoreAnalysis,
            individualScores: Object.values(guesses).map(g => g.score)
        });
        return (
            <div className="p-8 text-center">
                <p className="mb-4 text-red-600">Error: Invalid score calculation</p>
                <p className="text-gray-600">Please try resubmitting your guesses</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl px-4 py-8 mx-auto">
            <ResultsHeader scoreAnalysis={scoreAnalysis} />
            <ShareResults
                score={scoreAnalysis.totalScore}
                totalSamples={Object.keys(samplesMap).length}
                bestGuess={scoreAnalysis.bestGuess}
            />
            <SampleResults 
                guesses={guesses}
                samplesMap={samplesMap}
            />
        </div>
    );
};

// Helper components for cleaner rendering
const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center p-8">
        <div className="text-center">
            <div className="w-12 h-12 mb-4 border-b-2 rounded-full animate-spin border-amber-600"></div>
            <p className="text-gray-600">Loading results...</p>
        </div>
    </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="p-8 text-center">
        <p className="mb-4 text-red-600">{message}</p>
        <p className="text-gray-600">Please try refreshing the page</p>
    </div>
);

const NoSamplesMessage: React.FC = () => (
    <div className="p-8 text-center">
        <p className="mb-4 text-red-600">No samples available</p>
        <p className="text-gray-600">Please try refreshing the page</p>
    </div>
);

const ResultsHeader: React.FC<{ scoreAnalysis: any }> = ({ scoreAnalysis }) => (
    <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Results Analysis</h2>
        <p className="text-xl text-gray-600">Total Score: {scoreAnalysis.totalScore}</p>
    </div>
);

const SampleResults: React.FC<{ 
    guesses: Record<string, any>, 
    samplesMap: Record<SampleId, WhiskeySample> 
}> = ({ guesses, samplesMap }) => {
    if (!guesses || Object.keys(guesses).length === 0) {
        return (
            <div className="p-4 text-center rounded-lg bg-gray-50">
                <p className="text-gray-600">No guesses available to display</p>
            </div>
        );
    }

    return (
        <div className="mt-8 overflow-hidden border rounded-lg">
            <Accordion 
                type="single" 
                collapsible 
                defaultValue="sample-A" 
                className="bg-white divide-y divide-gray-200"
            >
                {Object.entries(guesses).map(([sampleId, guess]) => {
                    const sample = samplesMap[sampleId as SampleId];
                    if (!sample) return null;
                    
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
    );
};