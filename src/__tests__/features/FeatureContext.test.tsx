import { render, screen, act } from '@testing-library/react';
import { FeatureProvider, useFeature } from '../../contexts/FeatureContext';
import { FEATURES } from '../../config/features';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  onSnapshot: jest.fn((_, callback) => {
    callback({
      forEach: (fn: (doc: any) => void) => {
        FEATURES.forEach(feature => {
          fn({
            id: feature.id,
            data: () => feature
          });
        });
      }
    });
    return jest.fn(); // unsubscribe
  }),
  doc: jest.fn(),
  updateDoc: jest.fn()
}));

// Test Component
const TestComponent = ({ featureId }: { featureId: string }) => {
  const { enabled, loading } = useFeature(featureId);
  if (loading) return <div>Loading...</div>;
  return <div>{enabled ? 'Feature Enabled' : 'Feature Disabled'}</div>;
};

describe('FeatureContext', () => {
  it('provides feature states to components', async () => {
    render(
      <FeatureProvider>
        <TestComponent featureId="core-game" />
      </FeatureProvider>
    );

    // Should show loading first
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for feature state to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Core game should be enabled by default
    expect(screen.getByText('Feature Enabled')).toBeInTheDocument();
  });

  it('handles missing features gracefully', async () => {
    render(
      <FeatureProvider>
        <TestComponent featureId="non-existent-feature" />
      </FeatureProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Non-existent features should be disabled by default
    expect(screen.getByText('Feature Disabled')).toBeInTheDocument();
  });

  it('properly categorizes essential and non-essential features', async () => {
    const essentialFeatures = FEATURES.filter(f => f.isEssential);
    const nonEssentialFeatures = FEATURES.filter(f => !f.isEssential);

    expect(essentialFeatures.length).toBeGreaterThan(0);
    expect(nonEssentialFeatures.length).toBeGreaterThan(0);

    // Essential features should all be enabled by default
    essentialFeatures.forEach(feature => {
      expect(feature.enabled).toBe(true);
    });

    // Non-essential features can be either enabled or disabled
    const someEnabled = nonEssentialFeatures.some(f => f.enabled);
    const someDisabled = nonEssentialFeatures.some(f => !f.enabled);
    expect(someEnabled || someDisabled).toBe(true);
  });
});
