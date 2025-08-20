export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { use } from "react";
import FinishClient from "./FinishClient";

type SP = Record<string, string | string[] | undefined>;

export default function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = use(searchParams);
  const orderId = typeof sp.order_id === "string" ? sp.order_id : null;
  return <FinishClient orderId={orderId} />;
}
