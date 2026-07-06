import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const DEFAULT_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
};

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'AED';

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
];

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  rates: Record<string, number>;
  isLoadingRates: boolean;
  formatPrice: (usdAmount: number, options?: { compact?: boolean; decimals?: number }) => string;
  convertFromUSD: (usdAmount: number) => number;
  currencyInfo: CurrencyInfo;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Default USD; users can switch to their preferred currency (persisted in localStorage).
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window === 'undefined') return 'USD';
    const saved = window.localStorage.getItem('preferred_currency') as CurrencyCode | null;
    return saved && CURRENCIES.some(c => c.code === saved) ? saved : 'USD';
  });
  const rates = DEFAULT_RATES;
  const isLoadingRates = false;
  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    try { window.localStorage.setItem('preferred_currency', code); } catch {}
  }, []);

  const convertFromUSD = useCallback((usdAmount: number): number => {
    const rate = rates[currency] ?? 1;
    return usdAmount * rate;
  }, [currency, rates]);

  const currencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const formatPrice = useCallback((usdAmount: number, options?: { compact?: boolean; decimals?: number }): string => {
    const converted = convertFromUSD(usdAmount);
    const { symbol } = currencyInfo;

    // Smart decimal handling
    let decimals = options?.decimals;
    if (decimals === undefined) {
      if (converted === 0) decimals = 2;
      else if (Math.abs(converted) < 0.01) {
        // Find first significant digit for micro-transactions
        const str = Math.abs(converted).toFixed(8);
        const match = str.match(/0\.0*[1-9]/);
        decimals = match ? match[0].length : 8;
      } else if (Math.abs(converted) < 1) decimals = 4;
      else decimals = 2;
    }

    if (options?.compact && converted >= 1000) {
      if (converted >= 1000000) return `${symbol}${(converted / 1000000).toFixed(1)}M`;
      if (converted >= 1000) return `${symbol}${(converted / 1000).toFixed(1)}K`;
    }

    return `${symbol}${converted.toFixed(decimals)}`;
  }, [convertFromUSD, currencyInfo]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      rates,
      isLoadingRates,
      formatPrice,
      convertFromUSD,
      currencyInfo,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback for components outside provider (like landing page)
    return {
      currency: 'USD' as CurrencyCode,
      setCurrency: () => { },
      rates: DEFAULT_RATES,
      isLoadingRates: false,
      formatPrice: (usdAmount: number) => `₹${(usdAmount * DEFAULT_RATES.INR).toFixed(2)}`,
      convertFromUSD: (usdAmount: number) => usdAmount * DEFAULT_RATES.INR,
      currencyInfo: CURRENCIES[1],
    };
  }
  return context;
}
