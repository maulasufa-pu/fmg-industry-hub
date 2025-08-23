// app/auth/callback/CallbackClient.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const ran = useRef(false);

  // ---- DEBUG helpers (aman di-prod, cuma console.log) ----
  const DEBUG_PKCE = true;
  const dumpPkce = (label: string) => {
    if (!DEBUG_PKCE) return;
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        /pkce|flow|sb-/i.test(k)
      );
      const values: Record<string, string | null> = {};
      keys.forEach((k) => (values[k] = localStorage.getItem(k)));
      // ambil ref dari env (kalau ada)
      const envUrl =
        (typeof process !== "undefined" &&
          (process as any).env?.NEXT_PUBLIC_SUPABASE_URL) ||
        "";
      const refFromEnv =
        (envUrl.match(/^https:\/\/([^.]+)\.supabase\.co/i) || [])[1] || null;

      // log ringkas
      // eslint-disable-next-line no-console
      console.log("[callback]", label, {
        href: location.href,
        origin: location.origin,
        envUrl,
        refFromEnv,
        pkceKeys: keys,
        pkceValues: values,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[callback] dumpPkce error:", e);
    }
  };
  // --------------------------------------------------------

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const supabase = getSupabaseClient();

      try {
        // Pastikan ada ?code= di URL; kalau gak ada, balik ke /login
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (!code) {
          console.error("[callback] missing ?code in URL");
          window.location.replace("/login?err=nocode");
          return;
        }

        dumpPkce("before-exchange");

        // 1) EXCHANGE MANUAL (detectSessionInUrl=false di client)
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error || !data.session) {
          console.error("[callback] exchange error:", error);
          // hint untuk kasus 'invalid flow state'
          dumpPkce("exchange-failed");
          window.location.replace("/login?err=oauth");
          return;
        }

        dumpPkce("after-exchange");

        // 2) SET HttpOnly cookie ke server
        const resp = await fetch("/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!resp.ok) {
          let msg = "failed to set server session";
          try {
            msg = ((await resp.json()) as any)?.error || msg;
          } catch {}
          console.error("[callback] set-session error:", msg);
          dumpPkce("after-set-failed");
          window.location.replace("/login?err=setcookie");
          return;
        }

        dumpPkce("after-set-success");

        // 3) redirect sekali (hormati ?next / ?redirectedFrom kalau ada)
        const rawNext = sp.get("next") || sp.get("redirectedFrom") || "";
        const dest = rawNext.startsWith("/") ? rawNext : "/client/dashboard";

        // Pakai location.replace agar full reload + cookie HttpOnly pasti kebaca middleware
        window.location.replace(dest);
      } catch (e) {
        console.error("[callback] unexpected:", e);
        dumpPkce("unexpected");
        window.location.replace("/login?err=unexpected");
      }
    })();
  }, [router, sp]);

  return null;
}
