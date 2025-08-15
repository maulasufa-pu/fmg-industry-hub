// src/app/auth/callback/CallbackClient.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Role = "client" | "admin" | "owner";

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
        const code = sp.get("code");
        if (!code) {
          router.replace("/login");
          return;
        }

        // Tukar code -> session
        const href = window.location.href;
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(href);
        if (exErr) {
          console.error("[callback] exchange error:", exErr);
          router.replace("/login?err=oauth");
          return;
        }

        // Ambil user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Pastikan profile ada (tanpa blok navigasi kalau gagal)
        try {
          const { data: profRow, error: selErr } = await supabase
            .from("profiles")
            .select("id, role, name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          if (!selErr && !profRow) {
            const md = (user.user_metadata ?? {}) as Record<string, unknown>;
            const first = (md.given_name ?? md.first_name ?? "") as string;
            const last  = (md.family_name ?? md.last_name ?? "") as string;
            const full  =
              (md.full_name as string) ||
              [first, last].filter(Boolean).join(" ") ||
              (user.email?.split("@")[0] ?? "User");

            await supabase
              .from("profiles")
              .insert({
                id: user.id,
                name: full,
                role: "client" satisfies Role, // default client
                avatar_url: (md.avatar_url as string) || null,
              });
          }
        } catch (e) {
          console.warn("[callback] ensure profile soft-fail:", e);
        }

        // Ambil role terbaru dari DB
        const { data: profile, error: roleErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (roleErr) {
          console.warn("[callback] read role error:", roleErr);
        }

        const role = (profile?.role ?? "client") as Role;

        // Tentukan tujuan akhir berdasar role.
        // - admin/owner -> /admin/dashboard
        // - client      -> /client/dashboard
        // Kalau ada ?redirectedFrom atau ?next, hanya dipakai jika cocok segment-nya.
        const nextParam = sp.get("redirectedFrom") || sp.get("next") || "";
        const toAdmin = "/admin/dashboard";
        const toClient = "/client/dashboard";

        const isAdminLike = role === "admin" || role === "owner";
        let dest = isAdminLike ? toAdmin : toClient;

        if (nextParam) {
          try {
            const u = new URL(nextParam, window.location.origin);
            const p = u.pathname;
            if (!isAdminLike && p.startsWith("/client")) dest = u.pathname + u.search + u.hash;
            if (isAdminLike && p.startsWith("/admin"))  dest = u.pathname + u.search + u.hash;
          } catch {
            // abaikan nextParam kalau bukan URL valid
          }
        }

        router.prefetch(dest);
        router.replace(dest);
      } catch (e) {
        console.error("[callback] unexpected:", e);
        router.replace("/login?err=unexpected");
      }
    })();
  }, [router, sp]);

  return null;
}
