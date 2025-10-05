"use client";
import { useEffect, useCallback, useRef } from "react";
import { CLIENT_WAKE_EVENT } from "@/lib/wakeRefetch";

/**
 * Component to trigger data re-fetch when tab/window gets focus,
 * with debounce to prevent repeated reloads.
 */
export default function ClientWakeReloader() {
  const lastReloadTime = useRef(0);
  const DEBOUNCE_MS = 2000; // Minimum interval between reloads

  const handleWake = useCallback(() => {
    const now = Date.now();
    if (now - lastReloadTime.current < DEBOUNCE_MS) {
      return; // Skip if too close to previous reload
    }
    
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    const dispatchWithRetry = () => {
      try {
        // Broadcast event untuk trigger refetch data
        window.dispatchEvent(new Event(CLIENT_WAKE_EVENT));
        lastReloadTime.current = now; // Update waktu hanya jika berhasil
      } catch (error) {
        // console.error("Failed to dispatch wake event:", error);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          // Exponential backoff untuk retry
          setTimeout(dispatchWithRetry, Math.pow(2, retryCount) * 100);
        }
      }
    };
    
    dispatchWithRetry();
  }, []);

  useEffect(() => {
    const onFocus = () => void handleWake();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void handleWake();
      }
    };

    window.addEventListener("focus", onFocus, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [handleWake]);

  return null;
}
