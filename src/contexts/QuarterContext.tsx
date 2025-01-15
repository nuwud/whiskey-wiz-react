import React, { createContext, useContext, useEffect, useState } from 'react';
import { Quarter, WhiskeySample } from '../types/game';
import { quarterService } from '../services/quarterService';
import { useAuth } from './AuthContext';

interface QuarterContextType {
  currentQuarter: Quarter | null;
  quarterCode: string | null;
  isLoading: boolean;
  error: string | null;
  samples: WhiskeySample[];
  setQuarterByCode: (code: string) => Promise<void>;
  refreshQuarter: () => Promise<void>;
}

const QuarterContext = createContext<QuarterContextType | undefined>(undefined);

interface QuarterProviderProps {
  children: React.ReactNode;
  code?: string;
}

export function QuarterProvider({ children, code }: QuarterProviderProps) {
  const [currentQuarter, setCurrentQuarter] = useState<Quarter | null>(null);
  const [quarterCode, setQuarterCode] = useState<string | null>(code || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<WhiskeySample[]>([]);
  const { currentUser } = useAuth();

  const loadQuarter = async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const quarter = await quarterService.getQuarterByCode(code);
      if (!quarter) {
        throw new Error('Quarter not found');
      }
      setCurrentQuarter(quarter);
      setSamples(quarter.samples);
      setQuarterCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quarter');
      setCurrentQuarter(null);
      setSamples([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (quarterCode) {
      loadQuarter(quarterCode);
    }
  }, [quarterCode]);

  const setQuarterByCode = async (code: string) => {
    await loadQuarter(code);
  };

  const refreshQuarter = async () => {
    if (quarterCode) {
      await loadQuarter(quarterCode);
    }
  };

  const value: QuarterContextType = {
    currentQuarter,
    quarterCode,
    isLoading,
    error,
    samples,
    setQuarterByCode,
    refreshQuarter
  };

  return (
    <QuarterContext.Provider value={value}>
      {children}
    </QuarterContext.Provider>
  );
}

export function useQuarter() {
  const context = useContext(QuarterContext);
  if (!context) {
    throw new Error('useQuarter must be used within a QuarterProvider');
  }
  return context;
}