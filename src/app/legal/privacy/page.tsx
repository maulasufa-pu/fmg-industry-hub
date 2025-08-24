"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  FileText,
  Cookie,
  Globe,
  Mail,
  Lock,
  Database,
  Cog,
  UserCheck,
  Trash2,
  Clock,
  Building2,
  EyeOff,
  Activity,
  KeyRound,
} from "lucide-react";

/*************************************************
 * FMG Universe — /legal/privacy
 * - Modern, professional single page (no slides)
 * - Light/Dark friendly, glass cards, gradient accents
 * - Sticky Table of Contents with scroll-spy
 * - Reduced-motion aware, a11y focused
 *************************************************/

/* ---------- Small helpers ---------- */
function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ---------- The page ---------- */
export default function PrivacyPage(): React.JSX.Element {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<string>("intro");

  const lastUpdated = "2025-08-01"; // set to your official effective date (YYYY-MM-DD)

  const sections = useMemo(
    () => [
      { id: "intro", label: "Introduction", Icon: FileText },
      { id: "scope", label: "Scope & Who We Are", Icon: Building2 },
      { id: "collection", label: "Information We Collect", Icon: Database },
      { id: "sources", label: "Sources of Data", Icon: Globe },
      { id: "use", label: "How We Use Data", Icon: Cog },
      { id: "legal-bases", label: "Legal Bases (GDPR)", Icon: ShieldCheck },
      { id: "sharing", label: "Sharing & Disclosure", Icon: UserCheck },
      { id: "ai", label: "AI & Automated Decisions", Icon: Activity },
      { id: "cookies", label: "Cookies & Tracking", Icon: Cookie },
      { id: "transfers", label: "International Transfers", Icon: Globe },
      { id: "retention", label: "Data Retention", Icon: Clock },
      { id: "security", label: "Security", Icon: Lock },
      { id: "your-rights", label: "Your Rights", Icon: KeyRound },
      { id: "children", label: "Children's Privacy", Icon: EyeOff },
      { id: "third-party", label: "Third‑Party Links & Services", Icon: Globe },
      { id: "changes", label: "Changes to This Policy", Icon: FileText },
      { id: "contact", label: "Contact", Icon: Mail },
    ],
    []
  );

  /* ---------- Scroll‑spy ---------- */
  useEffect(() => {
    const root = containerRef.current ?? undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      {
        root,
        threshold: [0.3, 0.6, 0.9],
      }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const card = "rounded-2xl border border-neutral-900/10 bg-white/70 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-white/5";
  const h2 = "text-xl font-semibold tracking-tight text-neutral-900 dark:text-white";
  const p = "text-[15px] leading-relaxed text-neutral-700 dark:text-white/80";
  const list = "list-disc pl-5 space-y-2 text-[15px] text-neutral-700 dark:text-white/80";

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">
      {/* Soft gradient background accents */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: -16 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute -top-28 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/12 to-sky-500/10 blur-2xl"
        />
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="absolute -bottom-28 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-400/12 to-cyan-400/10 blur-2xl"
        />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="pt-16 sm:pt-20 md:pt-24 pb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
              FMG Universe • Privacy Policy
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-3 max-w-2xl text-neutral-700 dark:text-white/80">
              Your privacy matters. This policy explains what we collect, why we collect it, how we use and share it, and the choices you have.
            </p>
            <div className="mt-3 text-sm text-neutral-600 dark:text-white/60">
              Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
          {/* Sticky TOC */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className={classNames(card, "sticky top-6 p-4 sm:p-5")}>
              <div className="text-sm font-semibold opacity-80">On this page</div>
              <nav className="mt-3 grid gap-1.5" aria-label="Table of contents">
                {sections.map(({ id, label, Icon }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={classNames(
                      "group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
                      active === id
                        ? "bg-neutral-900/5 text-neutral-900 dark:bg-white/10 dark:text-white"
                        : "text-neutral-700 hover:bg-neutral-900/5 dark:text-white/70 dark:hover:bg-white/10"
                    )}
                    aria-current={active === id ? "true" : undefined}
                  >
                    <Icon className="h-4 w-4 opacity-70" />
                    <span>{label}</span>
                  </a>
                ))}
              </nav>
              <div className="mt-4">
                <button
                  onClick={() => (window as any)?.FMG?.openCookieManager?.()}
                  className="w-full rounded-xl border border-neutral-900/10 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-100 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  Cookie Preferences
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div ref={containerRef} className="lg:col-span-8 xl:col-span-9">
            <ArticleCard id="intro" title="Introduction" Icon={FileText}>
              <p className={p}>
                This Privacy Policy describes how FMG Universe (&#34;FMG&#34;, &#34;we&#34;, &#34;us&#34;, &#34;our&#34;) collects, uses, shares, and protects personal data when you visit our websites, use our apps and platforms, engage with our talent and publishing services, or otherwise interact with us (collectively, the &#34;Services&#34;). By using the Services, you agree to this Policy.
              </p>
              <p className={classNames(p, "mt-3")}>
                If you do not agree, please do not use the Services. Where required by law, we will seek your explicit consent before processing certain data.
              </p>
            </ArticleCard>

            <ArticleCard id="scope" title="Scope & Who We Are" Icon={Building2}>
              <ul className={list}>
                <li>
                  <strong>Controller:</strong> FMG Universe, with principal place of business in Jakarta, Indonesia. For some activities we act as a <em>processor</em> on behalf of clients.
                </li>
                <li>
                  <strong>Coverage:</strong> This Policy applies to our websites, portals, creator tools, analytics dashboards, and business operations for Creation, Talent, Media, R&D, Publishing, Live, and Academy.
                </li>
                <li>
                  <strong>Exclusions:</strong> Third‑party sites and services linked from our Services are governed by their own policies.
                </li>
              </ul>
            </ArticleCard>

            <ArticleCard id="collection" title="Information We Collect" Icon={Database}>
              <p className={p}>The types of personal data we collect include:</p>
              <ul className={list}>
                <li><strong>Account & identity</strong> (name, email, username, password, role, verification status).</li>
                <li><strong>Professional & talent</strong> (portfolio links, credits, splits, IPI/CAE, ISWC/ISRC mapping, bios, skills, availability).</li>
                <li><strong>Contact & communications</strong> (messages, support tickets, preferences, marketing opt‑ins).</li>
                <li><strong>Transactional</strong> (orders, invoices, payment tokens via processors; we do not store full card numbers).</li>
                <li><strong>Usage & device</strong> (log data, IP, approximate location, browser/OS/DAW details, performance metrics, crash reports).</li>
                <li><strong>Content you upload</strong> (audio, stems, metadata, artwork, documents, comments, timestamps, version history).</li>
                <li><strong>Cookies & similar tech</strong> (described below).</li>
              </ul>
            </ArticleCard>

            <ArticleCard id="sources" title="Sources of Data" Icon={Globe}>
              <ul className={list}>
                <li><strong>Directly from you</strong> (forms, uploads, contracts, communications).</li>
                <li><strong>Automatically</strong> through your use of the Services (logs, analytics, device data).</li>
                <li><strong>Third parties</strong> (payment processors, DSPs, PROs/CMOs, identity verification, marketing platforms, publicly available sources).
                </li>
              </ul>
            </ArticleCard>

            <ArticleCard id="use" title="How We Use Data" Icon={Cog}>
              <ul className={list}>
                <li><strong>Provide & improve Services</strong>, including account management, features, personalization, support, and QA.</li>
                <li><strong>Rights & releases ops</strong> (metadata, splits, registrations, audit trails, royalty matching).</li>
                <li><strong>Safety & integrity</strong> (fraud prevention, abuse, security, compliance, and enforcing Terms).</li>
                <li><strong>Analytics & R&D</strong> (measuring performance, training and evaluating internal models where permitted).</li>
                <li><strong>Communications</strong> (service notices, transactional emails, marketing with your consent or as allowed by law).</li>
                <li><strong>Legal obligations</strong> and to protect vital or legitimate interests.</li>
              </ul>
            </ArticleCard>

            <ArticleCard id="legal-bases" title="Legal Bases (GDPR)" Icon={ShieldCheck}>
              <ul className={list}>
                <li><strong>Performance of a contract</strong> (providing requested Services).</li>
                <li><strong>Consent</strong> (marketing, certain cookies, optional data). You may withdraw at any time.</li>
                <li><strong>Legitimate interests</strong> (improving Services, security, analytics, preventing abuse) balanced against your rights.</li>
                <li><strong>Legal obligation</strong> (tax, accounting, regulatory requests).</li>
                <li><strong>Vital interests</strong> (rare emergencies).</li>
              </ul>
            </ArticleCard>

            <ArticleCard id="sharing" title="Sharing & Disclosure" Icon={UserCheck}>
              <p className={p}>We do not sell personal data. We share it as necessary with:</p>
              <ul className={list}>
                <li><strong>Service providers</strong> (cloud hosting, storage, analytics, communications, payments, support) under contracts.</li>
                <li><strong>Music ecosystem partners</strong> (DSPs, distributors, PROs/CMOs, licensors, licensees) to deliver your selections, releases, and rights operations.</li>
                <li><strong>Professional advisors</strong> (legal, audit, insurance).</li>
                <li><strong>Corporate events</strong> (merger, acquisition, financing) subject to appropriate safeguards.</li>
                <li><strong>Law enforcement or regulators</strong> when required by law or to protect rights, safety, or integrity.</li>
              </ul>
            </ArticleCard>

            <ArticleCard id="ai" title="AI & Automated Decisions" Icon={Activity}>
              <ul className={list}>
                <li>
                  We may use machine learning to enable features such as similarity search, deduplication, moderation aids, talent or catalog recommendations, or workflow predictions.
                </li>
                <li>
                  We do <strong>not</strong> use automated decision‑making that produces legal or similarly significant effects without meaningful human review.
                </li>
                <li>
                  Where required, we obtain consent or provide opt‑out mechanisms for personalization. You can contact us to object to profiling where applicable.
                </li>
              </ul>
            </ArticleCard>

            <ArticleCard id="cookies" title="Cookies & Tracking" Icon={Cookie}>
              <p className={p}>We use cookies and similar technologies to operate and improve the Services.</p>
              <ul className={list}>
                <li><strong>Essential</strong> – required for core functionality, security, and network management.</li>
                <li><strong>Analytics</strong> – help us understand usage and improve performance.</li>
                <li><strong>Functional</strong> – remember preferences and enhance features.</li>
                <li><strong>Advertising</strong> – measure campaigns and, where applicable, deliver relevant content (subject to consent).</li>
              </ul>
              <p className={classNames(p, "mt-3")}>
                You can manage preferences any time via the <em>Cookie Preferences</em> button above or your browser settings. We currently do not respond to do‑not‑track signals. Where supported, we treat a valid <em>Global Privacy Control (GPC)</em> signal as a request to opt‑out of sale/share of personal data.
              </p>
            </ArticleCard>

            <ArticleCard id="transfers" title="International Transfers" Icon={Globe}>
              <p className={p}>
                We operate globally. When transferring personal data internationally, we implement appropriate safeguards, such as Standard Contractual Clauses (and the UK Addendum where applicable) or other lawful mechanisms. You can request a copy of relevant safeguards.
              </p>
            </ArticleCard>

            <ArticleCard id="retention" title="Data Retention" Icon={Clock}>
              <p className={p}>
                We retain personal data for as long as necessary to fulfill the purposes outlined in this Policy, comply with legal obligations, resolve disputes, and enforce agreements. Retention periods vary by data type; we apply documented schedules and delete or anonymize data when no longer needed.
              </p>
            </ArticleCard>

            <ArticleCard id="security" title="Security" Icon={Lock}>
              <ul className={list}>
                <li>We use technical and organizational measures designed to protect personal data (encryption in transit, access controls, logging, secure development practices).</li>
                <li>No system is perfectly secure; we cannot guarantee absolute security.</li>
                <li>Report security issues to <a href="mailto:security@fmguniverse.com" className="underline underline-offset-4">security@fmguniverse.com</a>.</li>
              </ul>
            </ArticleCard>

            <ArticleCard id="your-rights" title="Your Rights" Icon={KeyRound}>
              <p className={p}>Depending on your location, you may have rights such as:</p>
              <ul className={list}>
                <li><strong>Access</strong>, <strong>correct</strong>, or <strong>delete</strong> your personal data.</li>
                <li><strong>Portability</strong>, <strong>restriction</strong>, or <strong>objection</strong> to certain processing.</li>
                <li><strong>Withdraw consent</strong> at any time (where processing is based on consent).</li>
                <li><strong>Opt‑out</strong> of direct marketing and, where applicable, sale/share of personal data.</li>
              </ul>
              <p className={classNames(p, "mt-3")}>Region‑specific notices:</p>
              <ul className={list}>
                <li><strong>EU/UK (GDPR):</strong> You may lodge a complaint with your supervisory authority.</li>
                <li><strong>California (CPRA/CCPA):</strong> Rights to know, delete, correct, and opt‑out of sale/share; we do not discriminate for exercising these rights. We honor GPC signals where recognized.</li>
                <li><strong>Other regions:</strong> We will honor applicable local laws. Contact us to exercise your rights.</li>
              </ul>
              <p className={classNames(p, "mt-3")}>
                To make a request, email <a href="mailto:privacy@fmguniverse.com" className="underline underline-offset-4">privacy@fmguniverse.com</a> or use in‑app settings where available. We may verify your request and may deny requests where an exemption applies.
              </p>
            </ArticleCard>

            <ArticleCard id="children" title="Children's Privacy" Icon={EyeOff}>
              <p className={p}>
                Our Services are not directed to children under 13 (or the age of digital consent in your region). We do not knowingly collect personal data from children. If you believe a child provided data, contact us and we will take appropriate steps to delete it.
              </p>
            </ArticleCard>

            <ArticleCard id="third-party" title="Third‑Party Links & Services" Icon={Globe}>
              <p className={p}>
                The Services may link to third‑party websites, DSPs, plugins, or apps. Their privacy practices are governed by their own policies. We are not responsible for their content or practices.
              </p>
            </ArticleCard>

            <ArticleCard id="changes" title="Changes to This Policy" Icon={FileText}>
              <p className={p}>
                We may update this Policy from time to time. When we make material changes, we will notify you by posting the updated Policy and adjusting the &#34;Last updated&#34; date, and, where required, provide additional notice or seek consent.
              </p>
            </ArticleCard>

            <ArticleCard id="contact" title="Contact" Icon={Mail}>
              <p className={p}>
                Questions, requests, or complaints about privacy? Contact our privacy team at
                {" "}
                <a href="mailto:privacy@fmguniverse.com" className="underline underline-offset-4">privacy@fmguniverse.com</a>.
              </p>
              <p className={classNames(p, "mt-3")}>
                If you are in the EU/UK, you may also contact your local supervisory authority. If you are in California, you may contact us to exercise your CPRA rights or use settings where available.
              </p>
            </ArticleCard>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------- Reusable Article Card ---------- */
function ArticleCard({
  id,
  title,
  Icon,
  children,
}: {
  id: string;
  title: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-label={title} className="scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4 }}
        className="mb-6 rounded-2xl border border-neutral-900/10 bg-white/70 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6"
      >
        <div className="mb-3 inline-flex items-center gap-2">
          <div className="rounded-xl bg-neutral-900/10 p-2 dark:bg-white/10">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
        </div>
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          {children}
        </div>
      </motion.div>
    </section>
  );
}
