// src/lib/useFocusRefetch.ts
"use client";

import { useEffect, useRef } from "react";

export function useFocusRefetch(reload: () => void, abortCurrent: () => void) {
  const justFocusedRef = useRef(false);

  useEffect(() => {
    const onFocus = () => {
      // kalau ada request lama, batalkan dulu, lalu refetch
      abortCurrent();
      // hindari double-trigger jika visibilitychange juga nembak
      if (!justFocusedRef.current) {
        justFocusedRef.current = true;
        reload();
        setTimeout(() => (justFocusedRef.current = false), 50);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") onFocus();
      else abortCurrent(); // saat disembunyikan, kill inflight supaya gak ngegantung
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload, abortCurrent]);
}
