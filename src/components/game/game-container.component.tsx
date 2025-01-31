import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';
import { quarterService } from '../../services/quarter.service';
import { AnalyticsService } from '../../services/analytics.service';
import { monitoringService } from '../../services/monitoring.service';
import { FirebaseService } from '../../services/firebase.service';
import { WhiskeySample } from '../../types/game.types';
import { Spinner } from '../../components/ui/spinner-ui.component';
import { GameState, SampleKey } from '../../types/game.types';
import { SampleGuessing } from './sample-guessing.component';

type SampleId = 'A' | 'B' | 'C' | 'D';

const calculateTotalScore = (scores: Record<SampleKey, number>): number => {
  return Object.values(scores).reduce((sum, score) => sum + score, 0);
};

const calculateTimeSpent = (startTime: number): number => {
  return Math.floor((Date.now() - startTime) / 1000);
};

const INITIAL_GAME_STATE: GameState = {
  userId: '',
  quarterId: '',
  isPlaying: true,
  isLoading: false,
  error: null,
  currentSampleId: null,
  currentQuarter: null,
  scoringRules: {
    age: {
      maxPoints: 100,
      pointDeductionPerYear: 10,
      exactMatchBonus: 20
    },
    proof: {
      maxPoints: 100,
      pointDeductionPerProof: 5,
      exactMatchBonus: 20
    },
    mashbill: {
      maxPoints: 100,
      pointDeductionPerType: 5,
      exactMatchBonus: 20
    }
  },
  lastUpdated: new Date(),
  startTime: new Date(),
  endTime: new Date(),
  currentRound: 1,
  totalRounds: 4,
  totalScore: {
    'A': 0, 'B': 0, 'C': 0, 'D': 0
  } as Record<SampleKey, number>,
  completedSamples: [],
  progress: 0,
  hasSubmitted: false,
  currentChallengeIndex: 0,
  totalChallenges: 0,
  challenges: [],
  currentSample: 'A',
  samples: [],
  difficulty: 'beginner',
  mode: 'standard' as const,
  guesses: {
    'A': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0 },
    'B': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0 },
    'C': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0 },
    'D': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0 }
  },
  score: {
    'A': 0, 'B': 0, 'C': 0, 'D': 0
  } as Record<SampleKey, number>,
  scores: {
    'A': 'A',
    'B': 'B',
    'C': 'C',
    'D': 'D'
  },
  answers: {},
  timeRemaining: 0,
  lives: 3,
  hints: 0,
  isComplete: false
};

export interface GuessSubmitEvent {
  sampleId: string;
  guessedValues: {
    age: number;
    proof: number;
    mashbill: {
      corn: number;
      rye: number;
      wheat: number;
      barley: number;
    };
  };
}

export const GameContainer: React.FC = () => {
  const { quarterId } = useParams<{ quarterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [samples, setSamples] = useState<Record<SampleId, WhiskeySample>>({} as Record<SampleId, WhiskeySample>);
  const [startTime] = useState<number>(Date.now());
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const sampleIds: SampleId[] = ['A', 'B', 'C', 'D'];

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

        AnalyticsService.gameStarted({
          quarterId,
          userId: user.uid
        }, {
          difficulty: quarter.difficulty,
          mode: 'standard',
          deviceType: 'web'
        }, {
          quarterId,
          userId: user.uid
        }, {
          difficulty: quarter.difficulty,
          mode: 'standard',
          deviceType: 'web'
        });

        const quarterSamples = quarter.samples.reduce((acc, sample, index) => {
          const sampleId = String.fromCharCode(65 + index) as SampleId;
          acc[sampleId] = sample;
          return acc;
        }, {} as Record<SampleId, WhiskeySample>);

        setSamples(quarterSamples);
        setLoading(false);
      } catch (error) {
        console.error('Analytics setup failed:', error);
        setError('Failed to initialize analytics. Please try again.');
        AnalyticsService.trackError('Analytics setup failed', 'game_container');
      } finally {
        monitoringService.endTrace('game_initialization');
      }
    };

    initializeGame();
  }, [quarterId, user, navigate]);

  const handleNextSample = () => {
    if (currentSampleIndex < sampleIds.length - 1) {
      setCurrentSampleIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        setGameState(prev => ({
          ...prev,
          currentSample: sampleIds[nextIndex] as SampleKey
        }));
        return nextIndex;
      });
    }
  };

  const handlePreviousSample = () => {
    if (currentSampleIndex > 0) {
      setCurrentSampleIndex(prevIndex => {
        const nextIndex = prevIndex - 1;
        setGameState(prev => ({
          ...prev,
          currentSample: sampleIds[nextIndex] as SampleKey
        }));
        return nextIndex;
      });
    }
  };

  const handleGameComplete = async () => {
    const timeSpent = calculateTimeSpent(startTime);
    if (!quarterId || !user) return;

    try {
      monitoringService.startTrace('game_completion');

      AnalyticsService.trackGuess({
        quarterId,
        userId: user.uid,
        sampleId: ('sampleId'),
        accuracy: 100,
        timeSpent: Math.floor((Date.now() - startTime) / 1000)
      });

      await FirebaseService.submitScore(user.uid, quarterId, calculateTotalScore(gameState.totalScore));

      AnalyticsService.gameCompleted({
        quarterId: gameState.quarterId,
        userId: user.uid,
        score: calculateTotalScore(gameState.totalScore),
        time_spent: timeSpent
      });

      setGameState(prev => ({
        ...prev,
        guesses: {
          ...prev.guesses,
          'A': { ...prev.guesses['A'], submitted: true },
          'B': { ...prev.guesses['B'], submitted: true },
          'C': { ...prev.guesses['C'], submitted: true },
          'D': { ...prev.guesses['D'], submitted: true }
        },
        isComplete: true
      }));
      navigate(`/quarters/${quarterId}/results`);
    } catch (error) {
      console.error('Game completion failed:', error);
      setError('Failed to complete game. Please try again.');
      AnalyticsService.trackError('Game completion failed', 'game_container');
    } finally {
      monitoringService.endTrace('game_completion');
    }
  };

  const isGameComplete = () => {
    return Object.keys(samples).length > 0 &&
      Object.keys(samples).every(sampleId =>
        gameState.guesses[sampleId as SampleId] !== undefined
      );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
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
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-4 text-2xl font-bold">Game of Whiskey Blind Tasting</h1>

      <div className="flex flex-wrap gap-4">
        {Object.entries(samples).map(([sampleId, sample]) => (
          <div key={sampleId} className="flex-shrink-0">
            <div className="w-48 h-48 bg-white rounded-lg shadow-md">
              <img
                className="object-cover w-full h-full"
                src={sample.image}
                alt={sample.name}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <SampleGuessing
          currentSample={sampleIds[currentSampleIndex]}
          onNextSample={handleNextSample}
          onPreviousSample={handlePreviousSample}
          isLastSample={currentSampleIndex === sampleIds.length - 1}
        />
      </div>

      {isGameComplete() && !gameState.isComplete && (
        <button
          onClick={handleGameComplete}
          className="px-6 py-2 mt-4 text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600"
        >
          Complete Game
        </button>
      )}
    </div>
  );
};

export const validateMashbill = (mashbill: GuessSubmitEvent['guessedValues']['mashbill']): boolean => {
  const total = Object.values(mashbill).reduce((sum, value) => sum + value, 0);
  return total === 100;
};