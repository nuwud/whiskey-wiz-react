# Feature Toggle System

## Overview
The feature toggle system allows BlindBarrels.com administrator (Bobbie DeMars) to enable/disable features through an intuitive admin interface. This system ensures smooth transitions when features are toggled, handling necessary UI updates and data refreshes appropriately.

## Key Features
- Admin interface for feature management
- Smooth UI transitions when features are toggled
- Proper game state management during feature changes
- Persistent feature state storage in Firebase
- Automatic layout adjustments

## Available Toggles
Current toggleable features include:
- Accessibility Settings
- Game Progress Tracking
- Seasonal Events & Trends
- Shopify Integration
- Whiskey Recommendations
- Advanced Statistics
- Social Features
- Tutorial System

## Implementation Details

### Feature Context
The FeatureContext provides current feature states throughout the application:
```typescript
const { enabled } = useFeature('feature-id');
```

### HOC Usage
Wrap components with the withFeatureToggle HOC:
```typescript
export default withFeatureToggle(MyComponent, 'feature-id');
```

### Admin Interface
Access the feature management panel at `/admin/features`.

## Adding New Features

1. Add feature definition to `src/config/features.ts`:
```typescript
{
  id: 'my-feature',
  name: 'My Feature',
  description: 'Description of the feature',
  requiresRefresh: boolean,
  category: 'gameplay' | 'social' | 'interface'
}
```

2. Update database schema if needed
3. Add feature toggle check in component
4. Test feature in all states (enabled/disabled)

## Common Pitfalls

1. Always handle both enabled and disabled states gracefully
2. Consider data cleanup when disabling features
3. Test feature toggle effects on active games
4. Ensure proper mobile layout adjustments

## Troubleshooting

### Feature Not Toggling
- Verify Firebase permissions
- Check feature ID spelling
- Confirm admin role assignment

### Layout Issues
- Review responsive design handling
- Check feature container cleanup
- Verify parent component adjustments