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
        detectSessionInUrl: true
      }
    }
  );

  return _client;
}

/** Aman dipanggil di client sebelum fetch penting. */
export async function ensureFreshSession(): Promise<void> {
  const sb = getSupabaseClient();
  const LOCK_TIMEOUT = 10000; // 10 detik max untuk acquire lock
  
  // Check session dulu tanpa lock
  const { data } = await sb.auth.getSession();
  const sess = data.session;
  const now = Math.floor(Date.now() / 1000);
  const exp = sess?.expires_at ?? 0;

  // Early returns sebelum acquire lock
  if (!sess) return; // anon ok (tergantung RLS)
  if (!sess.refresh_token) return; // tidak bisa refresh → biarkan
  if (exp - now > 60) return; // masih aman

  // Lock mechanism dengan timeout
  let lockResolver: (() => void) | undefined;

  try {
    // Tunggu lock dengan timeout dan retry limit
    const start = Date.now();
    let retryCount = 0;
    const MAX_RETRIES = 5;
    
    while (_refreshLock && retryCount < MAX_RETRIES) {
      if (Date.now() - start > LOCK_TIMEOUT) {
        throw new Error('Timeout waiting for refresh lock');
      }

      try {
        await withTimeout(
          _refreshLock,
          1000,
          'Lock wait timeout'
        );
        break; // Berhasil mendapatkan lock
      } catch {
        retryCount++;
        if (retryCount === MAX_RETRIES) {
          throw new Error('Max retry attempts exceeded waiting for lock');
        }
        // Tunggu sebentar sebelum retry
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Acquire lock
    _refreshLock = new Promise(resolve => {
      lockResolver = resolve;
    });

    // Double-check session setelah dapat lock
    const { data: current } = await sb.auth.getSession();
    const currentExp = current.session?.expires_at ?? 0;
    if (currentExp - now > 60) {
      return; // Session sudah di-refresh oleh proses lain
    }

    try {
      // Refresh session dengan timeout
      const refreshResult = await withTimeout(
        sb.auth.refreshSession(),
        8000,
        'Session refresh timeout'
      );

      const newToken = refreshResult.data.session?.access_token;
      if (newToken) {
        // Update realtime auth dengan timeout
        await withTimeout(
          sb.realtime.setAuth(newToken),
          5000,
          'Realtime auth update timeout'
        ).catch(error => {
          console.error('Realtime auth update failed:', error);
        });
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      
      // Sign out dengan timeout
      await withTimeout(
        sb.auth.signOut(),
        5000,
        'Sign out timeout'
      ).catch(error => {
        console.error('Sign out failed:', error);
      });
    }
  } catch (error) {
    console.error('Session management error:', error);
  } finally {
    if (lockResolver) {
      lockResolver();
      _refreshLock = null;
    }
  }
}

/** Timeout helper untuk query builder */
export function withSignal<T>(qb: T, signal: AbortSignal): T {
  const m = qb as unknown as { abortSignal?: (s: AbortSignal) => T };
  return typeof m.abortSignal === "function" ? m.abortSignal(signal) : qb;
}
