import { GameState, SampleGuess, WhiskeySample } from '../types/game.types';
import { GuestSessionService } from './guest-session.service';
import { AnalyticsService } from './analytics.service';

const GUEST_GAME_STATE_KEY = 'whiskeywiz_guest_game';
const MAX_GUEST_SCORES = 10; // Limit stored scores for guests

interface GuestGameState extends GameState {
    guestId: string;
    timestamp: number;
}

interface GuestScore {
    guestId: string;
    quarterId: string;
    score: number;
    timestamp: number;
    samples: Record<string, WhiskeySample>;
    guesses: Record<string, SampleGuess>;
}

export class GuestGameStateService {
    static saveGameState(state: GameState, guestId: string): void {
        try {
            // Verify guest session is still valid
            if (!GuestSessionService.isSessionValid()) {
                throw new Error('Guest session expired');
            }

            const guestState: GuestGameState = {
                ...state,
                guestId,
                timestamp: Date.now()
            };

            localStorage.setItem(GUEST_GAME_STATE_KEY, JSON.stringify(guestState));

            // Track analytics
            AnalyticsService.trackEvent('guest_game_state_saved', {
                guestId,
                quarterId: state.quarterId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to save guest game state:', error);
            throw error;
        }
    }

    static loadGameState(guestId: string): GameState | null {
        try {
            // Verify guest session
            if (!GuestSessionService.isSessionValid()) {
                this.clearGameState();
                throw new Error('Guest session expired');
            }

            const savedState = localStorage.getItem(GUEST_GAME_STATE_KEY);
            if (!savedState) return null;

            const guestState: GuestGameState = JSON.parse(savedState);

            // Verify state belongs to current guest
            if (guestState.guestId !== guestId) {
                this.clearGameState();
                return null;
            }

            // Check if state is too old (24 hours)
            if (Date.now() - guestState.timestamp > 24 * 60 * 60 * 1000) {
                this.clearGameState();
                return null;
            }

            return guestState;
        } catch (error) {
            console.error('Failed to load guest game state:', error);
            this.clearGameState();
            return null;
        }
    }

    static saveScore(score: GuestScore): void {
        try {
            const scores = this.getScores();
            scores.unshift(score);

            // Keep only the most recent scores
            const limitedScores = scores.slice(0, MAX_GUEST_SCORES);

            localStorage.setItem('whiskeywiz_guest_scores', JSON.stringify(limitedScores));

            // Track analytics
            AnalyticsService.trackEvent('guest_score_saved', {
                guestId: score.guestId,
                quarterId: score.quarterId,
                score: score.score,
                timestamp: new Date(score.timestamp).toISOString()
            });
        } catch (error) {
            console.error('Failed to save guest score:', error);
        }
    }

    static getScores(): GuestScore[] {
        try {
            const savedScores = localStorage.getItem('whiskeywiz_guest_scores');
            return savedScores ? JSON.parse(savedScores) : [];
        } catch (error) {
            console.error('Failed to get guest scores:', error);
            return [];
        }
    }

    static clearGameState(): void {
        localStorage.removeItem(GUEST_GAME_STATE_KEY);
    }

    static transferToUser(_userId: string): GuestScore[] {
        try {
            const scores = this.getScores();
            this.clearGameState();
            return scores;
        } catch (error) {
            console.error('Failed to transfer guest scores:', error);
            return [];
        }
    }

    static isStateValid(state: GameState): boolean {
        if (!state || typeof state !== 'object') return false;

        // Check required properties
        return (
            'samples' in state &&
            'guesses' in state &&
            'quarterId' in state &&
            'currentSampleId' in state &&
            Object.keys(state.samples).length === 4
        );
    }

    static handleExpiredSession(): void {
        this.clearGameState();
        localStorage.removeItem('whiskeywiz_guest_scores');
    }
}