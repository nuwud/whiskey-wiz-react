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
import { loadGameState } from '../../utils/storage.utils'

export const GameResults: React.FC = () => {
    const { quarterId } = useParams<{ quarterId: string }>();  
    const { guesses, score  } = useGameStore();
    const [samplesMap, setSamplesMap] = useState<Record<SampleId, WhiskeySample>>({} as Record<SampleId, WhiskeySample>);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

        // Load saved game state
        useEffect(() => {
            const savedState = loadGameState();
            if (savedState) {
                console.log('Loading saved game state:', savedState);
                setSamplesMap(savedState?.samples || {} as Record<SampleId, WhiskeySample>);
                // You might want to update the global game store here as well
            }
        }, []);

        useEffect(() => {
            const loadQuarterData = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    
                    if (!quarterId) {
                        throw new Error('No quarter ID found');
                    }
    
                    // Only load quarter data if we don't have saved state
                    if (Object.keys(samplesMap).length === 0) {
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
                    }
                    
                    // Track successful load
                    AnalyticsService.trackEvent('game_results_loaded', {
                        quarterId,
                        sampleCount: Object.keys(samplesMap).length
                    });
    
                } catch (error) {
                    console.error('Error loading quarter data:', error);
                    setError(error instanceof Error ? error.message : 'Failed to load game data');
                } finally {
                    setLoading(false);
                }
            };
    
            loadQuarterData();
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

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
        </div>
    </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center p-8">
        <p className="text-red-600 mb-4">{message}</p>
        <p className="text-gray-600">Please try refreshing the page</p>
    </div>
);

const NoSamplesMessage: React.FC = () => (
    <div className="text-center p-8">
        <p className="text-red-600 mb-4">No samples available</p>
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
            <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No guesses available to display</p>
            </div>
        );
    }

    return (
        <div className="mt-8 border rounded-lg overflow-hidden">
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