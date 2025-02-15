import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';
import { quarterService } from '../../services/quarter';
import { AnalyticsService } from '../../services/analytics.service';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { monitoringService } from '../../services/monitoring.service';
import { FirebaseService } from '../../services/firebase.service';
import { Spinner } from '../../components/ui/spinner-ui.component';
import { useGameStore } from '../../store/game.store';
import { GameState, SampleGuess, SampleId, SampleKey, WhiskeySample, INITIAL_STATE } from '../../types/game.types';
import { SampleGuessing, createInitialGuesses } from './sample-guessing.component';
import { useGameProgression } from '../../store/game-progression.store';
import { ScoreService } from '../../services/score.service';
import { transformQuarterSamples } from '../../utils/data-transform.utils';
import { saveGameState, loadGameState } from '../../utils/storage.utils';  // assuming this is where the function is
import { GuestSessionMonitor } from '../guest/guest-session-monitor.component';
import { GuestGameStateService } from '../../services/guest-game-state.service';
import { useToast } from '../../hooks/use-toast.hook';

const calculateTimeSpent = (startTime: number): number => {
    return Math.floor((Date.now() - startTime) / 1000);
};

const SAMPLE_IDS: SampleId[] = ['A', 'B', 'C', 'D'];

export const isValidSampleSet = (
    samples: unknown
): samples is Record<SampleId, WhiskeySample> => {
    if (!samples || typeof samples !== 'object') return false;

    const requiredIds = new Set(['A', 'B', 'C', 'D']);
    const sampleIds = new Set(Object.keys(samples));

    return [...requiredIds].every(id => sampleIds.has(id));
};

const validateUserAccess = (user: any, quarterId: string | undefined) => {
    if (!quarterId) {
        return { valid: false, error: 'No quarter selected' };
    }
    
    if (!user) {
        return { valid: false, error: 'Not authenticated' };
    }

    if (user.guest && !localStorage.getItem('guestToken')) {
        return { valid: false, error: 'Invalid guest session' };
    }

    return { valid: true, error: null };
};

