# WhiskeyWiz Technical Specifications

## Architecture Overview

### Frontend
- Next.js 14
- React 18
- TypeScript
- TailwindCSS

### Backend
- Firebase
  - Authentication
  - Firestore
  - Storage
  - Functions

### Testing
- Jest
- React Testing Library
- Firebase Emulators

## Component Structure

### Core Components
```typescript
// Base layouts and common components
src/
  ├── components/
  │   ├── common/
  │   │   ├── Header
  │   │   ├── Footer
  │   │   └── Navigation
  │   ├── auth/
  │   │   ├── SignIn
  │   │   └── SignUp
  │   └── game/
  │       ├── GameEngine
  │       └── GameBoard
```

### Admin Features
```typescript
// Admin management components
src/
  └── components/
      └── admin/
          ├── QuarterManagement
          ├── FeatureToggles
          └── Analytics
```

### Game Features
```typescript
// Game-specific components
src/
  └── components/
      └── game/
          ├── Quarters
          ├── Scoring
          └── Results
```

## Firebase Schema

### Collections
```typescript
interface User {
  uid: string;
  email: string;
  isAdmin: boolean;
  preferences: UserPreferences;
}

interface Quarter {
  id: string;
  name: string;
  active: boolean;
  config: QuarterConfig;
  questions: Question[];
}

interface GameProgress {
  userId: string;
  quarterId: string;
  score: number;
  completed: boolean;
  timestamp: Timestamp;
}
```

## API Routes

### Authentication
```typescript
/api/auth/
  ├── signin  // POST: Email/password login
  ├── signup  // POST: New user registration
  └── verify  // POST: Email verification
```

### Game Management
```typescript
/api/game/
  ├── quarters    // GET: List quarters, POST: Create quarter
  ├── progress    // GET: User progress, POST: Update progress
  └── results     // GET: Game results, POST: Submit results
```

### Admin Routes
```typescript
/api/admin/
  ├── features    // GET/POST: Feature management
  ├── users       // GET: User management
  └── analytics   // GET: Game analytics
```

## Deployment Pipeline

### Development
1. Local Development
   ```bash
   npm run dev     # Start development server
   npm run test    # Run tests
   ```

2. Firebase Emulators
   ```bash
   npm run firebase:emulators
   ```

### Staging
1. Build Check
   ```bash
   npm run build
   npm run test
   ```

2. Firebase Preview
   ```bash
   npm run deploy:preview
   ```

### Production
1. Build
   ```bash
   npm run build
   ```

2. Deploy
   ```bash
   npm run deploy
   ```

## Environment Variables

### Required Variables
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SHOPIFY=true
```

## Testing Strategy

### Unit Tests
```typescript
// Component tests
describe('GameComponent', () => {
  it('renders game board', () => {...});
  it('tracks score', () => {...});
});
```

### Integration Tests
```typescript
// Feature tests
describe('Game Flow', () => {
  it('completes full game cycle', () => {...});
});
```

### E2E Tests
```typescript
// Full flow tests
describe('User Journey', () => {
  it('signup to game completion', () => {...});
});
```