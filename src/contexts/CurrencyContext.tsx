"use client";

import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency, DEFAULT_CURRENCY, fetchExchangeRates } from '@/lib/currency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: Record<string, number>;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

interface CurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: Currency;
}

export function CurrencyProvider({ 
  children, 
  defaultCurrency = DEFAULT_CURRENCY 
}: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refreshRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchExchangeRates();
      setRates(data.rates);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      
      // console.log('Exchange rates updated:', {
      //   currencyCount: Object.keys(data.rates).length,
      //   timestamp: data.lastUpdated,
      //   sampleRates: {
      //     USD: data.rates.USD,
      //     IDR: data.rates.IDR,
      //     EUR: data.rates.EUR
      //   }
      // });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rates';
      setError(errorMessage);
      // console.error('Currency rates fetch failed:', errorMessage);
      
      // Keep existing rates if available, otherwise use fallback
      setRates((current) => Object.keys(current).length <= 1
        ? { USD: 1, IDR: 16000, EUR: 0.92, JPY: 150 }
        : current);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    refreshRates();

    // Refresh every hour
    const interval = setInterval(refreshRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshRates]);

  // Persist currency selection in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fmg-currency');
      if (stored) {
        const storedCurrency = stored as Currency;
        // Validate it's a supported currency
        const supportedCurrencies = ['USD', 'IDR', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'SGD'];
        if (supportedCurrencies.includes(storedCurrency)) {
          setCurrency(storedCurrency);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fmg-currency', currency);
    }
  }, [currency]);

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    rates,
    loading,
    error,
    lastUpdated,
    refreshRates
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}
