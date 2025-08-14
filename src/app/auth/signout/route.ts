import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST() {
  const cookieStore = await cookies(); // ← biarkan infer tipenya
  const res = NextResponse.json({ ok: true });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (all) => {
        all.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options as CookieOptions | undefined)
        );
      },
    },
  });

  await supabase.auth.signOut();

  // bersihkan token
  res.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
  res.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });

  return res;
}
