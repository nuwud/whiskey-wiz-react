// src/contexts/feature.context.tsx
import React, { createContext, useState, useEffect } from 'react';
import { featureFlags } from '../config/feature-flags.config';

export interface FeatureContextType {
  features: typeof featureFlags;
  toggleFeature: (featureName: keyof typeof featureFlags) => void;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const FeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<typeof featureFlags>(featureFlags);
  const [isInitialized, setIsInitialized] = useState(false);

  const toggleFeature = (featureName: keyof typeof featureFlags) => {
    setFeatures(prev => ({
      ...prev,
      [featureName]: !prev[featureName]
    }));
  };

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const value = {
    features,
    toggleFeature
  };

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
};

export { FeatureContext };