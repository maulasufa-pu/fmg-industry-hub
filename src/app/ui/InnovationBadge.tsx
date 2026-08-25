"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTheme } from "next-themes";

export default function InnovationBadge() {
  const texts = React.useMemo(
    () => ["Flemmo Music", "Build Ecosystem", "Spark Innovation", "Foster Collaboration"],
    []
  );

  // state
  const [index, setIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const { theme } = useTheme();

  // mount flag —> penting untuk elak mismatch
  React.useEffect(() => {
    setMounted(true);
    setIndex(0); // pastikan starting text stabil
  }, []);

  const stayMs = 1500;
  const animMs = 500;

  // rotasi teks setelah mounted
  React.useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      setIndex((p) => (p + 1) % texts.length);
    }, stayMs + animMs);
    return () => clearTimeout(t);
  }, [mounted, index, texts.length, stayMs, animMs]);

  // variants teks
  const variants = {
    enter: { y: "100%", opacity: 0 },
    center: { y: "0%", opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  } as const;

  // status
  const isFlemmo = texts[index] === "Flemmo Music";
  const isDark = theme === "dark";

  // Base style untuk konsistensi SSR/CSR
  const baseStyle = React.useMemo(() => {
    if (!mounted) {
      // SSR default - border version
      return {
        backgroundColor: "transparent",
        borderColor: "rgba(239, 68, 68, 0.5)", // red-500/50
        borderWidth: "1px",
        color: isDark ? "rgb(243, 244, 246)" : "rgb(17, 24, 39)", // gray-100 : gray-900
      };
    }
    
    if (isFlemmo) {
      // Flemmo Music - filled version
      return {
        backgroundColor: "rgb(220, 38, 38)", // red-600
        borderColor: "rgb(220, 38, 38)", // red-600
        borderWidth: "1px",
        color: "white",
        boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.5)",
      };
    } else {
      // Other texts - border version
      return {
        backgroundColor: "transparent",
        borderColor: isDark ? "rgba(248, 113, 113, 0.5)" : "rgba(239, 68, 68, 0.5)", // red-400/50 : red-500/50
        borderWidth: "1px",
        color: isDark ? "rgb(243, 244, 246)" : "rgb(17, 24, 39)", // gray-100 : gray-900
        boxShadow: isDark ? "0 4px 15px -2px rgba(248, 113, 113, 0.3)" : "0 4px 15px -2px rgba(239, 68, 68, 0.3)",
      };
    }
  }, [mounted, isFlemmo, isDark]);

  // Live animate properties
  const liveAnimate = React.useMemo(() => {
    if (!mounted) return {};
    return baseStyle;
  }, [mounted, baseStyle]);

  // Icon class
  const iconClass = React.useMemo(() => {
    if (!mounted) return "text-red-600 dark:text-red-300";
    if (isFlemmo) return "text-white";
    return isDark ? "text-red-400" : "text-red-600";
  }, [mounted, isFlemmo, isDark]);

  return (
    <motion.div
      data-no-translate
      initial={false}                    // jangan inject state awal beda dengan SSR
      animate={liveAnimate}              // hanya aktif setelah mounted
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="mb-4 inline-flex h-7 items-center justify-center gap-2 overflow-hidden rounded-full px-8 py-5"
      style={baseStyle}                  // SSR & CSR(1) sama persis
      suppressHydrationWarning={true}
    >
      <Sparkles className={`h-4 w-4 shrink-0 ${iconClass}`} />

      <div className="relative flex h-5 min-w-[190px] items-center justify-center overflow-hidden">
        {/* AnimatePresence boleh, tapi struktur tetap sama */}
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={index}                   // node tetap <span> apapun state-nya
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: animMs / 1000, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center text-sm font-medium"
          >
            {texts[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
