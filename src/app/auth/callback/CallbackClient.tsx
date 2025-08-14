"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const supabase = getSupabaseClient();

    (async () => {
      try {
        // Harus ada ?code= dari provider
        const code = sp.get("code");
        if (!code) {
          router.replace("/login");
          return;
        }

        // Tukar code -> session (pakai URL penuh)
        const href = window.location.href;
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(href);
        if (exErr) {
          console.error("[callback] exchange error:", exErr);
          router.replace("/login?err=oauth");
          return;
        }

        // (Optional) ambil user dan buat profile kalau belum ada — tapi JANGAN blok navigasi
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: prof, error: selErr } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", user.id)
              .maybeSingle();
            if (!selErr && !prof) {
              const md = (user.user_metadata ?? {}) as Record<string, unknown>;
              const first = (md.given_name ?? md.first_name ?? "") as string;
              const last  = (md.family_name ?? md.last_name ?? "") as string;
              const full  =
                (md.full_name as string) ||
                [first, last].filter(Boolean).join(" ") ||
                (user.email?.split("@")[0] ?? "User");
              const role = typeof md.role === "string" ? md.role : "client";
              const avatarUrl = (md.avatar_url as string) || null;

              await supabase.from("profiles").insert({
                id: user.id, name: full, role, avatar_url: avatarUrl,
                created_at: new Date().toISOString(),
              }).throwOnError();
            }
          }
        } catch (e) {
          // Soft-fail saja: jangan tahan redirect
          console.warn("[callback] profile ensure soft-fail:", e);
        }

        // Redirect tujuan (default dashboard). Prefetch supaya halus.
        const redirectedFrom = sp.get("redirectedFrom") || "/client/dashboard";
        router.prefetch(redirectedFrom);
        router.replace(redirectedFrom);
      } catch (e) {
        console.error("[callback] unexpected:", e);
        router.replace("/login?err=unexpected");
      }
    })();
  }, [router, sp]);

  // Suspense fallback di parent sudah cukup; tak perlu render loading lagi di sini.
  return null;
}
