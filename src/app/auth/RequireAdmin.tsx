// src/app/auth/RequireAdmin.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Role = "client" | "admin" | "owner";
type Guard = "checking" | "ok";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [state, setState] = useState<Guard>("checking");
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const to = `/login?redirectedFrom=${encodeURIComponent(pathname || "/admin/dashboard")}`;
        router.replace(to);
        return;
      }

      const raw = process.env.NEXT_PUBLIC_OWNER_EMAILS || "";
      const allow = raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      const email = (session.user.email || "").toLowerCase();
      if (allow.length && allow.includes(email)) {
        if (mountedRef.current) setState("ok");
        return;
      }

      const { data: prof, error } = await supabase
        .from("profiles")
        .select("main_role, staff_role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        router.replace("/client/dashboard");
        return;
      }

      let effectiveRole: Role = "client";
      if (prof) {
        const allRoles: string[] = [];
        if (prof.main_role) allRoles.push(prof.main_role);
        if (prof.staff_role && Array.isArray(prof.staff_role)) {
          allRoles.push(...prof.staff_role);
        }
        
        if (allRoles.includes("owner")) effectiveRole = "owner";
        else if (allRoles.includes("admin")) effectiveRole = "admin";
        else effectiveRole = "client";
      }

      const isAdminLike = effectiveRole === "admin" || effectiveRole === "owner";

      if (!isAdminLike) {
        router.replace("/client/dashboard");
        return;
      }

      if (mountedRef.current) {
        router.prefetch("/admin/dashboard");
        setState("ok");
      }
    })();
  }, [supabase, router, pathname]);

  if (state !== "ok") {
    return (
      <div className="min-h-[40vh] grid place-items-center text-sm text-coolgray-60">
        Checking access…
      </div>
    );
  }
  return <>{children}</>;
}
