"use client";

import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Currency } from '@/lib/currency';
import { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';

interface ClientCurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: Currency;
}

export function ClientCurrencyProvider({ 
  children, 
  defaultCurrency = "USD" as Currency 
}: ClientCurrencyProviderProps) {
  return (
    <LanguageProvider>
      <CurrencyProvider defaultCurrency={defaultCurrency}>
        {children}
      </CurrencyProvider>
    </LanguageProvider>
  );
}
