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
import { GameState, SampleGuess, SampleId, SampleKey, WhiskeySample, INITIAL_STATE, DEFAULT_SCORING_RULES, Difficulty } from '../../types/game.types';
import { SampleGuessing, createInitialGuesses } from './sample-guessing.component';
import { useGameProgression } from '../../store/game-progression.store';
import { ScoreService } from '../../services/score.service';
import { transformQuarterSamples } from '../../utils/data-transform.utils';
import { saveGameState } from '../../utils/storage.utils';
import { GuestSessionMonitor } from '../guest/guest-session-monitor.component';
import { GuestGameStateService } from '../../services/guest-game-state.service';
import { useToast } from '../../hooks/use-toast.hook';
import { retryOperation } from '../../utils/retry.utils'

const SAMPLE_IDS: SampleId[] = ['A', 'B', 'C', 'D'];

export const isValidSampleSet = (
    samples: unknown
): samples is Record<SampleId, WhiskeySample> => {
    if (!samples || typeof samples !== 'object') return false;

    const requiredIds = new Set(['A', 'B', 'C', 'D']);
    const sampleIds = new Set(Object.keys(samples));

    return [...requiredIds].every(id => sampleIds.has(id));
};

export const GameContainer: React.FC = () => {
    const { quarterId } = useParams<{ quarterId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { samples, setSamples } = useGameStore();
    const { toast } = useToast();
    const [sessionExpired, setSessionExpired] = useState(false);
    const [isStateInitialized, setIsStateInitialized] = useState(false);

    const calculateTimeSpent = (startTime: number): number => {
        return Math.floor((Date.now() - startTime) / 1000);
    };
        
    // Removed unused validateUserAccess function

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

    // Centralized logging function
    const logSamples = (samples: Record<SampleId, WhiskeySample>) => {
        console.log('Current samples in store:', samples);
    };

    // Add guess handling
    const handleGuessSubmit = (sampleId: SampleId, guess: SampleGuess) => {
        
        console.log('Processing guess for sample:', sampleId, guess);
        const sample = samples[sampleId];
        console.log('Raw sample data:', sample);
        console.log('Raw guess data:', guess);

    if (!sample || Number(sample.age) <= 0 || Number(sample.proof) <= 0) {
        console.error('Invalid sample data:', sample);
        toast({
            title: "Error",
            description: "Invalid sample data detected. Please contact support.",
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
        if (!samples || Object.keys(samples).length < SAMPLE_IDS.length) {
            return false; // Prevent incorrect completion state
        }
    
        return SAMPLE_IDS.every(id => samples[id] && guesses[id]?.submitted);
    }, [samples, guesses]);
    

    // Update effect to handle game completion
    useEffect(() => {
        if (isGameComplete()) {
            handleGameComplete();
        }
    }, [guesses, isGameComplete]);

    const validateQuarterData = (quarter: any): boolean => {
        if (!quarter) return false;
    
        const hasSamples = quarter.samples && 
                Array.isArray(quarter.samples) && 
                quarter.samples.length === 4 && // Exactly 4 samples required
                quarter.samples.every((sample: WhiskeySample) => 
                    sample && 
                    typeof sample === 'object' &&
                    'age' in sample &&
                    'proof' in sample &&
                    'mashbill' in sample
                );
        
        console.log('Quarter samples validation:', {
            hasSamples,
            samplesLength: quarter.samples?.length,
            samplesData: quarter.samples
        });
    
        return hasSamples;
    };

    const initializeGame = useCallback(async () => {
        if (!user || !quarterId) return;
    
        setLoading(true);
        setError(null);
        const traceId = monitoringService.startTrace('game_initialization');
        console.time("Game Initialization Time");
    
        try {
            await retryOperation(async () => {
                console.time("Fetching Quarter Data");
                const quarter = await quarterService.getQuarterById(quarterId);
                if (!quarter || !validateQuarterData(quarter)) {
                    throw new Error('Invalid quarter data');
                }

                console.time("Transforming Samples");
                const transformedSamples = transformQuarterSamples(quarter.samples);
                console.timeEnd("Transforming Samples");

                if (!transformedSamples || Object.keys(transformedSamples).length < 4) {
                    throw new Error('Sample transformation failed');
                }
    
                console.log('Setting samples:', transformedSamples);
                console.time("Updating State");
                setSamples(transformedSamples);
                useGameStore.setState({
                    ...INITIAL_STATE,
                    samples: transformedSamples,
                    isInitialized: true
                });
                console.timeEnd("Updating State");

                console.timeEnd("Game Initialization Time");

                setGameState(prevState => ({
                    ...(prevState || INITIAL_STATE),
                    samples,
                    isInitialized: true,
                    userId: user?.userId || '',
                    quarterId: quarterId || '',
                    isLoading: false,
                    isPlaying: true
                }));
    
                    await saveGameState({ ...INITIAL_STATE, samples: transformedSamples });
                });

        } catch (error) {
            console.error('Game initialization failed:', error);
            setError(error instanceof Error ? error.message : 'Failed to initialize game');
        } finally {
            setLoading(false);
            monitoringService.endTrace('game_initialization', traceId);
        }
    }, [quarterId, user, setSamples]);

    if (!isStateInitialized || !samples || Object.keys(samples).length < 4) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner />
                <p>Loading game data...</p>
            </div>
        );
    } 

    // Single initialization effect
    useEffect(() => {
        let mounted = { current: true };
    
        if (user && !useGameStore.getState().isInitialized) {
            (async () => {
                try {
                    if (!mounted.current) return;
                    setLoading(true);
                    await initializeGame();
    
                    if (!mounted.current) return;
                    const currentSamples = useGameStore.getState().samples;
                    logSamples(currentSamples);
    
                    if (!currentSamples || Object.keys(currentSamples).length < 4) {
                        throw new Error('Samples failed to initialize');
                    }
                } catch (error) {
                    if (!mounted.current) return;
                    console.error('Initialization error:', error);
                    setError(error instanceof Error ? error.message : 'Failed to initialize game');
                } finally {
                    if (mounted.current) {
                        setLoading(false);
                    }
                }
            })();
        }
    
        return () => {
            mounted.current = false;
        };
    }, [user, initializeGame]);
    
    useEffect(() => {
        if (!samples || Object.keys(samples).length < 4) {
            return;
        }
        setGameState(prevState => ({
            ...(prevState || INITIAL_STATE),
            samples,
            isInitialized: true,
            userId: user?.userId || '',
            quarterId: quarterId || '',
            isLoading: false,
            isPlaying: true,
            error: null,
            currentSampleId: SAMPLE_IDS[0],
            lastUpdated: new Date(),
            startTime: new Date(),
            endTime: new Date(),
            currentRound: 0,
            totalRounds: SAMPLE_IDS.length,
            completedSamples: [],
            progress: 0,
            hasSubmitted: false,
            currentChallengeIndex: 0,
            totalChallenges: 0,
            challenges: [],
            currentSample: 'A',
            difficulty: 'beginner',
            mode: 'standard',
            totalScore: 0,
            guesses: createInitialGuesses(),
            answers: {},
            timeRemaining: 300,
            lives: 3,
            hints: 3,
            isComplete: false
        }));
    }, [samples]);

    // Save guest state
    useEffect(() => {
        if (gameState && user?.guest) {
            GuestGameStateService.saveGameState(gameState, user.userId);
        }
    }, [gameState, user]);

    const handleNextSample = () => {
        setCurrentSampleIndex(prevIndex => {
            const newIndex = prevIndex + 1;
            if (newIndex < SAMPLE_IDS.length) {
                setCurrentSample(SAMPLE_IDS[newIndex]);
            }
            return newIndex;
        });
    };

    const handlePreviousSample = () => {
        setCurrentSampleIndex(prevIndex => {
            const newIndex = Math.max(0, prevIndex - 1); // Ensure it doesn't go below 0
            setCurrentSample(SAMPLE_IDS[newIndex]);
            return newIndex;
        });
    };
    

    const handleGameComplete = () => {
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
                currentQuarter: {
                    id: quarterId,
                    name: '',
                    startDate: new Date(),
                    endDate: new Date(),
                    startTime: new Date(),
                    endTime: new Date(),
                    duration: 0,
                    difficulty: 'beginner' as Difficulty, // Add type assertion
                    minimumScore: 0,
                    maximumScore: 100,
                    minimumChallengesCompleted: 0,
                    isActive: true,
                    samples: Object.values(samples),
                    description: '',
                    scoringRules: DEFAULT_SCORING_RULES,
                    challenges: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            };

            saveGameState(finalState);
            console.log('Saved game state:', finalState);

            // Submit score for all valid users (guests, players, and admins)
            if (user?.guest) {
                localStorage.setItem('guestScore', JSON.stringify({
                    quarterId,
                    score: finalScore,
                    timestamp: Date.now()
                }));
            } else {
                FirebaseService.submitScore(user.userId, quarterId, finalScore);
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

    // Effect to track state initialization
    useEffect(() => {
        if (gameState) {
            setIsStateInitialized(true);
        }
    }, [gameState]);

    if (!isStateInitialized || !gameState) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner />
            </div>
        );
    }

    if (!samples || Object.keys(samples).length < 4) {
        const currentSamples = useGameStore.getState().samples;
        logSamples(currentSamples);
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4">
                        {loading 
                            ? 'Loading game samples...' 
                            : 'Samples not yet available. Please try refreshing.'}
                    </h2>
                    <Spinner />
                    <p className="mt-2 text-gray-600">
                        {error 
                            ? `Error: ${error}` 
                            : `This may take a few moments... (${Object.keys(currentSamples || {}).length}/4 samples loaded)`}
                    </p>
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

