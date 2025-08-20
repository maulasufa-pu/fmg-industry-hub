"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ErrorClient({
  orderId,
  statusCode,
  trxStatus,
  fraudStatus,
}: {
  orderId: string | null;
  statusCode: string;
  trxStatus: string;
  fraudStatus: string;
}) {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const qs = new URLSearchParams({
        state: "error",
        status_code: statusCode,
        transaction_status: trxStatus,
        fraud_status: fraudStatus,
      }).toString();

      if (!orderId) {
        router.replace(`/admin/invoices?${qs}`);
        return;
      }

      const { getSupabaseClient } = await import("@/lib/supabase/client");
      const sb = getSupabaseClient();
      const { data } = await sb
        .from("invoices")
        .select("id")
        .eq("invoice_no", orderId)
        .maybeSingle<{ id: string }>();

      router.replace(
        data?.id ? `/admin/invoices/${data.id}?${qs}` : `/admin/invoices?${qs}`
      );
    })();
  }, [orderId, statusCode, trxStatus, fraudStatus, router]);

  return <div className="p-6 text-sm text-muted-foreground">Redirecting…</div>;
}
