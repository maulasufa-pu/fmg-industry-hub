// src/lib/supabase/client.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _refreshLock: Promise<void> | null = null;

/** Helper untuk menjalankan operasi dengan timeout */
export async function withTimeout<T>(operation: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ]);
}

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "flemmo-auth",
      }
    }
  );

  return _client;
}

/** Aman dipanggil di client sebelum fetch penting. */
export async function ensureFreshSession(): Promise<void> {
  const sb = getSupabaseClient();

  const { data } = await sb.auth.getSession();
  const sess = data.session;
  if (!sess) return; // anon ok
  // NOTE: refresh_token bisa saja tidak tampil; jangan jadikan syarat
  const now1 = Math.floor(Date.now() / 1000);
  const exp1 = sess.expires_at ?? 0;
  if (exp1 - now1 > 60) return; // masih aman

  // Lock
  let lockResolver: (() => void) | undefined;
  const waitForLock = async () => {
    const start = Date.now();
    while (_refreshLock) {
      if (Date.now() - start > 10_000) throw new Error("Timeout waiting for refresh lock");
      // tunggu lock existing selesai (tanpa meledak)
      try { await withTimeout(_refreshLock, 1200, "Lock wait timeout"); }
      catch { /* retry lagi */ }
    }
  };

  try {
    await waitForLock();
    _refreshLock = new Promise<void>(res => { lockResolver = res; });

    // Double-check (recompute now!)
    const { data: current } = await sb.auth.getSession();
    const now2 = Math.floor(Date.now() / 1000);
    const exp2 = current.session?.expires_at ?? 0;
    if (exp2 - now2 > 60) return; // sudah diperbarui oleh proses lain

    // Coba refresh dengan retry ringan
    const tryRefresh = async () => {
      try {
        const r = await withTimeout(sb.auth.refreshSession(), 8000, "Session refresh timeout");
        const newToken = r.data.session?.access_token;
        if (newToken) {
          // Biasanya tidak perlu, tapi kalau mau biarkan silent fail
          await withTimeout(sb.realtime.setAuth(newToken), 3000, "Realtime auth update timeout")
            .catch(() => {});
        }
        return true;
      } catch (e: unknown) {
        // pastikan e adalah object dan punya message/error_description
        let msg = "";
        if (typeof e === "object" && e !== null) {
          const errObj = e as { error_description?: string; message?: string };
          msg = (errObj.error_description || errObj.message || "").toLowerCase();
        }
        if (msg.includes("invalid_grant") || msg.includes("invalid refresh")) {
          // refresh token invalid → ini baru alasan kuat untuk sign out
          await sb.auth.signOut().catch(() => {});
        }
        return false;
      }
    };

    const ok = await tryRefresh() || await tryRefresh(); // 2x kesempatan
    // kalau dua2nya gagal tapi bukan invalid_grant → biarkan saja, jangan signOut
  } finally {
    if (lockResolver) { lockResolver(); _refreshLock = null; }
  }
}


/** Timeout helper untuk query builder */
export function withSignal<T>(qb: T, signal: AbortSignal): T {
  const m = qb as unknown as { abortSignal?: (s: AbortSignal) => T };
  return typeof m.abortSignal === "function" ? m.abortSignal(signal) : qb;
}
