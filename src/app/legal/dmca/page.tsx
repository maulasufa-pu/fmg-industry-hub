"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldAlert,
  FileWarning,
  Mail,
  Copy,
  Gavel,
  BookText,
  Link2,
  Building2,
  MapPin,
  Phone,
  MailCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

function SectionCard({ children, id, title, icon: Icon }: { children: React.ReactNode; id: string; title: string; icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>; }): React.JSX.Element {
  return (
    <section id={id} aria-label={title} className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-900/10 bg-white/70 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          {Icon ? (
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-900/5 text-neutral-900 dark:bg-white/10 dark:text-white">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white sm:text-2xl">{title}</h2>
        </div>
        <div className="prose prose-neutral max-w-none text-[15px] leading-relaxed dark:prose-invert">
          {children}
        </div>
        <div aria-hidden className="pointer-events-none absolute -inset-[1px] rounded-2xl ring-1 ring-neutral-900/10 dark:ring-white/15" />
      </div>
    </section>
  );
}

function GradientBG(): React.JSX.Element {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {reduce ? (
        <>
          <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/16 via-fuchsia-500/14 to-sky-500/10 blur-2xl" />
          <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-emerald-500/18 via-teal-400/14 to-cyan-400/10 blur-2xl" />
        </>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [-10, 10, -10] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/16 via-fuchsia-500/14 to-sky-500/10 blur-2xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [8, -8, 8] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-emerald-500/18 via-teal-400/14 to-cyan-400/10 blur-2xl"
          />
        </>
      )}
    </div>
  );
}

function useScrollSpy(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!elements.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const inView = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (inView[0]) setActive((inView[0].target as HTMLElement).id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.1, 0.5, 1] }
    );

    elements.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids.join("|")]);
  return active;
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    // eslint-disable-next-line no-alert
    alert("Copied to clipboard.");
  } catch {
    // eslint-disable-next-line no-alert
    alert("Copy failed. Please copy manually.");
  }
}

const NOTICE_TEMPLATE = `Subject: DMCA Takedown Notice\n\nTo FMG Universe Legal Team,\n\nI am the copyright owner or authorized to act on behalf of the owner. I request the removal or disabling of access to the material identified below that is infringing my copyright.\n\n1. Work claimed to be infringed: [Describe the copyrighted work or attach a list.]\n2. Infringing material and its location on FMG services: [Provide URLs and/or detailed description sufficient to locate the material.]\n3. Contact information: [Full name, address, telephone, and email.]\n4. Statements:\n   • I have a good‑faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.\n   • The information in this notice is accurate, and under penalty of perjury, I am the owner or authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.\n\n5. Signature: [Type your full name as a digital signature]\n\nDate: [YYYY‑MM‑DD]`;

const COUNTER_TEMPLATE = `Subject: DMCA Counter‑Notification\n\nTo FMG Universe Legal Team,\n\nI am the user who uploaded the material removed or disabled by FMG as a result of a DMCA notice. I believe the material was removed or disabled due to mistake or misidentification. Please restore access to the material identified below.\n\n1. Material removed or to which access has been disabled and its location before removal: [Provide URLs and/or detailed description sufficient to identify the material.]\n2. Contact information: [Full name, address, telephone, and email.]\n3. Statements:\n   • Under penalty of perjury, I have a good‑faith belief that the material was removed or disabled as a result of mistake or misidentification.\n   • I consent to the jurisdiction of the Federal District Court for the judicial district in which my address is located, or if outside the United States, the judicial district in which FMG may be found, and I will accept service of process from the person who provided the original notice or their agent.\n\n4. Signature: [Type your full name as a digital signature]\n\nDate: [YYYY‑MM‑DD]`;

