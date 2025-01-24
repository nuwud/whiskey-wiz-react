import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { analyticsService } from './analytics.service';
import { DocumentData } from 'firebase/firestore';

export interface GameState {
  userId: string;
  quarterId: string;
  currentSample: string;
  score: number;
  completedSamples: string[];
  progress: number;
  lastUpdated: Date;
}

export class GameStateService {
  private gameStateCollection = collection(db, 'gameStates');

  async initializeGameState(userId: string, quarterId: string): Promise<GameState> {
    const initialState: GameState = {
      userId,
      quarterId,
      currentSample: '',
      score: 0,
      completedSamples: [],
      progress: 0,
      lastUpdated: new Date()
    };

    try {
      const gameStateRef = doc(this.gameStateCollection, userId);
      await setDoc(gameStateRef, {
        ...initialState,
        lastUpdated: new Date().toISOString() // Ensure proper date serialization
      });

      analyticsService.trackError('Game state initialized', 'game_state_service');

      return initialState;
    } catch (error) {
      console.error('Failed to initialize game state', error);
      analyticsService.trackError('Failed to initialize game state', 'game_state_service');
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
      analyticsService.trackError('Failed to update game state', 'game_state_service');
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
      analyticsService.trackError('Failed to retrieve game state', 'game_state_service');
      return null;
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
        analyticsService.trackError('Session recovered', 'game_state_service');
        return gameState;
      }

      return null;
    } catch (error) {
      console.error('Session recovery failed', error);
      analyticsService.trackError('Session recovery failed', 'game_state_service');
      return null;
    }
  }

  private convertToGameState(data: DocumentData): GameState {
    return {
      userId: data.userId,
      quarterId: data.quarterId,
      currentSample: data.currentSample,
      score: data.score,
      completedSamples: data.completedSamples,
      progress: data.progress,
      lastUpdated: new Date(data.lastUpdated)
    };
  }
}