import React, { useState, useEffect, useCallback } from 'react';
import { GameStateService, GameState, GameEvent } from '@/services/game-state.service';
import { useAuth } from '@/contexts/auth.context';
import { AnalyticsService } from '@/services/analytics.service';
import { cn } from '@/lib/utils';

interface GameProgressTrackerProps {
  quarterId: string;
  totalSamples: number;
  onProgress: (callback: (sampleId: string) => Promise<void>) => void;
}
export const GameProgressTracker: React.FC<GameProgressTrackerProps> = ({
  quarterId,
  totalSamples,
  onProgress
}) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [startTime] = useState<number>(Date.now());
  const gameStateService = new GameStateService();

  useEffect(() => {
    if (!user) return;

    const initializeOrRecoverGameState = async () => {
      try {
        const recoveredSession = await gameStateService.recoverIncompleteSession(user.uid);

        if (recoveredSession) {
          setGameState(recoveredSession);
          AnalyticsService.trackUserEngagement('game_start', {
            quarterId,
            userId: user.uid,
            event: 'resume' as GameEvent
          });
        } else {
          const newGameState = await gameStateService.initializeGameState(user.uid, quarterId);
          setGameState(newGameState);
          AnalyticsService.trackUserEngagement('game_start', {
            quarterId,
            userId: user.uid,
            event: 'start' as GameEvent
          });
        }
      } catch (error) {
        console.error('Failed to initialize game state:', error);
        AnalyticsService.trackError(
          'Game state initialization failed',
          'game_progress_tracker',
          user.uid
        );
      }
    };

    initializeOrRecoverGameState();
    const updateProgress = useCallback(async (completedSampleId: string) => {
      if (!user || !gameState) return;

      try {
        const updatedState = await gameStateService.updateGameState(user.uid, {
          ...gameState,
          completedSamples: [...gameState.completedSamples, completedSampleId],
          progress: (gameState.completedSamples.length + 1) / totalSamples * 100
        });

        setGameState(updatedState);

        // Track sample completion
        AnalyticsService.trackUserEngagement('sample_guessed', {
          quarterId,
          userId: user.uid,
          sampleId: completedSampleId,
          accuracy: ((updatedState.score - gameState.score) / 100) * 100,
          timeSpent: Math.floor((Date.now() - startTime) / 1000)
        });

        // If all samples are completed, track game completion
        if (updatedState.completedSamples.length === totalSamples) {
          AnalyticsService.trackUserEngagement('game_complete', {
            quarterId,
            userId: user.uid,
            score: updatedState.score,
            timeSpent: Math.floor((Date.now() - startTime) / 1000),
            event: 'complete' as GameEvent
          });
        }
      } catch (error) {
        console.error('Failed to update game progress:', error);
        AnalyticsService.trackError(
          'Game progress update failed',
          'game_progress_tracker',
          user.uid
        );
      }
    }, [gameState, user, quarterId, startTime, totalSamples]);

    useEffect(() => {
      if (onProgress) {
        onProgress(updateProgress);
      }
    }, [onProgress, updateProgress]);

  });

  if (!gameState) {
    return (
      <div className="rounded-lg bg-white p-4 shadow animate-pulse">
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="mt-2 flex justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const progress = Math.min(Math.max(gameState.progress, 0), 100);

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full bg-amber-500 transition-all duration-300",
            progress > 0 && `w-${Math.floor(progress / 5) * 5}/100`
          )}
        />
      </div>
      <div className="mt-2 flex justify-between text-sm text-gray-600">
        <span>Completed: {gameState.completedSamples.length}/{totalSamples}</span>
        <span>Score: {gameState.score}</span>
      </div>
    </div>
  );
}