// src/app/auth/RequireAdmin.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/roles";

type Guard = "checking" | "ok";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [state, setState] = useState<Guard>("checking");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace(`/login?redirectedFrom=${encodeURIComponent(pathname || "/admin")}`);
        return;
      }

      // env override: jika email ada di OWNER_EMAILS, langsung lolos
      const raw = process.env.NEXT_PUBLIC_OWNER_EMAILS || ""; // jika mau expose allowlist utk client guard
      const allow = raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      const email = session.user.email?.toLowerCase() ?? "";
      if (allow.includes(email)) { if (mounted) setState("ok"); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error) { router.replace("/client/dashboard"); return; }

      const role = data?.role as Role | undefined;
      if (role !== "owner" && role !== "admin") {
        router.replace("/client/dashboard");
        return;
      }
      if (mounted) setState("ok");
    })();
    return () => { mounted = false; };
  }, [supabase, router, pathname]);

  if (state !== "ok") {
    return <div className="min-h-[40vh] grid place-items-center text-sm text-coolgray-60">Checking access…</div>;
  }
  return <>{children}</>;
}
