// src/app/admin/page.tsx
import { redirect } from "next/navigation";

export default function AdminIndex(): never {
  redirect("/admin/dashboard");
}