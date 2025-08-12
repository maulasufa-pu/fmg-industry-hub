// src/lib/supabase/useFocusWarmAuth.ts
"use client";

import { useEffect } from "react";
import { ensureFreshSession, getSupabaseClient } from "./client";

export function useFocusWarmAuth() {
  useEffect(() => {
    const warm = () =>
      async () => {
        const sb = getSupabaseClient();
        await sb.auth.signOut();
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
