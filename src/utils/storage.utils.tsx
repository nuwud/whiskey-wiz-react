import { Quarter, SampleId, WhiskeySample } from '../types/game.types';
import { GuestSessionService } from '../services/guest-session.service';

export const GAME_STATE_KEY = 'whiskeywiz_game_state';

interface GameStateToSave {
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

export const saveGameState = (state: any) => {
    try {
        // Validate state before saving
        if (!validateGameState(state)) {
            throw new Error('Invalid game state');
        }

        const stateToSave = {
            ...state,
            timestamp: new Date().toISOString(),
            isInitialized: true
        };

        // Try both localStorage and IndexedDB
        try {
            localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.warn('localStorage failed, trying IndexedDB');
            saveToIndexedDB(GAME_STATE_KEY, stateToSave);
        }

    } catch (error) {
        console.error('Failed to save game state:', error);
        throw error;
    }
};

const validateGameState = (state: any): boolean => {
    return Boolean(
        state &&
        state.samples &&
        Object.keys(state.samples).length === 4 &&
        (Object.values(state.samples) as WhiskeySample[]).every((sample: WhiskeySample) => 
            sample && 
            typeof sample.age === 'number' &&
            typeof sample.proof === 'number' &&
            typeof sample.mashbill === 'string'
        )
    );
};

const saveToIndexedDB = (key: string, value: any) => {
    const request = indexedDB.open('whiskeywiz', 1);

    request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('gameState')) {
            db.createObjectStore('gameState');
        }
    };

    request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['gameState'], 'readwrite');
        const store = transaction.objectStore('gameState');
        store.put(value, key);
    };

    request.onerror = (event: any) => {
        console.error('Failed to save to IndexedDB:', event.target.error);
    };
};

export const loadGameState = (): Partial<GameStateToSave> | null => {
    try {
        const saved = localStorage.getItem(GAME_STATE_KEY);
        if (!saved) return null;

        const state = JSON.parse(saved);
        
        // If it's a guest session, verify validity
        if (state.isGuest) {
            if (!GuestSessionService.isSessionValid()) {
                clearGameState();
                throw new Error('Guest session expired');
            }
            // Extend guest session on valid load
            GuestSessionService.extendSession();
        }

        // Validate saved state
        if (!state.samples || 
            Object.keys(state.samples).length !== 4 ||
            !state.currentSampleId ||
            !state.isInitialized) {
            console.warn('Invalid saved state, clearing...');
            clearGameState();
            return null;
        }

        return state;
    } catch (error) {
        console.error('Failed to load game state:', error);
        clearGameState();
        throw error; // Re-throw to handle in UI
    }
};

export const clearGameState = () => {
    try {
        localStorage.removeItem(GAME_STATE_KEY);
        const state = loadGameState();
        if (state?.isGuest) {
            GuestSessionService.clearSession();
        }
    } catch (error) {
        console.error('Failed to clear game state:', error);
    }
};