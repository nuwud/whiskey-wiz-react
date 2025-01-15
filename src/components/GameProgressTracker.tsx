import React, { useState, useEffect } from 'react';
import { GameStateService, GameState } from '../services/GameStateService';
import { useAuth } from '../services/AuthContext';
import { AnalyticsService } from '../services/AnalyticsService';

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
        // Attempt to recover existing session
        const recoveredSession = await gameStateService.recoverIncompleteSession(user.uid);
        
        if (recoveredSession) {
          setGameState(recoveredSession);
        } else {
          // Initialize new game state if no recovery possible
          const newGameState = await gameStateService.initializeGameState(user.uid, quarterId);
          setGameState(newGameState);
        }

        // Track game start
        AnalyticsService.trackGameInteraction('game_started', {
          userId: user.uid,
          quarterId
        });
      } catch (error) {
        console.error('Failed to initialize game state', error);
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
          {...gameState, completedSamples: [...gameState.completedSamples, completedSampleId]}, 
          totalSamples
        )
      });

      setGameState(updatedState);

      // Detailed analytics tracking
      AnalyticsService.trackGameInteraction('sample_completed', {
        userId: user.uid,
        quarterId,
        sampleId: completedSampleId,
        totalProgress: updatedState.progress
      });
    } catch (error) {
      console.error('Failed to update game progress', error);
    }
  };

  if (!gameState) return null;

  return (
    <div className="game-progress-tracker">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${gameState.progress}%` }}
        />
      </div>
      <div className="progress-info">
        <span>Completed Samples: {gameState.completedSamples.length}/{totalSamples}</span>
        <span>Current Score: {gameState.score}</span>
      </div>
    </div>
  );
};