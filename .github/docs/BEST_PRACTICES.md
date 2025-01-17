# Best Practices Guide

## Component Patterns

### Error Handling
```typescript
// Always use ErrorBoundary for component errors
return (
  <ErrorBoundary>
    <Component />
  </ErrorBoundary>
);

// Use Alert for user-friendly errors
if (error) return (
  <Alert variant="destructive">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
);
```

### Loading States
```typescript
// Use skeleton loading for better UX
if (loading) return <ComponentLoading />;

// Show loading progress when possible
if (loading) return (
  <div className="flex items-center space-x-2">
    <Spinner />
    <span>Loading features...</span>
  </div>
);
```

### State Management
```typescript
// Use contexts for shared state
import { useFeature } from '@/contexts/FeatureContext';

// Destructure what you need
const { features, loading, error } = useFeature();

// Handle all states
if (loading) return <Loading />;
if (error) return <Error message={error} />;
if (!data) return null;
```

### Component Structure
```typescript
// Clear component organization
export default function FeatureManagement() {
  // 1. Hooks at the top
  const { features } = useFeature();
  const [loading, setLoading] = useState(false);

  // 2. Effects next
  useEffect(() => {
    // Effect logic
  }, []);

  // 3. Handlers next
  const handleToggle = () => {
    // Handler logic
  };

  // 4. Early returns for loading/error
  if (loading) return <Loading />;

  // 5. Main render
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

## Service Patterns

### Base Service
```typescript
class BaseService {
  protected async handleRequest<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  }
}
```

### Singleton Pattern
```typescript
class FeatureService extends BaseService {
  private static instance: FeatureService;

  static getInstance(): FeatureService {
    if (!FeatureService.instance) {
      FeatureService.instance = new FeatureService();
    }
    return FeatureService.instance;
  }
}
```

### Error Handling
```typescript
try {
  await service.operation();
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth errors
  } else {
    // Handle other errors
  }
}
```

## Firebase Integration

### Authentication
```typescript
// Use auth context
const { user } = useAuth();
if (!user) return <LoginPrompt />;

// Handle auth states
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
```

### Database
```typescript
// Use proper collection references
const resultsRef = collection(db, 'gameResults');

// Use queries efficiently
const q = query(
  resultsRef,
  where('userId', '==', user.uid),
  orderBy('timestamp', 'desc')
);
```

## Testing
```typescript
// Component testing
describe('FeatureManagement', () => {
  it('handles loading state', () => {
    // Test loading
  });

  it('handles error state', () => {
    // Test error
  });

  it('renders features', () => {
    // Test rendering
  });
});
```

## Notes for MCPs
1. Always check for existing implementations
2. Follow established patterns
3. Use consistent error handling
4. Add proper loading states
5. Document new patterns here

## Common Issues
1. Missing error handling
2. Inconsistent loading states
3. No type safety
4. Poor state management
5. Lack of documentation

Always update this guide when finding better patterns!