"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FinishClient({ orderId }: { orderId: string | null }) {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!orderId) {
        router.replace("/admin/invoices");
        return;
      }
      // lazy import supaya gak kepanggil saat prerender
      const { getSupabaseClient } = await import("@/lib/supabase/client");
      const sb = getSupabaseClient();
      const { data } = await sb
        .from("invoices")
        .select("id")
        .eq("invoice_no", orderId)
        .maybeSingle<{ id: string }>();

      router.replace(data?.id ? `/admin/invoices/${data.id}` : "/admin/invoices");
    })();
  }, [orderId, router]);

  return <div className="p-6 text-sm text-muted-foreground">Redirecting…</div>;
}
