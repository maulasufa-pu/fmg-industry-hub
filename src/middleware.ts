// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          const opts: CookieOptions = {
            secure: process.env.NODE_ENV === "production",
            ...options,
          };
          res.cookies.set(name, value, opts);
        });
      },
    },
  });

  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Auto redirect root
  if (path === "/admin") { url.pathname = "/admin/dashboard"; return NextResponse.redirect(url); }
  if (path === "/client") { url.pathname = "/client/dashboard"; return NextResponse.redirect(url); }

  // Auth pages
  if (["/login", "/signup"].includes(path)) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      const role = data?.role ?? null;
      if (role === "owner" || role === "admin") {
        url.pathname = "/admin/dashboard";
        return NextResponse.redirect(url);
      }
      url.pathname = "/client/dashboard";
      return NextResponse.redirect(url);
    }
    return res;
  }

  // Guard
  if (!(path.startsWith("/admin") || path.startsWith("/client"))) return res;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path + (url.search || ""));
    return NextResponse.redirect(loginUrl);
  }

  const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  const role = data?.role ?? null;
  const isAdminLike = role === "owner" || role === "admin";

  // Admin area
  if (path.startsWith("/admin") && !isAdminLike) {
    const to = req.nextUrl.clone();
    to.pathname = "/client/dashboard";
    return NextResponse.redirect(to);
  }

  // Client area with impersonation
  if (path.startsWith("/client") && isAdminLike) {
    const as = url.searchParams.get("as");
    if (as) {
      await supabase.from("admin_impersonations").upsert({
        admin_id: session.user.id,
        client_id: as,
        expire_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
      url.searchParams.delete("as");
      return NextResponse.redirect(url);
    }

    const { data: imp } = await supabase.from("admin_impersonations")
      .select("client_id, expire_at")
      .eq("admin_id", session.user.id)
      .gt("expire_at", new Date().toISOString())
      .maybeSingle();

    if (!imp) {
      const to = req.nextUrl.clone();
      to.pathname = "/admin/dashboard";
      return NextResponse.redirect(to);
    }
  }

  return res;
}

export const config = {
  matcher: ["/login", "/signup", "/client/:path*", "/admin/:path*"],
};