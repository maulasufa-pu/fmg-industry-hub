import { redirect } from "next/navigation";

export default function ClientIndex(): never {
  redirect("/client/dashboard");
}