"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion, motion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck, FileText, ArrowDown, Printer, Download, ExternalLink } from "lucide-react";

function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint - 0.5}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

function ParallaxField({ container }: { container: React.RefObject<HTMLDivElement | null> }) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ container: container as React.RefObject<HTMLElement> });
  const ySlow = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yMed = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const Motion = reduce || isMobile ? "div" : (motion.div as any);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Motion
        style={reduce || isMobile ? undefined : { y: ySlow }}
        className="absolute -top-28 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/16 via-fuchsia-500/14 to-sky-500/10 sm:h-[34rem] sm:w-[34rem] sm:-top-36 sm:-left-28 blur-xl sm:blur-2xl"
      />
      <Motion
        style={reduce || isMobile ? undefined : { y: yMed }}
        className="absolute -bottom-28 -right-20 h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-emerald-500/18 via-teal-400/14 to-cyan-400/10 sm:h-[32rem] sm:w-[32rem] sm:-bottom-36 sm:-right-24 blur-xl sm:blur-2xl"
      />
    </div>
  );
}

function GradientEmblem(): React.JSX.Element {
  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-neutral-900/10 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.2),transparent_35%)]" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/20 dark:ring-white/10" />
    </div>
  );
}

const SECTIONS = [
  { id: "introduction", title: "Introduction" },
  { id: "eligibility", title: "Eligibility" },
  { id: "accounts-security", title: "Accounts & Security" },
  { id: "acceptable-use", title: "Acceptable Use" },
  { id: "services-and-transactions", title: "Services & Transactions" },
  { id: "user-content", title: "User Content & License" },
  { id: "music-rights", title: "Music Rights & Metadata" },
  { id: "dmca", title: "Copyright (DMCA)" },
  { id: "privacy", title: "Privacy" },
  { id: "third-parties", title: "Third‑Party Services" },
  { id: "termination", title: "Termination" },
  { id: "disclaimers", title: "Disclaimers" },
  { id: "limitation", title: "Limitation of Liability" },
  { id: "indemnity", title: "Indemnification" },
  { id: "governing-law", title: "Governing Law & Disputes" },
  { id: "changes", title: "Changes to these Terms" },
  { id: "misc", title: "Miscellaneous" },
  { id: "contact", title: "Contact" },
] as const;

