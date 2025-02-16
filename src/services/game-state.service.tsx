import { db } from '../config/firebase';
import { doc, addDoc, getDoc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { AnalyticsService } from '../services/analytics.service';
import { DocumentData } from 'firebase/firestore';
import { GameState, SampleKey, DEFAULT_SCORING_RULES, WhiskeySample  } from '../types/game.types';
import { StateRecoveryService } from './state-recovery.service';
import { serverTimestamp as firestoreTimestamp } from 'firebase/firestore';
import { quarterService } from '../services/quarter';

const CHECKPOINT_COLLECTION = 'gameState_checkpoints';



export class GameStateService {
  private gameStateCollection = collection(db, 'gameStates');
  private static instance: GameStateService;
  private _totalScore: number = 0;
  private _timeSpent: number = 0;

  // Singleton pattern
  public static getInstance(): GameStateService {
    if (!GameStateService.instance) {
      GameStateService.instance = new GameStateService();
    }
    return GameStateService.instance;
  }

  async initializeGameState(uid: string, quarterId: string): Promise<GameState> {
    try {
        // Get quarter data first
        const quarter = await quarterService.getQuarterById(quarterId);
        
        if (!quarter) {
            throw new Error('Quarter not found');
        }
  
        if (!quarter.samples || quarter.samples.length === 0) {
            throw new Error('No samples found in quarter');
        }
  
        // Create initial state
        const initialState: GameState = {
            userId: uid,
            quarterId,
            isInitialized: true,
            currentSample: 'A',
            score: {
                'A': 0, 'B': 0, 'C': 0, 'D': 0
            } as Record<SampleKey, number>,
            scores: {
                A: 'A',
                B: 'B',
                C: 'C',
                D: 'D'
            },
            totalScore: 0,
            completedSamples: [],
            progress: 0,
            lastUpdated: new Date(),
            isPlaying: true,
            currentChallengeIndex: 0,
            challenges: quarter.challenges || [],
            samples: quarter.samples.reduce((acc: Record<SampleKey, WhiskeySample>, sample: WhiskeySample, index: number) => {
                const sampleId = String.fromCharCode(65 + index) as SampleKey; // A, B, C, D
                acc[sampleId] = {
                    ...sample,
                    id: sampleId
                } as WhiskeySample;
                return acc;
            }, {
                A: { id: 'A', name: '', age: 0, proof: 0, mashbill: 'Bourbon' as const, rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, availability: 'in stock', difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' } as WhiskeySample,
                B: { id: 'B', name: '', age: 0, proof: 0, mashbill: 'Bourbon' as const, rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, availability: 'in stock', difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' } as WhiskeySample,
                C: { id: 'C', name: '', age: 0, proof: 0, mashbill: 'Bourbon' as const, rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, availability: 'in stock', difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' } as WhiskeySample,
                D: { id: 'D', name: '', age: 0, proof: 0, mashbill: 'Bourbon' as const, rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, availability: 'in stock', difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' } as WhiskeySample
            }),
            guesses: {
                A: { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
                B: { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
                C: { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
                D: { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false }
            },
            answers: {},
            timeRemaining: 300,
            lives: 3,
            hints: 3,
            isComplete: false,
            totalChallenges: quarter.challenges?.length || 0,
            hasSubmitted: false,
            startTime: new Date(),
            endTime: new Date(),
            currentRound: 1,
            totalRounds: 4,
            mode: 'standard',
            difficulty: quarter.difficulty || 'beginner',
            isLoading: false,
            error: null,
            currentSampleId: 'A',
            currentQuarter: quarter,
            scoringRules: quarter.scoringRules || { ...DEFAULT_SCORING_RULES }
        };
  
        // Save to Firestore
        const gameStateRef = doc(this.gameStateCollection, uid);
        await setDoc(gameStateRef, {
            ...initialState,
            startTime: serverTimestamp(),
            lastUpdated: serverTimestamp()
        });
  
        return initialState;
    } catch (error) {
        console.error('Failed to initialize game state', error);
        throw error;
    }
  }

  // Score tracking methods
  public async submitScore(uid: string, quarterId: string, score: number): Promise<void> {
    try {
      const scoresRef = collection(db, 'scores');
      const finalScore = score || this._totalScore; // Use passed score or tracked total
      
      // Create the score document
      await addDoc(scoresRef, {
        userId: uid,
        quarterId,
        score: finalScore,
        timeSpent: this._timeSpent,
        timestamp: new Date(),
        metadata: {
          completedAt: new Date(),
          sessionDuration: this._timeSpent,
          finalScore: finalScore
        }
      });

      // Track analytics
      AnalyticsService.trackEvent('score_submitted', {
        userId: uid,
        quarterId,
        score: finalScore,
        timeSpent: this._timeSpent,
        timestamp: new Date().toISOString()
      });

      // Reset tracking after submission
      this.resetTracking();

    } catch (error) {
      console.error('Score submission failed:', error);
      AnalyticsService.trackEvent('score_submission', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: uid
      });
      throw error;
    }
  }

  // Add reset method
  private resetTracking(): void {
    this._totalScore = 0;
    this._timeSpent = 0;
  }

  // Time tracking methods
  public startTracking(): void {
    this._timeSpent = 0;
    this._totalScore = 0;
  }

  public updateTimeSpent(timeSpent: number): void {
    this._timeSpent = timeSpent;
  }

  public updateTotalScore(score: number): void {
    this._totalScore = score;
  }

  // Getters for external access
  public get totalScore(): number {
    return this._totalScore;
  }

  public get timeSpent(): number {
    return this._timeSpent;
  }

  // Game related methods
  async getQuarterData(quarterId: string) {
    try {
      const quarterRef = doc(db, 'quarters', quarterId);
      const quarterSnap = await getDoc(quarterRef);
      return quarterSnap.exists() ? quarterSnap.data() : null;
    } catch (error) {
      console.error('Error fetching quarter data:', error);
      throw error;
    }
  }

  async updateGameState(uid: string, updates: Partial<GameState>): Promise<GameState> {
    try {
      const gameStateRef = doc(this.gameStateCollection, uid);

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
      AnalyticsService.trackEvent('Failed to update game state', { service: 'game_state_service' });
      throw error;
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
      AnalyticsService.trackEvent('Failed to update game state', { service: 'game_state_service' });
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
      if (!gameState) return null;
      const staleThreshold = new Date();
      staleThreshold.setHours(staleThreshold.getHours() - 24);
      if (new Date(gameState.lastUpdated) > staleThreshold) {
        AnalyticsService.trackEvent('Session recovered', { service: 'game_state_service' });
        return gameState;
      }
      return null;
    } catch (error) {
      console.error('Session recovery failed', error);
      AnalyticsService.trackEvent('Session recovery failed', { service: 'game_state_service' });
      return null;
    }
  }

  async saveCheckpoint(userId: string, quarterId: string, checkpointName: string, state: any): Promise<void> {
    try {
      const checkpointRef = doc(db, CHECKPOINT_COLLECTION, `${userId}_${checkpointName}`);
      await setDoc(checkpointRef, {
        userId,
        quarterId,
        checkpointName,
        state,
        timestamp: new Date(),
        version: 1,
      });
    } catch (error) {
      console.error('Failed to save checkpoint:', error);
    }
  }

  async loadCheckpoint(
    userId: string,
    checkpointName: string
  ): Promise<any | null> {
    try {
      const checkpointRef = doc(db, CHECKPOINT_COLLECTION, `${userId}_${checkpointName}`);
      const docSnap = await getDoc(checkpointRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data().state;
    } catch (error) {
      console.error('Failed to load checkpoint:', error);
      return null;
    }
  }

  async recoverGameState(userId: string): Promise<GameState | null> {
    try {
      const docRef = doc(db, 'game_states', userId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      const savedState = {
        ...(docSnap.data() as GameState),
        timestamp: new Date(docSnap.data()?.timestamp || new Date())
      };
      const MAX_AGE_MS = 24 * 60 * 60 * 1000; 
      const stateAge = new Date().getTime() - savedState.timestamp.getTime();
      if (stateAge > MAX_AGE_MS) {
        await new StateRecoveryService().clearRecoveryState(userId);
        return null;
      }
      return savedState;
    } catch (error) {
      console.error('Failed to recover state:', error);
      return null;
    }
  }

  async convertToGameState(data: DocumentData): Promise<GameState> {
    return {
        userId: data.userId || '',
        quarterId: data.quarterId || '',
        isInitialized: Boolean(data.isInitialized),
        currentSample: data.currentSample || 'A',
        score: Object.entries(data.score || { A: 0, B: 0, C: 0, D: 0 }).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: typeof value === 'string' ? Number(value) : value
        }), { A: 0, B: 0, C: 0, D: 0 }),
        scores: data.scores || {
            'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D'
        },
        totalScore: Object.entries(data.totalScore || {}).reduce((acc, [, value]) => 
            acc + (typeof value === 'string' ? Number(value) : (value as number))
        , 0),
        completedSamples: Array.isArray(data.completedSamples) ? data.completedSamples : [],
        progress: Number(data.progress) || 0,
        lastUpdated: new Date(data.lastUpdated || Date.now()),
        isPlaying: Boolean(data.isPlaying),
        currentChallengeIndex: Number(data.currentChallengeIndex) || 0,
        challenges: Array.isArray(data.challenges) ? data.challenges : [],
        samples: data.samples || {},
        guesses: data.guesses || {
            'A': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
            'B': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
            'C': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
            'D': { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false }
        },
        answers: data.answers || {},
        timeRemaining: Number(data.timeRemaining) || 300,
        lives: Number(data.lives) || 3,
        hints: Number(data.hints) || 3,
        isComplete: Boolean(data.isComplete),
        totalChallenges: Number(data.totalChallenges) || 0,
        hasSubmitted: Boolean(data.hasSubmitted),
        startTime: new Date(data.startTime || Date.now()),
        endTime: new Date(data.endTime || Date.now()),
        currentRound: Number(data.currentRound) || 1,
        totalRounds: Number(data.totalRounds) || 4,
        mode: data.mode || 'standard',
        difficulty: data.difficulty || 'beginner',
        isLoading: Boolean(data.isLoading),
        error: data.error || null,
        currentSampleId: data.currentSampleId || null,
        currentQuarter: data.currentQuarter || null,
        scoringRules: data.scoringRules || DEFAULT_SCORING_RULES
    };
}

async getGameState(userId: string): Promise<GameState | null> {
  try {
      if (!userId) {
          throw new Error("User ID is required");
      }

      // First try gameStates collection
      const gameStateRef = doc(db, 'gameStates', userId);
      const snapshot = await getDoc(gameStateRef);

      if (!snapshot.exists()) {
          // Try game_results collection as fallback
          const resultRef = doc(db, 'game_results', userId);
          const resultSnap = await getDoc(resultRef);
          
          if (!resultSnap.exists()) {
              console.log("No existing game state found, creating new one");
              return this.createGameState(userId);
          }
          
          return this.convertToGameState(resultSnap.data());
      }

      const data = snapshot.data();
      if (!data) {
          console.log("Empty game state found, creating new one");
          return this.createGameState(userId);
      }

      // Convert data to GameState
      const gameState = await this.convertToGameState(data);

      // Validate samples existence
      if (!gameState.samples || Object.keys(gameState.samples).length === 0) {
          console.log("Invalid game state (no samples), creating new one");
          return this.createGameState(userId);
      }

      // Track analytics
      AnalyticsService.trackEvent('game_state_retrieved', {
          userId,
          hasValidSamples: Object.keys(gameState.samples).length > 0
      });

      return gameState;

  } catch (error) {
      console.error("Failed to retrieve game state", error);
      AnalyticsService.trackEvent('game_state_retrieval_failed', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // On error, create new game state
      console.log("Error retrieving game state, creating new one");
      return this.createGameState(userId);
  }
}

async createGameState(userId: string): Promise<GameState> {
  try {
      const newGameState: GameState = {
          userId,
          quarterId: '',
          isLoading: false,
          isInitialized: true,  // Changed to true since we're creating it
          isPlaying: true,      // Changed to true to indicate active game
          guesses: {
              A: { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
              B: { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
              C: { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false },
              D: { age: 0, proof: 0, mashbill: '', rating: 0, notes: '', score: 0, submitted: false }
          },
          completedSamples: [],
          currentSample: 'A',
          score: { 'A': 0, 'B': 0, 'C': 0, 'D': 0 },
          scores: { A: 'A', B: 'B', C: 'C', D: 'D' },
          totalScore: 0,
          progress: 0,
          currentChallengeIndex: 0,
          challenges: [],
          samples: {
              A: { id: 'A', name: '', age: 0, proof: 0, mashbill: 'Bourbon', rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, availability:'', difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' },
              B: { id: 'B', name: '', age: 0, proof: 0, mashbill: 'Bourbon', rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, availability:'', difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' },
              C: { id: 'C', name: '', age: 0, proof: 0, mashbill: 'Bourbon', rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, availability:'', difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' },
              D: { id: 'D', name: '', age: 0, proof: 0, mashbill: 'Bourbon', rating: 0, hints: [], distillery: '', description: '', notes: [], type: '', region: '', imageUrl: '', price: 0, availability:'', difficulty: 'beginner', score: 0, challengeQuestions: [], image: '' }
          },
          answers: {},
          timeRemaining: 300,
          lives: 3,
          hints: 3,
            isComplete: false,
            totalChallenges: 0,
            hasSubmitted: false,
            startTime: new Date(),
            endTime: new Date(),
            lastUpdated: new Date(),
            currentRound: 1,
            totalRounds: 4,
            mode: 'standard',
            difficulty: 'beginner',
            error: null,
            currentSampleId: 'A',  // Set initial sample
            currentQuarter: null,
            scoringRules: { ...DEFAULT_SCORING_RULES }
        };

        // Create the document in Firestore
        const gameStateRef = doc(db, 'gameStates', userId);
        await setDoc(gameStateRef, {
            ...newGameState,
            startTime: serverTimestamp(),
            lastUpdated: serverTimestamp()
        });

        // Track analytics for new game state creation
        AnalyticsService.trackEvent('game_state_created', {
            userId,
            timestamp: new Date().toISOString()
        });

        return newGameState;
    } catch (error) {
        console.error('Error creating game state:', error);
        AnalyticsService.trackEvent('game_state_creation_failed', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw new Error('Failed to create game state');
    }
}


}

// Export singleton instance
export const gameStateService = GameStateService.getInstance();
function serverTimestamp() {
  return firestoreTimestamp();
}
