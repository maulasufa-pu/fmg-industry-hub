// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;
  const isLocalhost = req.nextUrl.hostname === 'localhost' || 
                     req.nextUrl.hostname === '127.0.0.1' ||
                     req.nextUrl.hostname.startsWith('192.168.') ||
                     req.nextUrl.hostname.endsWith('.local');
  
  // console.log('🔍 Middleware Debug:', {
  //   hostname: req.nextUrl.hostname,
  //   pathname,
  //   isLocalhost,
  //   nodeEnv: process.env.NODE_ENV,
  //   disableFlag: process.env.DISABLE_AUTH_DEBUG,
  //   port: req.nextUrl.port
  // });

  if (req.nextUrl.hostname !== "flemmomusic.com") {
    return NextResponse.next(); // biarkan redirect .vercel.app → flemmomusic.com berjalan dulu
  }


  if (isLocalhost && process.env.NODE_ENV === 'development') {
    // console.log('🐛 FORCE DEBUG MODE: Bypassing ALL middleware auth for localhost:', pathname);
    if (pathname === "/admin") {
      // console.log('🔄 Redirecting /admin to /admin/dashboard');
      return NextResponse.redirect(new URL("/admin/dashboard", origin));
    }
    
    // console.log('✅ FORCE Allowing access to:', pathname);
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  const pendingCookies: { name: string; value: string; options?: Parameters<typeof NextResponse.prototype.cookies.set>[2] }[] = [];

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
            pendingCookies.push({ name, value, options });
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const withCookies = (res: NextResponse) => {
    pendingCookies.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  };

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

  const isPrivate = pathname.startsWith("/admin/") || pathname.startsWith("/client/");
  if (isPrivate && !user) {
    const url = new URL("/login", origin);
    url.searchParams.set("next", pathname + search);
    return withCookies(NextResponse.redirect(url));
  }

  if (pathname === "/login" && user) {
    const nextParam = req.nextUrl.searchParams.get("next") ?? "";
    if (nextParam.startsWith("/client") || nextParam.startsWith("/admin")) {
      try {
        return withCookies(NextResponse.redirect(new URL(nextParam, origin)));
      } catch { }
    }
    return withCookies(NextResponse.redirect(new URL("/client/dashboard", origin)));
  }

  return withCookies(NextResponse.next());
}

export const config = {
  matcher: ["/login", "/admin", "/admin/:path*", "/client", "/client/:path*"],
};
