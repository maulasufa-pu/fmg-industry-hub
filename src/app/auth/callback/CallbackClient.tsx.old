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
            .select("id, main_role, staff_role, first_name, last_name, avatarPath")
            .eq("id", user.id)
            .maybeSingle();

          if (!selErr && !profRow) {
            const md = (user.user_metadata ?? {}) as Record<string, unknown>;
            const first = (md.given_name ?? md.first_name ?? "") as string;
            const last  = (md.family_name ?? md.last_name ?? "") as string;
            
            // ganti kolom di SELECT (avatarPath -> avatar_path)
            const { data: profRow, error: selErr } = await supabase
              .from("profiles")
              .select("id, main_role, staff_role, first_name, last_name, avatar_path")
              .eq("id", user.id)
              .maybeSingle();

            if (!selErr && !profRow) {
              const md = (user.user_metadata ?? {}) as Record<string, unknown>;
              const first = (md.given_name ?? md.first_name ?? "") as string;
              const last  = (md.family_name ?? md.last_name ?? "") as string;

              // ⬇️ hanya tambah variabel untuk avatar_url & avatar_path
              const av = (user.user_metadata ?? {}) as {
                avatar_url?: string;
                picture?: string;
                avatar_path?: string;
              };

              const avatar_url =
                typeof av.avatar_url === "string" ? av.avatar_url :
                typeof av.picture === "string"    ? av.picture    :
                null;

              // Isi hanya jika benar2 path Storage (bukan URL http)
              const avatar_path =
                typeof av.avatar_path === "string" && !/^https?:\/\//i.test(av.avatar_path)
                  ? av.avatar_path
                  : null;

              await supabase.from("profiles").insert({
                id: user.id,
                first_name: first || (user.email?.split("@")[0] ?? "User"),
                last_name: last || "",
                email: user.email,
                main_role: "client" satisfies Role,
                staff_role: [],

                // ⬇️ set avatar sesuai aturan
                avatar_url,
                avatar_path,
              });
            }
          }
        } catch (e) {
          console.warn("[callback] ensure profile soft-fail:", e);
        }

        // Ambil role terbaru dari DB menggunakan getEffectiveRole logic
        const { data: profile, error: roleErr } = await supabase
          .from("profiles")
          .select("main_role, staff_role")
          .eq("id", user.id)
          .single();

        if (roleErr) {
          console.warn("[callback] read role error:", roleErr);
        }

        // Determine effective role (same logic as getEffectiveRole but simplified)
        let effectiveRole: Role = "client";
        if (profile) {
          const allRoles: string[] = [];
          if (profile.main_role) allRoles.push(profile.main_role);
          if (profile.staff_role && Array.isArray(profile.staff_role)) {
            allRoles.push(...profile.staff_role);
          }
          
          // Check priority: owner > admin > others
          if (allRoles.includes("owner")) effectiveRole = "owner";
          else if (allRoles.includes("admin")) effectiveRole = "admin";
          else effectiveRole = "client";
        }

        // Tentukan tujuan akhir berdasar role.
        // - admin/owner -> /admin/dashboard
        // - client      -> /client/dashboard
        // Kalau ada ?redirectedFrom atau ?next, hanya dipakai jika cocok segment-nya.
        const nextParam = sp.get("redirectedFrom") || sp.get("next") || "";
        const toAdmin = "/admin/dashboard";
        const toClient = "/client/dashboard";

        const isAdminLike = effectiveRole === "admin" || effectiveRole === "owner";
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
