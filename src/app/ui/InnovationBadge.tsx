"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import React from "react";

export default function InnovationBadge() {
  const texts = ["Build Ecosystem", "Spark Innovation", "Foster Collaboration"];
  const [index, setIndex] = React.useState(0);

  // Durasi tampil (2 detik) + durasi animasi (0.5s masuk + 0.5s keluar)
  const stayDuration = 1500; // 1s
  const animDuration = 500;  // 0.5s

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, stayDuration + animDuration); // total siklus
    return () => clearTimeout(timer);
  }, [index, texts.length]);

  const variants = {
    enter: { y: "100%", opacity: 0 },
    center: { y: "0%", opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  };

  return (
    <div className="mb-4 inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-1 text-xs shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40 overflow-hidden h-7">
      <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
      <div className="relative h-5 min-w-[140px] overflow-hidden flex items-center justify-center">
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
    </div>
  );
}
