"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "./Portal";
import { Currency, CURRENCY_OPTIONS, CurrencyOption } from "@/lib/currency";
import { useCurrency } from "@/contexts/CurrencyContext";

interface CurrencyDropdownProps {
  className?: string;
  showStatus?: boolean;
  compact?: boolean;
}

export function CurrencyDropdown({
  className = "",
  showStatus = true,
  compact = false,
}: CurrencyDropdownProps) {
  const { currency, setCurrency, loading, error, lastUpdated } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    CURRENCY_OPTIONS.find((opt) => opt.code === currency) ?? {
      code: (currency as Currency) ?? "USD",
      name: "Unknown Currency",
      flag: "💱",
      symbol: "$",
    };

  const filteredOptions = useMemo(
    () =>
      CURRENCY_OPTIONS.filter(
        (option) =>
          option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.code.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm]
  );

  const selectOption = (option: CurrencyOption) => {
    setCurrency(option.code);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = () => setIsOpen((v) => !v);

  // POSISI: fixed + clamp viewport, TANPA scroll offset
  const positionDropdown = useCallback(() => {
    const btn = buttonRef.current;
    const panel = dropdownRef.current;
    if (!btn || !panel) return;

    const rect = btn.getBoundingClientRect();
    const desiredW = compact ? 200 : 250;
    const gap = 8;

    panel.style.position = "fixed";
    panel.style.zIndex = "1001"; // di atas popover lain
    const maxW = Math.min(desiredW, window.innerWidth - 16);
    panel.style.width = `${maxW}px`;

    // default di bawah kiri
    let top = rect.bottom + gap;
    let left = rect.left;

    // clamp kiri-kanan
    const minLeft = 8;
    const maxLeft = window.innerWidth - maxW - 8;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // hitung tinggi aktual panel
    const ph = panel.offsetHeight || 320;

    // kalau tumpah bawah → flip ke atas jika muat
    if (top + ph > window.innerHeight - 8) {
      const flipTop = rect.top - gap - ph;
      if (flipTop >= 8) {
        top = flipTop;
        panel.style.maxHeight = "";
        panel.style.overflowY = "";
      } else {
        // tidak muat atas/bawah → batasi tinggi, tetap di bawah
        const maxHeight = Math.max(200, window.innerHeight - rect.bottom - gap - 16);
        panel.style.maxHeight = `${maxHeight}px`;
        panel.style.overflowY = "auto";
      }
    } else {
      panel.style.maxHeight = "320px";
      panel.style.overflowY = "hidden";
    }

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
  }, [compact]);

  // buka: posisikan, listener, auto-scroll anchor agar terlihat
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(t)) return;
      if (buttonRef.current && buttonRef.current.contains(t)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const handleScrollOrResize = () => positionDropdown();

    // posisikan setelah render
    requestAnimationFrame(() => {
      positionDropdown();
      // auto-scroll ke tombol agar panel pasti terlihat
      buttonRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
      // focus on search input for quick UX
      const input = dropdownRef.current?.querySelector<HTMLInputElement>("input[data-cdd-search='1']");
      input?.focus();
    });

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, positionDropdown]);

  return (
    <div className={className}>
      {/* Trigger */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={[
          "flex items-center justify-between gap-2 rounded-xl border transition-all duration-200",
          "hover:shadow-lg disabled:opacity-50 bg-white/10 border-white/20 text-white",
          "hover:bg-white/20 hover:border-white/30",
          compact
            ? "px-3 py-2 text-sm min-w-[140px]"
            : "px-4 py-3 text-sm font-medium min-w-[200px] shadow-lg hover:shadow-xl",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className={compact ? "text-base" : "text-lg"}>{selectedOption.flag}</span>
          <span className="text-white font-medium">{selectedOption.code}</span>
          {!compact && <span className="text-white/70 hidden sm:block">({selectedOption.name})</span>}
        </div>
        <svg
          className={`w-4 h-4 text-white/70 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Status bawah tombol (opsional) */}
      {showStatus && !compact && (
        <div className="mt-2 flex justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-fuchsia-400" />
              Updating rates...
            </div>
          )}
          {error && !loading && (
            <div className="text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded-full">
              ⚠️ Using cached rates
            </div>
          )}
          {!loading && !error && lastUpdated && (
            <div className="text-xs text-emerald-400">✅ Live rates ({new Date(lastUpdated).toLocaleTimeString()})</div>
          )}
        </div>
      )}

      {/* Panel di-portal ke body */}
      <AnimatePresence>
        {isOpen ? (
          <Portal>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.18 }}
              className="fixed z-[1001] bg-neutral-950/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden"
              role="listbox"
              aria-label="Select currency"
              style={{ maxHeight: "320px" }}
            >
              {/* Search */}
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    data-cdd-search="1"
                    type="text"
                    placeholder="Search currency..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-900/60 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/60 focus:border-fuchsia-400/60"
                  />
                </div>
              </div>

              {/* List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => {
                    const active = option.code === currency;
                    return (
                      <motion.button
                        key={option.code}
                        type="button"
                        onClick={() => selectOption(option)}
                        className={[
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                          active ? "bg-fuchsia-400/10 text-fuchsia-300" : "text-white hover:bg-white/10",
                        ].join(" ")}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.15 }}
                        role="option"
                        aria-selected={active}
                      >
                        <span className="text-xl">{option.flag}</span>
                        <div className="flex-1">
                          <div className="font-medium">{option.code}</div>
                          <div className="text-xs text-white/70">{option.name}</div>
                        </div>
                        <span className="text-sm font-mono text-white/60">{option.symbol}</span>
                        {active && (
                          <svg className="w-4 h-4 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <div className="text-2xl mb-2">🔍</div>
                    <div>No currencies found</div>
                  </div>
                )}
              </div>
            </motion.div>
          </Portal>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
