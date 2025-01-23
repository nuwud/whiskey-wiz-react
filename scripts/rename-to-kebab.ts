// Rename components to kebab-case
const componentRenames = {
  // Admin components
  'AdminDashboard.tsx': 'admin-dashboard.component.tsx',
  'AdminMetricsPanel.tsx': 'admin-metrics-panel.component.tsx',
  'AdminQuarterManagement.tsx': 'admin-quarter-management.component.tsx',
  'FeatureToggleAdmin.tsx': 'feature-toggle.component.tsx',
  'KnowledgeGraph.tsx': 'knowledge-graph.component.tsx',
  'QuarterAnalytics.tsx': 'quarter-analytics.component.tsx',
  'QuarterLeaderboard.tsx': 'quarter-leaderboard.component.tsx',
  'QuarterManagement.tsx': 'quarter-management.component.tsx',
  'SampleEditor.tsx': 'sample-editor.component.tsx',
  'UserManagement.tsx': 'user-management.component.tsx',

  // Auth components
  'ForgotPassword.tsx': 'forgot-password.component.tsx',
  'Login.tsx': 'login.component.tsx',
  'LoginForm.tsx': 'login-form.component.tsx',
  'ProtectedRoute.tsx': 'protected-route.component.tsx',
  'RegisterForm.tsx': 'register-form.component.tsx',
  'SignIn.tsx': 'sign-in.component.tsx',
  'SignUp.tsx': 'sign-up.component.tsx',
  'VerifyEmail.tsx': 'verify-email.component.tsx',

  // Common components
  'ErrorBoundary.tsx': 'error-boundary.component.tsx',
  'Header.tsx': 'header.component.tsx',
  'LoadingSpinner.tsx': 'loading-spinner.component.tsx',
  'UserNav.tsx': 'user-nav.component.tsx',

  // Game components
  'Challenge.tsx': 'challenge.component.tsx',
  'GameBoard.tsx': 'game-board.component.tsx',
  'GameContainer.tsx': 'game-container.component.tsx',
  'GameOver.tsx': 'game-over.component.tsx',
  'GameResults.tsx': 'game-results.component.tsx',
  'QuarterSelection.tsx': 'quarter-selection.component.tsx',
  'SampleGuessing.tsx': 'sample-guessing.component.tsx',
  'ScoreBoard.tsx': 'score-board.component.tsx',

  // Root components
  'AccessibilitySettings.tsx': 'accessibility-settings.component.tsx',
  'GameProgressTracker.tsx': 'game-progress-tracker.component.tsx',
  'LoadingState.tsx': 'loading-state.component.tsx',
  'SeasonalTrends.tsx': 'seasonal-trends.component.tsx',
  'ShopifyIntegration.tsx': 'shopify-integration.component.tsx',
  'WhiskeyRecommendations.tsx': 'whiskey-recommendations.component.tsx',

  // Models
  'Player.ts': 'player.model.ts',
  'Quarter.ts': 'quarter.model.ts',

  // Utils
  'ErrorHandler.ts': 'error-handler.util.ts',
  'QuarterComponentGenerator.ts': 'quarter-component-generator.util.ts'
};

// UI components are already in kebab-case
// Services are already in kebab-case
// Hooks need renaming
const hookRenames = {
  'useAccessibility.ts': 'use-accessibility.hook.ts',
  'useStateRecovery.ts': 'use-state-recovery.hook.ts',
  'useWhiskeyKnowledge.ts': 'use-whiskey-knowledge.hook.ts'
};