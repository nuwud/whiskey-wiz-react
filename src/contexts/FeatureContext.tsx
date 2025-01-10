"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiresRefresh: boolean;
  category: string;
}

interface FeatureContextType {
  features: Record<string, Feature>;
  loading: boolean;
  toggleFeature?: (id: string, enabled: boolean) => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType>({
  features: {},
  loading: true,
});

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<Record<string, Feature>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const featuresRef = collection(db, 'features');
    const q = query(featuresRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const featureData: Record<string, Feature> = {};
      snapshot.forEach((doc) => {
        featureData[doc.id] = {
          id: doc.id,
          ...doc.data() as Omit<Feature, 'id'>
        };
      });
      setFeatures(featureData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleFeature = async (id: string, enabled: boolean) => {
    const featureRef = doc(db, 'features', id);
    await updateDoc(featureRef, { enabled });
  };

  return (
    <FeatureContext.Provider value={{ features, loading, toggleFeature }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature(featureId: string) {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeature must be used within a FeatureProvider');
  }

  return {
    ...context.features[featureId],
    enabled: context.features[featureId]?.enabled ?? false,
    loading: context.loading,
  };
}
