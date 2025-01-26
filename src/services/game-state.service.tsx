import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { AnalyticsService } from 'src/services/analytics.service';
import { DocumentData } from 'firebase/firestore';
import { GameState } from '@/types/game.types';

export class GameStateService {
  private gameStateCollection = collection(db, 'gameStates');

  async initializeGameState(userId: string, quarterId: string): Promise<GameState> {
    const initialState: GameState = {
      userId,
      quarterId,
      currentSample: 'A',
      score: 0,
      totalScore: 0,
      completedSamples: [],
      progress: 0,
      lastUpdated: new Date(),
      isPlaying: false,
      currentChallengeIndex: 0,
      challenges: [],
      samples: [],
      guesses: {
        A: { age: 0, proof: 0, mashbill: '' },
        B: { age: 0, proof: 0, mashbill: '' },
        C: { age: 0, proof: 0, mashbill: '' },
        D: { age: 0, proof: 0, mashbill: '' }
      },
      answers: {},
      timeRemaining: 0,
      lives: 0,
      hints: 0,
      isComplete: false,
      totalChallenges: 0,
      hasSubmitted: false
    };

    try {
      const gameStateRef = doc(this.gameStateCollection, userId);
      await setDoc(gameStateRef, {
        ...initialState,
        lastUpdated: new Date().toISOString() // Ensure proper date serialization
      });

      AnalyticsService.trackError('Game state initialized', 'game_state_service');

      return initialState;
    } catch (error) {
      console.error('Failed to initialize game state', error);
      AnalyticsService.trackError('Failed to initialize game state', 'game_state_service');
      throw error;
    }
  }

  async updateGameState(userId: string, updates: Partial<GameState>): Promise<GameState> {
    try {
      const gameStateRef = doc(this.gameStateCollection, userId);

      // Fetch current state to merge updates
      const currentStateDoc = await getDoc(gameStateRef);
      if (!currentStateDoc.exists()) {
        throw new Error('Game state not found');
      }

      const currentState = this.convertToGameState(currentStateDoc.data());
      const updatedState = {
        ...currentState,
        ...updates,
        lastUpdated: new Date()
      };

      await updateDoc(gameStateRef, {
        ...updatedState,
        lastUpdated: new Date().toISOString() // Ensure proper date serialization
      });

      return updatedState;
    } catch (error) {
      console.error('Failed to update game state', error);
      AnalyticsService.trackError('Failed to update game state', 'game_state_service');
      throw error;
    }
  }

  async getGameState(userId: string): Promise<GameState | null> {
    try {
      const gameStateRef = doc(this.gameStateCollection, userId);
      const gameStateDoc = await getDoc(gameStateRef);

      if (!gameStateDoc.exists()) {
        return null;
      }

      return this.convertToGameState(gameStateDoc.data());
    } catch (error) {
      console.error('Failed to retrieve game state', error);
      AnalyticsService.trackError('Failed to retrieve game state', 'game_state_service');
      return null;
    }
  }

  async getGameEvent(userId: string): Promise<void> {
    try {
      const gameStateRef = doc(this.gameStateCollection, userId);
      await updateDoc(gameStateRef, {
        lastUpdated: new Date().toISOString() // Ensure proper date serialization
      });
    } catch (error) {
      console.error('Failed to update game state', error);
      AnalyticsService.trackError('Failed to update game state', 'game_state_service');
      throw error;
    }
  }

  calculateProgress(state: GameState, totalSamples: number): number {
    if (totalSamples <= 0) return 0;
    return Math.min(Math.round((state.completedSamples.length / totalSamples) * 100), 100);
  }

  async recoverIncompleteSession(userId: string): Promise<GameState | null> {
    try {
      const gameState = await this.getGameState(userId);

      if (!gameState) {
        return null;
      }

      // Check if session is stale (24 hours)
      const staleThreshold = new Date();
      staleThreshold.setHours(staleThreshold.getHours() - 24);

      const lastUpdated = new Date(gameState.lastUpdated);
      if (lastUpdated > staleThreshold) {
        AnalyticsService.trackError('Session recovered', 'game_state_service');
        return gameState;
      }

      return null;
    } catch (error) {
      console.error('Session recovery failed', error);
      AnalyticsService.trackError('Session recovery failed', 'game_state_service');
      return null;
    }
  }

  private convertToGameState(data: DocumentData): GameState {
    return {
      userId: data.userId || '',
      quarterId: data.quarterId || '',
      currentSample: data.currentSample || 'A',
      score: data.score || 0,
      totalScore: data.totalScore || 0,
      completedSamples: data.completedSamples || [],
      progress: data.progress || 0,
      lastUpdated: new Date(data.lastUpdated || new Date()),
      isPlaying: data.isPlaying || false,
      currentChallengeIndex: data.currentChallengeIndex || 0,
      challenges: data.challenges || [],
      samples: data.samples || [],
      guesses: data.guesses || {},
      answers: data.answers || {},
      timeRemaining: data.timeRemaining || 0,
      lives: data.lives || 0,
      hints: data.hints || 0,
      isComplete: data.isComplete || false,
      totalChallenges: data.totalChallenges || 0,
      hasSubmitted: data.hasSubmitted || false
    };
  }
}


export type GameEvent = 'start' | 'resume' | 'complete';
