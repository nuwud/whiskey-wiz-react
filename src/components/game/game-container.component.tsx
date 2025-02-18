import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';
import { AnalyticsService } from '../../services/analytics.service';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { FirebaseService } from '../../services/firebase.service';
import { Spinner } from '../../components/ui/spinner-ui.component';
import { useGameStore } from '../../store/game.store';
import { GameState, SampleGuess, SampleId, SampleKey, WhiskeySample, INITIAL_STATE, DEFAULT_SCORING_RULES, Difficulty } from '../../types/game.types';
import { SampleGuessing, createInitialGuesses } from './sample-guessing.component';
import { useGameProgression } from '../../store/game-progression.store';
import { ScoreService } from '../../services/score.service';
import { saveGameState } from '../../utils/storage.utils';
import { useToast } from '../../hooks/use-toast.hook';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const SAMPLE_IDS: SampleId[] = ['A', 'B', 'C', 'D'];

export const GameContainer: React.FC = () => {
    const { quarterId } = useParams<{ quarterId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { samples, setSamples } = useGameStore();
    const { toast } = useToast();
    const [isStateInitialized, setIsStateInitialized] = useState(false);

    const calculateTimeSpent = (startTime: number): number => {
        return Math.floor((Date.now() - startTime) / 1000);
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

    // DIRECT FIRESTORE ACCESS - Bypasses all service layers
    const loadQuarterDirectly = async (quarterId: string) => {
        try {
            console.log("🚀 Loading quarter directly:", quarterId);
            
            // Get quarter document
            const quarterDoc = await getDoc(doc(db, 'quarters', quarterId));
            if (!quarterDoc.exists()) {
                throw new Error(`Quarter ${quarterId} not found`);
            }
            
            const quarterData = quarterDoc.data();
            
            // Get samples subcollection - THIS MATCHES YOUR FIRESTORE STRUCTURE
            const samplesSnapshot = await getDocs(collection(db, `quarters/${quarterId}/samples`));
            
            if (samplesSnapshot.empty) {
                throw new Error(`No samples found for quarter ${quarterId}`);
            }
            
            // Process samples
            let samples: Record<SampleId, WhiskeySample> = {};
            samplesSnapshot.docs.forEach(doc => {
                const sampleId = doc.id as SampleId; // A, B, C, D
                const sampleData = doc.data();
                samples[sampleId] = {
                    ...sampleData,
                    id: sampleId,
                    // Ensure required fields
                    age: sampleData.age || 0,
                    proof: sampleData.proof || 0,
                    mashbill: sampleData.mashbill || 'Bourbon',
                    rating: sampleData.rating || 0,
                    hints: sampleData.hints || [],
                    notes: sampleData.notes || [],
                    challengeQuestions: sampleData.challengeQuestions || [],
                    image: sampleData.image || '',
                    availability: sampleData.availability || '',
                    imageUrl: sampleData.imageUrl || '',
                    score: 0
                } as WhiskeySample;
            });
            
            // If any sample is missing, add fallback data
            SAMPLE_IDS.forEach(id => {
                if (!samples[id] || !samples[id].age || !samples[id].proof) {
                    console.log(`Adding fallback data for sample ${id}`);
                    samples[id] = getFallbackSample(id);
                }
            });
            
            console.log("Successfully loaded samples:", samples);
            
            // Set state
            setSamples(samples);
            useGameStore.setState({
                ...INITIAL_STATE,
                samples,
                isInitialized: true
            });
            
            setGameState({
                ...INITIAL_STATE,
                samples,
                scoringRules: quarterData.scoringRules || DEFAULT_SCORING_RULES,
                isInitialized: true,
                currentSampleId: 'A',
                userId: user?.userId || 'guest',
                quarterId,
                isLoading: false,
                isPlaying: true,
                currentSample: 'A',
            });
            
            setIsStateInitialized(true);
            
            return true;
        } catch (error) {
            console.error("Direct quarter loading failed:", error);
            return false;
        }
    };
    
    const getFallbackSample = (id: SampleId): WhiskeySample => {
        const fallbacks = {
            'A': { id: 'A', name: 'Sample A', age: 4, proof: 100, mashbill: 'Single Malt', rating: 0, distillery: 'Andalusia Whiskey Co.', description: 'A triple-distilled American single malt', region: 'Texas', type: 'single malt' },
            'B': { id: 'B', name: 'Sample B', age: 7, proof: 108, mashbill: 'Bourbon', rating: 0, distillery: 'Dark Arts Whiskey House', description: 'A bourbon finished with French oak staves', region: 'Kentucky', type: 'bourbon' },
            'C': { id: 'C', name: 'Sample C', age: 6, proof: 115, mashbill: 'Rye', rating: 0, distillery: 'Taconic Distillery', description: 'A cask strength rye whiskey', region: 'New York', type: 'rye' },
            'D': { id: 'D', name: 'Sample D', age: 5, proof: 97, mashbill: 'Bourbon', rating: 0, distillery: 'Wilderness Trail Distillery', description: 'A high-rye bourbon aged in char #4 barrels', region: 'Kentucky', type: 'bourbon' }
        };
        
        return {
            ...fallbacks[id],
            hints: [],
            notes: [],
            challengeQuestions: [],
            image: '',
            availability: '',
            imageUrl: '',
            score: 0,
            price: 0,
            difficulty: 'beginner'
        } as WhiskeySample;
    };
    
    // Add guess handling
    const handleGuessSubmit = (sampleId: SampleId, guess: SampleGuess) => {
        console.log('Processing guess for sample:', sampleId, guess);
        const sample = samples[sampleId];
        
        if (!sample || Number(sample.age) <= 0 || Number(sample.proof) <= 0) {
            console.error('Invalid sample data:', sample);
            toast({
                title: "Using fallback sample data",
                description: "We're using default values for this sample.",
                type: "warning"
            });
            
            // Use fallback sample
            const fallbackSample = getFallbackSample(sampleId);
            setSamples(prev => ({
                ...prev,
                [sampleId]: fallbackSample
            }));
            
            const cleanGuess = {
                ...guess,
                age: Number(guess.age),
                proof: Number(guess.proof)
            };

            const scoreResult = ScoreService.calculateScore(cleanGuess, fallbackSample);
            
            setGuesses(prevGuesses => ({
                ...prevGuesses,
                [sampleId]: {
                    ...guess,
                    score: scoreResult.totalScore,
                    breakdown: scoreResult.breakdown,
                    explanations: scoreResult.explanations
                }
            }));
            
            return;
        }
        
        // Normal scoring
        const cleanGuess = {
            ...guess,
            age: Number(guess.age),
            proof: Number(guess.proof)
        };

        const scoreResult = ScoreService.calculateScore(cleanGuess, sample);
        console.log('Score calculated:', scoreResult);

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

    // Main initialization effect
    useEffect(() => {
        if (!quarterId) return;
        
        let mounted = true;
        let timer: ReturnType<typeof setTimeout>;
        
        const init = async () => {
            setLoading(true);
            setError(null);
            
            // Set timeout for emergency measures
            timer = setTimeout(() => {
                if (mounted && loading) {
                    console.warn("⚠️ Loading timeout reached - using fallback data");
                    const fallbackSamples = SAMPLE_IDS.reduce((acc, id) => {
                        acc[id] = getFallbackSample(id);
                        return acc;
                    }, {} as Record<SampleId, WhiskeySample>);
                    
                    setSamples(fallbackSamples);
                    setGameState({
                        ...INITIAL_STATE,
                        samples: fallbackSamples,
                        isInitialized: true,
                        currentSampleId: 'A',
                        userId: user?.userId || 'guest',
                        quarterId: quarterId || '',
                        isLoading: false,
                        isPlaying: true,
                        currentSample: 'A',
                    });
                    setIsStateInitialized(true);
                    setLoading(false);
                }
            }, 3000);
            
            try {
                // Direct Firestore access - most reliable method
                const success = await loadQuarterDirectly(quarterId);
                
                if (!success && mounted) {
                    throw new Error("Failed to load quarter data");
                }
            } catch (error) {
                console.error('Game initialization failed:', error);
                if (mounted) {
                    setError('Failed to load game. Using fallback data.');
                    
                    // Use fallback data
                    const fallbackSamples = SAMPLE_IDS.reduce((acc, id) => {
                        acc[id] = getFallbackSample(id);
                        return acc;
                    }, {} as Record<SampleId, WhiskeySample>);
                    
                    setSamples(fallbackSamples);
                    setGameState({
                        ...INITIAL_STATE,
                        samples: fallbackSamples,
                        isInitialized: true,
                        currentSampleId: 'A',
                        userId: user?.userId || 'guest',
                        quarterId: quarterId || '',
                        isLoading: false,
                        isPlaying: true,
                        currentSample: 'A',
                    });
                    setIsStateInitialized(true);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                    if (timer) clearTimeout(timer);
                }
            }
        };
        
        init();
        
        return () => {
            mounted = false;
            if (timer) clearTimeout(timer);
        };
    }, [quarterId, user]);

    const handleNextSample = () => {
        setCurrentSampleIndex(prevIndex => {
            const newIndex = Math.min(SAMPLE_IDS.length - 1, prevIndex + 1);
            setCurrentSample(SAMPLE_IDS[newIndex]);
            return newIndex;
        });
    };

    const handlePreviousSample = () => {
        setCurrentSampleIndex(prevIndex => {
            const newIndex = Math.max(0, prevIndex - 1);
            setCurrentSample(SAMPLE_IDS[newIndex]);
            return newIndex;
        });
    };

    const handleGameComplete = () => {
        try {
            console.log('Starting game completion process...');
            setLoading(true);

            const timeSpent = calculateTimeSpent(startTime);
            const finalScore = calculateTotalScore();

            // Save score locally for guests
            localStorage.setItem('guestScore', JSON.stringify({
                quarterId,
                score: finalScore,
                timestamp: Date.now(),
                guesses: guesses
            }));

            // Try to save if user is logged in
            if (user && !user.guest) {
                FirebaseService.submitScore(user.userId, quarterId || '', finalScore)
                    .catch(err => console.error("Failed to submit score:", err));
            }

            // Track completion
            try {
                logEvent(getAnalytics(), 'game_completed', {
                    quarterId,
                    score: finalScore,
                    time_spent: timeSpent
                });
            } catch (e) {
                console.error("Analytics error:", e);
            }

            console.log('Navigating to results page...');
            navigate(`/game/${quarterId}/results`);
        } catch (error) {
            console.error('Game completion failed:', error);
            toast({
                title: "Game Complete",
                description: "Your results are ready!",
                type: "success"
            });
            navigate(`/game/${quarterId}/results`);
        } finally {
            setLoading(false);
        }
    };

    // RENDER LOGIC
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Spinner />
                    <p className="mt-4">Loading game data...</p>
                </div>
            </div>
        );
    }

    if (!isStateInitialized || !gameState) {
        // If not initialized after loading is complete, use fallbacks
        const fallbackSamples = SAMPLE_IDS.reduce((acc, id) => {
            acc[id] = getFallbackSample(id);
            return acc;
        }, {} as Record<SampleId, WhiskeySample>);
        
        setSamples(fallbackSamples);
        setGameState({
            ...INITIAL_STATE,
            samples: fallbackSamples,
            isInitialized: true,
            currentSampleId: 'A',
            isPlaying: true
        });
        setIsStateInitialized(true);
        
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner />
            </div>
        );
    }

    if (!samples || Object.keys(samples).length < 4) {
        // Emergency fallback if samples are still missing
        const fallbackSamples = SAMPLE_IDS.reduce((acc, id) => {
            acc[id] = getFallbackSample(id);
            return acc;
        }, {} as Record<SampleId, WhiskeySample>);
        
        setSamples(fallbackSamples);
        
        return (
            <div className="container mx-auto px-4">
                <div className="container px-4 py-8 mx-auto">
                    <h1 className="mb-8 text-2xl font-bold">Game of Whiskey Blind Tasting</h1>
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
    }

    return (
        <div className="container mx-auto px-4">
            <div className="container px-4 py-8 mx-auto">
                <h1 className="mb-8 text-2xl font-bold">Game of Whiskey Blind Tasting</h1>
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