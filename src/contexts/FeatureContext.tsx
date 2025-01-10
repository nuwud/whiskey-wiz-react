import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface FeatureState {
  id: string;
  name: string;
  enabled: boolean;
  requiresRefresh: boolean;
}

interface FeatureContextType {
  features: Record<string, FeatureState>;
  loading: boolean;
  toggleFeature?: (id: string, enabled: boolean) => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType>({ features: {}, loading: true });

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<Record<string, FeatureState>>({}); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const featuresRef = collection(db, 'features');
    const q = query(featuresRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const featureData: Record<string, FeatureState> = {};
      snapshot.forEach((doc) => {
        featureData[doc.id] = doc.data() as FeatureState;
      });
      setFeatures(featureData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleFeature = async (id: string, enabled: boolean) => {
    const featureRef = doc(db, 'features', id);
    await updateDoc(featureRef, { enabled });
    
    // Dispatch event for feature change
    window.dispatchEvent(new CustomEvent('featureToggled', { 
      detail: { 
        featureId: id, 
        enabled,
        requiresRefresh: features[id]?.requiresRefresh 
      }
    }));
  };

  return (
    <FeatureContext.Provider value={{ features, loading, toggleFeature }}>
      {children}
    </FeatureContext.Provider>
  );
}

export const useFeature = (featureId: string) => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeature must be used within a FeatureProvider');
  }

  return {
    ...context.features[featureId],
    enabled: context.features[featureId]?.enabled ?? false,
    loading: context.loading
  };
};
