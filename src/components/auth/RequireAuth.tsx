// src/components/auth/RequireAuth.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Props = { children: React.ReactNode };

export default function RequireAuth({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseClient(true), []);
  const [status, setStatus] = useState<"checking" | "authed" | "guest">("checking");

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      // cek session awal
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session) {
        setStatus("authed");
      } else {
        setStatus("guest");
        router.replace(`/login?redirectedFrom=${encodeURIComponent(pathname || "/client")}`);
      }
    };

    check();

    // update realtime kalau status auth berubah
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) setStatus("authed");
      else {
        setStatus("guest");
        router.replace(`/login?redirectedFrom=${encodeURIComponent(pathname || "/client")}`);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  if (status !== "authed") {
    // optionally: skeleton/spinner
    return (
      <div className="min-h-[40vh] grid place-items-center text-sm text-coolgray-60">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
