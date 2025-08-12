//E:\FMGIH\fmg-industry-hub\src\lib\supabase\client.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { fetch: (i: any, init?: any) => fetch(i, { ...init, cache: "no-store" }) },
    }
  );

  _client.auth.onAuthStateChange((_evt, session) => {
    const token = session?.access_token;
    if (token) {
      try { _client!.realtime.setAuth(token); } catch {}
    }
  });

  return _client;
}