export default function DMCAPage(): React.JSX.Element {
  const toc = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "designated-agent", label: "Designated Agent" },
      { id: "notice", label: "How to Send a DMCA Notice" },
      { id: "counter", label: "How to Send a Counter‑Notice" },
      { id: "repeat", label: "Repeat Infringer Policy" },
      { id: "standards", label: "Standard Technical Measures" },
      { id: "third-party", label: "Third‑Party Platforms" },
      { id: "misuse", label: "Misuse & 17 U.S.C. §512(f)" },
      { id: "changes", label: "Changes & Contact" },
    ],
    []
  );
  const active = useScrollSpy(toc.map((t) => t.id));

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <GradientBG />

      <header className="relative z-10 mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-900/10 bg-white/70 p-6 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-8">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-white/90" /> Legal
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">DMCA Policy</h1>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-neutral-700 dark:text-white/80">
              This page explains FMG Universe’s policy under the U.S. Digital Millennium Copyright Act (17 U.S.C. §512), including how to send a valid takedown notice and how to submit a counter‑notification.
            </p>
            <p className="mt-2 text-xs opacity-70">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          <div aria-hidden className="pointer-events-none absolute -inset-[1px] rounded-2xl ring-1 ring-neutral-900/10 dark:ring-white/15" />
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-12 gap-6 px-4 py-10 sm:px-6 sm:py-12">
        <aside className="sticky top-20 hidden h-max select-none md:col-span-3 md:block">
          <nav aria-label="On this page" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-3 text-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-70">
              <BookText className="h-3.5 w-3.5" /> Contents
            </div>
            <ol className="space-y-1.5">
              {toc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className={`block rounded-lg px-2 py-1.5 transition hover:bg-neutral-900/5 dark:hover:bg-white/10 ${
                      active === t.id ? "bg-neutral-900/5 font-medium dark:bg-white/10" : "opacity-80"
                    }`}
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="col-span-12 space-y-6 md:col-span-9">
          <SectionCard id="overview" title="Overview" icon={ShieldAlert}>
            <p>
              FMG Universe (“FMG,” “we,” “us,” or “our”) respects intellectual property rights and expects users to do the same. We comply with the Digital Millennium Copyright Act (“DMCA”). If you believe content available through FMG services infringes your copyright, you can submit a valid DMCA notice and we will respond consistent with §512 of the U.S. Copyright Act.
            </p>
            <p className="mt-3 text-[13px] opacity-80">
              <strong>Important:</strong> This policy applies to copyright only. For trademark, privacy, or other legal requests, please contact <a className="underline underline-offset-4" href="/contact">FMG Support</a>.
            </p>
          </SectionCard>

          <SectionCard id="designated-agent" title="Designated Agent" icon={Building2}>
            <p>
              FMG’s designated agent to receive notices and counter‑notifications under the DMCA is:
            </p>
            <div className="mt-3 grid gap-2 rounded-xl border border-neutral-900/10 bg-white/60 p-3 text-[14px] dark:border-white/10 dark:bg-white/5 sm:grid-cols-2">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 opacity-70" />
                <span>
                  Attn: DMCA Agent<br />
                  West Jakarta 11480, Indonesia
                </span>
              </div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 opacity-70" /> <a className="underline underline-offset-4" href="mailto:admin@flemmomusic.com">admin@flemmomusic.com</a></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 opacity-70" /> +62 82298288188</div>
            </div>
            <p className="mt-3 text-[13px] opacity-80">Do not send unrelated inquiries to the DMCA mailbox; they may not receive a response.</p>
          </SectionCard>

          <SectionCard id="notice" title="How to Send a DMCA Notice" icon={FileWarning}>
            <p>To be effective under 17 U.S.C. §512(c)(3), your notice <em>must</em> include all of the following:</p>
            <ol className="mt-3 list-decimal pl-5">
              <li>Your physical or electronic signature.</li>
              <li>Identification of the copyrighted work claimed to have been infringed (or a representative list).</li>
              <li>Identification of the material that is claimed to be infringing, and information reasonably sufficient to permit us to locate the material (e.g., precise URLs, account/profile name, timestamps).</li>
              <li>Your contact information (full name, address, telephone, and email).</li>
              <li>A statement that you have a good‑faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement that the information in the notification is accurate, and <strong>under penalty of perjury</strong>, that you are the copyright owner or authorized to act on the owner’s behalf.</li>
            </ol>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <button
                onClick={() => copyText(NOTICE_TEMPLATE)}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
              >
                <Copy className="mr-2 h-4 w-4" /> Copy Notice Template
              </button>
              <a
                href={`mailto:dmca@fmg-universe.com?subject=${encodeURIComponent("DMCA Takedown Notice")}`}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-900/20 px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                <Mail className="mr-2 h-4 w-4" /> Email the Agent
              </a>
            </div>
            <p className="mt-3 text-[13px] opacity-80">Submitting incomplete notices may delay processing. We may share your notice—including your contact information—with the user who posted the material.</p>
          </SectionCard>

          <SectionCard id="counter" title="How to Send a Counter‑Notice" icon={MailCheck}>
            <p>If you believe your material was removed or disabled by mistake or misidentification, you may submit a counter‑notification that includes all items required by 17 U.S.C. §512(g)(3):</p>
            <ol className="mt-3 list-decimal pl-5">
              <li>Your physical or electronic signature.</li>
              <li>Identification of the material removed or to which access has been disabled, and its location before removal.</li>
              <li>Your name, address, telephone number, and email address.</li>
              <li>A statement <strong>under penalty of perjury</strong> that you have a good‑faith belief the material was removed or disabled as a result of mistake or misidentification.</li>
              <li>Your consent to the jurisdiction of the Federal District Court for your address (or where FMG is located if you reside outside the U.S.), and that you will accept service of process from the original complainant.</li>
            </ol>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <button
                onClick={() => copyText(COUNTER_TEMPLATE)}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
              >
                <Copy className="mr-2 h-4 w-4" /> Copy Counter‑Notice Template
              </button>
              <a
                href={`mailto:dmca@fmg-universe.com?subject=${encodeURIComponent("DMCA Counter-Notification")}`}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-900/20 px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                <Mail className="mr-2 h-4 w-4" /> Email the Agent
              </a>
            </div>
            <p className="mt-3 text-[13px] opacity-80">Upon receipt of a valid counter‑notification, we may restore the material within 10–14 business days unless the complainant notifies us that they have filed an action seeking a court order to restrain the user from engaging in infringing activity.</p>
          </SectionCard>

          <SectionCard id="repeat" title="Repeat Infringer Policy" icon={Gavel}>
            <p>
              In appropriate circumstances, and at our discretion, FMG may terminate, suspend, or limit accounts of users who are determined to be repeat infringers. We also may remove content at any time for any reason consistent with our Terms of Use.
            </p>
          </SectionCard>

          <SectionCard id="standards" title="Standard Technical Measures" icon={Link2}>
            <p>
              FMG accommodates and does not interfere with <em>standard technical measures</em> used by copyright owners to identify or protect copyrighted works, as defined by 17 U.S.C. §512(i).
            </p>
          </SectionCard>

          <SectionCard id="third-party" title="Third‑Party Platforms & Links" icon={AlertTriangle}>
            <p>
              Some FMG experiences may embed or link to third‑party platforms (e.g., YouTube, TikTok, Instagram, Spotify). If allegedly infringing content is hosted by a third party, you should send your notice to that service’s designated agent. FMG cannot remove content hosted on services we do not control.
            </p>
          </SectionCard>

          <SectionCard id="misuse" title="Misuse, Fair Use & §512(f)" icon={FileWarning}>
            <p>
              Submitting knowing and material misrepresentations in a DMCA notice or counter‑notice may expose you to liability for damages under 17 U.S.C. §512(f). Before filing, consider whether the use may be lawful (e.g., fair use, license, public domain). If unsure, consult a lawyer.
            </p>
          </SectionCard>

          <SectionCard id="changes" title="Changes & How to Contact Us" icon={CheckCircle2}>
            <p>
              We may update this DMCA Policy from time to time. Changes take effect when posted here. For questions about this policy, contact our designated agent above or reach out via our <a className="underline underline-offset-4" href="/contact">Contact</a> page.
            </p>
          </SectionCard>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent dark:from-neutral-950" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-neutral-950" />
    </main>
  );
}
