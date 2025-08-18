// src/components/auth/RedirectIfAuthenticated.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getEffectiveRole } from "@/lib/roles/effective";

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
      try {
        console.log("RedirectIfAuthenticated: Checking session...");
        
        // Add timeout for session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 2000)
        );
        
        const { data: { session } } = await Promise.race([
          sessionPromise, 
          timeoutPromise
        ]);
        
        if (!session) {
          console.log("RedirectIfAuthenticated: No session found");
          return;
        }

        console.log("RedirectIfAuthenticated: Session found, getting role...");
        
        // Ambil effective role dengan timeout
        const rolePromise = getEffectiveRole();
        const roleTimeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Role check timeout')), 2000)
        );
        
        const effectiveRole = await Promise.race([
          rolePromise,
          roleTimeoutPromise
        ]);
        
        const role = effectiveRole as Role;
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

        console.log(`RedirectIfAuthenticated: Redirecting to ${dest}`);
        router.prefetch(dest);
        router.replace(dest);
      } catch (err) {
        console.error("RedirectIfAuthenticated: Error checking auth:", err);
        
        // In development, be lenient with timeouts
        if (process.env.NODE_ENV === 'development') {
          console.log("RedirectIfAuthenticated: Development mode - skipping redirect due to timeout");
          return;
        }
        
        // In production, assume not authenticated on error
        return;
      }
    })();
  }, [router, sp]);

  return null;
}
