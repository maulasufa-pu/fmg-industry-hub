import { Suspense } from "react";
import DashboardClient from "./DashboardClient"; // bikin komponen client terpisah

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
      <DashboardClient />
    </Suspense>
  );
}
