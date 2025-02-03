import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';
import { quarterService } from '../../services/quarter.service';
import { AnalyticsService } from '../../services/analytics.service';
import { monitoringService } from '../../services/monitoring.service';
import { FirebaseService } from '../../services/firebase.service';
import { Spinner } from '../../components/ui/spinner-ui.component';
import { SampleKey, SampleGuess, WhiskeySample, SampleId } from '../../types/game.types';
import { SampleGuessing, createInitialGuesses } from './sample-guessing.component';
import { useGameProgression } from '../../store/game-progression.store';

const calculateTimeSpent = (startTime: number): number => {
  return Math.floor((Date.now() - startTime) / 1000);
};

const SAMPLE_IDS: SampleId[] = ['A', 'B', 'C', 'D'];

export const GameContainer: React.FC = () => {
  const { quarterId } = useParams<{ quarterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Local UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [startTime] = useState<number>(Date.now());
  
  // Game state
  const [samples, setSamples] = useState<Record<SampleId, WhiskeySample>>({} as Record<SampleId, WhiskeySample>);
  const [guesses, setGuesses] = useState<Record<SampleKey, SampleGuess>>(createInitialGuesses());
  
  // Global game progression state
  const gameProgression = useGameProgression();
  const { setCurrentSample } = gameProgression;

  // Add guess handling
  const handleGuessSubmit = (sampleId: SampleId, guess: SampleGuess) => {
    setGuesses(prevGuesses => ({
      ...prevGuesses,
      [sampleId]: guess
    }));
  };

  // Add total score calculation
  const calculateTotalScore = useCallback(() => {
    return Object.values(guesses).reduce((total, guess) => total + (guess.score || 0), 0);
  }, [guesses]);

  const isGameComplete = useCallback(() => {
    return Object.keys(samples).length > 0 &&
      SAMPLE_IDS.every(id => guesses[id]?.submitted);
  }, [samples, guesses]);

  // Update effect to handle game completion
  useEffect(() => {
    if (isGameComplete()) {
      handleGameComplete();
    }
  }, [guesses, isGameComplete]);

  // Initialize game on component mount
  useEffect(() => {
    const initializeGame = async () => {
      if (!quarterId || !user) {
        navigate('/quarters');
        return;
      }

      try {
        monitoringService.startTrace('game_initialization');
        const quarter = await quarterService.getQuarterById(quarterId);
        if (!quarter) throw new Error('Quarter not found');

        // Track game start
        AnalyticsService.gameStarted(
          { quarterId, userId: user.uid },
          { difficulty: quarter.difficulty, mode: 'standard', deviceType: 'web' },
          { quarterId, userId: user.uid },
          { difficulty: quarter.difficulty, mode: 'standard', deviceType: 'web' }
        );

        // Transform quarter samples into a record by sample ID
        const quarterSamples = quarter.samples.reduce((acc, sample, index) => {
          const sampleId = SAMPLE_IDS[index];
          acc[sampleId] = sample;
          return acc;
        }, {} as Record<SampleId, WhiskeySample>);

        // Initialize all state
        setSamples(quarterSamples);
        setCurrentSample(SAMPLE_IDS[0]);
        setCurrentSampleIndex(0);
        
        setLoading(false);
      } catch (error) {
        console.error('Game initialization failed:', error);
        setError('Failed to initialize game. Please try again.');
        AnalyticsService.trackError('Game initialization failed', 'game_container');
      } finally {
        monitoringService.endTrace('game_initialization');
      }
    };

    initializeGame();
  }, [quarterId, user, navigate, setCurrentSample]);

  const handleNextSample = () => {
    if (currentSampleIndex < SAMPLE_IDS.length - 1) {
      setCurrentSampleIndex(prev => prev + 1);
    }
  };
  
  const handlePreviousSample = () => {
    if (currentSampleIndex > 0) {
      setCurrentSampleIndex(prev => prev - 1);
    }
  };

  const handleGameComplete = async () => {
    const TRACE_NAME = 'game_completion';
    
    if (!quarterId || !user) return;
    
    try {
      setLoading(true);
      console.log('Starting game completion process...');
      monitoringService.startTrace(TRACE_NAME);
      const timeSpent = calculateTimeSpent(startTime);
      const totalScore = calculateTotalScore();
  
      console.log('Submitting final score:', totalScore);
      await FirebaseService.submitScore(
        user.uid, 
        quarterId, 
        totalScore
      );
  
      // Track completion analytics
      AnalyticsService.gameCompleted({
        quarterId,
        userId: user.uid,
        score: totalScore,
        time_spent: timeSpent
      });
  
      console.log('Navigating to results page...');
      // Fix the navigation path
      navigate(`/game/${quarterId}/results`, { replace: true });
      
    } catch (error) {
      console.error('Game completion failed:', error);
      setError('Failed to complete game. Please try again.');
      AnalyticsService.trackError('Game completion failed', 'game_container');
    } finally {
      setLoading(false);
      monitoringService.clearTrace(TRACE_NAME); // Use clear instead of end if trace might not exist
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