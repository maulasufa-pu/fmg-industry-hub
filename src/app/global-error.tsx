"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { void fetch("/api/monitoring/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: error.name || "GlobalError", message: error.message, digest: error.digest, path: window.location.pathname }), keepalive: true }); }, [error]);
  return <html lang="id"><body className="m-0 bg-neutral-950 font-sans text-white"><main className="grid min-h-screen place-items-center px-4"><div className="max-w-lg text-center"><h1 className="text-3xl font-bold">FMG is temporarily unavailable.</h1><p className="mt-3 text-white/65">Please retry. If the problem continues, contact FMG support.</p><button type="button" onClick={reset} className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-neutral-950">Retry</button></div></main></body></html>;
}
