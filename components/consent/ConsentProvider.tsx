'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getAnalyticsConsent, setAnalyticsConsent } from '@/lib/consent';

interface ConsentContextType {
  analyticsEnabled: boolean;
  setAnalyticsEnabled: (enabled: boolean) => void;
  isLoaded: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

interface ConsentProviderProps {
  children: ReactNode;
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const [analyticsEnabled, setAnalyticsEnabledState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load consent state from cookie on mount
  useEffect(() => {
    const consent = getAnalyticsConsent();
    setAnalyticsEnabledState(consent);
    setIsLoaded(true);
  }, []);

  const setAnalyticsEnabled = useCallback((enabled: boolean) => {
    setAnalyticsConsent(enabled);
    setAnalyticsEnabledState(enabled);
  }, []);

  return (
    <ConsentContext.Provider
      value={{
        analyticsEnabled,
        setAnalyticsEnabled,
        isLoaded,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextType {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}
