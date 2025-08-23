// app/auth/callback/page.tsx
import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] grid place-items-center">Finishing sign-in…</div>}>
      <CallbackClient />
    </Suspense>
  );
}
