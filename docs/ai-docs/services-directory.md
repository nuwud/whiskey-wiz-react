# Services - BlindBarrels.com Whiskey Tasting Game

This document outlines the service layer implementation in the `src/services/` directory of the BlindBarrels.com Whiskey Tasting Game, which handles data access, business logic, and external integrations.

## Service Architecture

The application follows a service-oriented architecture pattern where business logic is encapsulated in dedicated service classes that handle specific domains of functionality. These services abstract away the complexities of data operations, API calls, and state management from UI components.

## Core Services

### Firebase Service (`firebase.service.ts`)

Centralizes Firebase interactions:

- **Purpose**: Provides an abstraction layer for Firebase services
- **Functionality**:
  - Authentication methods (login, signup, logout)
  - Firestore database operations
  - Firebase Storage operations
  - Cloud Functions invocation
  - Submitting scores and game results
  - Player data management

### Quarter Service (`quarter/quarter.service.ts`)

Manages quarterly whiskey box data:

- **Purpose**: Handles operations related to quarterly whiskey boxes
- **Functionality**:
  - Fetching quarter metadata
  - Retrieving quarter details with samples
  - Creating and updating quarters (admin)
  - Activating/deactivating quarters
  - Fetching whiskey samples within quarters

### Game State Service (`game-state.service.ts`)

Manages the state of game sessions:

- **Purpose**: Handles saving, loading, and managing game state
- **Functionality**:
  - Initializing new game sessions
  - Saving game progress
  - Resuming games in progress
  - Cleaning up completed games
  - Handling game state transitions

### Score Service (`score.service.ts`)

Contains scoring logic:

- **Purpose**: Calculates and processes scores based on user guesses
- **Functionality**:
  - Comparing guesses against actual values
  - Applying scoring rules for age, proof, and mashbill
  - Calculating penalties and bonuses
  - Generating explanations for scores
  - Calculating total scores

### Leaderboard Service (`leaderboard.service.ts`)

Manages player rankings and scores:

- **Purpose**: Provides leaderboard functionality
- **Functionality**:
  - Fetching global and quarterly leaderboards
  - Calculating player rankings
  - Filtering and sorting leaderboard data
  - Tracking personal records

### Monitoring Service (`monitoring.service.ts`)

Handles application monitoring and performance tracking:

- **Purpose**: Collects data on application performance and errors
- **Functionality**:
  - Performance tracing
  - Error logging
  - User action monitoring
  - Performance metrics collection

## Supporting Services

### Authentication Service (`auth.service.ts`)

Handles user authentication:

- **Purpose**: Manages user authentication state and operations
- **Functionality**:
  - User sign-in/sign-up flows
  - Password reset
  - Email verification
  - Profile management

### User Service (`user.service.ts`)

Manages user data:

- **Purpose**: Handles user-related data operations
- **Functionality**:
  - Profile data management
  - User preferences
  - Settings management
  - Role-based access control

### Analytics Service (`analytics.service.ts`)

Collects and processes analytics data:

- **Purpose**: Gathers insights on user behavior and game performance
- **Functionality**:
  - Tracking user actions
  - Game completion analytics
  - Feature usage statistics
  - Conversion tracking

## Service Integration Patterns

The services are integrated with the application through several patterns:

1. **Direct Import**: Components directly import and use service methods
   ```typescript
   import { quarterService } from '../../services/quarter/quarter.service';
   
   // Later in component
   const quarter = await quarterService.getQuarterById(quarterId);
   ```

2. **Context Providers**: Services exposed via React Context
   ```typescript
   import { useAuth } from '../../contexts/auth.context';
   
   // Later in component
   const { user } = useAuth();
   ```

3. **State Management**: Services integrated with Zustand stores
   ```typescript
   import { useGameStore } from '../../store/game.store';
   
   // Later in component
   const { samples, setSamples } = useGameStore();
   ```

4. **Utility Functions**: Helper functions that utilize services
   ```typescript
   import { transformQuarterSamples } from '../../utils/data-transform.utils';
   
   // Later in component
   const transformedSamples = transformQuarterSamples(quarter.samples);
   ```

## Error Handling

Services implement consistent error handling patterns:

- Try/catch blocks with detailed error information
- Error logging via monitoring service
- User-friendly error messages returned to UI
- Graceful fallbacks when operations fail

## Service Architecture Benefits

The service-oriented architecture provides several advantages:

1. **Separation of Concerns**: UI components focus on presentation while services handle business logic
2. **Testability**: Services can be unit tested independently of UI
3. **Reusability**: The same service can be used by multiple components
4. **Maintainability**: Business logic changes can be made in one place
5. **Scalability**: Services can be optimized independently as the application grows