export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { use } from "react";
import UnfinishClient from "./UnfinishClient";
import type { Metadata } from "next";
import { seoFromDB } from "@/lib/seo-loader";
export const metadata: Metadata = seoFromDB("/payments/unfinish");


type SP = Record<string, string | string[] | undefined>;

export default function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = use(searchParams);
  const orderId = typeof sp.order_id === "string" ? sp.order_id : null;
  const status_code = typeof sp.status_code === "string" ? sp.status_code : "";
  const transaction_status =
    typeof sp.transaction_status === "string" ? sp.transaction_status : "";
  return (
    <UnfinishClient
      orderId={orderId}
      statusCode={status_code}
      trxStatus={transaction_status}
    />
  );
}
