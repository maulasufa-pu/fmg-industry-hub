// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;

  // Biarkan callback & static lewat tanpa guard
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  let res = NextResponse.next();

  // Supabase SSR cookies adapter (Edge)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value ?? null;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Root panel redirect (tetap, tapi gated oleh auth)
  if (pathname === "/admin") {
    if (!user) {
      const url = new URL("/login", origin);
      url.searchParams.set("next", "/admin");
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(new URL("/admin/dashboard", origin));
  }

  if (pathname === "/client") {
    if (!user) {
      const url = new URL("/login", origin);
      url.searchParams.set("next", "/client");
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(new URL("/client/dashboard", origin));
  }

  // Proteksi semua halaman panel
  const isPrivate = pathname.startsWith("/admin/") || pathname.startsWith("/client/");
  if (isPrivate && !user) {
    const url = new URL("/login", origin);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Sudah login tapi masuk /login? —> lempar ke dashboard (hilang flicker)
  if (pathname === "/login" && user) {
    const nextParam = req.nextUrl.searchParams.get("next") ?? "";
    if (nextParam.startsWith("/client") || nextParam.startsWith("/admin")) {
      try {
        return NextResponse.redirect(new URL(nextParam, origin));
      } catch { /* ignore invalid */ }
    }
    return NextResponse.redirect(new URL("/client/dashboard", origin));
  }

  return res;
}

export const config = {
  matcher: ["/login", "/admin", "/admin/:path*", "/client", "/client/:path*"],
};
