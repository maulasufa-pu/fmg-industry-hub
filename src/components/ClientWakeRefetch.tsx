"use client";
import { useEffect } from "react";
import { WAKE_EVENT } from "@/lib/wakeRefetch";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Mem-broadcast event WAKE_EVENT setiap kali tab kembali fokus/visible.
 * Tidak melakukan full reload — hanya memberi sinyal agar semua data loader refetch.
 */
export default function ClientWakeRefetch(): null {
  useEffect(() => {
    const supabase = getSupabaseClient();

    const onWake = () => {
      // Jaga-jaga, segarkan info session secara non-blocking
      void supabase.auth.getSession().catch(() => {});
      // Broadcast satu event ke seluruh app
      window.dispatchEvent(new Event(WAKE_EVENT));
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") onWake();
    };

    window.addEventListener("focus", onWake, { passive: true });
    document.addEventListener("visibilitychange", onVisibility, { passive: true });

    return () => {
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}