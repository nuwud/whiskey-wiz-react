import { Quarter, SampleId, WhiskeySample } from '../types/game.types';

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
}

export const saveGameState = (state: any) => {
    try {
        const stateToSave = {
            guesses: state.guesses,
            score: state.score,
            totalScore: state.totalScore,
            currentQuarter: state.currentQuarter,
            samples: state.samples,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
        console.error('Failed to save game state:', error);
    }
};

export const loadGameState = (): Partial<GameStateToSave> | null => {
    try {
        const saved = localStorage.getItem(GAME_STATE_KEY);
        if (!saved) return null;

        const state = JSON.parse(saved);
        
        // Validate saved state
        if (!state.samples || 
            Object.keys(state.samples).length !== 4 ||
            !state.currentSampleId) {
            console.warn('Invalid saved state, clearing...');
            localStorage.removeItem(GAME_STATE_KEY);
            return null;
        }

        return state;
    } catch (error) {
        console.error('Failed to load game state:', error);
        localStorage.removeItem(GAME_STATE_KEY);
        return null;
    }
};

export const clearGameState = () => {
    try {
        localStorage.removeItem(GAME_STATE_KEY);
    } catch (error) {
        console.error('Failed to clear game state:', error);
    }
};