// src/app/cleint/page.tsx  (SERVER)
import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth/server";
import type { Metadata } from "next";
import { seoFromDB } from "@/lib/seo-loader";
export const metadata: Metadata = seoFromDB("/client");


export default async function ClientIndex() {
  const auth = await getServerAuthContext();
  const role = auth?.effectiveRole ?? "guest";
  switch (role) {
    case "client":
      redirect("/client/dashboard");
    default:
      redirect("/home"); 
  }
}
