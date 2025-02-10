import React, { createContext, useState } from 'react';
import { featureFlags } from '../config/feature-flags.config';

export interface FeatureContextType {
  features: typeof featureFlags;
  toggleFeature: (featureName: keyof typeof featureFlags) => void;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const FeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<typeof featureFlags>(featureFlags);

  const toggleFeature = (featureName: keyof typeof featureFlags) => {
    setFeatures(prev => ({
      ...prev,
      [featureName]: !prev[featureName]
    }));
  };

  return (
    <FeatureContext.Provider value={{ features, toggleFeature }}>
      {children}
    </FeatureContext.Provider>
  );
};

export { FeatureContext };