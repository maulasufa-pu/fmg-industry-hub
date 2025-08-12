import { useEffect } from "react";
import { getSupabaseClient } from "./client";

export function useFocusWarmAuth() {
  useEffect(() => {
    const sb = getSupabaseClient();
    const warm = async () => {
      try {
        const { data } = await sb.auth.getSession();
        const exp = data.session?.expires_at ?? 0;
        const now = Math.floor(Date.now() / 1000);
        // hanya refresh kalau benar-benar mau habis (<= 60s)
        if (data.session && exp && exp - now <= 60) {
          await sb.auth.refreshSession();
        }
      } catch {}
    };
    const onFocus = () => warm();
    const onVisible = () => { if (document.visibilityState === "visible") warm(); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    warm(); // warm sekali saat mount

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}

export async function ensureFreshSession() {
  const sb = getSupabaseClient();
  try {
    const { data } = await sb.auth.getSession();
    const exp = data.session?.expires_at ?? 0;
    const now = Math.floor(Date.now() / 1000);
    if (data.session && exp && exp - now <= 60) {
      await sb.auth.refreshSession();
    }
  } catch {}
}

export async function withTimeout<T>(
  runner: (opts: { signal: AbortSignal }) => Promise<T>,
  ms = 8000
): Promise<T> {
  const ac = new AbortController();
  const kill = setTimeout(() => ac.abort("timeout"), ms);
  try {
    return await runner({ signal: ac.signal });
  } finally {
    clearTimeout(kill);
  }
}
