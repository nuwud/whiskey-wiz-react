export const GAME_STATE_KEY = 'whiskeywiz_game_state';

export interface GameStateToSave {
    guesses: Record<string, any>;
    score: Record<string, number>;
    totalScore: number;
    currentQuarter: string;
    samples: Record<string, any>;
    timestamp: string;
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

export const loadGameState = () => {
    try {
        const savedState = localStorage.getItem(GAME_STATE_KEY);
        if (!savedState) return null;
        
        const parsedState = JSON.parse(savedState);
        // Check if state is still valid (e.g., not too old)
        const stateAge = new Date().getTime() - new Date(parsedState.timestamp).getTime();
        const MAX_AGE = 30 * 60 * 1000; // 30 minutes
        
        if (stateAge > MAX_AGE) {
            localStorage.removeItem(GAME_STATE_KEY);
            return null;
        }
        
        return parsedState;
    } catch (error) {
        console.error('Failed to load game state:', error);
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