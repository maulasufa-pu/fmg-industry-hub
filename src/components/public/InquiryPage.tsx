"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";

type ContactReason = "project" | "partnership" | "publishing" | "press" | "support" | "other";

type InquiryPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  reason: ContactReason;
  subject: string;
  highlights?: string[];
  messagePlaceholder?: string;
  backHref?: string;
  backLabel?: string;
};

export default function InquiryPage({
  eyebrow,
  title,
  description,
  reason,
  subject,
  highlights = [],
  messagePlaceholder = "Tell us what you need, your target date, budget range, and any useful links.",
  backHref = "/",
  backLabel = "Back to FMG",
}: InquiryPageProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        company: form.get("company"),
        reason,
        subject: form.get("subject"),
        message: form.get("message"),
        website: form.get("website"),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(typeof body.error === "string" ? body.error : "We could not send your inquiry. Please try again.");
      setStatus("error");
      return;
    }
    event.currentTarget.reset();
    setStatus("sent");
  }

  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-black dark:text-white">
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">{eyebrow}</p>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">{description}</p>
          {highlights.length > 0 && (
            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          <Link href={backHref} className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:underline dark:text-violet-300">
            {backLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Name
              <input required name="name" minLength={2} maxLength={120} className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-500 dark:border-white/15 dark:bg-black" />
            </label>
            <label className="grid gap-2 text-sm font-medium">Email
              <input required name="email" type="email" maxLength={254} className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-500 dark:border-white/15 dark:bg-black" />
            </label>
          </div>
          <label className="mt-5 grid gap-2 text-sm font-medium">Artist, company, or organization <span className="font-normal text-slate-500">(optional)</span>
            <input name="company" maxLength={160} className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-500 dark:border-white/15 dark:bg-black" />
          </label>
          <label className="mt-5 grid gap-2 text-sm font-medium">Subject
            <input required name="subject" minLength={3} maxLength={180} defaultValue={subject} className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-500 dark:border-white/15 dark:bg-black" />
          </label>
          <label className="mt-5 grid gap-2 text-sm font-medium">Details
            <textarea required name="message" minLength={20} maxLength={2000} rows={7} placeholder={messagePlaceholder} className="resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-violet-500 dark:border-white/15 dark:bg-black" />
          </label>
          <label className="sr-only" aria-hidden="true">Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          <button disabled={status === "sending"} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60">
            {status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {status === "sending" ? "Sending…" : "Send inquiry"}
          </button>
          <div className="mt-4 min-h-6 text-sm" role="status" aria-live="polite">
            {status === "sent" && <p className="text-emerald-700 dark:text-emerald-300">Received. FMG will reply to the email you provided.</p>}
            {status === "error" && <p className="text-rose-700 dark:text-rose-300">{error}</p>}
          </div>
        </form>
      </section>
    </main>
  );
}
