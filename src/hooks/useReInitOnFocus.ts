import { useEffect, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
// import { setupRealtimeListeners } from "@/lib/realtime"; // optional
// import { fetchInitialData } from "@/lib/data";           // optional

export function useReInitOnFocus() {
  const busy = useRef(false);
  const lastRunAt = useRef(0);

  const reInitSystem = async () => {
    const now = Date.now();
    if (busy.current || now - lastRunAt.current < 800) return; // debounce
    busy.current = true;

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { await supabase.auth.refreshSession(); }

      // setupRealtimeListeners?.(supabase);
      // await fetchInitialData?.(supabase);

    } finally {
      lastRunAt.current = Date.now();
      busy.current = false;
    }
  };

  useEffect(() => {
    const onFocus = () => reInitSystem();
    const onVis = () => { if (document.visibilityState === "visible") reInitSystem(); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
}
