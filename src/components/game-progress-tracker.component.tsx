import React, { useState, useEffect, useCallback } from 'react';
import { GameStateService } from '../services/game-state.service';
import { GameState, SampleKey, GameEvent } from '../types/game.types';
import { useAuth } from '../contexts/auth.context';
import { AnalyticsService } from '../services/analytics.service';
import { cn } from '../lib/utils';

interface GameProgressTrackerProps {
  userId: string;
  quarterId: string;
  gameState: GameState;
  totalSamples: number;
  onProgress: (callback: (sampleId: string) => Promise<void>) => void;
}
export const GameProgressTracker: React.FC<GameProgressTrackerProps> = ({
  userId,
  quarterId,
  totalSamples,
  onProgress
}) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [startTime] = useState<number>(Date.now());
  const gameStateService = new GameStateService();
  const calculateTotalScore = (scores: Record<SampleKey, number>): number => {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  };

  useEffect(() => {
    if ( !user || !quarterId || !gameState ) return;

    const initializeOrRecoverGameState = async () => {
      try {
        const recoveredSession = await gameStateService.recoverIncompleteSession(user.userId);

        if (recoveredSession) {
          setGameState(recoveredSession);
          AnalyticsService.trackUserEngagement('game_start', {
            userId,
            quarterId,
            progress: gameState.progress,
            timestamp: new Date().toISOString(),
            event: 'resume' as GameEvent
          });
        } else {
          const newGameState = await gameStateService.initializeGameState(user.userId, quarterId);
          setGameState(newGameState);
          AnalyticsService.trackUserEngagement('game_start', {
            quarterId,
            userId: user.userId,
            event: 'start' as GameEvent
          });
        }
      } catch (error) {
        console.error('Failed to initialize game state:', error);
        AnalyticsService.trackEvent('Failed to track game progress', {
          component: 'GameProgressTracker',
          userId: user.userId
        });
      }
    };

    initializeOrRecoverGameState();
    const updateProgress = useCallback(async (completedSampleId: string) => {
      if (!user || !gameState) return;

      try {
        const updatedState = await gameStateService.updateGameState(user.userId, {
          ...gameState,
          completedSamples: [...gameState.completedSamples, completedSampleId],
          progress: (gameState.completedSamples.length + 1) / totalSamples * 100
        });

        setGameState(updatedState);

        // Track sample completion
        AnalyticsService.trackUserEngagement('sample_guessed', {
          quarterId,
          userId: user.userId,
          sampleId: completedSampleId,
          accuracy: calculateTotalScore(updatedState.score) - calculateTotalScore(gameState.score),
          timeSpent: Math.floor((Date.now() - startTime) / 1000)
        });

        // If all samples are completed, track game completion
        if (updatedState.completedSamples.length === totalSamples) {
          AnalyticsService.trackUserEngagement('game_complete', {
            quarterId,
            userId: user.userId,
            score: updatedState.score,
            timeSpent: Math.floor((Date.now() - startTime) / 1000),
            event: 'complete' as GameEvent
          });
        }
      } catch (error) {
        console.error('Failed to update game progress:', error);
        AnalyticsService.trackEvent('Game progress update failed', {
          component: 'game_progress_tracker',
          userId: user.userId
        });
      }
    }, [userId, quarterId, gameState, startTime, totalSamples]);

    useEffect(() => {
      if (onProgress) {
        onProgress(updateProgress);
      }
    }, [onProgress, updateProgress]);

  });

  if (!gameState) {
    return (
      <div className="p-4 bg-white rounded-lg shadow animate-pulse">
        <div className="w-full h-2 bg-gray-200 rounded" />
        <div className="flex justify-between mt-2">
          <div className="w-24 h-4 bg-gray-200 rounded" />
          <div className="w-24 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const progress = Math.min(Math.max(gameState.progress, 0), 100);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
        <div
          className={cn(
            "h-full bg-amber-500 transition-all duration-300",
            progress > 0 && `w-${Math.floor(progress / 5) * 5}/100`
          )}
        />
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <span>Completed: {gameState.completedSamples.length}/{totalSamples}</span>
        <span>Score: {calculateTotalScore(gameState.score)}</span>
      </div>
    </div>
  );
}

export default GameProgressTracker;
