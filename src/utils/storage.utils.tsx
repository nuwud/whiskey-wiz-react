import { Quarter, SampleId, WhiskeySample, GameState, INITIAL_STATE, MASHBILL_TYPES, DifficultyEnum  } from '../types/game.types';
import { GuestSessionService } from '../services/guest-session.service';

export const GAME_STATE_KEY = 'whiskeywiz_game_state';

interface GameStateToSave extends Partial<GameState> {
    guesses: Record<string, any>;
    score: Record<string, number>;
    totalScore: number;
    currentQuarter: Quarter | null;
    samples: Record<SampleId, WhiskeySample>;
    timestamp: string;
    currentSampleId: SampleId | null;
    completedSamples: string[];
    isInitialized: boolean;
    isGuest?: boolean;
}

const validateSamples = (samples: Record<SampleId, WhiskeySample>): boolean => {
    if (!samples || typeof samples !== 'object') return false;
    
    const requiredSamples = ['A', 'B', 'C', 'D'];
    const hasSamples = requiredSamples.every(id => {
        const sample = samples[id as SampleId];
        return sample && 
                typeof sample.age === 'number' && sample.age > 0 &&
                typeof sample.proof === 'number' && sample.proof > 0 &&
                typeof sample.mashbill === 'string' && sample.mashbill.length > 0;
    });

    if (!hasSamples) {
        console.error('Sample validation failed:', samples);
    }
    
    return hasSamples;
};

const validateGameState = (state: any): boolean => {
    if (!state || typeof state !== 'object') {
        console.error('Invalid state structure');
        return false;
    }

    const isValid = Boolean(
        state.samples &&
        validateSamples(state.samples) &&
        (!state.currentSampleId || typeof state.currentSampleId === 'string') &&
        Array.isArray(state.completedSamples) &&
        typeof state.isInitialized === 'boolean'
    );

    if (!isValid) {
        console.error('Game state validation failed:', {
            hasSamples: Boolean(state.samples),
            samplesValid: state.samples ? validateSamples(state.samples) : false,
            currentSampleIdValid: !state.currentSampleId || typeof state.currentSampleId === 'string',
            completedSamplesValid: Array.isArray(state.completedSamples),
            isInitializedValid: typeof state.isInitialized === 'boolean'
        });
    }

    return isValid;
};

export const saveGameState = async (state: Partial<GameStateToSave>): Promise<void> => {
    try {
        if (!validateGameState(state)) {
            throw new Error('Invalid game state structure');
        }

        const stateToSave: GameStateToSave = {
            ...INITIAL_STATE,
            ...state,
            samples: state.samples || {
                'A': {
                    id: 'A',
                    name: '',
                    age: 0,
                    proof: 0,
                    mashbill: MASHBILL_TYPES.BOURBON,
                    hints: [],
                    distillery: '',
                    description: '',
                    notes: [],
                    type: '',
                    region: '',
                    availability: '',
                    imageUrl: '',
                    price: 0,
                    difficulty: DifficultyEnum.Beginner,                    score: 'score A',
                    challengeQuestions: [],
                    image: '',
                    rating: 0
                },
                'B': {
                    id: 'B',
                    name: '',
                    age: 0,
                    proof: 0,
                    mashbill: MASHBILL_TYPES.BOURBON, 
                    hints: [],
                    distillery: '',
                    description: '',
                    notes: [],
                    type: '',
                    region: '',
                    availability: '',
                    imageUrl: '',
                    price: 0,
                    difficulty: DifficultyEnum.Beginner,                    score: 'score B',
                    challengeQuestions: [],
                    image: '',
                    rating: 0
                },
                'C': {
                    id: 'C',
                    name: '',
                    age: 0,
                    proof: 0,
                    mashbill: MASHBILL_TYPES.BOURBON,
                    hints: [],
                    distillery: '',
                    description: '',
                    notes: [],
                    type: '',
                    region: '',
                    availability: '',
                    imageUrl: '',
                    price: 0,
                    difficulty: DifficultyEnum.Beginner,                    score: 'score C',
                    challengeQuestions: [],
                    image: '',
                    rating: 0
                },
                'D': {
                    id: 'D',
                    name: '',
                    age: 0,
                    proof: 0,
                    mashbill: MASHBILL_TYPES.BOURBON,
                    hints: [],
                    distillery: '',
                    description: '',
                    notes: [],
                    type: '',
                    region: '',
                    availability: '',
                    imageUrl: '',
                    price: 0,
                    difficulty: DifficultyEnum.Beginner,                    score: 'score D',
                    challengeQuestions: [],
                    image: '',
                    rating: 0
                }
            } as Record<SampleId, WhiskeySample>,
            score: state.score || INITIAL_STATE.score,
            totalScore: state.totalScore || 0,
            currentQuarter: state.currentQuarter || null,
            timestamp: new Date().toISOString(),
            currentSampleId: state.currentSampleId || null,
            completedSamples: state.completedSamples || [],
            isInitialized: true,
            isGuest: !!state.isGuest,
        };

        try {
            localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.warn('localStorage failed, falling back to IndexedDB');
            await saveToIndexedDB(GAME_STATE_KEY, stateToSave);
        }

    } catch (error) {
        console.error('Failed to save game state:', error);
        throw error;
    }
};

const saveToIndexedDB = (key: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('whiskeywiz', 1);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('gameState')) {
                db.createObjectStore('gameState');
            }
        };

        request.onsuccess = (event: Event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['gameState'], 'readwrite');
            const store = transaction.objectStore('gameState');
            
            const putRequest = store.put(value, key);
            
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
        };

        request.onerror = () => reject(request.error);
    });
};

export const loadGameState = (): GameStateToSave | null => {
    try {
        const saved = localStorage.getItem(GAME_STATE_KEY);
        if (!saved) {
            console.log('No saved game state found');
            return null;
        }

        const state = JSON.parse(saved) as GameStateToSave;
        
        if (state.isGuest && !GuestSessionService.isSessionValid()) {
            console.warn('Guest session expired, clearing state');
            clearGameState();
            return null;
        }

        if (!validateGameState(state)) {
            console.warn('Invalid saved state structure, clearing');
            clearGameState();
            return null;
        }

        // Extend guest session if valid
        if (state.isGuest) {
            GuestSessionService.extendSession();
        }

        return state;
    } catch (error) {
        console.error('Failed to load game state:', error);
        clearGameState();
        return null;
    }
};

export const clearGameState = (): void => {
    try {
        localStorage.removeItem(GAME_STATE_KEY);
        indexedDB.deleteDatabase('whiskeywiz');
        
        const state = loadGameState();
        if (state?.isGuest) {
            GuestSessionService.clearSession();
        }
    } catch (error) {
        console.error('Failed to clear game state:', error);
    }
};