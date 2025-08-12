"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function CallbackClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getSupabaseClient();

        const href = window.location.href;
        const url = new URL(href);

        // Pastikan ada code dari OAuth
        if (!url.searchParams.get("code")) {
          router.replace("/login");
          return;
        }

        // Tukar code -> session
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(href);
        if (exErr) {
          if (!cancelled) setError(exErr.message);
          return;
        }

        // Ambil user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setError("No user after OAuth callback.");
          return;
        }

        // Pastikan ada profile
        const { data: prof, error: selErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (selErr) {
          if (!cancelled) setError(selErr.message);
          return;
        }

        if (!prof) {
          const md = (user.user_metadata ?? {}) as Record<string, unknown>;
          const first = (md.given_name ?? md.first_name ?? "") as string;
          const last  = (md.family_name ?? md.last_name ?? "") as string;
          const full  =
            (md.full_name as string) ||
            [first, last].filter(Boolean).join(" ") ||
            (user.email?.split("@")[0] ?? "User");

          const role = typeof md.role === "string" ? md.role : "client";
          const avatarUrl = (md.avatar_url as string) || null;

          const { error: insErr } = await supabase.from("profiles").insert({
            id: user.id,
            name: full,
            role,
            avatar_url: avatarUrl,
            created_at: new Date().toISOString(),
          });
          if (insErr) {
            if (!cancelled) setError(insErr.message);
            return;
          }
        }

        const redirectedFrom = url.searchParams.get("redirectedFrom") || "/client/dashboard";
        router.replace(redirectedFrom);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unexpected error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <p className="text-sm text-coolgray-90">
        {error ? `Auth error: ${error}` : "Finishing sign-in..."}
      </p>
    </div>
  );
}
