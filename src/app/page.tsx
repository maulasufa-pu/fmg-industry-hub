"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion, Variants, useScroll, useTransform } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, Music, LineChart, ShieldCheck } from "lucide-react";

/*****************************************
 * Types
 *****************************************/

type Service = {
  label: string;
  description: string;
  hrefPrimary: string;
  hrefSecondary?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  highlights?: readonly string[];
};

type Post = {
  title: string;
  href: string;
  tag: "Blog" | "News";
  dateISO: string; // YYYY-MM-DD
};

/*****************************************
 * Animation Variants
 *****************************************/

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: i * 0.06 },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

/*****************************************
 * Data (replace with CMS as needed)
 *****************************************/

const services: readonly Service[] = [
  {
    label: "Flemmo Studio",
    description: "Recording • Mixing • Mastering — release‑ready sound with two‑stage QC.",
    hrefPrimary: "/studio/booking",
    hrefSecondary: "/studio/services",
    icon: Music,
    highlights: ["Hybrid analog/digital", "A‑list engineering workflow", "QC 2‑step"],
  },
  {
    label: "Flemmo Creative",
    description: "MV • Content • Campaign — visuals and narratives that actually ship.",
    hrefPrimary: "/creative/brief",
    hrefSecondary: "/creative/portfolio",
    icon: Sparkles,
    highlights: ["Full‑stack production", "Campaign & rollout", "Brand safety"],
  },
  {
    label: "Flemmo Academy",
    description: "Education & Masterclasses — industry‑grade learning, real workflows.",
    hrefPrimary: "/academy/courses",
    hrefSecondary: "/academy/enroll",
    icon: PlayCircle,
    highlights: ["Mentor‑led", "Project‑based", "Career‑ready"],
  },
  {
    label: "FMG Publishing",
    description: "Distribution & Publishing — transparent splits, clear rights, clean reporting.",
    hrefPrimary: "/publishing/start-release",
    hrefSecondary: "/publishing/how-it-works",
    icon: ShieldCheck,
    highlights: ["Royalty splits", "Metadata & QC", "DSP pitch"],
  },
] as const;

const samplePosts: readonly Post[] = [
  { title: "How we cut idea→release time by 30%", href: "/blog/idea-to-release-30", tag: "Blog", dateISO: "2025-08-01" },
  { title: "FMG Publishing: 3 years serving creators", href: "/newsroom/fmg-publishing-3-years", tag: "News", dateISO: "2025-07-10" },
] as const;

/*****************************************
 * Utilities
 *****************************************/

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/*****************************************
 * Page Component
 *****************************************/

