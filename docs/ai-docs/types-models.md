# Types and Models - BlindBarrels.com Whiskey Tasting Game

This document covers the type system and data models used in the BlindBarrels.com Whiskey Tasting Game application, focusing on the `src/types/` and `src/models/` directories.

## Types Directory (`src/types/`)

The types directory contains TypeScript type definitions for various aspects of the application.

### Game Types (`game.types.tsx`)

This is the largest type definition file (19,688 lines) and defines the core game entities:

- **Sample Types**:
  - `SampleId` / `SampleKey`: identifiers for samples ('A', 'B', 'C', 'D')
  - `WhiskeySample`: comprehensive type for whiskey sample data
    ```typescript
    export interface WhiskeySample {
      id: string;
      name: string;
      age: number;
      proof: number;
      mashbill: MashbillType;
      rating: number;
      mashbillComposition?: { corn: number; rye: number; wheat: number; barley: number; };
      hints: string[];
      distillery: string;
      description: string;
      notes: string[];
      type: string;
      region: string;
      availability: string;
      imageUrl: string;
      price: number;
      difficulty: Difficulty;
      score: Score;
      challengeQuestions: ChallengeQuestion[];
      image: string;
    }
    ```
  - `MashbillType`: Enum for mashbill types ('Bourbon', 'Rye', 'Wheat', 'Single Malt')

- **User Input Types**:
  - `SampleGuess`: type for user's guess for a sample
    ```typescript
    export interface SampleGuess {
      age: number;
      proof: number;
      mashbill: string;
      score?: number;
      rating: number;
      notes: string;
      submitted: boolean;
      breakdown?: { age: number; proof: number; mashbill: number; };
      explanations?: { age: string; proof: string; mashbill: string; };
    }
    ```

- **Game State**:
  - `GameState`: comprehensive state of a game session
  - `Quarter`: data structure for quarterly whiskey boxes
  - `Challenge`: structure for special challenges

- **Scoring System**:
  - `ScoringRules`: configuration for the scoring algorithm
  - `BaseScoringRule`: base type for scoring rules
  - `AgeScoringRule`: scoring logic for age guesses
  - `ProofScoringRule`: scoring logic for proof guesses
  - `MashbillScoringRule`: scoring logic for mashbill guesses
  - `DEFAULT_SCORING_RULES`: constant with default scoring configuration

- **Analytics Types**:
  - `GameMetrics`: player performance metrics
  - `QuarterAnalytics`: detailed analytics for quarters
  - `GameInteractionData`: tracking user interactions

### Auth Types (`auth.types.tsx`)

Authentication and user-related types:

- `UserRole`: enum for user roles (PLAYER, ADMIN, GUEST)
- `User`: user profile information
- `AuthState`: authentication state
- Various auth-related utility and helper types

### Other Type Files

- `admin.types.tsx`: Types for admin features
- `knowledge.types.tsx`: Whiskey knowledge-related structures
- `env.d.tsx`: Environment variable types

## Models Directory (`src/models/`)

The models directory contains simplified data models used across the application.

### Quarter Model (`quarter.model.tsx`)

Defines the basic structure of a whiskey sample:

```typescript
export interface Sample {
  id: string;
  age: number;
  proof: number;
  mashbill: 'Bourbon' | 'Rye' | 'Wheat' | 'Single Malt' | 'Specialty';
}
```

### Player Model (`player.model.tsx`)

Defines player-related data structures:

```typescript
// Simplified version - see actual file for details
export interface PlayerProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  preferences: PlayerPreferences;
  stats: PlayerStats;
}
```

## Type Usage Patterns

1. **Type Guards**: Used to validate data structures
   ```typescript
   export const isValidSampleGuess = (guess: unknown): guess is SampleGuess => {
     // Implementation checking for required fields and types
   };
   ```

2. **Enums and Constants**: Used for fixed sets of values
   ```typescript
   export const MASHBILL_TYPES = { 
     BOURBON: 'Bourbon', 
     RYE: 'Rye', 
     WHEAT: 'Wheat', 
     SINGLE_MALT: 'Single Malt' 
   } as const;
   ```

3. **Utility Types**: Used to derive types from existing ones
   ```typescript
   export type Difficulty = typeof DIFFICULTY_OPTIONS[number];
   ```

4. **Default Values**: Provided for complex structures
   ```typescript
   export const INITIAL_STATE: GameState = {
     // Default values for all GameState fields
   };
   ```

5. **Normalization Functions**: For consistent data handling
   ```typescript
   export const normalizeMashbill = (mashbill: string): MashbillType => {
     // Logic to normalize mashbill strings to standard types
   };
   ```

## Type Hierarchy

The type system follows a hierarchical structure:

1. **Basic Types**: Simple type definitions (string literals, numbers)
2. **Component Types**: UI-specific props and state types
3. **Domain Types**: Business logic types (samples, quarters, scores)
4. **Service Types**: Data service and API interface types
5. **Analytics Types**: Data collection and reporting types

This comprehensive type system ensures type safety across the application and provides excellent documentation of the data structures and their relationships.