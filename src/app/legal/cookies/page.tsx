"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cookie, ShieldCheck, Globe, Settings2, ExternalLink, Info, Languages, Clock, Lock, Network, FileText, Undo2, CircleCheck } from "lucide-react";

function classNames(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

const LAST_UPDATED = "August 24, 2025"; 
const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "what-are-cookies", label: "What Are Cookies & Similar Tech" },
  { id: "who-sets", label: "Who Sets Them (1st vs 3rd Party)" },
  { id: "how-we-use", label: "How We Use Cookies" },
  { id: "categories", label: "Categories & Examples" },
  { id: "your-choices", label: "Your Choices & Controls" },
  { id: "legal-bases", label: "Legal Bases (GDPR/UK)" },
  { id: "sale-sharing", label: "Sale/Sharing (California)" },
  { id: "retention", label: "Retention & Lifetimes" },
  { id: "security", label: "Security & Do Not Track" },
  { id: "international", label: "International Transfers" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes to this Notice" },
  { id: "contact", label: "Contact" },
] as const;

function useScrollSpy(ids: readonly string[], offset = 120) {
  const [active, setActive] = useState<string>(ids[0]);
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(id);
          });
        },
        { rootMargin: `-${offset}px 0px -60% 0px`, threshold: [0, 0.1, 1] }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [ids, offset]);
  return active;
}

function TableOfContents(): React.JSX.Element {
  const active = useScrollSpy(SECTIONS.map((s) => s.id));
  return (
    <aside className="sticky top-20 hidden h-[calc(100svh-6rem)] shrink-0 lg:block">
      <div className="w-72 rounded-2xl border border-neutral-900/10 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Settings2 className="h-4 w-4" />
          Table of Contents
        </div>
        <nav className="space-y-1 text-[13px]">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={classNames(
                "block rounded-md px-2 py-1 transition-colors",
                active === s.id
                  ? "bg-neutral-900/10 text-neutral-900 dark:bg-white/10 dark:text-white"
                  : "text-neutral-700 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white"
              )}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function SectionCard({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ComponentType<any>; children: React.ReactNode; }) {
  const reduce = useReducedMotion();
  return (
    <section id={id} aria-label={title} className="scroll-mt-24">
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl border border-neutral-900/10 bg-white/70 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-8"
      >
        <div aria-hidden className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-transparent [background:radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.08),rgba(236,72,153,0.06),rgba(251,191,36,0.05),transparent_70%)]" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-900/10 bg-neutral-900/5 px-3 py-1 text-xs text-neutral-800 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
            <Icon className="h-4 w-4" />
            {title}
          </div>
          <div className="prose prose-neutral max-w-none text-[15px] leading-relaxed dark:prose-invert">
            {children}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-900/10 bg-neutral-900/5 px-2 py-0.5 text-[11px] text-neutral-800 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
      {children}
    </span>
  );
}

function manageCookiePreferences() {
  if (typeof window === "undefined") return;
  (window as any).OneTrust?.ToggleInfoDisplay?.();
  (window as any).Cookiebot?.show?.();
  (window as any).__cmp?.("showConsentTool");
  (window as any).klaro?.show?.();
}

function setConsentCookie(value: "accept_all" | "reject_non_essential") {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toUTCString(); // 180 days
  document.cookie = `fmg_cookie_consent=${value}; Path=/; SameSite=Lax; Expires=${expires}`;
}

