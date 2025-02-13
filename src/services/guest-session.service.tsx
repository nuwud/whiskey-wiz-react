import { GuestProfile } from '../types/auth.types';

const GUEST_SESSION_KEY = 'whiskeywiz_guest_session';
const GUEST_STATE_KEY = 'whiskeywiz_guest_state';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface GuestState {
    preferences: {
        favoriteWhiskeys: string[];
        preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
        notifications: boolean;
    };
    gameProgress: {
        gamesPlayed: number;
        totalScore: number;
        bestScore: number;
        lastPlayed: string;
    };
    currentGame?: {
        quarterId: string;
        progress: any;
        timestamp: string;
    };
}

export class GuestSessionService {
    static saveSession(profile: GuestProfile): void {
        try {
            const session = {
                profile,
                expiresAt: Date.now() + SESSION_DURATION,
            };
            localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
        } catch (error) {
            console.error('Failed to save guest session:', error);
        }
    }

    static getSession(): { profile: GuestProfile; expiresAt: number } | null {
        try {
            const session = localStorage.getItem(GUEST_SESSION_KEY);
            if (!session) return null;

            const parsedSession = JSON.parse(session);
            if (Date.now() > parsedSession.expiresAt) {
                this.clearSession();
                return null;
            }

            return parsedSession;
        } catch (error) {
            console.error('Failed to get guest session:', error);
            return null;
        }
    }

    static saveState(state: Partial<GuestState>): void {
        try {
            const currentState = this.getState() || {};
            const newState = {
                ...currentState,
                ...state,
                lastUpdated: new Date().toISOString(),
            };
            localStorage.setItem(GUEST_STATE_KEY, JSON.stringify(newState));
        } catch (error) {
            console.error('Failed to save guest state:', error);
        }
    }

    static getState(): GuestState | null {
        try {
            const state = localStorage.getItem(GUEST_STATE_KEY);
            if (!state) return null;
            return JSON.parse(state);
        } catch (error) {
            console.error('Failed to get guest state:', error);
            return null;
        }
    }

    static clearSession(): void {
        localStorage.removeItem(GUEST_SESSION_KEY);
        localStorage.removeItem(GUEST_STATE_KEY);
    }

    static isSessionValid(): boolean {
        const session = this.getSession();
        return session !== null && Date.now() < session.expiresAt;
    }

    static extendSession(): void {
        const session = this.getSession();
        if (session) {
            session.expiresAt = Date.now() + SESSION_DURATION;
            localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
        }
    }

    static async convertToRegistered(_uid: string): Promise<void> {
        const state = this.getState();
        if (state) {
            // Implementation for transferring guest progress to registered user
            // This would involve updating the user's document in Firestore
            // with the guest state data
            // and then clearing the guest session
            await this.clearSession();
        }
        this.clearSession();
    }
}