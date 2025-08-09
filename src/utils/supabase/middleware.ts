// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function createClient(request: NextRequest) {
  // response dasar; akan di-reassign bila Supabase butuh set cookie
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      // ✅ versi yang kompatibel: getAll / setAll
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // sinkronkan ke request & response
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set({ name, value, ...options })
        );
      },
    },
  });

  return { supabase, response };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/client");
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (!isProtected && !isAuthPage) return NextResponse.next();

  const { supabase, response } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  // Proteksi /client/*
  if (isProtected) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Blokir /login & /signup bila SUDAH login
  if (isAuthPage) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/client/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/client/:path*", "/login", "/signup"],
};
