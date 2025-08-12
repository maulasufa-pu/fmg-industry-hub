// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  let res = NextResponse.next({ request: { headers: req.headers } });

  // bikin supabase server client yang bisa baca/tulis cookie di middleware
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  // ====== “RedirectIfAuthenticated” versi middleware ======
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

  // (opsional) kalau mau sekalian proteksi /client/*
  // if (path.startsWith("/client")) {
  //   const { data: { user } } = await supabase.auth.getUser();
  //   if (!user) {
  //     const url = req.nextUrl.clone();
  //     url.pathname = "/login";
  //     url.searchParams.set("redirectedFrom", path);
  //     return NextResponse.redirect(url);
  //   }
  // }

  return res;
}

export const config = {
  matcher: ["/login", "/signup", "/client/:path*"], // /client/* hanya dipakai kalau blok proteksi diaktifkan
};
