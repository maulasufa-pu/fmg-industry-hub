"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const supabase = getSupabaseClient(true);
      await supabase.auth.exchangeCodeForSession(window.location.href);
      router.replace("/client/dashboard");
    })();
  }, [router]);
  return null;
}
