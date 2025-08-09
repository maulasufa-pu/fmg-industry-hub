// src/components/auth/RedirectIfAuthenticated.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function RedirectIfAuthenticated() {
  const router = useRouter();
  useEffect(() => {
    const supabase = getSupabaseClient(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/client/dashboard");
    });
  }, [router]);
  return null;
}
