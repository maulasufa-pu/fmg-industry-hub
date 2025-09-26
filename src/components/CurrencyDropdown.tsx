"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Currency, CURRENCY_OPTIONS, CurrencyOption } from '@/lib/currency';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CurrencyDropdownProps {
  className?: string;
  showStatus?: boolean;
  compact?: boolean;
}

export function CurrencyDropdown({ 
  className = "", 
  showStatus = true,
  compact = false 
}: CurrencyDropdownProps) {
  const { currency, setCurrency, loading, error, lastUpdated } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  const selectedOption = CURRENCY_OPTIONS.find(opt => opt.code === currency);
  
  const filteredOptions = CURRENCY_OPTIONS.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectOption = (option: CurrencyOption) => {
    setCurrency(option.code);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`
          flex items-center justify-between gap-2 rounded-xl backdrop-blur-sm border transition-all duration-200 
          hover:shadow-lg disabled:opacity-50
          ${compact 
            ? 'px-3 py-2 text-sm min-w-[140px] bg-white/80 dark:bg-gray-900/80 border-black/20 dark:border-white/20 hover:border-black/30 dark:hover:border-white/30' 
            : 'px-4 py-3 text-sm font-medium min-w-[200px] bg-white/80 dark:bg-gray-900/80 border-black/20 dark:border-white/20 shadow-lg hover:shadow-xl hover:border-black/30 dark:hover:border-white/30'
          }
        `}
        whileHover={{ scale: compact ? 1.01 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <span className={compact ? "text-base" : "text-lg"}>{selectedOption?.flag}</span>
          <span className="text-gray-900 dark:text-white font-medium">{selectedOption?.code}</span>
          {!compact && (
            <span className="text-gray-500 dark:text-gray-400 hidden sm:block">
              ({selectedOption?.name})
            </span>
          )}
        </div>
        <motion.svg
          className="w-4 h-4 text-gray-500"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      {/* Status Indicators */}
      {showStatus && !compact && (
        <div className="mt-2 flex justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
              Updating rates...
            </div>
          )}
          
          {error && !loading && (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
              ⚠️ Using cached rates
            </div>
          )}
          
          {!loading && !error && lastUpdated && (
            <div className="text-xs text-green-600 dark:text-green-400">
              ✅ Live rates ({new Date(lastUpdated).toLocaleTimeString()})
            </div>
          )}
        </div>
      )}

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
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
            
            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: buttonRect ? Math.min(buttonRect.bottom + 8, window.innerHeight - 320) : 0,
                left: buttonRect ? Math.max(8, Math.min(buttonRect.left, window.innerWidth - 250)) : 0,
                width: compact ? 200 : 250,
                maxWidth: 'calc(100vw - 16px)',
              }}
              className="z-50 bg-neutral-950/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl max-h-80 overflow-hidden"
            >
              {/* Search Input */}
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search currency..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-900/60 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/60 focus:border-fuchsia-400/60"
                    autoFocus
                  />
                </div>
              </div>

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <motion.button
                      key={option.code}
                      type="button"
                      onClick={() => selectOption(option)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                        option.code === currency ? 'bg-fuchsia-400/10 text-fuchsia-300' : 'text-white'
                      }`}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className="text-xl">{option.flag}</span>
                      <div className="flex-1">
                        <div className="font-medium">{option.code}</div>
                        <div className="text-xs text-white/70">{option.name}</div>
                      </div>
                      <span className="text-sm font-mono text-white/60">{option.symbol}</span>
                      {option.code === currency && (
                        <svg className="w-4 h-4 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </motion.button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
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