import React, { useState, useEffect } from 'react';
import { GameStateService, GameState } from '@/services/game-state.service';
import { useAuth } from '@/contexts/auth.context';
import { analyticsService } from '@/services/analytics.service';

interface GameProgressTrackerProps {
  quarterId: string;
  totalSamples: number;
}

export const GameProgressTracker: React.FC<GameProgressTrackerProps> = ({
  quarterId,
  totalSamples
}) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameStateService = new GameStateService();

  useEffect(() => {
    if (!user) return;

    const initializeOrRecoverGameState = async () => {
      try {
        const recoveredSession = await gameStateService.recoverIncompleteSession(user.uid);

        if (recoveredSession) {
          setGameState(recoveredSession);
        } else {
          const newGameState = await gameStateService.initializeGameState(user.uid, quarterId);
          setGameState(newGameState);
        }

        analyticsService.gameStarted(quarterId);
      } catch (error) {
        console.error('Failed to initialize game state', error);
        analyticsService.trackError('Game state initialization failed', 'game_progress_tracker');
      }
    };

    initializeOrRecoverGameState();
  }, [user, quarterId]);

  const updateProgress = async (completedSampleId: string) => {
    if (!user || !gameState) return;

    try {
      const updatedState = await gameStateService.updateGameState(user.uid, {
        completedSamples: [...gameState.completedSamples, completedSampleId],
        progress: gameStateService.calculateProgress(
          { ...gameState, completedSamples: [...gameState.completedSamples, completedSampleId] },
          totalSamples
        )
      });

      setGameState(updatedState);
      analyticsService.gameCompleted(quarterId, updatedState.score);
    } catch (error) {
      console.error('Failed to update game progress', error);
      analyticsService.trackError('Game progress update failed', 'game_progress_tracker');
    }
  };

  if (!gameState) return null;

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${gameState.progress}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-sm text-gray-600">
        <span>Completed: {gameState.completedSamples.length}/{totalSamples}</span>
        <span>Score: {gameState.score}</span>
      </div>
    </div>
  );
};