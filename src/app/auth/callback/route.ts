// app/auth/callback/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type Role = "client" | "admin" | "owner";
type ProfPick = { main_role: Role | null; staff_role: string[] | null };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") || url.searchParams.get("redirectedFrom") || "";
  if (!code) return NextResponse.redirect(new URL("/login", url));

  // ⬇️ buat response redirect lebih dulu, supaya cookies ditulis ke response yg sama
  const res = NextResponse.redirect(new URL("/client/dashboard", url), 307);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options); // ⬅️ TULIS KE RES
          });
        },
      },
    }
  );

  const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exErr) {
    res.headers.set("Location", new URL("/login?err=oauth", url).toString());
    return res;
  }

  let dest = "/client/dashboard";
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const { data } = await supabase
        .from("profiles")
        .select("main_role, staff_role")
        .eq("id", user.id)
        .maybeSingle();

      const prof = data as ProfPick | null;
      const roles: string[] = [];
      if (prof?.main_role) roles.push(prof.main_role);
      if (Array.isArray(prof?.staff_role)) roles.push(...prof.staff_role);

      const isAdminLike = roles.includes("owner") || roles.includes("admin");
      const defaultDest = isAdminLike ? "/admin/dashboard" : "/client/dashboard";

      if (nextParam) {
        try {
          const u = new URL(nextParam, url.origin);
          const p = u.pathname;
          dest =
            (p.startsWith("/admin") && isAdminLike) || (p.startsWith("/client") && !isAdminLike)
              ? p + u.search + u.hash
              : defaultDest;
        } catch {
          dest = defaultDest;
        }
      } else {
        dest = defaultDest;
      }
    }
  } catch { /* keep default */ }

  res.headers.set("Location", new URL(dest, url).toString()); // ⬅️ update tujuan di response yg sama
  return res;
}
