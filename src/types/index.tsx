// Re-export all types
export * from './admin.types';
export * from './auth.types';
export * from './game.types';
export * from './knowledge.types';

// Core game types that aren't specific to a domain
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type GameEvent = 'start' | 'complete' | 'timeout' | 'forfeit';
export type GuessResult = 'correct' | 'incorrect' | 'partial';

// Shared utility types
export type LoadingState = 'idle' | 'loading' | 'error' | 'success';