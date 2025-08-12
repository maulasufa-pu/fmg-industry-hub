// src/lib/supabase/client.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _refreshLock: Promise<void> | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,   // tidak simpan di storage browser
        autoRefreshToken: true, // refresh manual (kita yang kontrol)
        detectSessionInUrl: true,
      },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          // PENTING: jangan hilangkan header apikey/Authorization dari Supabase
          const hdrs = new Headers(init?.headers as HeadersInit | undefined);
          hdrs.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
          hdrs.set("Pragma", "no-cache");
          hdrs.set("Expires", "0");
          return fetch(input, {
            ...init,
            cache: "no-store",
            headers: hdrs,
          });
        },
      },
      realtime: { params: { eventsPerSecond: 5 } },
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

/** Aman dipanggil di client sebelum fetch penting. */
export async function ensureFreshSession() {
  const sb = getSupabaseClient();
  const { data } = await sb.auth.getSession();
  const sess = data.session;
  const now = Math.floor(Date.now() / 1000);
  const exp = sess?.expires_at ?? 0;

  if (!sess) return; // anon ok (tergantung RLS)
  if (!sess.refresh_token) return; // tidak bisa refresh → biarkan

  if (exp - now > 60) return; // masih aman

  if (!_refreshLock) {
    _refreshLock = (async () => {
      const { error, data: refreshed } = await sb.auth.refreshSession();
      if (error) {
        await sb.auth.signOut();
      } else if (refreshed?.session?.access_token) {
        try { sb.realtime.setAuth(refreshed.session.access_token); } catch {}
      }
    })().finally(() => { _refreshLock = null; });
  }
  await _refreshLock;
}

/** Timeout helper */
export async function withTimeout<T>(
  runner: (opts: { signal: AbortSignal }) => Promise<T>,
  ms = 8000
): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort("timeout"), ms);
  try {
    return await runner({ signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

export function withSignal<T>(qb: T, signal: AbortSignal): T {
  const m = qb as unknown as { abortSignal?: (s: AbortSignal) => T };
  return typeof m.abortSignal === "function" ? m.abortSignal(signal) : qb;
}
