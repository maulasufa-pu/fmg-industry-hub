"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import React from "react";
import { useTheme } from "next-themes";

export default function InnovationBadge() {
  const texts = [
    "Flemmo Music",
    "Build Ecosystem",
    "Spark Innovation",
    "Foster Collaboration",
  ];
  const [index, setIndex] = React.useState(0);
  const { theme } = useTheme();

  const stayDuration = 1500; // 1.5s
  const animDuration = 500; // 0.5s

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, stayDuration + animDuration);
    return () => clearTimeout(timer);
  }, [index, texts.length]);

  const variants = {
    enter: { y: "100%", opacity: 0 },
    center: { y: "0%", opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  };

  const isFlemmo = texts[index] === "Flemmo Music";
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={false}
      animate={{
        backgroundColor: isFlemmo ? "rgb(220,38,38)" : "rgba(0,0,0,0)",
        borderColor: isFlemmo ? "rgb(220,38,38)" : "rgba(239,68,68,0.5)",
        boxShadow: isFlemmo
          ? "0 0 18px rgba(239,68,68,0.9)"
          : "0 0 12px rgba(239,68,68,0.7)",
        color: isDark ? "#fff" : "#000", // adaptif light/dark
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="mb-4 inline-flex items-center justify-center gap-2 rounded-full 
                 px-8 py-5 text-s overflow-hidden h-7"
    >
      <Sparkles
        className={`h-4 w-4 shrink-0 ${
          isDark ? "text-red-300" : "text-red-600"
        }`}
      />
      <div className="relative h-5 min-w-[190px] overflow-hidden flex items-center justify-center">
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={index}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: animDuration / 1000, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {texts[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
