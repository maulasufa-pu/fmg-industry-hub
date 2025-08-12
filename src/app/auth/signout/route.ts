// src/app/auth/signout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST() {
  // ✅ di setup kamu: cookies() async
  const cookieStore = await cookies();
  const res = NextResponse.json({ ok: true });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options as CookieOptions | undefined);
        });
      },
    },
  });

  await supabase.auth.signOut();

  // bersihkan token supabase
  for (const name of ["sb-access-token", "sb-refresh-token"]) {
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }

  return res;
}
