# Contexts - BlindBarrels.com Whiskey Tasting Game

This document explains the React Context implementation in the `src/contexts/` directory of the BlindBarrels.com Whiskey Tasting Game, which provides global state management for key application features.

## Context Overview

React Context is used to provide global state and functionality that needs to be accessed by multiple components throughout the application without prop drilling. The application uses several context providers to manage different aspects of global state.

## Main Contexts

### Authentication Context (`auth.context.tsx`)

Manages user authentication state:

- **Purpose**: Provides global access to the current user's authentication state
- **Key State**:
  - `user`: Current authenticated user information
  - `loading`: Authentication loading state
  - `error`: Authentication error state
- **Key Methods**:
  - `login()`: Authenticates a user
  - `signup()`: Creates a new user account
  - `logout()`: Signs out the current user
  - `resetPassword()`: Initiates password reset flow
  - `updateProfile()`: Updates user profile information
- **Usage**:
  ```typescript
  import { useAuth } from '../../contexts/auth.context';
  
  function MyComponent() {
    const { user, login, logout } = useAuth();
    // Component logic using auth context
  }
  ```

### Feature Context (`feature.context.tsx`)

Manages feature flags and application capabilities:

- **Purpose**: Controls feature availability throughout the application
- **Key State**:
  - `features`: Object containing feature flag states
  - `loading`: Feature flags loading state
- **Key Methods**:
  - `isFeatureEnabled()`: Checks if a specific feature is enabled
  - `updateFeature()`: Updates feature flag state (admin only)
- **Usage**:
  ```typescript
  import { useFeatures } from '../../contexts/feature.context';
  
  function MyComponent() {
    const { isFeatureEnabled } = useFeatures();
    
    if (isFeatureEnabled('advanced_scoring')) {
      // Render advanced scoring UI
    }
  }
  ```

### Quarter Context (`quarter.context.tsx`)

Manages quarterly whiskey box data:

- **Purpose**: Provides access to quarter data throughout the application
- **Key State**:
  - `quarters`: Available quarterly whiskey boxes
  - `currentQuarter`: Currently selected quarter
  - `loading`: Data loading state
  - `error`: Error state
- **Key Methods**:
  - `loadQuarters()`: Fetches all available quarters
  - `selectQuarter()`: Sets the current quarter
  - `getQuarterById()`: Retrieves a specific quarter by ID
- **Usage**:
  ```typescript
  import { useQuarters } from '../../contexts/quarter.context';
  
  function MyComponent() {
    const { quarters, currentQuarter, selectQuarter } = useQuarters();
    // Component logic using quarter data
  }
  ```

### Theme Context (`theme.context.tsx`)

Manages application theming:

- **Purpose**: Controls the application's visual theme
- **Key State**:
  - `theme`: Current theme ('light', 'dark', etc.)
  - `userPreference`: User's preferred theme setting
- **Key Methods**:
  - `setTheme()`: Changes the current theme
  - `toggleTheme()`: Switches between light and dark themes
- **Usage**:
  ```typescript
  import { useTheme } from '../../contexts/theme.context';
  
  function MyComponent() {
    const { theme, toggleTheme } = useTheme();
    // Component logic using theme context
  }
  ```

## Context Provider Structure

Each context follows a similar structure:

1. **Context Creation**: Using React's `createContext`
2. **Provider Component**: A component that wraps children with the context provider
3. **Custom Hook**: A hook that provides easy access to the context
4. **Initial State**: Default values when context is first initialized
5. **Effect Hooks**: For loading data and responding to changes

Example:
```typescript
// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Effect hooks for authentication state
  useEffect(() => {
    // Authentication logic
  }, []);
  
  // Context value object
  const value = {
    user,
    loading,
    login: async () => { /* implementation */ },
    logout: async () => { /* implementation */ },
    // Other methods
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Context Integration in App Structure

Contexts are nested in the main `App.tsx` component to establish the provider hierarchy:

```typescript
const App: React.FC = () => {
  return (
    <ToastProvider>
      <FeatureProvider>
        <QuarterProvider>
          <Layout>
            <AppRoutes />
          </Layout>
        </QuarterProvider>
      </FeatureProvider>
      <Toaster />
    </ToastProvider>
  );
};
```

This structure ensures that all components in the application have access to the required global state and functionality.

## Context vs. Zustand Stores

The application uses both React Context and Zustand for state management:

- **Context**: Used for broader application state and services like authentication, feature flags, and theming
- **Zustand Stores**: Used for more complex state such as game state that benefits from its more powerful features

This hybrid approach leverages the strengths of each state management solution for different types of application state.