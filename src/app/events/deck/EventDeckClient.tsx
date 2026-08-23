"use client";

import Link from "next/link";
import { Download, Mail } from "lucide-react";

export default function EventDeckClient() {
  return (
    <main className="min-h-screen bg-white text-slate-950 print:bg-white print:text-black dark:bg-black dark:text-white">
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">FMG Events</p><h1 className="mt-3 text-4xl font-bold sm:text-6xl">Event capability deck</h1><p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">A concise scope guide for showcases, launches, festivals, brand activations, and hybrid music events.</p></div>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white print:hidden"><Download className="h-4 w-4" /> Save as PDF</button>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            ["Strategy & format", "Audience, program, run-of-show, venue feasibility, budget framing, and measurable outcomes."],
            ["Talent & production", "Artist coordination, stage requirements, technical riders, rehearsal planning, and show calling."],
            ["Media & partners", "Content capture, press workflow, sponsor integration, hospitality, and stakeholder approvals."],
            ["Delivery & reporting", "Production timeline, responsibility matrix, risk register, live operations, and post-event recap."],
          ].map(([title, copy]) => <article key={title} className="rounded-2xl border border-slate-200 p-6 dark:border-white/10"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{copy}</p></article>)}
        </div>
        <section className="mt-12 rounded-3xl bg-slate-950 p-8 text-white dark:bg-white dark:text-black"><h2 className="text-2xl font-bold">What FMG needs to quote</h2><p className="mt-3 max-w-3xl leading-7 opacity-80">Target date and city, venue status, audience size, program format, required talent, production scope, sponsor obligations, content needs, and budget range.</p><Link href="/events/inquiry" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white print:hidden"><Mail className="h-4 w-4" /> Start event inquiry</Link></section>
      </section>
    </main>
  );
}
