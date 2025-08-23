// app/auth/set/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json().catch(() => ({} as any));
  if (!access_token || !refresh_token) {
    return NextResponse.json({ ok: false, error: "missing tokens" }, { status: 400 });
  }

  // buffer cookies yang Supabase mau set
  const pending: { name: string; value: string; options?: Parameters<typeof NextResponse.prototype.cookies.set>[2] }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => pending.push({ name, value, options }));
        },
      },
    }
  );

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    const resErr = NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    pending.forEach(c => resErr.cookies.set(c.name, c.value, c.options));
    return resErr;
  }

  const resOk = NextResponse.json({ ok: true });
  pending.forEach(c => resOk.cookies.set(c.name, c.value, c.options));
  return resOk;
}
