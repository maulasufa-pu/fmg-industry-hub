"use client";
import { useEffect, useState, useRef, startTransition } from "react";
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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mountedRef.current) setIsAuthed(!!session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (mountedRef.current) setIsAuthed(!!session);
    });

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (isAuthed === null) return null;
  if (!isAuthed) return <>{fallback}</>;

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      // 1) drop session lokal (cepat)
      await supabase.auth.signOut();
      if (mountedRef.current) setIsAuthed(false);

      // 2) refresh boundary supaya cache server-side tidak stale
      startTransition(() => router.refresh());

      // 3) fire-and-forget bersihkan cookie server (jangan ditunggu)
      void fetch("/auth/signout", { method: "POST", cache: "no-store", credentials: "include" })
        .catch(() => { /* abaikan error jaringan */ });

      // 4) navigasi ke login
      startTransition(() => router.replace("/login"));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <button onClick={onClick} disabled={loading} className={className}>
      {loading ? loadingText : children}
    </button>
  );
}
