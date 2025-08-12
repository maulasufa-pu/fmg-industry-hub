import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export const dynamic = "force-dynamic"; // jangan diprerender
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] grid place-items-center text-sm text-coolgray-90">
        Finishing sign-in...
      </div>
    }>
      <CallbackClient />
    </Suspense>
  );
}
