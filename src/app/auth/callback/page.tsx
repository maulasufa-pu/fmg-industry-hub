// src/app/auth/callback/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const qp = useSearchParams();
  const redirectedFrom = qp.get("redirectedFrom") || "/client/dashboard";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseClient(true);

      // Pastikan URL membawa code dari OAuth
      const url = new URL(window.location.href);
      if (!url.searchParams.get("code")) {
        router.replace("/login");
        return;
      }

      // Tukar code jadi session
      const { error: exErr } = await supabase.auth.exchangeCodeForSession(url.toString());
      if (exErr) {
        setError(exErr.message);
        return;
      }

      // Ambil user sekarang
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("No user after OAuth callback.");
        return;
      }

      // Pastikan user punya profile (kalau belum → buat)
      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!prof) {
        const md = user.user_metadata || {};
        const first = md.given_name || md.first_name || "";
        const last = md.family_name || md.last_name || "";
        const full =
          md.full_name ||
          [first, last].filter(Boolean).join(" ") ||
          (user.email?.split("@")[0] ?? "User");

        const { error: insErr } = await supabase.from("profiles").insert({
          id: user.id,
          name: full,
          role: md.role || "client",
          avatar_url: md.avatar_url || null,
          created_at: new Date().toISOString(),
        });

        if (insErr) {
          setError(insErr.message);
          return;
        }
      }

      router.replace(redirectedFrom);
    };

    run();
  }, [redirectedFrom, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <p className="text-sm text-coolgray-90">
        {error ? `Auth error: ${error}` : "Finishing sign-in..."}
      </p>
    </div>
  );
}
