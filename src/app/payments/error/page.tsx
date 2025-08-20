export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { use } from "react";
import ErrorClient from "./ErrorClient";

type SP = Record<string, string | string[] | undefined>;

export default function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = use(searchParams);
  const orderId = typeof sp.order_id === "string" ? sp.order_id : null;
  const status_code = typeof sp.status_code === "string" ? sp.status_code : "";
  const transaction_status =
    typeof sp.transaction_status === "string" ? sp.transaction_status : "";
  const fraud_status =
    typeof sp.fraud_status === "string" ? sp.fraud_status : "";
  return (
    <ErrorClient
      orderId={orderId}
      statusCode={status_code}
      trxStatus={transaction_status}
      fraudStatus={fraud_status}
    />
  );
}
