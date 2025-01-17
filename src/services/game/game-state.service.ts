import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { analyticsService } from '@/services/analytics';

export interface GameState {
  userId: string;
  quarterId: string;
  currentSample: string;
  score: number;
  completedSamples: string[];
  progress: number;
  lastUpdated: Date;
}

class GameStateService {
  private static instance: GameStateService;
  private gameStateCollection = collection(db, 'gameStates');

  private constructor() {}

  static getInstance(): GameStateService {
    if (!GameStateService.instance) {
      GameStateService.instance = new GameStateService();
    }
    return GameStateService.instance;
  }

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
      await setDoc(gameStateRef, initialState);

      analyticsService.trackEvent('game_state_initialized', {
        userId,
        quarterId
      });

      return initialState;
    } catch (error) {
      console.error('Failed to initialize game state', error);
      throw error;
    }
  }

  async updateGameState(userId: string, updates: Partial<GameState>): Promise<GameState> {
    try {
      const gameStateRef = doc(this.gameStateCollection, userId);
      
      // Fetch current state to merge updates
      const currentStateDoc = await getDoc(gameStateRef);
      const currentState = currentStateDoc.data() as GameState;

      const updatedState = {
        ...currentState,
        ...updates,
        lastUpdated: new Date()
      };

      await updateDoc(gameStateRef, updatedState);

      analyticsService.trackEvent('game_state_updated', {
        userId,
        updates: Object.keys(updates)
      });

      return updatedState;
    } catch (error) {
      console.error('Failed to update game state', error);
      throw error;
    }
  }

  async getGameState(userId: string): Promise<GameState | null> {
    try {
      const gameStateRef = doc(this.gameStateCollection, userId);
      const gameStateDoc = await getDoc(gameStateRef);

      return gameStateDoc.exists() 
        ? gameStateDoc.data() as GameState 
        : null;
    } catch (error) {
      console.error('Failed to retrieve game state', error);
      return null;
    }
  }

  // Advanced progress tracking
  calculateProgress(state: GameState, totalSamples: number): number {
    return (state.completedSamples.length / totalSamples) * 100;
  }

  // Detect and handle incomplete game sessions
  async recoverIncompleteSession(userId: string): Promise<GameState | null> {
    try {
      const gameState = await this.getGameState(userId);
      
      if (gameState) {
        // Check if session is stale (e.g., more than 24 hours old)
        const staleThreshold = new Date();
        staleThreshold.setHours(staleThreshold.getHours() - 24);

        if (gameState.lastUpdated < staleThreshold) {
          analyticsService.trackEvent('session_recovery', {
            userId,
            quarterId: gameState.quarterId
          });

          return gameState;
        }
      }

      return null;
    } catch (error) {
      console.error('Session recovery failed', error);
      return null;
    }
  }
}

export const gameStateService = GameStateService.getInstance();