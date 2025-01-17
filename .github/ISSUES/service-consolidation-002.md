# Service Layer Consolidation Plan

## Service Duplicates Found

### Authentication Services
1. authService.ts
2. core/AuthService.ts
3. AuthContext.tsx
- **Best Version**: feature/service-consolidation/core/AuthService.ts (has better error handling)

### Analytics Services
1. analyticsService.ts
2. AnalyticsService.ts
3. analytics/AnalyticsService.ts
- **Best Version**: analytics/AnalyticsService.ts (has proper type definitions)

### Quarter Services
1. quarterService.ts
2. QuarterService.ts
3. quarters/QuarterService.ts
- **Best Version**: quarters/QuarterService.ts (includes templates)

## Consolidation Steps

1. Authentication (Priority: High)
- [ ] Extract core/AuthService.ts
- [ ] Update type definitions
- [ ] Implement error handling
- [ ] Update imports

2. Game Services (Priority: High)
- [ ] Merge GameStateService and StateRecoveryService
- [ ] Implement GameChallengeService
- [ ] Add error boundaries
- [ ] Update analytics tracking

3. Integration Services (Priority: Medium)
- [ ] ShopifyIntegrationService
- [ ] WebhookService cleanup
- [ ] Firebase configuration

4. Analytics & Monitoring (Priority: Low)
- [ ] Consolidate analytics implementations
- [ ] Add proper error tracking
- [ ] Implement monitoring dashboard

## File Structure After Consolidation
```
src/services/
├── auth/
│   ├── index.ts
│   └── auth.service.ts
├── game/
│   ├── index.ts
│   ├── state.service.ts
│   └── challenge.service.ts
├── analytics/
│   ├── index.ts
│   └── analytics.service.ts
└── integration/
    ├── index.ts
    ├── shopify.service.ts
    └── webhooks/
```

## Service Dependencies
- Firebase Auth
- Shopify API
- Analytics
- Error Tracking

## Testing Plan
- [ ] Unit tests for each service
- [ ] Integration tests for flows
- [ ] Error handling verification
- [ ] Performance testing

## Notes
- Keep error handling consistent
- Use proper typing
- Document exports
- Keep analytics tracking
- Maintain backwards compatibility

## Related Issues
- ui-components-001.md (UI dependencies)
- branch-state-001.md (Branch management)
- service-implementation-001.md (Implementation details)

## Remote Branch Status
- feature/service-consolidation has most complete services
- Need to cherry-pick specific improvements
- Keep main branch as target

## Current Tasks
1. [ ] Extract best auth service
2. [ ] Fix Firebase config
3. [ ] Update component imports
4. [ ] Test consolidated services