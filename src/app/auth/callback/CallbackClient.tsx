// app/auth/callback/CallbackClient.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const supabase = getSupabaseClient();

      try {
        // 1) EXCHANGE MANUAL (karena detectSessionInUrl=false)
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error || !data.session) {
          console.error("[callback] exchange error:", error);
          router.replace("/login?err=oauth");
          return;
        }

        // 2) SET HttpOnly cookie ke server
        const resp = await fetch("/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        });
        if (!resp.ok) {
          let msg = "failed to set server session";
          try { msg = (await resp.json())?.error || msg; } catch {}
          console.error("[callback] set-session error:", msg);
          router.replace("/login?err=setcookie");
          return;
        }

        // 3) redirect sekali (hormati ?next / ?redirectedFrom kalau ada)
        const rawNext = sp.get("next") || sp.get("redirectedFrom") || "";
        const dest = rawNext.startsWith("/") ? rawNext : "/client/dashboard";
        router.replace(dest);
      } catch (e) {
        console.error("[callback] unexpected:", e);
        router.replace("/login?err=unexpected");
      }
    })();
  }, [router, sp]);

  return null;
}
