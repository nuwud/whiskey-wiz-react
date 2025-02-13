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
        const stateToSave = {
            guesses: state.guesses,
            score: state.score,
            totalScore: state.totalScore,
            currentQuarter: state.currentQuarter,
            samples: state.samples,
            timestamp: new Date().toISOString(),
            isGuest: state.isGuest,
            currentSampleId: state.currentSampleId,
            completedSamples: state.completedSamples,
            isInitialized: true
        };

        // If it's a guest session, check validity
        if (state.isGuest && !GuestSessionService.isSessionValid()) {
            throw new Error('Guest session expired');
        }

        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateToSave));

        // If it's a guest, also save to guest state
        if (state.isGuest) {
            GuestSessionService.saveState({
                currentGame: {
                    quarterId: state.currentQuarter?.id,
                    progress: {
                        guesses: state.guesses,
                        score: state.score,
                        completedSamples: state.completedSamples
                    },
                    timestamp: new Date().toISOString()
                }
            });
        }
    } catch (error) {
        console.error('Failed to save game state:', error);
        throw error; // Re-throw to handle in UI
    }
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