// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type Role = "client" | "admin" | "owner";
type ProfPick = { main_role: Role | null; staff_role: string[] | null };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextParam =
    url.searchParams.get("next") || url.searchParams.get("redirectedFrom") || "";

  if (!code) return NextResponse.redirect(new URL("/login", url));

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  // Exchange code → set HttpOnly cookie
  const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exErr) return NextResponse.redirect(new URL("/login?err=oauth", url));

  let dest = "/client/dashboard";

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const { data } = await supabase
        .from("profiles") // ⬅️ no generic here
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
          if (p.startsWith("/admin") && isAdminLike) dest = p + u.search + u.hash;
          else if (p.startsWith("/client") && !isAdminLike) dest = p + u.search + u.hash;
          else dest = defaultDest;
        } catch {
          dest = defaultDest;
        }
      } else {
        dest = defaultDest;
      }
    }
  } catch {
    // keep default dest
  }

  return NextResponse.redirect(new URL(dest, url));
}
