"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import React from "react";
import { Parallax } from "react-scroll-parallax";

export default function InnovationBadge() {
  const texts = [
    "Build Ecosystem",
    "Spark Innovation",
    "Foster Collaboration",
  ];
  const [index, setIndex] = React.useState(0);

  // ganti teks setiap 1 detik
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, 1000);
    return () => clearInterval(interval);
  }, [texts.length]);

  const variants = {
    enter: { y: "100%", opacity: 0 },
    center: { y: "0%", opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  };

  return (
    <Parallax speed={0.08}>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40 overflow-hidden h-7">
        <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
        <div className="relative h-5 w-[200px] overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={index}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-start"
            >
              {texts[index]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </Parallax>
  );
}
