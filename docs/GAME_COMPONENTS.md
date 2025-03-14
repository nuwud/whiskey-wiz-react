# Game Components Documentation

This document provides a detailed overview of the game-related components in the Whiskey Wiz React application.

## Core Game Components

### Game Container (`game-container.component.tsx`)

The main orchestrator for the game flow. This component:

- Manages the overall game state
- Coordinates between different game phases
- Handles loading of quarterly whiskey data
- Manages transitions between game screens
- Coordinates user progress tracking

At 11,173 lines, this is one of the largest components, indicating its central role in managing the game experience.

### Quarter Selection (`quarter-selection.component.tsx`)

This component allows users to select which quarterly whiskey box they want to play with:

- Displays available quarters
- Shows quarter details and release dates
- Handles selection and launching of a specific quarter's game
- May include filtering and sorting options

### Sample Guessing (`sample-guessing.component.tsx`)

The core gameplay component where users guess characteristics of whiskey samples:

- Interface for inputting guesses about whiskey type, origin, age, etc.
- Visual feedback during the guessing process
- Timer functionality (if applicable)
- Input validation

At 11,643 lines, this component contains detailed logic for the main gameplay mechanics.

### Game Results (`game-results.component.tsx`)

Displays comprehensive results after a gameplay session:

- Summary of player performance
- Detailed breakdown of correct/incorrect answers
- Comparison with correct whiskey characteristics
- Score calculations and display
- Options to share results or play again

### Sample Result (`sample-result.component.tsx`)

Shows detailed results for an individual whiskey sample:

- Comparison between player guesses and actual characteristics
- Visual feedback on accuracy
- Educational information about the whiskey
- Detailed whiskey characteristics

### Score Display (`score-display.component.tsx`)

Visual representation of player scores:

- Current score
- Score breakdowns by category
- Visual indicators of performance
- Comparison with previous scores or averages

### Score Board (`score-board.component.tsx`)

Leaderboard functionality showing top scores:

- Rankings among all players
- Filtering options for time periods or friends
- Personal best indicators

### Share Results (`share-results.component.tsx`)

Functionality for sharing game results:

- Social media integration
- Generation of shareable content
- Options for what to include in shares
- Preview of shared content

### Game Over (`game-over.component.tsx`)

Final screen after game completion:

- Overall performance summary
- Options to navigate after completion
- Encouragement to play again
- Suggestions for related activities

### Challenge (`challenge.component.tsx`)

Special challenge or competitive game modes:

- Different rule sets for challenges
- Time-limited challenges
- Special scoring mechanisms
- Competitive features

### Game Board (`game-board.component.tsx`)

Visual representation of the game state:

- Display of current progress
- Visual layout of samples
- Game controls and navigation

### Game Error Boundary (`game-error-boundary.component.tsx`)

Specialized error handling for game-specific errors:

- Graceful degradation when errors occur
- Recovery options
- Error logging
- User-friendly error messages

## Gameplay Flow

The typical gameplay flow through these components is:

1. **Quarter Selection**: User selects a quarterly whiskey box
2. **Game Container**: Initializes the game with selected quarter
3. **Sample Guessing**: User goes through each sample making guesses
4. **Sample Result**: After each sample, results are shown
5. **Game Results**: Overall results displayed after all samples
6. **Game Over**: Final screen with options to share or play again

The game components work together through a combination of props, context, and possibly Redux state management to maintain game state and player progress throughout the experience.