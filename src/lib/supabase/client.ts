// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type {
  SupabaseClient,
  Session,
  AuthChangeEvent,
} from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/** Client Supabase berbasis cookie (PKCE) */
export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("Missing Supabase env vars");

  _client = createBrowserClient(url, anon, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      // Exchange dilakukan di /auth/callback server — biar SDK tidak auto-parse ?code
      detectSessionInUrl: false,
    },
  });

  // Seed token Realtime sekali
  _client.auth.getSession().then((res) => {
    const token = res.data.session?.access_token;
    if (token) {
      try {
        _client!.realtime.setAuth(token);
      } catch (e) {
        console.warn("realtime.setAuth(seed) failed:", e);
      }
    }
  });

  // Keep sinkron dengan sesi terbaru
  _client.auth.onAuthStateChange(
    (_evt: AuthChangeEvent, session: Session | null) => {
      try {
        _client!.realtime.setAuth(session?.access_token ?? "");
      } catch (e) {
        console.warn("realtime.setAuth(onAuthStateChange) failed:", e);
      }
    }
  );

  return _client;
}

/** Opsional */
export async function ensureFreshSession(): Promise<void> {
  const sb = getSupabaseClient();
  const res = await sb.auth.getSession();
  const exp = res.data.session?.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  if (exp - now > 60) return;
  try {
    await sb.auth.refreshSession();
  } catch {
    /* ignore */
  }
}
