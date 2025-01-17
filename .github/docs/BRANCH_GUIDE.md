# Branch Guide and Feature Status

## Main Branches

### development
- Primary development branch
- Contains latest stable features
- Source of best practices and patterns

### main
- Production branch
- Only accepts fully tested features
- Requires PR review

## Feature Branches

### Admin Features
1. feature/admin-dashboard-complete
   - Complete admin interface
   - Analytics dashboard
   - User management

2. feature/admin-enhancements
   - Extended admin capabilities
   - Advanced metrics

3. feature/admin-toggles
   - Feature flag system
   - Runtime toggles

### Game Features
1. feature/game-mechanics
   - Core game logic
   - Scoring system

2. feature/game-mechanics-complete
   - Enhanced gameplay
   - Additional challenge types

### UI/UX Features
1. feature/restore-game-ui
   - Updated game interface
   - Improved user experience

### Error Handling
1. error-boundaries-loading-states
   - Error boundary implementation
   - Loading state components

### Integration
1. feature/complete-integration
   - Firebase integration
   - Service connections

### Authentication
1. feature/auth-system
   - User authentication
   - Role management

2. feature/email-verification-migration
   - Email verification system
   - User validation

### Social Features
1. feature/social-features
   - User interactions
   - Social challenges

## Best Practices

### Code Review
1. Check development branch first
2. Look for better implementations in feature branches
3. Compare similar features across branches

### Integration
1. Always merge development into feature branches first
2. Resolve conflicts favoring better code
3. Document significant changes

### Documentation
1. Update this guide when adding features
2. Document branch dependencies
3. Note deprecated branches

## Notes for MCPs
1. Always check existing code first
2. development branch has latest patterns
3. Compare similar features across branches
4. Mind token/response limits
5. Document thoroughly