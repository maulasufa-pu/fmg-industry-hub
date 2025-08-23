"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Role = "client" | "admin" | "owner";

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
        const code = sp.get("code");
        if (!code) {
          router.replace("/login");
          return;
        }

        // 1) EXCHANGE di client (PKCE OK di sini)
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error || !data.session) {
          console.error("[callback] exchange error:", error);
          router.replace("/login?err=oauth");
          return;
        }

        // 2) SET HttpOnly cookie di server
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

        // 3) role-aware dest (opsional)
        let dest: string = "/client/dashboard";
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            const { data: prof } = await supabase
              .from("profiles").select("main_role,staff_role").eq("id", user.id).maybeSingle();

            const roles: string[] = [];
            if (prof?.main_role) roles.push(prof.main_role);
            if (Array.isArray(prof?.staff_role)) roles.push(...prof.staff_role);
            const isAdminLike = roles.includes("owner") || roles.includes("admin");
            const defaultDest = isAdminLike ? "/admin/dashboard" : "/client/dashboard";

            const rawNext = sp.get("next") || sp.get("redirectedFrom") || "";
            if (rawNext) {
              try {
                const u = new URL(rawNext, window.location.origin);
                const p = u.pathname;
                dest =
                  (p.startsWith("/admin") && isAdminLike) ||
                  (p.startsWith("/client") && !isAdminLike)
                    ? p + u.search + u.hash
                    : defaultDest;
              } catch { dest = defaultDest; }
            } else {
              dest = defaultDest;
            }
          }
        } catch { /* keep default */ }

        router.replace(dest);
      } catch (e) {
        console.error("[callback] unexpected:", e);
        router.replace("/login?err=unexpected");
      }
    })();
  }, [router, sp]);

  return null;
}
