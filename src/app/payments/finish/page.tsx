export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { use } from "react";
import FinishClient from "./FinishClient";
import type { Metadata } from "next";
import { seoFromDB } from "@/lib/seo-loader";
export const metadata: Metadata = seoFromDB("/payments/finish");


type SP = Record<string, string | string[] | undefined>;

export default function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = use(searchParams);
  const orderId = typeof sp.order_id === "string" ? sp.order_id : null;
  return <FinishClient orderId={orderId} />;
}
