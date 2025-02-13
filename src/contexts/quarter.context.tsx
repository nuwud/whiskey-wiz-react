import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../config/firebase';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
import { collection, query, where, getDocs, onSnapshot, Unsubscribe, doc, getDoc } from 'firebase/firestore';
import { Quarter } from '../types/game.types';
import { useAuth } from './auth.context';

interface QuarterContextType {
  currentQuarter: Quarter | null;
  previousQuarter: Quarter | null;
  nextQuarter: Quarter | null;
  loading: boolean;
  error: string | null;
  refreshQuarter: () => Promise<void>;
  transitionToQuarter: (quarterId: string) => Promise<void>;
  quarterCache: Map<string, Quarter>;
}

interface QuarterProviderProps {
  children: React.ReactNode;
}

interface CachedQuarter extends Quarter {
  cachedAt: number;
}

const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
const CACHE_KEY = 'quarterCache';

const QuarterContext = createContext<QuarterContextType | undefined>(undefined);

export const QuarterProvider: React.FC<QuarterProviderProps> = ({ children }) => {
  const [currentQuarter, setCurrentQuarter] = useState<Quarter | null>(null);
  const [previousQuarter, setPreviousQuarter] = useState<Quarter | null>(null);
  const [nextQuarter, setNextQuarter] = useState<Quarter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quarterCache] = useState<Map<string, CachedQuarter>>(new Map());

  const { user } = useAuth();

  const getCachedQuarter = (id: string): Quarter | null => {
    const cached = quarterCache.get(id);
    if (!cached) return null;
    
    if (Date.now() - cached.cachedAt > CACHE_DURATION) {
      quarterCache.delete(id);
      return null;
    }
    
    return cached;
  };

  const cacheQuarter = (quarter: Quarter) => {
    quarterCache.set(quarter.id, {
      ...quarter,
      cachedAt: Date.now()
    });
  };

  const clearCache = () => {
    quarterCache.clear();
    localStorage.removeItem(CACHE_KEY);
  };

  const handleError = (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    setError(errorMessage);
    console.error('Quarter context error:', error);
  };
  
  // Real-time updates for active quarter
  useEffect(() => {
    let unsubscribe: Unsubscribe;

    const subscribeToActiveQuarter = async () => {
      try {
        const q = query(
          collection(db, 'quarters'),
          where('isActive', '==', true)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const quarterDoc = snapshot.docs[0];
            const quarterData = {
              id: quarterDoc.id,
              ...quarterDoc.data()
            } as Quarter;

            setCurrentQuarter(quarterData);
            cacheQuarter(quarterData);
          }
        }, (error) => {
          clearCache(); // Clear cache on subscription error
          handleError(error);
        });
      } catch (err) {
        clearCache();
        handleError(err);
      }
    };

    void subscribeToActiveQuarter();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Fetch adjacent quarters
  useEffect(() => {
    const fetchAdjacentQuarters = async () => {
      if (!currentQuarter) return;

      try {
        // Fetch previous quarter
        const prevQ = query(
          collection(db, 'quarters'),
          where('endDate', '<', currentQuarter.startDate),
          where('isActive', '==', false)
        );
        const prevSnapshot = await getDocs(prevQ);
        if (!prevSnapshot.empty) {
          const prevQuarterData = {
            id: prevSnapshot.docs[0].id,
            ...prevSnapshot.docs[0].data()
          } as Quarter;
          setPreviousQuarter(prevQuarterData);
          cacheQuarter(prevQuarterData);
        }

        // Fetch next quarter
        const nextQ = query(
          collection(db, 'quarters'),
          where('startDate', '>', currentQuarter.endDate),
          where('isActive', '==', false)
        );
        const nextSnapshot = await getDocs(nextQ);
        if (!nextSnapshot.empty) {
          const nextQuarterData = {
            id: nextSnapshot.docs[0].id,
            ...nextSnapshot.docs[0].data()
          } as Quarter;
          setNextQuarter(nextQuarterData);
          cacheQuarter(nextQuarterData);
        }
      } catch (err) {
        handleError(err);
      }
    };

    void fetchAdjacentQuarters();
  }, [currentQuarter]);

  const refreshQuarter = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'quarters'),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const quarterDoc = querySnapshot.docs[0];
        const quarterData = {
          id: quarterDoc.id,
          ...quarterDoc.data()
        } as Quarter;

        setCurrentQuarter(quarterData);
        cacheQuarter(quarterData);
      }
    } catch (err) {
      clearCache();
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const transitionToQuarter = useCallback(async (quarterId: string) => {
    setLoading(true);
    try {
      // Check cache first
      const cached = getCachedQuarter(quarterId);
      if (cached) {
        setCurrentQuarter(cached);
        return;
      }

      // Fetch from Firestore if not cached
      const quarterRef = doc(db, 'quarters', quarterId);
      const quarterSnap = await getDoc(quarterRef);

      if (quarterSnap.exists()) {
        const quarterData = {
          id: quarterSnap.id,
          ...quarterSnap.data()
        } as Quarter;

        cacheQuarter(quarterData);
        setCurrentQuarter(quarterData);
      } else {
        throw new Error('Quarter not found');
      }
    } catch (err) {
      clearCache(); // Clear cache on transition error
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshQuarter();
  }, [refreshQuarter]);

  const value = {
    currentQuarter,
    previousQuarter,
    nextQuarter,
    loading,
    error,
    refreshQuarter,
    transitionToQuarter,
    quarterCache
  };

  return (
    <QuarterContext.Provider value={value}>
      {error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="p-4 text-center">
            <h2 className="text-xl font-bold text-red-600">Error Loading Quarter Data</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button 
              onClick={refreshQuarter}
              className="px-4 py-2 mt-4 text-white rounded bg-amber-600 hover:bg-amber-700"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </QuarterContext.Provider>
  );
};

export const useQuarter = (): QuarterContextType => {
  const context = useContext(QuarterContext);
  if (context === undefined) {
    throw new Error('useQuarter must be used within a QuarterProvider');
  }
  return context;
};
