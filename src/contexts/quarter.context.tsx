import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Quarter {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  samples: any[];
}

interface QuarterContextType {
  currentQuarter: Quarter | null;
  loading: boolean;
  error: string | null;
}

const QuarterContext = createContext<QuarterContextType | undefined>(undefined);

export const QuarterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentQuarter, setCurrentQuarter] = useState<Quarter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentQuarter = async () => {
      try {
        const q = query(
          collection(db, 'quarters'),
          where('isActive', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const quarterDoc = querySnapshot.docs[0];
          setCurrentQuarter({
            id: quarterDoc.id,
            ...quarterDoc.data()
          } as Quarter);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching quarter');
      } finally {
        setLoading(false);
      }
    };

    void fetchCurrentQuarter();
  }, []);

  return (
    <QuarterContext.Provider value={{ currentQuarter, loading, error }}>
      {!loading && children}
    </QuarterContext.Provider>
  );
};

export const useQuarter = () => {
  const context = useContext(QuarterContext);
  if (context === undefined) {
    throw new Error('useQuarter must be used within a QuarterProvider');
  }
  return context;
};