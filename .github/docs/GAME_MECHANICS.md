# Game Mechanics Guide

## Core Game Structure

### State Management
```typescript
interface GameState {
  currentSample: 'A' | 'B' | 'C' | 'D';
  samples: Sample[];
  guesses: {
    [key in 'A' | 'B' | 'C' | 'D']: {
      age: number;
      proof: number;
      mashbill: string;
      score?: number;
    }
  };
  totalScore: number;
  isComplete: boolean;
}
```

### Scoring Rules
```typescript
interface ScoringRules {
  age: {
    maxPoints: number;
    pointDeductionPerYear: number;
    exactMatchBonus: number;
  };
  proof: {
    maxPoints: number;
    pointDeductionPerProof: number;
    exactMatchBonus: number;
  };
  mashbill: {
    correctGuessPoints: number;
  };
}
```

## Game Flow

1. Quarter Loading:
```typescript
const fetchGameData = async () => {
  const activeQuarters = await quarterService.getActiveQuarters();
  const currentQuarter = activeQuarters[0];
  const config = await quarterService.getGameConfiguration();
  
  setQuarter(currentQuarter);
  setScoringRules(config.scoringRules);
};
```

2. Sample Navigation:
```typescript
const navigateSample = (direction: 'next' | 'previous') => {
  const sampleOrder = ['A', 'B', 'C', 'D'];
  const currentIndex = sampleOrder.indexOf(gameState.currentSample);
  let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
  
  // Handle boundaries and completion
};
```

3. Score Calculation:
```typescript
const calculateScore = (
  sample: Sample, 
  guess: {age: number, proof: number, mashbill: string}, 
  rules: ScoringRules
) => {
  // Calculate age score
  // Calculate proof score
  // Calculate mashbill score
  return totalScore;
};
```

## Implementation Notes

### Required Services
1. QuarterService
   - getActiveQuarters()
   - getGameConfiguration()

2. ScoreService
   - submitScore()
   - getLeaderboard()

### Error Handling
```typescript
try {
  await submitScore({
    playerId,
    quarterId,
    totalScore,
    guesses
  });
} catch (error) {
  handleError('Failed to submit score');
}
```

### State Updates
```typescript
const updateGuess = (field: keyof Guess) => (value: number | string) => {
  setGameState(prev => ({
    ...prev,
    guesses: {
      ...prev.guesses,
      [prev.currentSample]: {
        ...prev.guesses[prev.currentSample],
        [field]: value
      }
    }
  }));
};
```

## Testing Guide

### Test Cases
1. Sample Navigation
   - Forward/backward movement
   - Boundary conditions
   - Completion state

2. Score Calculation
   - Exact matches
   - Partial scores
   - Bonus points

3. State Management
   - Guess updates
   - Score tracking
   - Game completion

### Example Test
```typescript
describe('GameContainer', () => {
  it('calculates scores correctly', () => {
    const sample = {
      age: 10,
      proof: 100,
      mashbill: 'rye'
    };
    const guess = {
      age: 10,
      proof: 98,
      mashbill: 'rye'
    };
    const score = calculateScore(sample, guess, rules);
    expect(score).toBeDefined();
  });
});
```

## Build Requirements

1. State Management:
   - Quarter state
   - Game progress
   - Score tracking

2. Service Integration:
   - Firebase for persistence
   - Auth for user tracking
   - Analytics for gameplay data

3. UI Components:
   - Sample display
   - Input controls
   - Navigation
   - Score display

## Deployment Notes

1. Configuration:
   - Scoring rules in Firebase
   - Quarter management
   - Feature flags

2. Monitoring:
   - Score submissions
   - User progress
   - Error tracking

3. Analytics:
   - Gameplay patterns
   - User engagement
   - Error rates