// src/components/auth/RedirectIfAuthenticated.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function RedirectIfAuthenticated() {
  const router = useRouter();
  // useEffect(() => {
  //   const supabase = getSupabaseClient();
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     if (session) router.replace("/client/dashboard");
  //   });
  // }, [router]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (data?.role === "admin") router.replace("/admin");
      else router.replace("/client");
    })();
  }, [router]);
  return null;
}
