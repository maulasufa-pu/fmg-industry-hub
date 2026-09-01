// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeInternalPath } from "@/lib/safe-next";

export async function proxy(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;
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
  const { data: claimsData } = user ? await supabase.auth.getClaims() : { data: null };
  const mfaRequired = user?.app_metadata?.mfa_required === true;
  const hasRequiredMfa = !mfaRequired || claimsData?.claims?.aal === "aal2";

  let isAdmin = false;
  if (user && (pathname.startsWith("/admin") || pathname === "/login")) {
    const ownerEmails = (process.env.OWNER_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (ownerEmails.includes((user.email ?? "").toLowerCase())) {
      isAdmin = true;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("main_role")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = profile?.main_role === "admin" || profile?.main_role === "owner";
    }
  }

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
    if (!isAdmin) {
      return withCookies(NextResponse.redirect(new URL("/client/dashboard?error=forbidden", origin)));
    }
    if (!hasRequiredMfa) {
      const url = new URL("/auth/mfa", origin);
      url.searchParams.set("next", "/admin/dashboard");
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

  if (pathname.startsWith("/admin/") && user && !isAdmin) {
    return withCookies(NextResponse.redirect(new URL("/client/dashboard?error=forbidden", origin)));
  }

  if (pathname.startsWith("/admin/") && user && isAdmin && !hasRequiredMfa) {
    const url = new URL("/auth/mfa", origin);
    url.searchParams.set("next", pathname + search);
    return withCookies(NextResponse.redirect(url));
  }

  if (pathname === "/login" && user) {
    const nextParam = req.nextUrl.searchParams.get("next") ?? "";
    const safeNext = safeInternalPath(nextParam, "");
    if (isAdmin && !hasRequiredMfa) {
      const url = new URL("/auth/mfa", origin);
      url.searchParams.set("next", nextParam.startsWith("/admin") ? nextParam : "/admin/dashboard");
      return withCookies(NextResponse.redirect(url));
    }
    if (nextParam.startsWith("/admin") && !isAdmin) {
      return withCookies(NextResponse.redirect(new URL("/client/dashboard?error=forbidden", origin)));
    }
    if (safeNext && (!safeNext.startsWith("/admin") || isAdmin)) {
      try {
        return withCookies(NextResponse.redirect(new URL(safeNext, origin)));
      } catch { }
    }
    return withCookies(NextResponse.redirect(new URL(isAdmin ? "/admin/dashboard" : "/client/dashboard", origin)));
  }

  return withCookies(NextResponse.next());
}

export const config = {
  matcher: ["/login", "/admin", "/admin/:path*", "/client", "/client/:path*", "/tuneXpert"],
};
