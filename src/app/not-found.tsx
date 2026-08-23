import Link from "next/link";
import { ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-white px-5 text-slate-950 dark:bg-black dark:text-white">
      <div className="max-w-xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-600 dark:text-violet-300">404 · Page not found</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Page not found.</h1>
        <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">The address may be outdated or typed incorrectly. Nothing has been redirected, so you can see and report the broken link.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"><Home className="h-4 w-4" /> Homepage</Link>
          <Link href="/services" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50 dark:border-white/20 dark:hover:bg-white/10"><Search className="h-4 w-4" /> Arrangement service</Link>
          <Link href="/help" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50 dark:border-white/20 dark:hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> Report a broken link</Link>
        </div>
      </div>
    </main>
  );
}
