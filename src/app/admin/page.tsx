// src/app/admin/page.tsx  (SERVER)
import { redirect } from "next/navigation";
import { getEffectiveRole } from "@/lib/roles/effective";

export default async function AdminIndex() {
  const role = await getEffectiveRole();
  switch (role) {
    case "owner":
    case "admin":
      redirect("/admin/projects");
    case "anr":
      redirect("/admin/anr/queue");
    case "producer":
      redirect("/admin/producer/board");
    case "composer":
      redirect("/admin/composer/assigned");
    case "audio_engineer":
      redirect("/admin/engineer/queue");
    case "publishing":
      redirect("/admin/publishing/dashboard");
    default:
      redirect("/client"); // client/guest diarahkan keluar area admin
  }
}
