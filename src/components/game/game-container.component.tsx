import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';
import { quarterService } from '../../services/quarter/quarter.service';
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
        if (!user) return;
        const initGame = async () => {
            const gameStateService = new GameStateService();
            const state = await gameStateService.getGameState(user.userId);
            if (state) {
                setGameState(state);
                setGuesses(state.guesses);
                setCurrentSampleIndex(state.completedSamples.length);
                setCurrentSample(state.currentSample); // Restore the last sample played
            }
        };
        initGame();
    }, [user, setCurrentSample]);

    useEffect(() => {
        if (gameState) {
            useGameStore.setState({ 
                guesses: gameState.guesses, 
                completedSamples: gameState.completedSamples, 
                totalScore: gameState.totalScore 
            });
        }
    }, [gameState]);
    

    // Add guess handling
    const handleGuessSubmit = (sampleId: SampleId, guess: SampleGuess) => {
        console.log('Processing guess for sample:', sampleId, guess);
        const sample = samples[sampleId];
        console.log('Sample data:', sample);
        if (!sample) return;
        // Use the centralized scoring service
        const scoreResult = ScoreService.calculateScore(guess, sample);
        console.log('Score result:', scoreResult);

        // Convert explanations array to required object format
        const explanationsObject = {
            age: scoreResult.explanations[0] || '',
            proof: scoreResult.explanations[1] || '',
            mashbill: scoreResult.explanations[2] || ''
        };

        // Create the complete guess with score
        const scoredGuess: SampleGuess = {
            ...guess,
            score: scoreResult.totalScore,
            breakdown: scoreResult.breakdown,
            explanations: explanationsObject
        };
        console.log('Score result:', scoredGuess);
    
        // Update guesses with full score information
        setGuesses(prevGuesses => ({
            ...prevGuesses,
            [sampleId]: {
                ...guess,
                score: scoreResult.totalScore,
                breakdown: scoreResult.breakdown,
                explanations: explanationsObject
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

    const initializeGame = useCallback(async () => {
        if (!quarterId || !user) {
            navigate('/quarters');
            return;
        }

        const traceStartTime = monitoringService.startTrace('game_initialization');

        try {
            setLoading(true);
            
            // Fetch quarter with samples
            const quarter = await quarterService.getQuarterById(quarterId);
            console.log('Fetched Quarter:', quarter);
            
            if (!quarter) {
                throw new Error('Quarter not found');
            }

            if (!quarter.samples || Object.keys(quarter.samples).length === 0) {
                console.error('No samples found in quarter:', quarter.samples);
                throw new Error('No samples found in quarter');
            }
            

            // Transform and validate samples
            const transformedSamples = transformQuarterSamples(quarter.samples);
            console.log('Transformed Samples:', transformedSamples);

            if (Object.keys(transformedSamples).length !== SAMPLE_IDS.length) {
                console.error('Incorrect number of samples:', transformedSamples);
                throw new Error(`Expected ${SAMPLE_IDS.length} samples, found ${Object.keys(transformedSamples).length}`);
            }

            // Update game state
            setSamples(transformedSamples);
            setCurrentSampleIndex(0);
            setCurrentSample(SAMPLE_IDS[0]);

            // Update global store
            useGameStore.setState({
                samples: transformedSamples,
                currentSampleId: SAMPLE_IDS[0],
                isInitialized: true
            });  

            console.log('Game initialized successfully');

        } catch (error) {
            console.error('Game initialization failed:', error);
            setError(error instanceof Error ? error.message : 'Failed to initialize game');
            logEvent(getAnalytics(), 'error', {
                error_message: error instanceof Error ? error.message : 'Unknown error',
                error_type: 'game_initialization_failed',
                userId: user.userId
            });
        } finally {
            monitoringService.endTrace('game_initialization', traceStartTime);
        }
    }, [quarterId, user, navigate, setCurrentSample]);

    // Initialize game on mount
    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

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
            const totalScore = calculateTotalScore();

            // Only submit score if user is a player or admin
            if (user.role && [UserRole.PLAYER, UserRole.ADMIN].includes(user.role)) {
                console.log('Submitting final score:', totalScore);
                await FirebaseService.submitScore(user.userId, quarterId, totalScore);
            }

            logEvent(getAnalytics(), 'game_completed', {
                quarterId,
                userId: user.userId,
                userRole: user.role, // Using UserRole enum
                score: totalScore,
                time_spent: timeSpent
            });

            console.log('Navigating to results page...');
            navigate(`/game/${quarterId}/results`, { replace: true });

        } catch (error) {
            console.error('Game completion failed:', error);
            setError('Failed to complete game. Please try again.');
            logEvent(getAnalytics(), 'error', {
                error_message: error instanceof Error ? error.message : 'Unknown error',
                error_type: 'game_completion_failed',
                userId: user.userId
            });
        } finally {
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
        <div className="container px-4 mx-auto">
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