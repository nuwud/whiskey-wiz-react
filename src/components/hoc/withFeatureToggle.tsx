import React from 'react';
import { useFeature } from '@/contexts/FeatureContext';

export function withFeatureToggle<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureId: string,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureToggleWrapper(props: P) {
    const { enabled, loading } = useFeature(featureId);

    if (loading) return null;
    if (!enabled) return FallbackComponent ? <FallbackComponent {...props} /> : null;

    return <WrappedComponent {...props} />;
  };
}
