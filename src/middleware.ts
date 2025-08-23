// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;

  // Allow callback & static
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // ⬇️ tampung cookie yg ingin diset Supabase (jangan langsung nempel ke res)
  const pendingCookies: { name: string; value: string; options?: Parameters<typeof NextResponse.prototype.cookies.set>[2] }[] = [];

  // bikin client dengan adapter getAll/setAll
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // baca dari request
          return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
        },
        setAll(cookies) {
          // JANGAN set ke response dulu — masukkin ke buffer
          cookies.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options });
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // helper untuk apply cookie ke response apa pun yg dikembalikan
  const withCookies = (res: NextResponse) => {
    pendingCookies.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  };

  // Root panel redirect (gated)
  if (pathname === "/admin") {
    if (!user) {
      const url = new URL("/login", origin);
      url.searchParams.set("next", "/admin");
      return withCookies(NextResponse.redirect(url));
    }
    return withCookies(NextResponse.redirect(new URL("/admin/dashboard", origin)));
  }

  if (pathname === "/client") {
    if (!user) {
      const url = new URL("/login", origin);
      url.searchParams.set("next", "/client");
      return withCookies(NextResponse.redirect(url));
    }
    return withCookies(NextResponse.redirect(new URL("/client/dashboard", origin)));
  }

  // Proteksi halaman panel
  const isPrivate = pathname.startsWith("/admin/") || pathname.startsWith("/client/");
  if (isPrivate && !user) {
    const url = new URL("/login", origin);
    url.searchParams.set("next", pathname + search);
    return withCookies(NextResponse.redirect(url));
  }

  // Sudah login tapi ke /login → lempar ke dashboard
  if (pathname === "/login" && user) {
    const nextParam = req.nextUrl.searchParams.get("next") ?? "";
    if (nextParam.startsWith("/client") || nextParam.startsWith("/admin")) {
      try {
        return withCookies(NextResponse.redirect(new URL(nextParam, origin)));
      } catch { /* ignore */ }
    }
    return withCookies(NextResponse.redirect(new URL("/client/dashboard", origin)));
  }

  // default pass-through + apply cookies kalau Supabase minta set (refresh, dsb.)
  return withCookies(NextResponse.next());
}

export const config = {
  matcher: ["/login", "/admin", "/admin/:path*", "/client", "/client/:path*"],
};
