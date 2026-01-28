"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Currency = "USD" | "IDR" | "EUR" | "JPY" | "GBP" | "AUD" | "CAD" | "SGD" | "KRW" | "VND" | "INR" | "PHP" | "THB" | "MYR";

export interface CurrencyOption {
  code: Currency;
  name: string;
  flag: string;
  symbol: string;
}

export const DEFAULT_CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸", symbol: "$" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩", symbol: "Rp" },
  { code: "EUR", name: "Euro", flag: "🇪🇺", symbol: "€" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", symbol: "¥" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", symbol: "£" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", symbol: "C$" },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", symbol: "S$" },
  { code: "KRW", name: "South Korean Won", flag: "🇰🇷", symbol: "₩" },
  { code: "VND", name: "Vietnamese Dong", flag: "🇻🇳", symbol: "₫" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳", symbol: "₹" },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭", symbol: "₱" },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭", symbol: "฿" },
  { code: "MYR", name: "Malaysian Ringgit", flag: "🇲🇾", symbol: "RM" },
];

export type CurrencyDropdownVariant = "default" | "compact" | "minimal" | "simple";
export type CurrencyDropdownSize = "sm" | "md" | "lg";

export interface CurrencyDropdownAdvancedProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  loading?: boolean;
  className?: string;
  options?: CurrencyOption[];
  variant?: CurrencyDropdownVariant;
  size?: CurrencyDropdownSize;
  showName?: boolean;
  showSymbol?: boolean;
  showSearch?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Advanced Currency Dropdown Component
 * 
 * A highly customizable currency selector with multiple variants and sizes.
 * 
 * @param value - Currently selected currency code
 * @param onChange - Callback when currency changes
 * @param loading - Show loading state
 * @param className - Additional CSS classes
 * @param options - Custom currency options (defaults to DEFAULT_CURRENCY_OPTIONS)
 * @param variant - Visual variant: "default" | "compact" | "minimal" | "simple"
 * @param size - Size: "sm" | "md" | "lg"
 * @param showName - Show currency name in button (default: true for default variant)
 * @param showSymbol - Show currency symbol in dropdown (default: true)
 * @param showSearch - Show search input (default: true)
 * @param placeholder - Search input placeholder
 * @param disabled - Disable the dropdown
 * 
 * @example
 * // Default variant (PageClient style)
 * <CurrencyDropdownAdvanced 
 *   value={currency} 
 *   onChange={setCurrency} 
 * />
 * 
 * @example
 * // Compact variant
 * <CurrencyDropdownAdvanced 
 *   value={currency} 
 *   onChange={setCurrency}
 *   variant="compact"
 *   size="sm"
 * />
 * 
 * @example
 * // Minimal variant (no border, transparent)
 * <CurrencyDropdownAdvanced 
 *   value={currency} 
 *   onChange={setCurrency}
 *   variant="minimal"
 *   showName={false}
 * />
 */
export function CurrencyDropdownAdvanced({
  value,
  onChange,
  loading = false,
  className = "",
  options = DEFAULT_CURRENCY_OPTIONS,
  variant = "default",
  size = "md",
  showName,
  showSymbol = true,
  showSearch = true,
  placeholder = "Search currency...",
  disabled = false,
}: CurrencyDropdownAdvancedProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const selectedOption = options.find(opt => opt.code === value);
  
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectOption = (option: CurrencyOption) => {
    onChange(option.code);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Default showName based on variant
  const shouldShowName = showName ?? (variant === "default");

  // Size classes
  const sizeClasses = {
    sm: {
      button: "px-2 py-1.5 text-xs min-w-[120px]",
      flag: "text-sm",
      icon: "w-3 h-3",
      dropdown: "text-xs",
      option: "px-3 py-2",
    },
    md: {
      button: "px-4 py-3 text-sm min-w-[200px]",
      flag: "text-lg",
      icon: "w-4 h-4",
      dropdown: "text-sm",
      option: "px-4 py-3",
    },
    lg: {
      button: "px-6 py-4 text-base min-w-[240px]",
      flag: "text-xl",
      icon: "w-5 h-5",
      dropdown: "text-base",
      option: "px-5 py-4",
    },
  };

  const sizes = sizeClasses[size];

  // Variant styles
  const variantStyles = {
    default: {
      button: "rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-black/20 dark:border-white/20 shadow-lg hover:shadow-xl hover:border-black/30 dark:hover:border-white/30",
      dropdown: "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-black/20 dark:border-white/20 rounded-xl shadow-2xl",
      search: "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg",
      option: "hover:bg-gray-100 dark:hover:bg-gray-800",
      selected: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    },
    compact: {
      button: "rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 shadow-sm hover:shadow-md hover:border-slate-400 dark:hover:border-slate-500",
      dropdown: "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-xl",
      search: "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md",
      option: "hover:bg-slate-50 dark:hover:bg-slate-800",
      selected: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400",
    },
    minimal: {
      button: "rounded-lg bg-transparent border-0 shadow-none hover:bg-black/5 dark:hover:bg-white/5",
      dropdown: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl",
      search: "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md",
      option: "hover:bg-slate-50 dark:hover:bg-slate-800",
      selected: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
    },
    simple: {
      button: "rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500",
      dropdown: "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg",
      search: "bg-slate-100 dark:bg-slate-700 border-0 rounded",
      option: "hover:bg-slate-100 dark:hover:bg-slate-700",
      selected: "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={loading || disabled}
        className={`flex items-center justify-between gap-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${styles.button} ${sizes.button}`}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
      >
        <div className="flex items-center gap-2">
          <span className={sizes.flag}>{selectedOption?.flag}</span>
          <span className="text-gray-900 dark:text-white">{selectedOption?.code}</span>
          {shouldShowName && (
            <span className="text-gray-500 dark:text-gray-400 hidden sm:block">
              ({selectedOption?.name})
            </span>
          )}
        </div>
        <motion.svg
          className={`${sizes.icon} text-gray-500`}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
            />
            
            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`absolute top-full mt-2 left-0 right-0 z-[9999] max-h-80 overflow-hidden ${styles.dropdown} ${sizes.dropdown}`}
            >
              {/* Search Input */}
              {showSearch && (
                <div className="p-3 border-b border-black/10 dark:border-white/10">
                  <div className="relative">
                    <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${sizes.icon} text-gray-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 ${sizes.dropdown} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${styles.search}`}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <motion.button
                      key={option.code}
                      type="button"
                      onClick={() => selectOption(option)}
                      className={`w-full flex items-center gap-3 text-left transition-colors ${sizes.option} ${
                        option.code === value ? styles.selected : `text-gray-900 dark:text-white ${styles.option}`
                      }`}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className={sizes.flag}>{option.flag}</span>
                      <div className="flex-1">
                        <div className="font-medium">{option.code}</div>
                        <div className={`${size === 'sm' ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400`}>{option.name}</div>
                      </div>
                      {showSymbol && (
                        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-mono text-gray-400`}>{option.symbol}</span>
                      )}
                      {option.code === value && (
                        <svg className={`${sizes.icon} ${option.code === value ? 'text-current' : 'text-blue-600 dark:text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </motion.button>
                  ))
                ) : (
                  <div className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${sizes.dropdown}`}>
                    <div className="text-2xl mb-2">🔍</div>
                    <div>No currencies found</div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CurrencyDropdownAdvanced;
