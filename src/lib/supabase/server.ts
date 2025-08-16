// src/lib/supabase/server.ts
// ❌ hapus: import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function assertServer() {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseServerClient() must be called on the server");
  }
}

let _serverClient: SupabaseClient | null = null;

/** HANYA dipakai di server (RSC, API routes, server actions). */
export function getSupabaseServerClient(): SupabaseClient {
  assertServer(); // ✅ guard biar tidak kepanggil di client

  if (_serverClient) return _serverClient;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  _serverClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  return _serverClient;
}
