import React from 'react';
import { withFeatureToggle } from './hoc/withFeatureToggle';

// ... rest of the existing component code ...

export default withFeatureToggle(GameProgressTracker, 'progress-tracking');
