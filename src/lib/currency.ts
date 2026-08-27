/**
 * Global Currency System
 * All prices are stored in USD as base currency
 * Users can select display currency
 */

export type Currency = "USD" | "EUR" | "JPY" | "GBP" | "AUD" | "CAD" | "SGD" | "KRW" | "VND" | "INR" | "PHP" | "THB" | "MYR" | "IDR";

export interface CurrencyOption {
  code: Currency;
  name: string;
  flag: string;
  symbol: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸", symbol: "$" },
  { code: "EUR", name: "Euro", flag: "🇪🇺", symbol: "€" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", symbol: "¥" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", symbol: "£" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", symbol: "C$" },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", symbol: "S$" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩", symbol: "Rp" },
  { code: "KRW", name: "South Korean Won", flag: "🇰🇷", symbol: "₩" },
  { code: "VND", name: "Vietnamese Dong", flag: "🇻🇳", symbol: "₫" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳", symbol: "₹" },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭", symbol: "₱" },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭", symbol: "฿" },
  { code: "MYR", name: "Malaysian Ringgit", flag: "🇲🇾", symbol: "RM" },
];

export const DEFAULT_CURRENCY: Currency = "USD";

/**
 * Safe rates used immediately while the live exchange-rate request is pending.
 * Keeping every supported currency here means the selector never has to wait
 * for an external service before it can update prices.
 */
export const FALLBACK_EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  JPY: 150,
  GBP: 0.81,
  AUD: 1.51,
  CAD: 1.37,
  SGD: 1.35,
  KRW: 1380,
  VND: 25400,
  INR: 83.5,
  PHP: 58,
  THB: 35.5,
  MYR: 4.4,
  IDR: 15750,
};

/**
 * Convert USD amount to target currency
 */
export function convertFromUSD(
  usdAmount: number, 
  targetCurrency: Currency, 
  exchangeRates: Record<string, number>
): number {
  if (targetCurrency === "USD") return usdAmount;
  
  const rate = exchangeRates[targetCurrency];
  if (!rate || !Number.isFinite(rate)) {
    // console.warn(`Exchange rate not found for ${targetCurrency}, using USD`);
    return usdAmount;
  }
  
  return usdAmount * rate;
}

/**
 * Format price with currency-specific formatting
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  options: { 
    showSymbol?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { showSymbol = true, compact = false } = options;
  
  try {
    const currencyOption = CURRENCY_OPTIONS.find(opt => opt.code === currency);
    
    // Handle currency-specific decimal places
    let maximumFractionDigits = 2;
    let minimumFractionDigits = 0;
    
    switch (currency) {
      case "JPY":
      case "KRW":
      case "VND":
      case "IDR":
        maximumFractionDigits = 0;
        minimumFractionDigits = 0;
        break;
      default:
        // Major currencies use 2 decimals but hide .00
        if (amount >= 1000 || amount % 1 === 0) {
          maximumFractionDigits = 0;
          minimumFractionDigits = 0;
        } else {
          maximumFractionDigits = 2;
          minimumFractionDigits = 2;
        }
        break;
    }
    
    // Use Intl.NumberFormat for proper locale formatting
    const locale = currency === "IDR" ? "id-ID" : "en-US";
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency,
      maximumFractionDigits,
      minimumFractionDigits,
      notation: compact && amount >= 1000000 ? 'compact' : 'standard'
    });
    
    if (showSymbol && formatter.formatToParts) {
      // Custom formatting for better symbol placement
      const parts = formatter.formatToParts(amount);
      const currencyPart = parts.find(part => part.type === 'currency');
      const valueParts = parts.filter(part => part.type !== 'currency');
      
      if (currencyPart && currencyOption) {
        // Use our custom symbol
        return `${currencyOption.symbol}${valueParts.map(p => p.value).join('')}`;
      }
    }
    
    const formatted = formatter.format(amount);
    
    // Replace standard currency symbols with our custom ones if needed
    if (showSymbol && currencyOption && formatted.includes(currency)) {
      return formatted.replace(currency, currencyOption.symbol);
    }
    
    return formatted;
    
  } catch (error) {
    // console.warn(`Currency formatting failed for ${currency}:`, error);
    const symbol = CURRENCY_OPTIONS.find(opt => opt.code === currency)?.symbol || currency;
    return showSymbol ? `${symbol}${Math.round(amount).toLocaleString()}` : Math.round(amount).toLocaleString();
  }
}

/**
 * Convert and format price from USD base to display currency
 */
export function formatPrice(
  usdBasePrice: number,
  displayCurrency: Currency,
  exchangeRates: Record<string, number>,
  options?: { showSymbol?: boolean; compact?: boolean }
): string {
  const convertedAmount = convertFromUSD(usdBasePrice, displayCurrency, exchangeRates);
  return formatCurrency(convertedAmount, displayCurrency, options);
}

/**
 * Get auto-sizing font class based on price length
 */
export function getPriceFontSize(priceText: string): string {
  const digitCount = priceText.replace(/[^\d]/g, '').length;
  
  if (digitCount <= 2) {
    return "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl";
  } else if (digitCount <= 3) {
    return "text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl";
  } else if (digitCount <= 5) {
    return "text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl";
  } else if (digitCount <= 7) {
    return "text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl";
  } else if (digitCount <= 9) {
    return "text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl";
  } else {
    return "text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl";
  }
}

/**
 * Fetch current exchange rates (same API as main page)
 */
export async function fetchExchangeRates(): Promise<{
  rates: Record<string, number>;
  date?: string;
  lastUpdated?: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('/api/exchange', { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      rates: { ...FALLBACK_EXCHANGE_RATES, ...(data.rates || {}) },
      date: data.date,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    };
  } catch (error) {
    // console.warn('Failed to fetch exchange rates, using fallback:', error);
    return {
      rates: { ...FALLBACK_EXCHANGE_RATES },
      lastUpdated: new Date().toISOString()
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function formatIdrAnchoredPrice(
  idrAmount: number,
  displayCurrency: Currency,
  exchangeRates: Record<string, number>,
): string {
  if (displayCurrency === "IDR") return formatCurrency(idrAmount, "IDR");
  const idrPerUsd = exchangeRates.IDR || 15750;
  const usdAmount = idrAmount / idrPerUsd;
  return formatPrice(usdAmount, displayCurrency, exchangeRates);
}
