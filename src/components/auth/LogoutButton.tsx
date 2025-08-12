// src/components/auth/LogoutButton.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Props = {
  className?: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  loadingText?: string;
};

export default function LogoutButton({
  className = "h-10 px-3 rounded-lg bg-primary-60 text-white hover:bg-primary-70",
  children = "Logout",
  fallback = null,
  loadingText = "Logging out...",
}: Props) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // cek session awal
    supabase.auth.getSession().then(({ data: { session} }) => {
      setIsAuthed(!!session);
    });

    // subscribe perubahan auth
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (isAuthed === null) return null;
  if (!isAuthed) return <>{fallback}</>;

  const onClick = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // 1) hapus session di client (localStorage)
      await supabase.auth.signOut();
      setIsAuthed(false); // sembunyikan tombol segera

      // 2) bersihkan cookie server + redirect target
      await fetch("/auth/signout", { method: "POST" });

      // 3) pindah ke login
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={onClick} disabled={loading} className={className}>
      {loading ? loadingText : children}
    </button>
  );
}