export default function CookiesPolicyPage(): React.JSX.Element {
  const reduce = useReducedMotion();
  const headerAnim = useMemo(() => ({
    initial: reduce ? undefined : { opacity: 0, y: 12 },
    animate: reduce ? undefined : { opacity: 1, y: 0 },
  }), [reduce]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <motion.div
          initial={reduce ? undefined : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/12 to-sky-500/10 blur-2xl"/>
        <motion.div
          initial={reduce ? undefined : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="absolute -bottom-24 -right-20 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-emerald-500/16 via-teal-400/12 to-cyan-400/10 blur-2xl"/>
      </div>

      <header className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div {...headerAnim} transition={{ duration: 0.45 }} className="pt-16 sm:pt-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
              <Cookie className="h-3.5 w-3.5" /> FMG Universe • Cookies
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">Cookies & Similar Technologies</h1>
            <p className="mt-3 text-neutral-700 dark:text-white/80">This Cookies Notice explains how FMG Universe (&#34;FMG&#34;, &#34;we&#34;, &#34;us&#34;) uses cookies and similar technologies on our websites, apps, and services. It works together with our <a href="/legal/privacy" className="underline underline-offset-4">Privacy Policy</a>.</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-white/60">Last updated: {LAST_UPDATED}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={manageCookiePreferences} className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900">
                <Settings2 className="h-4 w-4" /> Manage Cookie Preferences
              </button>
              <button onClick={() => setConsentCookie("accept_all")} className="inline-flex items-center gap-2 rounded-xl border border-neutral-900/20 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 dark:border-white/20 dark:bg-white/10 dark:text-white">
                <CircleCheck className="h-4 w-4" /> Accept All
              </button>
              <button onClick={() => setConsentCookie("reject_non_essential")} className="inline-flex items-center gap-2 rounded-xl border border-neutral-900/20 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 dark:border-white/20 dark:bg-white/10 dark:text-white">
                <Undo2 className="h-4 w-4" /> Reject Non‑Essential
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1fr_20rem] lg:gap-8 lg:px-8">
        <div className="space-y-6">
          <SectionCard id={SECTIONS[0].id} title={SECTIONS[0].label} icon={Info}>
            <p>Cookies are small text files placed on your device. We also use technologies like web beacons, pixels, local storage, SDKs, and device identifiers (together, “cookies”). We use them to make our services work, keep them secure, measure performance, remember preferences, support media delivery, and help us and our partners show relevant content.</p>
            <p>This Notice applies to FMG domains and products that link to it. Where we process personal data through cookies, our <a href="/legal/privacy" className="underline underline-offset-4">Privacy Policy</a> describes details such as data controller, rights, and contacts.</p>
          </SectionCard>

          <SectionCard id={SECTIONS[1].id} title={SECTIONS[1].label} icon={Cookie}>
            <ul className="list-disc pl-5">
              <li><strong>Cookies</strong> store a unique ID so a site can recognize your browser. They can be session (deleted when you close your browser) or persistent (stay until they expire or you delete them).</li>
              <li><strong>Pixels/web beacons</strong> are small images or code that load when you view a page or email, letting us or partners know an action occurred.</li>
              <li><strong>Local storage/SDKs</strong> are app/browser storage or libraries that keep data for functionality or analytics.</li>
            </ul>
          </SectionCard>

          <SectionCard id={SECTIONS[2].id} title={SECTIONS[2].label} icon={Globe}>
            <p><strong>First‑party cookies</strong> are set by FMG. <strong>Third‑party cookies</strong> are set by others (for example analytics, advertising, media hosting, customer support, payments). Third parties may read or set their cookies when you view FMG pages or interact with FMG content on their services.</p>
          </SectionCard>

          <SectionCard id={SECTIONS[3].id} title={SECTIONS[3].label} icon={FileText}>
            <div className="grid gap-2 text-[15px]">
              <p>We use cookies for the purposes below. Depending on your region, non‑essential cookies are used with your consent.</p>
              <ul className="grid list-disc gap-1 pl-5">
                <li><strong>Strictly Necessary</strong> — to load pages, log you in, route traffic, prevent fraud, and keep your preferences (e.g., cookie choices).</li>
                <li><strong>Performance/Analytics</strong> — to understand usage and improve reliability, features, and content.</li>
                <li><strong>Functional</strong> — to remember settings (language, region), support media, and enhance features.</li>
                <li><strong>Advertising/Marketing</strong> — to measure campaigns and show relevant content, including on other sites/apps.</li>
                <li><strong>Social Media</strong> — to enable sharing, embeds, and social sign‑in where offered.</li>
                <li><strong>Security & Abuse Prevention</strong> — to detect suspicious activity and protect accounts.</li>
                <li><strong>Experiments</strong> — to run A/B tests and measure outcomes.</li>
                <li><strong>Diagnostics</strong> — to log errors and crashes.</li>
              </ul>
            </div>
          </SectionCard>

          <SectionCard id={SECTIONS[4].id} title={SECTIONS[4].label} icon={Settings2}>
            <p>The exact cookies depend on your region, product, and current features. The <button onClick={manageCookiePreferences} className="underline underline-offset-4">Cookie Preferences Center</button> lists active vendors and cookies for your session. Examples include:</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-neutral-900/10 dark:border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-900/5 text-neutral-700 dark:bg-white/10 dark:text-white/80">
                  <tr>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Example Cookie</th>
                    <th className="px-3 py-2">Purpose</th>
                    <th className="px-3 py-2">Typical Lifetime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/10 dark:divide-white/10">
                  <tr>
                    <td className="px-3 py-2"><Pill>Strictly Necessary</Pill></td>
                    <td className="px-3 py-2">fmg_session</td>
                    <td className="px-3 py-2">Maintains login state and routes requests securely.</td>
                    <td className="px-3 py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2"><Pill>Analytics</Pill></td>
                    <td className="px-3 py-2">_ga / _gid</td>
                    <td className="px-3 py-2">Measures traffic and usage patterns.</td>
                    <td className="px-3 py-2">24 months / 24 hours</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2"><Pill>Functional</Pill></td>
                    <td className="px-3 py-2">preferred_language</td>
                    <td className="px-3 py-2">Remembers language or region settings.</td>
                    <td className="px-3 py-2">6–12 months</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2"><Pill>Advertising</Pill></td>
                    <td className="px-3 py-2">_fbp / _tt_enable_cookie</td>
                    <td className="px-3 py-2">Attribution and reach measurement for campaigns.</td>
                    <td className="px-3 py-2">90–180 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[13px] text-neutral-600 dark:text-white/60">Examples are illustrative. The live set may change; see the Cookie Preferences Center for the most up‑to‑date list of vendors and purposes.</p>
          </SectionCard>

          <SectionCard id={SECTIONS[5].id} title={SECTIONS[5].label} icon={Settings2}>
            <div className="space-y-3">
              <p>You have meaningful control over cookies and similar technologies:</p>
              <ul className="list-disc pl-5">
                <li><strong>Manage Center:</strong> Use the <button onClick={manageCookiePreferences} className="underline underline-offset-4">Cookie Preferences Center</button> to accept, reject, or update non‑essential categories at any time.</li>
                <li><strong>Browser Controls:</strong> Most browsers let you block/clear cookies. See your browser&#39;s help pages. Blocking may impact site functionality.</li>
                <li><strong>Mobile Settings:</strong> On iOS/Android you can reset advertising IDs and limit ad tracking in OS settings.</li>
                <li><strong>Industry Opt‑Outs:</strong> Visit the Network Advertising Initiative (NAI), Digital Advertising Alliance (DAA), or YourOnlineChoices (EU) for interest‑based advertising choices.</li>
                <li><strong>Global Privacy Control (GPC):</strong> Where required, we treat a valid GPC signal as an opt‑out of sale/sharing or targeted advertising.</li>
                <li><strong>Do Not Track (DNT):</strong> DNT is not widely honored; we rely on the controls described above.</li>
              </ul>
              <p className="text-[13px] text-neutral-600 dark:text-white/60">Changes may not remove previously set third‑party cookies automatically. You can clear them in your browser. Certain essential cookies cannot be disabled because they are strictly necessary for our services to function.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={manageCookiePreferences} className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"><Settings2 className="h-4 w-4"/>Open Preferences</button>
                <button onClick={() => setConsentCookie("reject_non_essential")} className="inline-flex items-center gap-2 rounded-xl border border-neutral-900/20 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 dark:border-white/20 dark:bg-white/10 dark:text-white"><Lock className="h-4 w-4"/>Reject Non‑Essential</button>
              </div>
            </div>
          </SectionCard>

          <SectionCard id={SECTIONS[6].id} title={SECTIONS[6].label} icon={Languages}>
            <p>Under the EU/UK GDPR and ePrivacy rules, we rely on:</p>
            <ul className="list-disc pl-5">
              <li><strong>Consent</strong> (GDPR Art. 6(1)(a)) for non‑essential cookies, including analytics/advertising, where required.</li>
              <li><strong>Legitimate interests</strong> (GDPR Art. 6(1)(f)) for strictly necessary cookies that enable core functionality and security, aligned with your reasonable expectations and subject to balancing tests.</li>
            </ul>
          </SectionCard>

          <SectionCard id={SECTIONS[7].id} title={SECTIONS[7].label} icon={ExternalLink}>
            <p>In some U.S. states (e.g., California), certain analytics/advertising activities may be considered a “sale,” “sharing,” or “targeted advertising.” Where applicable, you can opt‑out via the <button onClick={manageCookiePreferences} className="underline underline-offset-4">Cookie Preferences Center</button> or by sending a valid Global Privacy Control signal. See our <a href="/legal/privacy" className="underline underline-offset-4">Privacy Policy</a> for more on U.S. state privacy rights.</p>
          </SectionCard>

          <SectionCard id={SECTIONS[8].id} title={SECTIONS[8].label} icon={Clock}>
            <p>Cookies last for different periods:
              <ul className="list-disc pl-5">
                <li><strong>Session</strong> cookies are deleted when you close your browser/app.</li>
                <li><strong>Persistent</strong> cookies remain until their set expiry (for example 30, 90, 180, or 730 days) or until you delete them.</li>
              </ul>
              We retain cookie-derived data as described in our Privacy Policy and only as long as necessary for the purposes above, unless a longer period is required by law.
            </p>
          </SectionCard>

          <SectionCard id={SECTIONS[9].id} title={SECTIONS[9].label} icon={Network}>
            <p>We use technical and organizational measures to help protect cookie‑related data. However, no online service can be 100% secure. For security events, we follow our incident processes and legal obligations. <strong>Do Not Track (DNT):</strong> most browsers support DNT, but there is no common standard; we rely on the controls described in <a href="#your-choices" className="underline underline-offset-4">Your Choices</a>.</p>
          </SectionCard>

          <SectionCard id={SECTIONS[10].id} title={SECTIONS[10].label} icon={Globe}>
            <p>We may process data with vendors around the world. Where we transfer personal data internationally, we use appropriate safeguards (for example, EU/UK Standard Contractual Clauses) and supplement them as needed. See the <a href="/legal/privacy" className="underline underline-offset-4">Privacy Policy</a> for more.</p>
          </SectionCard>

          <SectionCard id={SECTIONS[11].id} title={SECTIONS[11].label} icon={ShieldCheck}>
            <p>Our services are intended for a general audience. We do not knowingly place cookies to profile children under applicable age thresholds. If you believe a child has provided personal data via cookies, please contact us.</p>
          </SectionCard>

          <SectionCard id={SECTIONS[12].id} title={SECTIONS[12].label} icon={FileText}>
            <p>We may update this Notice from time to time. If we make material changes, we will provide appropriate notice (for example, by posting the updated date, an in‑product message, or obtaining consent again where required).</p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-white/60">If a translation of this Notice conflicts with the English version, the English version controls to the extent permitted by law.</p>
          </SectionCard>

          <SectionCard id={SECTIONS[13].id} title={SECTIONS[13].label} icon={Info}>
            <p>Questions about this Cookies Notice or our use of cookies?</p>
            <ul className="list-none pl-0">
              <li>Email: <a href="mailto:legal@fmguniverse.com" className="underline underline-offset-4">legal@fmguniverse.com</a></li>
              <li>Postal: FMG Universe — Legal, Jakarta, Indonesia (or your local FMG entity)</li>
            </ul>
          </SectionCard>
        </div>

        <TableOfContents />
      </div>

      <footer className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-neutral-900/10 bg-white/60 p-4 text-[12px] text-neutral-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white/60">
          This page is provided for transparency and does not constitute legal advice. Your specific implementation (vendors, CMP, retention) may vary based on region and product. Ensure your Cookie Preferences Center reflects your current stack.
        </div>
      </footer>
    </main>
  );
}
