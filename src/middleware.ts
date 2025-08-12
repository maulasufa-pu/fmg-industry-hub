// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  // pakai const (bukan let) karena tidak pernah di-reassign
  const res = NextResponse.next({ request: { headers: req.headers } });

  // bikin supabase server client yang bisa baca/tulis cookie di middleware
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      // API getAll/setAll juga oke; versi ini lebih eksplisit dan strongly-typed
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // beri default secure di production
          const opts: CookieOptions = {
            secure: process.env.NODE_ENV === "production",
            ...options,
          };
          res.cookies.set(name, value, opts);
        });
      },
    },
  });

  // ====== “RedirectIfAuthenticated” versi middleware ======
  const path = req.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  if (isAuthPage) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const url = req.nextUrl.clone();
      url.pathname = "/client/dashboard";
      return NextResponse.redirect(url);
    }
    return res; // belum login -> biarkan akses /login /signup
  }

  return res;
}

export const config = {
  matcher: ["/login", "/signup", "/client/:path*"], // aktifkan /client/* jika blok proteksi di atas di-uncomment
};
