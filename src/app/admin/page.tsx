// src/app/admin/page.tsx  (SERVER)
import { redirect } from "next/navigation";
import { getEffectiveRole } from "@/lib/roles/effective";
import type { Metadata } from "next";
import { seoFromDB } from "@/lib/seo-loader";
export const metadata: Metadata = seoFromDB("/admin");


export default async function AdminIndex() {
  const role = await getEffectiveRole();
  switch (role) {
    case "owner":
    case "admin":
      redirect("/admin/projects");
    // case "anr":
    //   redirect("/admin/anr/queue");
    // case "producer":
    //   redirect("/admin/producer/board");
    // case "composer":
    //   redirect("/admin/composer/assigned");
    // case "engineer":
    //   redirect("/admin/engineer/queue");
    // case "publisher":
    //   redirect("/admin/publishing/dashboard");
    default:
      redirect("/client");
  }
}
