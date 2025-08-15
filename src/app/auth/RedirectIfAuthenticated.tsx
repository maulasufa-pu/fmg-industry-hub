// src/components/auth/RedirectIfAuthenticated.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Role = "client" | "admin" | "owner";

export default function RedirectIfAuthenticated() {
  const router = useRouter();
  const sp = useSearchParams();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const supabase = getSupabaseClient();

    (async () => {
      // Sudah login?
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // Ambil role dari DB
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      const role = (prof?.role ?? "client") as Role;
      const isAdminLike = role === "owner" || role === "admin";

      // Tentukan tujuan default per-role
      const toAdmin = "/admin/dashboard";
      const toClient = "/client/dashboard";
      let dest = isAdminLike ? toAdmin : toClient;

      // Hormati ?next / ?redirectedFrom kalau segmen cocok
      const nextParam = sp.get("next") || sp.get("redirectedFrom") || "";
      if (nextParam) {
        try {
          const u = new URL(nextParam, window.location.origin);
          if (!isAdminLike && u.pathname.startsWith("/client")) dest = u.pathname + u.search + u.hash;
          if (isAdminLike && u.pathname.startsWith("/admin"))  dest = u.pathname + u.search + u.hash;
        } catch {
          // abaikan jika bukan URL valid
        }
      }

      router.prefetch(dest);
      router.replace(dest);
    })();
  }, [router, sp]);

  return null;
}
