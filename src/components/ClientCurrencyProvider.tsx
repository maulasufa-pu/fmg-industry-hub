"use client";

import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Currency } from '@/lib/currency';
import { ReactNode } from 'react';

interface ClientCurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: Currency;
}

export function ClientCurrencyProvider({ 
  children, 
  defaultCurrency = "USD" as Currency 
}: ClientCurrencyProviderProps) {
  return (
    <CurrencyProvider defaultCurrency={defaultCurrency}>
      {children}
    </CurrencyProvider>
  );
}