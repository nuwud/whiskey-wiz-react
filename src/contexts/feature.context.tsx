import React, { createContext, useContext, useState } from 'react';

interface FeatureFlags {
  enableMachineLearning: boolean;
  enableSocialFeatures: boolean;
  enableShopifyIntegration: boolean;
}

interface FeatureContextType {
  features: FeatureFlags;
  toggleFeature: (featureName: keyof FeatureFlags) => void;
}

const defaultFeatures: FeatureFlags = {
  enableMachineLearning: false,
  enableSocialFeatures: true,
  enableShopifyIntegration: false
};

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const FeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures);

  const toggleFeature = (featureName: keyof FeatureFlags) => {
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

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};