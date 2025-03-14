# State Management Stores - BlindBarrels.com Whiskey Tasting Game

This document explains the state management implementation using Zustand in the `src/store/` directory of the BlindBarrels.com Whiskey Tasting Game.

## Zustand Store Overview

The application uses [Zustand](https://github.com/pmndrs/zustand) for state management, a lightweight state management solution that's simpler than Redux but more powerful than React Context for complex state. Zustand provides a hook-based API that makes it easy to create and use global state stores.

## Main Stores

### Game Store (`game.store.ts`)

Manages the core game state:

- **Purpose**: Central store for game data, player guesses, and game progress
- **Key State**:
  - `samples`: Whiskey samples in the current game
  - `guesses`: Player's guesses for each sample
  - `completedSamples`: Array of completed sample IDs
  - `currentSampleId`: ID of the currently active sample
  - `totalScore`: Current total score
  - `isInitialized`: Game initialization status
- **Key Actions**:
  - `setSamples()`: Updates the samples data
  - `setGuesses()`: Updates player guesses
  - `setCurrentSampleId()`: Changes the active sample
  - `resetGame()`: Resets the game state
  - `updateTotalScore()`: Recalculates the total score
- **Usage**:
  ```typescript
  import { useGameStore } from '../../store/game.store';
  
  function MyComponent() {
    const { samples, guesses, totalScore } = useGameStore();
    const { setSamples, setGuesses } = useGameStore();
    // Component logic using game store
  }
  ```

### Game Progression Store (`game-progression.store.ts`)

Tracks player progression through the game:

- **Purpose**: Manages the player's journey through game stages
- **Key State**:
  - `currentSample`: Current sample being played
  - `sampleProgress`: Progress within each sample
  - `currentQuarter`: Currently active quarter
  - `gamePhase`: Current phase of gameplay
  - `gameStatus`: Overall game status
- **Key Actions**:
  - `setCurrentSample()`: Updates the current sample
  - `updateProgress()`: Updates progress for a specific sample
  - `setGamePhase()`: Changes the game phase
  - `completeGame()`: Marks the game as complete
- **Usage**:
  ```typescript
  import { useGameProgression } from '../../store/game-progression.store';
  
  function MyComponent() {
    const { currentSample, gamePhase } = useGameProgression();
    const { setCurrentSample, setGamePhase } = useGameProgression();
    // Component logic using progression store
  }
  ```

### UI Store (`ui.store.ts`)

Manages UI state:

- **Purpose**: Centralizes UI-related state that affects multiple components
- **Key State**:
  - `sidebarOpen`: Sidebar visibility state
  - `modalState`: Current open modals
  - `toasts`: Active toast notifications
  - `theme`: Current UI theme
- **Key Actions**:
  - `toggleSidebar()`: Toggles sidebar visibility
  - `openModal()`: Opens a specific modal
  - `closeModal()`: Closes a specific modal
  - `addToast()`: Adds a toast notification
  - `removeToast()`: Removes a toast notification
  - `setTheme()`: Updates the UI theme
- **Usage**:
  ```typescript
  import { useUIStore } from '../../store/ui.store';
  
  function MyComponent() {
    const { sidebarOpen, theme } = useUIStore();
    const { toggleSidebar, setTheme } = useUIStore();
    // Component logic using UI store
  }
  ```

### Player Store (`player.store.ts`)

Manages player-related data:

- **Purpose**: Centralizes player statistics, preferences, and history
- **Key State**:
  - `playerStats`: Player performance statistics
  - `gameHistory`: Player's game history
  - `preferences`: Player preferences
  - `achievements`: Player achievements
- **Key Actions**:
  - `updateStats()`: Updates player statistics
  - `addGameToHistory()`: Records a completed game
  - `updatePreferences()`: Changes player preferences
  - `unlockAchievement()`: Marks an achievement as unlocked
- **Usage**:
  ```typescript
  import { usePlayerStore } from '../../store/player.store';
  
  function MyComponent() {
    const { playerStats, preferences } = usePlayerStore();
    const { updateStats, updatePreferences } = usePlayerStore();
    // Component logic using player store
  }
  ```

## Store Implementation Pattern

Zustand stores follow a consistent pattern:

1. **State Interface**: TypeScript interface defining the store state
2. **Store Creation**: Using Zustand's `create` function
3. **State and Actions**: Combined in a single store object
4. **Selectors**: Optional selectors for derived state
5. **Middleware**: Persistence, logging, or other middleware

Example:
```typescript
// State interface
interface GameState {
  samples: Record<SampleId, WhiskeySample>;
  guesses: Record<SampleKey, SampleGuess>;
  totalScore: number;
  // More state properties
  
  // Actions
  setSamples: (samples: Record<SampleId, WhiskeySample>) => void;
  setGuesses: (guesses: Record<SampleKey, SampleGuess>) => void;
  resetGame: () => void;
  // More actions
}

// Store creation with initial state and actions
export const useGameStore = create<GameState>((set) => ({
  // Initial state
  samples: {},
  guesses: initialGuesses,
  totalScore: 0,
  
  // Actions
  setSamples: (samples) => set({ samples }),
  setGuesses: (guesses) => set({ guesses }),
  resetGame: () => set({ 
    samples: {}, 
    guesses: initialGuesses,
    totalScore: 0 
  }),
  // More actions
}));
```

## Store Integration with Services

Stores are often integrated with services for data operations:

```typescript
const handleGuessSubmit = (sampleId: SampleId, guess: SampleGuess) => {
  // Get current store state
  const { samples } = useGameStore.getState();
  const sample = samples[sampleId];
  
  // Use service for business logic
  const scoreResult = ScoreService.calculateScore(guess, sample);
  
  // Update store with result
  useGameStore.setState(state => ({
    guesses: {
      ...state.guesses,
      [sampleId]: {
        ...guess,
        score: scoreResult.totalScore,
        breakdown: scoreResult.breakdown,
        explanations: {
          age: scoreResult.explanations[0] || '',
          proof: scoreResult.explanations[1] || '',
          mashbill: scoreResult.explanations[2] || ''
        }
      }
    }
  }));
};
```

## Store Persistence

Some stores use persistence to maintain state across sessions:

```typescript
import { persist } from 'zustand/middleware';

export const usePlayerStore = create(
  persist(
    (set) => ({
      // Store implementation
    }),
    {
      name: 'player-storage', // Storage key
      getStorage: () => localStorage, // Storage mechanism
    }
  )
);
```

## Zustand vs. Context API

The application uses both Zustand and React Context, with different use cases:

- **Zustand**: Complex state with many updates, especially for game mechanics
- **Context**: Simpler state shared across many components, especially for user data and app-wide settings

This hybrid approach leverages the strengths of each solution based on the specific requirements of different parts of the application.