export default function HomePage(): React.JSX.Element {
  const { scrollYProgress } = useScroll();
  const scaleHero = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, 120]);

  const serviceCols = useMemo(() => services, []);

  return (
    <main className="min-h-screen bg-[#0A1220] text-white selection:bg-white/20 selection:text-white">
      {/* Top gradient / ambient */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div style={{ y: yGlow }} className="absolute left-1/2 top-[-12rem] -z-10 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-500/40 via-indigo-500/25 to-emerald-400/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/30 border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold tracking-tight hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40 rounded px-1">
            <span className="text-white">Flemmo</span>
            <span className="text-white/70"> Music Global</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <Link className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-1" href="/studio">Studio</Link>
            <Link className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-1" href="/creative">Creative</Link>
            <Link className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-1" href="/academy">Academy</Link>
            <Link className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-1 font-medium" href="/publishing">Publishing</Link>
            <Link className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-1" href="https://hub.flemmomusic.com">FMGIHub</Link>
          </nav>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/publishing/start-release" className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-black">
              Start a Release <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/studio/booking" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40">
              Book the Studio
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <motion.div style={{ scale: scaleHero }} initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight tracking-tight">
              Artist‑First Infrastructure.
            </h1>
            <p className="mt-5 max-w-2xl text-lg sm:text-xl text-white/80">
              Produksi studio, konten, edukasi, serta distribusi & publishing—terintegrasi lewat <span className="text-white">FMGIHub</span>.
              Gerak dari ide sampai rilis tanpa friksi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/publishing/start-release" className="inline-flex items-center gap-2 rounded-2xl bg-white text-black px-5 py-3 text-sm font-medium hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-black">
                Start a Release <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/studio/booking" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40">
                Book the Studio
              </Link>
              <Link href="https://hub.flemmomusic.com/network" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40">
                Join the Network
              </Link>
            </div>

            {/* Proof bar */}
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                "FMG Publishing: 3+ years",
                "Founder: Sony Music Group Global Scholars",
                "Global collaborations",
              ].map((item, i) => (
                <motion.div
                  key={item}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.6 }}
                  variants={fadeUp}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section aria-labelledby="services" className="relative py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <h2 id="services" className="text-2xl sm:text-3xl font-semibold tracking-tight">What We Do</h2>
            <Link href="/about" className="text-white/70 hover:text-white text-sm">About Flemmo</Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {serviceCols.map((s, i) => (
              <motion.article
                key={s.label}
                className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.03] p-5 hover:border-white/20"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                custom={i}
                variants={scaleIn}
              >
                <div className="flex items-center gap-3">
                  <s.icon className="h-5 w-5 text-white" />
                  <h3 className="text-lg font-medium">{s.label}</h3>
                </div>
                <p className="mt-3 text-sm text-white/80 min-h-[56px]">{s.description}</p>
                {s.highlights && (
                  <ul className="mt-3 space-y-1 text-xs text-white/70">
                    {s.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/60" /> {h}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={s.hrefPrimary} className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-3 py-2 text-xs font-medium hover:bg-white/90">
                    {s.label.includes("Publishing") ? "Start a Release" : s.label.includes("Creative") ? "Submit Brief" : s.label.includes("Academy") ? "View Courses" : "Book Now"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {s.hrefSecondary && (
                    <Link href={s.hrefSecondary} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs text-white/90 hover:bg-white/10">
                      Learn more
                    </Link>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <h2 id="how" className="text-2xl sm:text-3xl font-semibold tracking-tight">How It Works</h2>
            <Link href="https://hub.flemmomusic.com" className="text-white/70 hover:text-white text-sm">FMGIHub</Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-5">
            {[
              { k: "Join", d: "Onboarding & verified profile." },
              { k: "Create", d: "Studio & Creative production pipeline." },
              { k: "Publish", d: "Metadata, QC, release via FMG Publishing." },
              { k: "Connect", d: "FMGIHub Network for briefs & collabs." },
              { k: "Grow", d: "Analytics & insights for next releases." },
            ].map((step, i) => (
              <motion.div key={step.k} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm uppercase tracking-wide text-white/60">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-lg font-medium">{step.k}</div>
                <p className="mt-1 text-sm text-white/80">{step.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured work */}
      <section aria-labelledby="work" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <h2 id="work" className="text-2xl sm:text-3xl font-semibold tracking-tight">Featured Work</h2>
            <div className="flex items-center gap-4 text-sm">
              <Link className="text-white/70 hover:text-white" href="/studio/portfolio">Studio Portfolio</Link>
              <Link className="text-white/70 hover:text-white" href="/creative/portfolio">Creative Portfolio</Link>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.figure key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="aspect-video bg-gradient-to-br from-white/10 to-white/0" />
                <figcaption className="p-4">
                  <div className="text-sm text-white/70">Project {i}</div>
                  <div className="mt-1 text-base">Role: Production • Mix • Master</div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Publishing highlight */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Distribution & Publishing that’s actually clear</h2>
              <p className="mt-3 text-white/80">Royalty splits yang jelas, pelaporan yang kebaca, metadata & QC rapi, dan pitch ke DSP. Bergerak dari demo ke rilis dengan kontrol penuh atas hak.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/publishing/start-release" className="inline-flex items-center gap-2 rounded-2xl bg-white text-black px-5 py-3 text-sm font-medium hover:bg-white/90">
                  Start a Release <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/publishing/how-it-works" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm text-white/90 hover:bg-white/10">
                  How it Works
                </Link>
                <Link href="/publishing/pricing" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm text-white/90 hover:bg-white/10">
                  See Pricing
                </Link>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-3 text-white/90"><LineChart className="h-5 w-5" /> Reporting Snapshot</div>
              <div className="mt-4 h-40 rounded-lg bg-gradient-to-tr from-emerald-300/20 via-blue-300/20 to-indigo-300/20" />
              <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/80">
                <li className="rounded-lg border border-white/10 bg-white/5 p-3">T+3 payout option</li>
                <li className="rounded-lg border border-white/10 bg-white/5 p-3">Split by track & version</li>
                <li className="rounded-lg border border-white/10 bg-white/5 p-3">DSP pitch helper</li>
                <li className="rounded-lg border border-white/10 bg-white/5 p-3">Rights audit trail</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Academy */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="lg:col-span-1">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Flemmo Academy</h2>
              <p className="mt-3 text-white/80">Kurikulum praktis yang bersumber dari workflow produksi dan rilis nyata. Mentor, project‑based, career‑ready.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/academy/courses" className="inline-flex items-center gap-2 rounded-2xl bg-white text-black px-5 py-3 text-sm font-medium hover:bg-white/90">
                  View Courses <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/academy/enroll" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm text-white/90 hover:bg-white/10">
                  Enroll Now
                </Link>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="lg:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {["Vocal Recording Modern", "Mixing for Streaming", "Release Strategy 101", "Sound Design for Visuals"].map((c) => (
                <article key={c} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="aspect-video rounded-lg bg-gradient-to-br from-white/10 to-white/0" />
                  <h3 className="mt-3 text-base font-medium">{c}</h3>
                  <p className="mt-1 text-sm text-white/70">Mentor‑led • Project‑based</p>
                </article>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logos / social proof (optional) */}
      <section aria-label="Social proof" className="relative py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {["Partner A", "Partner B", "Editor C", "Brand D"].map((n) => (
              <div key={n} className="h-10 rounded bg-white/5 text-center text-white/40 text-sm leading-10">{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog & News */}
      <section aria-labelledby="updates" className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <h2 id="updates" className="text-2xl sm:text-3xl font-semibold tracking-tight">From the Team</h2>
            <div className="flex items-center gap-4 text-sm">
              <Link className="text-white/70 hover:text-white" href="/blog">Blog</Link>
              <Link className="text-white/70 hover:text-white" href="/newsroom">Newsroom</Link>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {samplePosts.map((p, i) => (
              <motion.article key={p.href} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs text-white/60">{p.tag} • {formatDate(p.dateISO)}</div>
                <h3 className="mt-2 text-lg font-medium">
                  <Link href={p.href} className="hover:underline decoration-white/50 underline-offset-4">{p.title}</Link>
                </h3>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Siap bawa proyekmu ke rilis?</h2>
          <p className="mt-4 text-white/80 max-w-xl mx-auto">Mulai dari mana pun kamu berada—kami bantu bergerak dari ide ke rilis dengan kontrol atas hak, data, dan kualitas.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/publishing/start-release" className="inline-flex items-center gap-2 rounded-2xl bg-white text-black px-5 py-3 text-sm font-medium hover:bg-white/90">
              Start a Release <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/creative/brief" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm text-white/90 hover:bg-white/10">
              Submit a Brief
            </Link>
            <Link href="/studio/booking" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm text-white/90 hover:bg-white/10">
              Book the Studio
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 text-sm">
            <div>
              <div className="font-medium text-white">Flemmo</div>
              <ul className="mt-3 space-y-2 text-white/70">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-white">Services</div>
              <ul className="mt-3 space-y-2 text-white/70">
                <li><Link href="/studio" className="hover:text-white">Studio</Link></li>
                <li><Link href="/creative" className="hover:text-white">Creative</Link></li>
                <li><Link href="/academy" className="hover:text-white">Academy</Link></li>
                <li><Link href="/publishing" className="hover:text-white">Publishing</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-white">FMGIHub</div>
              <ul className="mt-3 space-y-2 text-white/70">
                <li><Link href="https://hub.flemmomusic.com" className="hover:text-white">Overview</Link></li>
                <li><Link href="https://hub.flemmomusic.com/network" className="hover:text-white">Network</Link></li>
                <li><Link href="https://hub.flemmomusic.com/products" className="hover:text-white">Products</Link></li>
                <li><Link href="https://app.flemmomusic.com/login" className="hover:text-white">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-white">Legal</div>
              <ul className="mt-3 space-y-2 text-white/70">
                <li><Link href="/legal/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-white">Cookies</Link></li>
                <li><Link href="/legal/dmca" className="hover:text-white">DMCA</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/50">
            <div>© {new Date().getFullYear()} Flemmo Music Global. All rights reserved.</div>
            <div className="space-y-1">
              <div>FMG Publishing is a division of Flemmo Music Global.</div>
              <div>FMGIHub is a platform & network of Flemmo Music Global.</div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
