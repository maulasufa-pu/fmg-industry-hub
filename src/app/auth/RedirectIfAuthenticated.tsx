// src/components/auth/RedirectIfAuthenticated.tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getEffectiveRole } from "@/lib/roles/effective";

type Role = "client" | "admin" | "owner";

export default function RedirectIfAuthenticated() {
  const router = useRouter();
  const sp = useSearchParams();
  const path = usePathname();
  const ranRef = useRef(false);

  useLayoutEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (path.startsWith("/auth")) return;

    const supabase = getSupabaseClient();

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const role = (await getEffectiveRole()) as Role;
      const isAdminLike = role === "owner" || role === "admin";
      const toAdmin = "/admin/dashboard";
      const toClient = "/client/dashboard";
      let dest = isAdminLike ? toAdmin : toClient;

      const nextParam = sp.get("next") || sp.get("redirectedFrom") || "";
      if (nextParam) {
        try {
          const u = new URL(nextParam, window.location.origin);
          if (!isAdminLike && u.pathname.startsWith("/client")) dest = u.pathname + u.search + u.hash;
          if (isAdminLike && u.pathname.startsWith("/admin"))  dest = u.pathname + u.search + u.hash;
        } catch {  }
      }

      router.replace(dest, { scroll: false }); 
    })();
  }, [router, sp, path]);

  return null;
}