export default function TermsPage(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const headings = Array.from(el.querySelectorAll<HTMLElement>("section[id]"));
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]) setActive((vis[0].target as HTMLElement).id);
      },
      { root: null, threshold: [0.4, 0.6, 0.8] }
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, []);

  const effectiveDate = useMemo(() => {
    try {
      const d = new Date();
      return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "";
    }
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <ParallaxField container={containerRef} />

      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent dark:from-neutral-950" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-neutral-950" />

      <header className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16">
          <div className="flex items-center gap-3">
            <GradientEmblem />
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-600 dark:text-white/60">FMG Universe • Legal</p>
              <h1 className="mt-1 text-3xl font-semibold sm:text-4xl md:text-5xl">Terms of Service</h1>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-neutral-700 dark:text-white/80">
            These Terms of Service (&#34;Terms&#34;) govern your access to and use of FMG Universe products, websites, and services (collectively, the &#34;Services&#34;). By using the Services you agree to these Terms.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-900/10 bg-neutral-900/5 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
              <ShieldCheck className="h-4 w-4" /> Effective {effectiveDate}
            </span>
            <a href="/legal" className="inline-flex items-center gap-1 rounded-full border border-neutral-900/10 bg-neutral-900/5 px-2.5 py-1 hover:bg-neutral-900/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <FileText className="h-4 w-4" /> Back to Legal
            </a>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-full border border-neutral-900/10 bg-neutral-900/5 px-2.5 py-1 hover:bg-neutral-900/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>
      </header>

      <div ref={containerRef} className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block">
          <nav aria-label="Table of contents" className="sticky top-24 rounded-2xl border border-neutral-900/10 bg-white/70 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="px-1 pb-2 text-xs uppercase tracking-wider text-neutral-600 dark:text-white/60">On this page</div>
            <ul className="space-y-1.5">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`block rounded-lg px-2 py-1 text-sm transition hover:bg-neutral-900/5 dark:hover:bg-white/10 ${
                      active === s.id ? "bg-neutral-900/5 font-medium dark:bg-white/10" : "opacity-80"
                    }`}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="space-y-10">
          <section id="introduction" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Introduction</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              FMG Universe (&#34;FMG&#34;, &#34;we&#34;, &#34;us&#34;) provides Services that help artists, labels, brands, and their teams create, collaborate, distribute, market, manage rights, and learn. These Terms form a binding agreement between you and FMG. If you are using the Services on behalf of an organization, you represent that you have authority to bind that organization, and &#34;you&#34; includes that organization.
            </p>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              <strong>Not legal advice.</strong> This page summarizes the rules for using our Services. It is not a substitute for independent legal counsel.
            </p>
          </section>

          <section id="eligibility" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Eligibility</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800 dark:text-white/85">
              <li>You must be able to form a binding contract. If you are under the age of 13 (or 16 in the EEA/UK), you may only use the Services with consent and supervision of a parent or legal guardian.</li>
              <li>You may not use the Services if you are barred under applicable laws or have been previously suspended by FMG.</li>
            </ul>
          </section>

          <section id="accounts-security" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Accounts & Security</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800 dark:text-white/85">
              <li>Provide accurate information and keep it updated. You are responsible for maintaining the confidentiality of your credentials and for all activity on your account.</li>
              <li>Notify us immediately of any unauthorized use. We may suspend or terminate access to protect you, us, or third parties.</li>
              <li>For organization accounts, you are responsible for provisioning and de‑provisioning users and permissions.</li>
            </ul>
          </section>

          <section id="acceptable-use" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Acceptable Use</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">You agree not to, and not to allow others to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800 dark:text-white/85">
              <li>Infringe or violate rights of others (including copyright, trademark, privacy, and publicity rights).</li>
              <li>Upload unlawful, harmful, deceptive, defamatory, or hateful content.</li>
              <li>Reverse engineer, decompile, scrape, or circumvent technical protections, rate limits, or access controls.</li>
              <li>Introduce malware or interfere with the integrity or performance of the Services.</li>
              <li>Misrepresent an affiliation or impersonate another person or entity.</li>
            </ul>
          </section>

          <section id="services-and-transactions" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Services & Transactions</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800 dark:text-white/85">
              <li><strong>Subscriptions & billing.</strong> Some features require paid subscriptions. Prices, taxes, and billing cycles will be disclosed at purchase. Unless otherwise stated, subscriptions renew automatically until canceled.</li>
              <li><strong>Fees & refunds.</strong> Fees are non‑refundable except where required by law or expressly stated. We may issue credits or refunds at our discretion.</li>
              <li><strong>Trials.</strong> If you sign up for a free trial, you will be charged at the end of the trial unless you cancel first.</li>
              <li><strong>Changes.</strong> We may add, change, or discontinue features, with reasonable notice where practical.</li>
              <li><strong>Beta features.</strong> Some features may be identified as beta or experimental and may be subject to additional terms and reliability limits.</li>
            </ul>
          </section>

          <section id="user-content" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">User Content & License</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">&#34;User Content&#34; means audio, compositions, recordings, metadata, artwork, text, images, video, feedback, and other material you submit or upload.</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800 dark:text-white/85">
              <li>You retain ownership of your User Content.</li>
              <li>You grant FMG a worldwide, non‑exclusive, royalty‑free license to host, store, reproduce, adapt, display, and distribute your User Content solely to operate, maintain, and improve the Services, and as you otherwise instruct (for example, distribution to DSPs).</li>
              <li>You represent and warrant that you have all necessary rights, licenses, and consents to grant the foregoing license and to use the Services in connection with your User Content.</li>
              <li>You can delete your User Content, but copies may persist in routine backups for a limited time. Content distributed to third‑party platforms may be subject to their policies.</li>
            </ul>
          </section>

          <section id="music-rights" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Music Rights & Metadata</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800 dark:text-white/85">
              <li>You are responsible for accurate splits, credits, and identifiers (e.g., ISRC, ISWC, IPI/CAE, UPC/EAN) and for clearing samples and third‑party rights.</li>
              <li>Where FMG provides distribution, administration, or licensing services, additional deal terms or addenda may apply and will control in the event of conflict with these Terms.</li>
              <li>You authorize FMG to deliver, update, and correct metadata and assets with third‑party platforms and rights organizations as reasonably necessary to provide the Services.</li>
            </ul>
          </section>

          <section id="dmca" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Copyright (DMCA)</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              We respect intellectual property and respond to notices of alleged infringement consistent with applicable law, including the DMCA. For instructions on submitting a notice or counter‑notice, see our <a className="underline underline-offset-4" href="/legal/dmca">DMCA policy</a>.
            </p>
          </section>

          <section id="privacy" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Privacy</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              Our <a href="/legal/privacy" className="underline underline-offset-4">Privacy Policy</a> explains how we collect, use, and share information about you. By using the Services, you agree to our Privacy Policy.
            </p>
          </section>

          <section id="third-parties" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Third‑Party Services</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800 dark:text-white/85">
              <li>The Services may integrate third‑party platforms (e.g., DSPs, social networks, analytics). FMG is not responsible for their content, policies, or practices.</li>
              <li>Your use of third‑party services is governed by their terms and policies.</li>
            </ul>
          </section>

          <section id="termination" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Termination</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800 dark:text-white/85">
              <li>You may stop using the Services at any time. You can request account deletion through <a href="/contact" className="underline underline-offset-4">Contact</a> or via in‑product settings where available.</li>
              <li>We may suspend or terminate access with notice if you materially breach these Terms, pose a risk, or to comply with law. We may terminate inactive free accounts after reasonable notice.</li>
              <li>Upon termination, licenses you granted to FMG for operating the Services end, except for reasonable archival and legal compliance purposes. Terms that by nature should survive (e.g., ownership, payments due, indemnities, limitations of liability) will survive.</li>
            </ul>
          </section>

          <section id="disclaimers" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Disclaimers</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              THE SERVICES ARE PROVIDED &#34;AS IS&#34; AND &#34;AS AVAILABLE&#34; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON‑INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR‑FREE.
            </p>
          </section>

          <section id="limitation" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Limitation of Liability</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FMG AND ITS AFFILIATES, DIRECTORS, EMPLOYEES, AND PARTNERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              TO THE EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIMS RELATING TO THE SERVICES WILL BE LIMITED TO THE GREATER OF: (A) THE AMOUNT YOU PAID TO FMG FOR THE SERVICES IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO LIABILITY; OR (B) USD $100.
            </p>
          </section>

          <section id="indemnity" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Indemnification</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              You will indemnify and hold FMG and its affiliates, officers, agents, and employees harmless from any claims, damages, losses, and expenses (including reasonable attorneys’ fees) arising out of or related to: (a) your User Content; (b) your use of the Services; or (c) your violation of these Terms or applicable law.
            </p>
          </section>

          <section id="governing-law" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Governing Law & Disputes</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              These Terms are governed by the laws of <em>[choose jurisdiction]</em> without regard to conflict of laws principles. Except where prohibited, disputes will be resolved exclusively in the courts located in <em>[choose venue]</em>, and you consent to their jurisdiction.
            </p>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              <strong>Arbitration (optional).</strong> If you prefer binding arbitration with a class‑action waiver, we can include an arbitration clause—let us know your preferred seat and rules (e.g., SIAC, AAA).</p>
          </section>

          <section id="changes" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Changes to these Terms</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              We may update these Terms from time to time. If a change materially affects your rights or obligations, we will provide reasonable advance notice (for example, via email or in‑product). Changes become effective on the stated effective date. Your continued use of the Services after the effective date constitutes acceptance.
            </p>
          </section>

          <section id="misc" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Miscellaneous</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-800 dark:text-white/85">
              <li><strong>Entire agreement.</strong> These Terms, together with any service‑specific terms, the Privacy Policy, and any order forms, constitute the entire agreement between you and FMG regarding the Services.</li>
              <li><strong>Severability.</strong> If any provision is unenforceable, the remaining provisions will remain in full force and effect.</li>
              <li><strong>Assignment.</strong> You may not assign these Terms without our consent. We may assign these Terms as part of a merger, acquisition, or asset sale.</li>
              <li><strong>No waiver.</strong> Failure to enforce a provision is not a waiver.</li>
              <li><strong>Export controls.</strong> You must comply with applicable export and sanctions laws.</li>
              <li><strong>Headings.</strong> Headings are for convenience only.</li>
            </ul>
          </section>

          <section id="contact" className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="mt-3 text-neutral-800 dark:text-white/85">
              Questions about these Terms? Contact us via the <a href="/contact" className="underline underline-offset-4">Contact page</a> or email <a className="underline underline-offset-4" href="mailto:admin@flemmomusic.com">admin@flemmomusic.com</a>.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
