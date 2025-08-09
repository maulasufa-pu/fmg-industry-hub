// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase server client untuk Server Components & Route Handlers.
 * Kompatibel dengan @supabase/ssr yang meminta cookies.getAll/setAll.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies(); // pada Next versi kamu: Promise

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Di beberapa konteks RSC, set bisa diabaikan—aman untuk read-only use.
          }
        },
      },
    }
  );
}
