import { motion } from "framer-motion";

type NavDotsProps = {
  total: number;
  activeIndex: number;
  onGo: (i: number) => void;
};

export function NavDots({ total, activeIndex, onGo }: NavDotsProps) {
  return (
    <nav className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3">
      {Array.from({ length: total }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={i}
            onClick={() => onGo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active ? "true" : undefined}
            className="group relative grid place-items-center"
          >
            <motion.span
              layout
              animate={{ width: active ? 28 : 8, backgroundColor: active ? "rgb(99 102 241)" : "rgba(163,163,163,0.7)" }} // indigo-500 vs neutral-400/70
              transition={{ type: "spring", stiffness: 520, damping: 34 }}
              className="h-2 rounded-full"
            />
          </button>
        );
      })}
    </nav>
  );
}
