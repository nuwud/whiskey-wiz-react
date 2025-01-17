# Branch Information

## Active Branches

### backup-vite-main
- Our clean Vite implementation
- Core dependencies without Next.js
- Base for consolidation

### main
- Final target branch for consolidation
- Should contain best features from all branches

## Feature Branches (To Extract Best Parts)

### feature/game-mechanics-complete
- Core game logic implementation
- UI components for game board
- Score tracking system
- Features to extract:
  - Game mechanics
  - Score calculation
  - Performance optimizations

### feature/error-handling-loading-states
- Error boundary implementations
- Loading state management
- Features to extract:
  - Error boundaries
  - Loading spinners
  - State management

### feature/complete-integration
- Firebase integration
- Authentication flow
- Features to extract:
  - Auth system
  - Firebase config
  - User management

### feature/advanced-features
- Additional gameplay features
- Features to extract:
  - Any useful enhancements
  - Social features if present

## Archived Branches (Next.js Based - Reference Only)

### archived/next-admin-dashboard
- Admin features (Next.js version)
- Dashboard components

### archived/next-admin-toggles
- Feature flags system
- Toggle components

### archived/next-working
- Last working Next.js version
- Reference for features

### archived/service-naming
- Service naming convention work
- Reference for naming patterns

## Removed Branches (Successfully Integrated)
*None yet - will document as we consolidate*

## Integration Plan
1. Start with backup-vite-main (clean Vite)
2. Add core game mechanics
3. Implement error boundaries and loading states
4. Add Firebase integration
5. Include advanced features
6. Test and verify build
7. Deploy to Firebase