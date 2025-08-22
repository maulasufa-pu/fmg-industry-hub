// app/auth/set/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies as nextCookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { access_token?: string; refresh_token?: string };
  const { access_token, refresh_token } = body;
  if (!access_token || !refresh_token) {
    return NextResponse.json({ ok: false, error: "missing tokens" }, { status: 400 });
  }

  const cookieStore = await nextCookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // ✅ Versi yang cocok dengan CookieMethodsServer (getAll/setAll)
      cookies: {
        getAll() {
          return cookieStore.getAll().map(c => ({ name: c.name, value: c.value }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