export const GameContainer: React.FC = () => {
    const { quarterId } = useParams<{ quarterId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { samples, setSamples } = useGameStore();
    const { toast } = useToast();
    const [sessionExpired, setSessionExpired] = useState(false);

    const handleSessionExpiring = () => {
        toast({
            title: "Session Expiring",
            description: "Your guest session will expire soon. Sign up to save your progress!",
            type: "warning"
        });
    };

    const handleSessionExpired = () => {
        setSessionExpired(true);
        navigate('/signup', {
            state: { from: 'game' }
        });
    };

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
            const state = gameState as GameState;
            useGameStore.setState({
                samples: state.samples || {} as Record<SampleId, WhiskeySample>,
                guesses: state.guesses,
                completedSamples: state.completedSamples || [],
                totalScore: Object.values(state.totalScore || {}).reduce((sum, score) => sum + score, 0),
                currentSampleId: state.currentSampleId as SampleId || 'A'
            });
        }
    }, [gameState]);

    // Add guess handling
    const handleGuessSubmit = (sampleId: SampleId, guess: SampleGuess) => {
        console.log('Processing guess for sample:', sampleId, guess);
        const sample = samples[sampleId];
        console.log('Sample data:', sample);

        if (!sample || !sample.age || !sample.proof || !sample.mashbill) {
            console.error('Invalid sample data:', sample);
            toast({
                title: "Error",
                description: "Invalid sample data. Please try again or contact support.",
                type: "error"
            });
            return;
        }

        const cleanGuess = {
            ...guess,
            age: Number(guess.age),
            proof: Number(guess.proof)
        };

        // Change this line to use the static method
        const scoreResult = ScoreService.calculateScore(cleanGuess, sample);
        console.log('Score calculated:', scoreResult);

            // Update guesses with score
            setGuesses(prevGuesses => ({
                ...prevGuesses,
                [sampleId]: {
                    ...cleanGuess,
                    score: scoreResult.totalScore,
                    breakdown: scoreResult.breakdown,
                    explanations: scoreResult.explanations
                }
            }));

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
        const accessCheck = validateUserAccess(user, quarterId);
        if (!accessCheck.valid) {
            setError(accessCheck.error);
            navigate('/quarters', { state: { error: accessCheck.error } });
            return;
        }

        const traceId = monitoringService.startTrace('game_initialization');

        try {
            setLoading(true);
            setError(null);
            console.log('Starting game initialization...');

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Game initialization timed out')), 10000)
            );

            if (user && user.guest) {
                // Try to load guest state first
                const guestState = GuestGameStateService.loadGameState(user.userId);
                if (guestState && GuestGameStateService.isStateValid(guestState)) {
                    setGameState(guestState);
                    return;
                }
            }

            // Fetch user state and quarter data in parallel
            const results = await Promise.race([
                Promise.all([
                    loadGameState(),
                    quarterService.getQuarterById(quarterId!)
                ]),
                timeoutPromise
            ]) as [GameState | null, any];

            const [savedState, quarter] = results;

            if (savedState?.samples && Object.keys(savedState.samples).length === 4) {
                console.log('Restoring saved game state');
                const fullGameState: GameState = {
                    ...INITIAL_STATE,
                    ...savedState,
                    userId: user?.userId || 'unknown',
                    quarterId: quarterId!,
                    isLoading: false,
                    isPlaying: true
                };
                setGameState(fullGameState);
                setSamples(savedState.samples);
                return;
            }

            if (!quarter || !validateQuarterData(quarter)) {
                throw new Error('Invalid quarter data');
            }

            if (quarter && quarter.samples && Object.keys(quarter.samples).length > 0) {
                console.log('Transforming and setting samples...');
                const transformedSamples = transformQuarterSamples(quarter.samples);
                setSamples(transformedSamples);
                console.log('Set samples:', transformedSamples);
                saveGameState({ ...INITIAL_STATE, samples: transformedSamples });
            } else {
                console.error('No valid samples found for this quarter.');
            }

            if (user) {
                AnalyticsService.trackEvent('game_initialization_success', { quarterId, userId: user.userId });
            }

        } catch (error) {
            console.error('Game initialization failed:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
            AnalyticsService.trackEvent('game_initialization_failure', {
                error: error instanceof Error ? error.message : 'Unknown error',
                quarterId,
                userId: user?.userId || 'unknown'
            });
        } finally {
            setLoading(false);
            monitoringService.endTrace('game_initialization', traceId);
        }
    }, [quarterId, user, navigate, setSamples]);

    // Single initialization effect
    useEffect(() => {
        if (user && !useGameStore.getState().isInitialized) {
            const init = async () => {
                try {
                    setLoading(true);
                    await initializeGame();
                    // Add this to verify samples are loaded
                    const currentSamples = useGameStore.getState().samples;
                    if (!currentSamples || Object.keys(currentSamples).length === 0) {
                        throw new Error('Samples failed to initialize');
                    }
                } catch (error) {
                    console.error('Initialization error:', error);
                    setError(error instanceof Error ? error.message : 'Failed to initialize game');
                } finally {
                    setLoading(false);
                }
            };
            init();
        }
    }, [user, initializeGame]);

    // Save guest state
    useEffect(() => {
        if (gameState && user?.guest) {
            GuestGameStateService.saveGameState(gameState, user.userId);
        }
    }, [gameState, user]);

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
            const finalScore = calculateTotalScore();

            console.log('Final Guesses:', guesses);
            console.log('Calculated Total Score:', currentTotalScore);
            console.log('Final score:', finalScore); 

            const finalState = {
                guesses,
                score: Object.keys(guesses).reduce((acc, key) => ({
                    ...acc,
                    [key as SampleKey]: guesses[key as SampleKey]?.score || 0
                }), {}),
                totalScore: currentTotalScore,
                samples,
                currentQuarter: quarterId
            };

            await saveGameState(finalState);
            console.log('Saved game state:', finalState);

            // Submit score for all valid users (guests, players, and admins)
            if (user?.guest) {
                localStorage.setItem('guestScore', JSON.stringify({
                    quarterId,
                    score: finalScore,
                    timestamp: Date.now()
                }));
            } else {
                await FirebaseService.submitScore(user.userId, quarterId, finalScore);
            }

            logEvent(getAnalytics(), 'game_completed', {
                quarterId,
                userId: user.userId,
                userRole: user.role,
                score: currentTotalScore,
                time_spent: timeSpent
            });

            console.log('Navigating to results page...');
            navigate(`/game/${quarterId}/results`);

        } catch (error) {
            console.error('Game completion failed:', error);
            setError('Failed to complete game. Please try again.');
            toast({
                title: "Error",
                description: "Failed to save game results. Please try again.",
                type: "error"
            });
            AnalyticsService.trackEvent('game_completion_failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: user.userId
            });
        } finally {
            setLoading(false);
            monitoringService.endTrace('game_completion', gameCompletionTrace);
        }
    };

    useEffect(() => {
        if (sessionExpired) {
            navigate('/signup', {
                state: {
                    message: "Your guest session has expired. Sign up to continue playing!"
                }
            });
        }
    }, [sessionExpired, navigate]);

    if (!samples || Object.keys(samples).length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4">Initializing Game...</h2>
                    <Spinner />
                </div>
            </div>
        );
    }

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

            {/* Guest Session Monitor */}
            {user?.guest && (
                <GuestSessionMonitor
                    onSessionExpiring={handleSessionExpiring}
                    onSessionExpired={handleSessionExpired}
                />
            )}
        </div>
    );
};

