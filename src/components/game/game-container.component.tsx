import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth.context';
import { quarterService } from '@/services/quarter.service';
import { AnalyticsService } from '@/services/analytics.service';
import { monitoringService } from '@/services/monitoring.service';
import { FirebaseService } from '@/services/firebase.service';
import { WhiskeySample } from '@/services/quarter.service';
import { Spinner } from '@/components/ui/spinner-ui.component';

type SampleId = 'A' | 'B' | 'C' | 'D';

interface Guess {
  age: number;
  proof: number;
  mashbillType: string;
  submitted: boolean;
}

interface GameState {
  currentSample: SampleId;
  guesses: Record<SampleId, Guess>;
  scores: Record<SampleId, number>;
  totalScore: number;
  isComplete: boolean;
}

const INITIAL_GUESS: Guess = {
  age: 0,
  proof: 0,
  mashbillType: '',
  submitted: false
};

const INITIAL_GAME_STATE: GameState = {
  currentSample: 'A',
  guesses: {
    'A': { ...INITIAL_GUESS },
    'B': { ...INITIAL_GUESS },
    'C': { ...INITIAL_GUESS },
    'D': { ...INITIAL_GUESS }
  },
  scores: {
    'A': 0,
    'B': 0,
    'C': 0,
    'D': 0
  },
  totalScore: 0,
  isComplete: false
};

export const GameContainer: React.FC = () => {
  const { quarterId } = useParams<{ quarterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [samples, setSamples] = useState<Record<SampleId, WhiskeySample>>({} as Record<SampleId, WhiskeySample>);

  useEffect(() => {
    const initializeGame = async () => {
      if (!quarterId || !user) {
        navigate('/quarters');
        return;
      }

      try {
        monitoringService.startTrace('game_initialization');

        // Get quarter data
        const quarter = await quarterService.getQuarterById(quarterId);
        if (!quarter) throw new Error('Quarter not found');

        // Initialize analytics
        AnalyticsService.gameStarted({
          quarterId,
          userId: user.uid
        });

        // Set up samples
        const quarterSamples = quarter.samples.reduce((acc, sample, index) => {
          const sampleId = String.fromCharCode(65 + index) as SampleId;
          acc[sampleId] = sample;
          return acc;
        }, {} as Record<SampleId, WhiskeySample>);

        setSamples(quarterSamples);
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
  }, [quarterId, user, navigate]);

  const handleGuessSubmit = async (guess: Partial<Guess>) => {
    if (!quarterId || !user) return;

    const currentSample = samples[gameState.currentSample];
    if (!currentSample) return;

    try {
      monitoringService.startTrace('guess_submission');

      // Validate guess
      const result = await FirebaseService.validateGuess(quarterId, {
        ...guess,
        sampleId: gameState.currentSample
      });

      // Update game state
      setGameState(prev => ({
        ...prev,
        guesses: {
          ...prev.guesses,
          [prev.currentSample]: {
            ...prev.guesses[prev.currentSample],
            ...guess,
            submitted: true
          }
        },
        scores: {
          ...prev.scores,
          [prev.currentSample]: result.points
        },
        totalScore: Object.values(prev.scores).reduce((a, b) => a + b, 0) + result.points
      }));

      // Track guess
      AnalyticsService.sampleGuessed({
        quarterId,
        userId: user.uid,
        sampleId: gameState.currentSample,
        accuracy: result.points
      });

      // Move to next sample if available
      const currentIndex = 'ABCD'.indexOf(gameState.currentSample);
      if (currentIndex < 3) {
        const nextSample = String.fromCharCode(66 + currentIndex) as SampleId;
        setGameState(prev => ({ ...prev, currentSample: nextSample }));
      } else {
        await handleGameComplete();
      }
    } catch (error) {
      console.error('Guess submission failed:', error);
      setError('Failed to submit guess. Please try again.');
      AnalyticsService.trackError('Guess submission failed', 'game_container');
    } finally {
      monitoringService.endTrace('guess_submission');
    }
  };

  const handleGameComplete = async () => {
    if (!quarterId || !user) return;

    try {
      monitoringService.startTrace('game_completion');

      // Submit final score
      await FirebaseService.submitScore(user.uid, quarterId, gameState.totalScore);

      // Track completion
      AnalyticsService.gameCompleted({
        quarterId,
        userId: user.uid,
        score: gameState.totalScore
      });

      setGameState(prev => ({ ...prev, isComplete: true }));
      navigate(`/quarters/${quarterId}/results`);
    } catch (error) {
      console.error('Game completion failed:', error);
      setError('Failed to complete game. Please try again.');
      AnalyticsService.trackError('Game completion failed', 'game_container');
    } finally {
      monitoringService.endTrace('game_completion');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate('/quarters')}
          className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
        >
          Return to Quarter Selection
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Game UI components go here */}
    </div>
  );
};

export default GameContainer;