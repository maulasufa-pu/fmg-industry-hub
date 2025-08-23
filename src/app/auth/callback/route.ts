import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type Role = "client" | "admin" | "owner";
type ProfPick = { main_role: Role | null; staff_role: string[] | null };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const nextParam = url.searchParams.get("next") || url.searchParams.get("redirectedFrom") || "";
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login", url));

  // ⬇️ buffer semua cookie yg mau diset Supabase
  const pendingCookies: { name: string; value: string; options?: Parameters<typeof NextResponse.prototype.cookies.set>[2] }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll().map(c => ({ name: c.name, value: c.value })),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
          pendingCookies.push({ name, value, options })
        ),
      },
    }
  );

  // ⬇️ WAJIB pakai req.url
  const { error: exErr } = await supabase.auth.exchangeCodeForSession(req.url);
  if (exErr) {
    console.error("[callback] exchange error:", exErr);
    const resErr = NextResponse.redirect(new URL("/login?err=oauth", url));
    pendingCookies.forEach(({ name, value, options }) => resErr.cookies.set(name, value, options));
    return resErr;
  }

  // ⬇️ hitung dest role-aware (opsional)
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
      const roles = [
        ...(prof?.main_role ? [prof.main_role] : []),
        ...(Array.isArray(prof?.staff_role) ? prof!.staff_role : []),
      ];
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
        } catch { dest = defaultDest; }
      } else {
        dest = defaultDest;
      }
    }
  } catch {}

  // ⬇️ apply cookie ke RESPONSE FINAL yang dikembalikan
  const res = NextResponse.redirect(new URL(dest, url));
  pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}
