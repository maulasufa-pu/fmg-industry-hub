// src/lib/supabase/useFocusWarmAuth.ts
"use client";

import { useEffect } from "react";
import { ensureFreshSession } from "./client";

export function useFocusWarmAuth() {
  useEffect(() => {
    const warm = async () => {
      try {
        await ensureFreshSession();
      } catch (error) {
        console.error('Session refresh failed:', error);
      }
    };

    const onFocus = () => warm();
    const onVisible = () => { if (document.visibilityState === "visible") warm(); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    warm(); // sekali saat mount

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
