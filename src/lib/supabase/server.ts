import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _serverClient: SupabaseClient | null = null;

/** HANYA dipakai di server (RSC, API routes, server actions). */
export function getSupabaseServerClient(): SupabaseClient {
  if (_serverClient) return _serverClient;

  // Pakai service role kalau ada (JANGAN pernah diekspos ke client / NEXT_PUBLIC).
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  _serverClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: {
      persistSession: false,   // server tidak menyimpan sesi
      autoRefreshToken: false, // tidak perlu auto refresh di server
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });

  return _serverClient;
}
