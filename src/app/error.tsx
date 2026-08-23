"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    void fetch("/api/monitoring/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: error.name || "PageError", message: error.message, digest: error.digest, path: window.location.pathname }), keepalive: true });
  }, [error]);
  return <main className="grid min-h-[65vh] place-items-center px-4"><div className="max-w-lg rounded-3xl border border-neutral-200 p-8 text-center dark:border-white/10"><p className="text-sm font-semibold uppercase tracking-widest text-red-600">Something went wrong</p><h1 className="mt-3 text-3xl font-bold">This page could not be loaded.</h1><p className="mt-3 text-neutral-600 dark:text-white/65">Your data was not changed. Check your connection and try again.</p><button type="button" onClick={reset} className="mt-6 rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white dark:bg-white dark:text-neutral-950">Try again</button></div></main>;
}
