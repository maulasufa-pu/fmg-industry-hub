// src/app/client/page.tsx (SERVER) — kalau mau arahkan client ke dashboard-nya
import { redirect } from "next/navigation";
import { getEffectiveRole } from "@/lib/roles/effective";

export default async function ClientIndex() {
  const role = await getEffectiveRole();
  if (role === "guest") redirect("/login");
  // client bisa tetap lihat /client, role lain boleh juga kalau kamu mau
  return null; // atau render dashboard client
}
