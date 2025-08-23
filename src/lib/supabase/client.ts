// src/lib/supabase/client.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _refreshLock: Promise<void> | null = null;

/** Simpan instance di globalThis supaya aman dari HMR (dev) */
const globalForSupabase = globalThis as unknown as {
  __sbClient?: SupabaseClient;
};

/** Helper untuk menjalankan operasi dengan timeout */
export async function withTimeout<T>(operation: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms)),
  ]);
}

export function getSupabaseClient(): SupabaseClient {
  if (globalForSupabase.__sbClient) return globalForSupabase.__sbClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase environment variables");

  const client = createClient(url, anon, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // ⬅️ MATIKAN, biar gak double exchange
    },
  });


  // 1) seed token realtime sekali di awal (kalau sudah login)
  client.auth.getSession().then(({ data }) => {
    const token = data.session?.access_token;
    if (token) {
      try { client.realtime.setAuth(token); } catch (e) { console.warn("realtime.setAuth(seed) failed:", e); }
    }
  });

  // 2) jaga token realtime agar selalu mengikuti session terbaru
  client.auth.onAuthStateChange((_evt, session) => {
    try { client.realtime.setAuth(session?.access_token ?? ""); } catch (e) {
      console.warn("realtime.setAuth(onAuthStateChange) failed:", e);
    }
  });

  globalForSupabase.__sbClient = client;
  return client;
}

/** Aman dipanggil di client sebelum fetch penting. */
export async function ensureFreshSession(): Promise<void> {
  const sb = getSupabaseClient();
  const LOCK_TIMEOUT = 10_000; // 10s

  // Check session dulu tanpa lock
  const { data } = await sb.auth.getSession();
  const sess = data.session;
  const now = Math.floor(Date.now() / 1000);
  const exp = sess?.expires_at ?? 0;

  if (!sess) return;              // anon ok (tergantung RLS)
  if (!sess.refresh_token) return; // tidak bisa refresh → biarkan
  if (exp - now > 60) return;     // masih aman

  let lockResolver: (() => void) | undefined;

  try {
    const start = Date.now();
    let retryCount = 0;
    const MAX_RETRIES = 5;

    while ((globalThis as any).__sbRefreshLock && retryCount < MAX_RETRIES) {
      if (Date.now() - start > LOCK_TIMEOUT) throw new Error("Timeout waiting for refresh lock");
      try {
        await withTimeout((globalThis as any).__sbRefreshLock, 1000, "Lock wait timeout");
        break;
      } catch {
        retryCount++;
        if (retryCount === MAX_RETRIES) throw new Error("Max retry attempts exceeded waiting for lock");
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    // Acquire lock (disimpan di global supaya konsisten antar HMR)
    (globalThis as any).__sbRefreshLock = new Promise<void>((resolve) => { lockResolver = resolve; });

    // Double-check setelah dapat lock
    const { data: current } = await sb.auth.getSession();
    const currentExp = current.session?.expires_at ?? 0;
    if (currentExp - now > 60) return; // sudah di-refresh oleh proses lain

    try {
      const refreshResult = await withTimeout(sb.auth.refreshSession(), 8000, "Session refresh timeout");
      const newToken = refreshResult.data.session?.access_token;
      if (newToken) {
        try { sb.realtime.setAuth(newToken); } catch (e) { console.error("Realtime auth update failed:", e); }
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
      try {
        await withTimeout(sb.auth.signOut(), 5000, "Sign out timeout");
      } catch (e) {
        console.error("Sign out failed:", e);
      }
    }
  } catch (error) {
    console.error("Session management error:", error);
  } finally {
    if (lockResolver) lockResolver();
    (globalThis as any).__sbRefreshLock = null;
  }
}

/** Timeout helper untuk query builder */
export function withSignal<T>(qb: T, signal: AbortSignal): T {
  const m = qb as unknown as { abortSignal?: (s: AbortSignal) => T };
  return typeof m.abortSignal === "function" ? m.abortSignal(signal) : qb;
}
