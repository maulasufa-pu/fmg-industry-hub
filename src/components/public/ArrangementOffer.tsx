import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileAudio, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { ARRANGEMENT_ORDER_PATH, ARRANGEMENT_PORTFOLIO_PATH } from "@/lib/arrangement";

const INCLUDED = [
  "Arrangement shaped around your melody, brief, genre, and references",
  "Stereo preview, final WAV/MP3, instrumental, and consolidated stems",
  "Two structured revision rounds within the agreed arrangement scope",
  "Typical turnaround: 7–14 business days after brief and payment are confirmed",
];

export default function ArrangementOffer({ showInquiryLink = true }: { showInquiryLink?: boolean }) {
  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-black dark:text-white">
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Music arrangement service</p>
        <div className="mt-4 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">Turn your song idea into a finished arrangement.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">You bring the song, melody, chords, or voice-note guidance. FMG builds the musical structure and production direction. This is a paid service—we do not buy or scout your song through this flow.</p>
          </div>
          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6 dark:border-violet-800 dark:bg-violet-950/30">
            <p className="text-sm text-slate-600 dark:text-slate-300">Arrangement starts at</p>
            <p className="mt-1 text-4xl font-bold">USD 350</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Final scope and IDR invoice are confirmed before production starts.</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={ARRANGEMENT_ORDER_PATH} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700">Order arrangement <ArrowRight className="h-4 w-4" /></Link>
          {showInquiryLink && <Link href="/services/inquiry" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50 dark:border-white/20 dark:hover:bg-white/10">Ask before ordering</Link>}
          <Link href={ARRANGEMENT_PORTFOLIO_PATH} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50 dark:border-white/20 dark:hover:bg-white/10">Arrangement portfolio</Link>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {INCLUDED.map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 p-5 dark:border-white/10"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><span>{item}</span></div>)}
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-bold">How the order works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["1", "Send the brief", "Choose Arrangement, explain the song direction, and add shareable reference links."],
              ["2", "Confirm scope & pay", "FMG reviews the brief, confirms timing and scope, then issues an IDR invoice with a payment link."],
              ["3", "Review & receive", "Track previews and revision notes in the client portal, then receive the agreed final deliverables."],
            ].map(([number, title, copy]) => <article key={number} className="rounded-2xl bg-slate-50 p-6 dark:bg-white/5"><span className="text-sm font-bold text-violet-600">STEP {number}</span><h3 className="mt-2 text-xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy}</p></article>)}
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            [Clock3, "Timeline", "7–14 business days for a standard arrangement; complex/live instrumentation is quoted separately."],
            [RefreshCw, "Revisions", "Two structured rounds are included. A direction change or new scope is re-quoted."],
            [FileAudio, "Deliverables", "Final stereo WAV/MP3, instrumental, and consolidated stems unless the quote states otherwise."],
            [WalletCards, "Payment", "Scope is reviewed first. Production starts after the issued invoice reaches the agreed payment milestone."],
          ].map(([Icon, title, copy]) => {
            const IconComponent = Icon as typeof Clock3;
            return <article key={String(title)} className="rounded-2xl border border-slate-200 p-5 dark:border-white/10"><IconComponent className="h-6 w-6 text-violet-600" /><h3 className="mt-4 font-semibold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{String(copy)}</p></article>;
          })}
        </section>

        <section className="mt-16 rounded-3xl border border-emerald-200 bg-emerald-50 p-7 dark:border-emerald-900 dark:bg-emerald-950/25">
          <div className="flex items-start gap-4"><ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-emerald-700" /><div><h2 className="text-2xl font-bold">Your song remains your song</h2><p className="mt-2 max-w-3xl leading-7 text-slate-700 dark:text-slate-200">FMG does not acquire your composition simply because you order arrangement services. Ownership, credits, session assets, third-party material, and any transfer or license are stated in the approved quote/invoice and project terms. Final deliverables are released after the agreed payment milestone is completed.</p></div></div>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-bold">Arrangement FAQ</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 px-6 dark:divide-white/10 dark:border-white/10">
            {[
              ["Do I need a finished recording?", "No. A clear voice note, melody, chord guide, or rough recording can be enough if the brief explains the direction."],
              ["Does FMG buy my song?", "No. This flow sells arrangement services to you; it is not a label submission or song-acquisition form."],
              ["Can I request live musicians?", "Yes. Live players, studio time, vocal production, mixing, and mastering can be added and quoted as separate scope."],
              ["What counts as a revision?", "A revision adjusts the agreed direction. Rewriting the song, changing genre, or replacing the core brief is new scope."],
            ].map(([q, a]) => <details key={q} className="group py-5"><summary className="cursor-pointer list-none font-semibold">{q}</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{a}</p></details>)}
          </div>
        </section>
      </section>
    </main>
  );
}
