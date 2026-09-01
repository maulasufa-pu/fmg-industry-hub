import type { Metadata } from "next";
import { Suspense } from "react";

import MfaClient from "./MfaClient";

export const metadata: Metadata = { title: "Authenticator Verification", robots: { index: false, follow: false } };

export default function MfaPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center">Preparing secure verification…</div>}><MfaClient /></Suspense>;
}
