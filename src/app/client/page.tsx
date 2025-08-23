// src/app/cleint/page.tsx  (SERVER)
import { redirect } from "next/navigation";
import { getEffectiveRole } from "@/lib/roles/effective";

export default async function ClientIndex() {
  const role = await getEffectiveRole();
  switch (role) {
    case "client":
      redirect("/client/dashboard");
    default:
      redirect("/home"); // selain client diarahkan ke homepage
  }
}
