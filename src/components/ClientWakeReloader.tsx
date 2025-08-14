"use client";
import { useEffect } from "react";
import { WAKE_EVENT } from "@/lib/wakeRefetch"; // pastikan: export const WAKE_EVENT = 'client-refresh' as const;

export default function ClientWakeReloader() {
  useEffect(() => {
    const DEBOUNCE_MS = 2000;
    let last = 0;

    const fire = () => {
      const now = Date.now();
      if (now - last < DEBOUNCE_MS) return;
      last = now;
      window.dispatchEvent(new Event(WAKE_EVENT)); // 'client-refresh'
    };

    const onFocus = () => fire();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fire();
    };

    window.addEventListener("focus", onFocus, { passive: true });
    document.addEventListener("visibilitychange", onVisibility, { passive: true });
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
