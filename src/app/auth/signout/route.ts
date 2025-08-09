import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Support POST (utama) dan GET (kalau kamu mau pakai link)
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      // gunakan getAll/setAll agar kompatibel dengan @supabase/ssr
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set({ name, value, ...options })
        );
      },
    },
  });

  await supabase.auth.signOut(); // revoke token + bersihkan storage sisi server

  return response;
}

export const GET = POST;
