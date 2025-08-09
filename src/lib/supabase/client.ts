"use client";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient(persist = true) {
  const storage = persist ? window.localStorage : window.sessionStorage;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
