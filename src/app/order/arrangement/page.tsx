import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth/server";
import ArrangementOrderClient from "./ArrangementOrderClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Order Music Arrangement",
  robots: { index: false, follow: false },
};

export default async function ArrangementOrderPage() {
  const auth = await getServerAuthContext();
  if (!auth) redirect("/login?next=%2Forder%2Farrangement");
  return <ArrangementOrderClient />;
}
