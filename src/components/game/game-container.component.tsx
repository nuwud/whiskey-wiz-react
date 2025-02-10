import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';
import { quarterService } from '../../services/quarter.service';
import { AnalyticsService } from '../../services/analytics.service';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { monitoringService } from '../../services/monitoring.service';
import { FirebaseService } from '../../services/firebase.service';
import { Spinner } from '../../components/ui/spinner-ui.component';
import { useGameStore } from '../../store/game.store';
import { GameState, SampleGuess, SampleId, SampleKey } from '../../types/game.types';
import { GameStateService } from '../../services/game-state.service';
import { SampleGuessing, createInitialGuesses } from './sample-guessing.component';
import { useGameProgression } from '../../store/game-progression.store';
import { ScoreService } from '../../services/score.service';
import { transformQuarterSamples } from '../../utils/data-transform.utils';
import { UserRole } from '../../types/auth.types';
import { saveGameState } from '../../utils/storage.util';  // assuming this is where the function is

const calculateTimeSpent = (startTime: number): number => {
    return Math.floor((Date.now() - startTime) / 1000);
};

const SAMPLE_IDS: SampleId[] = ['A', 'B', 'C', 'D'];

export const GameContainer: React.FC = () => {
    const { quarterId } = useParams<{ quarterId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { samples, setSamples } = useGameStore();
    // Global game progression state
    const gameProgression = useGameProgression();
    const { setCurrentSample } = gameProgression;

    // Local UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
    const [startTime] = useState<number>(Date.now());
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [guesses, setGuesses] = useState<Record<SampleKey, SampleGuess>>(createInitialGuesses());

    useEffect(() => {
        if (gameState) {
            const calculatedTotalScore = Object.values(gameState.totalScore).reduce((sum, score) => sum + score, 0);
            useGameStore.setState({
                guesses: gameState.guesses,
                completedSamples: gameState.completedSamples,
                totalScore: calculatedTotalScore
            });
        }
    }, [gameState]);


    // Add guess handling
    const handleGuessSubmit = (sampleId: SampleId, guess: SampleGuess) => {
        console.log('Processing guess for sample:', sampleId, guess);
        const sample = samples[sampleId];
        console.log('Sample data:', sample);
        if (!sample) return;

        // Change this line to use the static method
        const scoreResult = ScoreService.calculateScore(guess, sample);
        console.log('Score result:', scoreResult);

        // Create the complete guess with score
        const scoredGuess: SampleGuess = {
            ...guess,
            score: scoreResult.totalScore,
            breakdown: scoreResult.breakdown,
            explanations: {
                age: scoreResult.explanations[0] || '',
                proof: scoreResult.explanations[1] || '',
                mashbill: scoreResult.explanations[2] || ''
            }
        };
        console.log('Score result:', scoredGuess);

        // Update guesses with full score information
        setGuesses(prevGuesses => ({
            ...prevGuesses,
            [sampleId]: {
                ...guess,
                score: scoreResult.totalScore,
                breakdown: scoreResult.breakdown,
                explanations: scoreResult.explanations
            }
        }));
    };

    // Add total score calculation
    const calculateTotalScore = useCallback(() => {
        return Object.values(guesses).reduce((total, guess) => total + (guess.score || 0), 0);
    }, [guesses]);

    const isGameComplete = useCallback(() => {
        return Object.keys(samples).length > 0 &&
            SAMPLE_IDS.every(id => samples[id] && guesses[id]?.submitted);
    }, [samples, guesses]);

    // Update effect to handle game completion
    useEffect(() => {
        if (isGameComplete()) {
            handleGameComplete();
        }
    }, [guesses, isGameComplete]);

    const validateQuarterData = (quarter: any): boolean => {
        if (!quarter) return false;
        
        const hasSamples = quarter.samples && Array.isArray(quarter.samples) && quarter.samples.length > 0;
        console.log('Quarter samples validation:', {
            hasSamples,
            samplesLength: quarter.samples?.length,
            samplesData: quarter.samples
        });
        
        return hasSamples;
    };

    const initializeGame = useCallback(async () => {
        if (!quarterId || !user) {
            navigate('/quarters');
            return;
        }
    
        const traceId = monitoringService.startTrace('game_initialization');
    
        try {
            setLoading(true);
    
            // First try to get existing game state
            const gameStateService = GameStateService.getInstance();
            let state = await gameStateService.getGameState(user.userId);
    
            if (!state) {
                // Fetch quarter with samples
                const quarter = await quarterService.getQuarterById(quarterId);
                console.log('Fetched Quarter:', quarter);
    
                if (!quarter || !validateQuarterData(quarter)) {
                    console.error('Invalid quarter data:', quarter);
                    throw new Error('Invalid quarter data');
                }
    
                // Transform and validate samples
                const transformedSamples = transformQuarterSamples(quarter.samples);
                console.log('Transformed Samples:', transformedSamples);
    
                // Verify we have all required samples
                const requiredSamples = new Set(['A', 'B', 'C', 'D']);
                const missingSamples = Array.from(requiredSamples)
                    .filter((id): id is SampleId => !transformedSamples[id as SampleId]);
                
                if (missingSamples.length > 0) {
                    console.error('Missing required samples:', missingSamples);
                    throw new Error(`Missing required samples: ${missingSamples.join(', ')}`);
                }
    
                // Create new game state
                state = await gameStateService.createGameState(user.userId);
    
                // Update game state
                setSamples(transformedSamples);
                setCurrentSampleIndex(0);
                setCurrentSample('A');
    
                // Update global store with validated data
                useGameStore.setState({
                    samples: transformedSamples,
                    currentSampleId: 'A',
                    isInitialized: true
                });
            } else {
                // Load existing state
                setGameState(state);
                setGuesses(state.guesses || createInitialGuesses());
                setCurrentSampleIndex(state.completedSamples?.length || 0);
                
                // Important: Also load the samples when restoring state
                if (state.samples) {
                    setSamples(state.samples);
                    useGameStore.setState({
                        samples: state.samples,
                        currentSampleId: SAMPLE_IDS[state.completedSamples?.length || 0],
                        isInitialized: true
                    });
                } else {
                    // If no samples in state, fetch them
                    const quarter = await quarterService.getQuarterById(quarterId);
                    if (quarter && validateQuarterData(quarter)) {
                        const transformedSamples = transformQuarterSamples(quarter.samples);
                        setSamples(transformedSamples);
                        useGameStore.setState({
                            samples: transformedSamples,
                            currentSampleId: SAMPLE_IDS[state.completedSamples?.length || 0],
                            isInitialized: true
                        });
                    }
                }
            }
    
            // Track successful initialization
            AnalyticsService.trackEvent('game_initialization_success', {
                quarterId,
                userId: user.userId,
                sampleCount: Object.keys(samples).length
            });
    
        } catch (error) {
            console.error('Game initialization failed:', error);
            setError(error instanceof Error ? error.message : 'Failed to initialize game');
            AnalyticsService.trackEvent('game_initialization_failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: user.userId,
                quarterId
            });
        } finally {
            setLoading(false);
            monitoringService.endTrace('game_initialization', traceId);
        }
    }, [quarterId, user, navigate, setCurrentSample, samples]);

    // Keep only one initialization useEffect
    useEffect(() => {
        if (user) {
            initializeGame();
        }
    }, [user, initializeGame]);

    useEffect(() => {
        const savedQuarter = localStorage.getItem("currentQuarter");
        if (savedQuarter) {
            useGameProgression.setState({ currentQuarter: JSON.parse(savedQuarter) });
        }
    }, []);

    const handleNextSample = () => {
        if (currentSampleIndex < SAMPLE_IDS.length - 1) {
            setCurrentSampleIndex((prev: number) => prev + 1);
            setCurrentSample(SAMPLE_IDS[currentSampleIndex + 1]);
        }
    };

    const handlePreviousSample = () => {
        if (currentSampleIndex > 0) {
            setCurrentSampleIndex((prev: number) => prev - 1);
            setCurrentSample(SAMPLE_IDS[currentSampleIndex - 1]);
        }
    };

    const handleGameComplete = async () => {
        if (!quarterId || !user) return;
    
        const gameCompletionTrace = monitoringService.startTrace('game_completion');
    
        try {
            setLoading(true);
            console.log('Starting game completion process...');
    
            const timeSpent = calculateTimeSpent(startTime);
            const currentTotalScore = calculateTotalScore();
    
            const finalState = {
                guesses,
                score: {}, // Add the current score state here
                totalScore: currentTotalScore,
                samples,
                currentQuarter: quarterId
            };
            
            saveGameState(finalState);
    
            // Only submit score if user is a player or admin
            if (user.role === UserRole.PLAYER || user.role === UserRole.ADMIN) {
                console.log('Submitting final score:', currentTotalScore);
                await FirebaseService.submitScore(user.userId, quarterId, currentTotalScore);
            }
    
            logEvent(getAnalytics(), 'game_completed', {
                quarterId,
                userId: user.userId,
                userRole: user.role,
                score: currentTotalScore,
                time_spent: timeSpent
            });
    
            console.log('Navigating to results page...');
            navigate(`/game/${quarterId}/results`, { replace: true });
    
        } catch (error) {
            console.error('Game completion failed:', error);
            setError('Failed to complete game. Please try again.');
            AnalyticsService.trackEvent('game_completion_failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: user.userId
            });
        } finally {
            setLoading(false);
            monitoringService.endTrace('game_completion', gameCompletionTrace);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="mb-4 text-red-500">{error}</div>
                <button
                    onClick={() => navigate('/quarters')}
                    className="px-4 py-2 text-white rounded bg-amber-500 hover:bg-amber-600"
                >
                    Return to Quarter Selection
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4">
            <div className="container px-4 py-8 mx-auto">
                <h1 className="mb-8 text-2xl font-bold">Game of Whiskey Blind Tasting</h1>

                {/* Sample Guessing Component */}
                <SampleGuessing
                    currentSample={SAMPLE_IDS[currentSampleIndex]}
                    guess={guesses[SAMPLE_IDS[currentSampleIndex]]}
                    onSubmitGuess={handleGuessSubmit}
                    onNextSample={handleNextSample}
                    onPreviousSample={handlePreviousSample}
                    isLastSample={currentSampleIndex === SAMPLE_IDS.length - 1}
                    onGameComplete={handleGameComplete}
                />
            </div>

        </div>
    );
};