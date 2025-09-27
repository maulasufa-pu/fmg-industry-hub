"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Mail,
  Send,
  Loader2,
  Megaphone,
  Handshake,
  Music2,
  Newspaper,
  ShieldCheck,
  HelpCircle,
  Building2,
  MapPin,
  Clock,
  ExternalLink
} from "lucide-react";

type Reason =
  | "project"
  | "partnership"
  | "publishing"
  | "press"
  | "support"
  | "other";

type FormValues = {
  name: string;
  email: string;
  company?: string;
  reason: Reason;
  subject: string;
  message: string;
};

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultValues: FormValues = {
  name: "",
  email: "",
  company: "",
  reason: "project",
  subject: "",
  message: "",
};

type Channel = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
  href: string;
  badge?: string;
};

function ChannelCard({ icon: Icon, title, desc, href, badge }: Channel): React.JSX.Element {
  return (
    <a
      href={href}
      className="group relative block rounded-2xl border border-neutral-900/10 bg-white/60 p-5 shadow-sm ring-1 ring-transparent backdrop-blur-lg transition hover:shadow-md hover:ring-neutral-900/10 dark:border-white/10 dark:bg-white/5 dark:hover:ring-white/20"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-neutral-900/5 p-3 text-neutral-900 dark:bg-white/10 dark:text-white">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{title}</h3>
            {badge && (
              <span className="rounded-full bg-neutral-900/5 px-2 py-0.5 text-[11px] text-neutral-600 dark:bg-white/10 dark:text-white/70">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-3 text-sm text-neutral-700 dark:text-white/80">{desc}</p>
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-neutral-900 group-hover:gap-1.5 dark:text-white">
            Open <ExternalLink className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 via-fuchsia-500/0 to-amber-300/0 opacity-0 transition-opacity duration-300 group-hover:opacity-30"
      />
    </a>
  );
}

function StatusBanner({ state }: { state: FormState }): React.JSX.Element | null {
  if (state.status === "idle") return null;
  const base = "rounded-xl border px-3 py-2 text-sm";
  if (state.status === "submitting") {
    return (
      <div className={`${base} border-neutral-900/10 bg-neutral-900/5 text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80`}>
        Sending your message…
      </div>
    );
  }
  if (state.status === "success") {
    return (
      <div className={`${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300`}>
        {state.message}
      </div>
    );
  }
  return (
    <div className={`${base} border-rose-500/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300`}>
      {state.message}
    </div>
  );
}

export default function ContactPage(): React.JSX.Element {
  const reduce = useReducedMotion();
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [touched, setTouched] = useState<Record<keyof FormValues, boolean>>({
    name: false,
    email: false,
    company: false,
    reason: false,
    subject: false,
    message: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const r = params.get("reason") as Reason | null;
    if (r && ["project","partnership","publishing","press","support","other"].includes(r)) {
      setValues((v) => ({ ...v, reason: r }));
    }
  }, []);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormValues, string>> = {};
    if (!values.name.trim()) e.name = "Name is required.";
    if (!emailRe.test(values.email)) e.email = "Invalid email address.";
    if (!values.subject.trim()) e.subject = "Subject is required.";
    if (values.message.trim().length < 20) e.message = "Message must be at least 20 characters.";
    return e;
  }, [values]);

  const hasErrors = Object.keys(errors).length > 0;

  const onChange =
    <K extends keyof FormValues>(key: K) =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const next = ev.target.value;
      setValues((v) => ({ ...v, [key]: next }));
    };

  const onBlur =
    <K extends keyof FormValues>(key: K) =>
    () => {
      setTouched((t) => ({ ...t, [key]: true }));
    };

  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setTouched({
      name: true,
      email: true,
      company: true,
      reason: true,
      subject: true,
      message: true,
    });
    if (hasErrors) return;

    try {
      setState({ status: "submitting" });
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const msg = `Failed to send (${res.status}). Please try again.`;
        setState({ status: "error", message: msg });
        return;
      }
      setState({ status: "success", message: "Thank you! Our team will review and get back to you shortly." });
      setValues(defaultValues);
      setTouched({
        name: false,
        email: false,
        company: false,
        reason: false,
        subject: false,
        message: false,
      });
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  };

  const channels: ReadonlyArray<Channel> = [
    {
      icon: Megaphone,
      title: "Project & Creative",
      desc: "Campaign briefs, content, music & media production. From idea to release.",
      href: "/media/inquiry",
      badge: "Priority",
    },
    {
      icon: Handshake,
      title: "Partnerships",
      desc: "Brand collaborations, co-programs, and long-term partnerships.",
      href: "/partners",
    },
    {
      icon: Music2,
      title: "Publishing / Rights",
      desc: "Work registration, split sheets, royalty claims, sync licensing.",
      href: "/publishing/inquiry",
    },
    {
      icon: Newspaper,
      title: "Press & Media",
      desc: "Interviews, press kit, media releases, and coverage info.",
      href: "/press",
    },
    {
      icon: ShieldCheck,
      title: "Support",
      desc: "General questions, request status, or account help.",
      href: "/help",
    },
  ];

  return (
    <main className="relative min-h-[100dvh] bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-white">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={reduce ? undefined : { opacity: 0.35, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/16 to-sky-500/12 blur-3xl"
        />
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -20 }}
          animate={reduce ? undefined : { opacity: 0.35, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="absolute -bottom-24 -right-24 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-400/16 to-cyan-400/12 blur-3xl"
        />
      </div>

      {/* Hero */}
      <section className="relative px-4 pt-24 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            Contact FMG Universe
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            Let’s build something remarkable.
          </h1>
          <p className="mt-3 max-w-2xl text-neutral-700 dark:text-white/80">
            Beyond Sound. Built-in Intelligence. We help artists, labels, and brands turn creativity into compounding value — with one operating system for music.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-700 dark:text-white/70">
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-4 w-4" /> FMG Universe — Global / Remote
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Jakarta, ID
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" /> Mon–Fri, 10:00–18:00 (GMT+7)
            </span>
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-6 pt-8 sm:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((c, i) => (
            <ChannelCard key={i} {...c} />
          ))}
          <a
            href="/press"
            className="group relative block rounded-2xl border border-dashed border-neutral-900/20 p-5 text-neutral-700 transition hover:border-neutral-900/40 dark:border-white/20 dark:text-white/80 dark:hover:border-white/40"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-neutral-900/5 p-3 text-neutral-900 dark:bg-white/10 dark:text-white">
                <Newspaper className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Press & Media Kit</h3>
                <p className="mt-1 text-sm">
                  Logos, brand assets, bios, and editorial guidelines.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-neutral-900 group-hover:gap-1.5 dark:text-white">
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </a>
        </div>
      </section>

      <section className="relative px-4 pb-24 pt-6 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-neutral-900/10 bg-white/60 p-5 shadow-sm backdrop-blur-lg dark:border-white/10 dark:bg-white/5">
              <h2 className="text-xl font-semibold">Send us a message</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-white/70">
                Fill out the form below. We’ll review and get back to you.
              </p>

              <form className="mt-5 grid gap-4" onSubmit={onSubmit} noValidate>
                <StatusBanner state={state} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="text-sm font-medium">Name</label>
                    <input
                      id="name"
                      name="name"
                      value={values.name}
                      onChange={onChange("name")}
                      onBlur={onBlur("name")}
                      required
                      className="mt-1 w-full rounded-xl border border-neutral-900/10 bg-white/80 px-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900/30 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/30"
                      placeholder="Full name"
                    />
                    {touched.name && errors.name && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={onChange("email")}
                      onBlur={onBlur("email")}
                      required
                      className="mt-1 w-full rounded-xl border border-neutral-900/10 bg-white/80 px-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900/30 dark:border-white/10 dark:bg-white/5"
                      placeholder="you@company.com"
                    />
                    {touched.email && errors.email && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="company" className="text-sm font-medium">Company / Role (optional)</label>
                    <input
                      id="company"
                      name="company"
                      value={values.company ?? ""}
                      onChange={onChange("company")}
                      onBlur={onBlur("company")}
                      className="mt-1 w-full rounded-xl border border-neutral-900/10 bg-white/80 px-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900/30 dark:border-white/10 dark:bg-white/5"
                      placeholder="Company name or role"
                    />
                  </div>

                  <div>
                    <label htmlFor="reason" className="text-sm font-medium">Category</label>
                    <select
                      id="reason"
                      name="reason"
                      value={values.reason}
                      onChange={onChange("reason")}
                      onBlur={onBlur("reason")}
                      className="mt-1 w-full rounded-xl border border-neutral-900/10 bg-white/80 px-3 py-2 text-sm outline-none ring-0 focus:border-neutral-900/30 dark:border-white/10 dark:bg-white/5"
                    >
                      <option value="project">Project / Creative</option>
                      <option value="partnership">Partnership</option>
                      <option value="publishing">Publishing / Rights</option>
                      <option value="press">Press & Media</option>
                      <option value="support">Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                  <input
                    id="subject"
                    name="subject"
                    value={values.subject}
                    onChange={onChange("subject")}
                    onBlur={onBlur("subject")}
                    required
                    className="mt-1 w-full rounded-xl border border-neutral-900/10 bg-white/80 px-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900/30 dark:border-white/10 dark:bg-white/5"
                    placeholder="e.g., Sync license request"
                  />
                  {touched.subject && errors.subject && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <span className="text-xs text-neutral-500 dark:text-white/50">
                      {values.message.trim().length}/2000
                    </span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    maxLength={2000}
                    value={values.message}
                    onChange={onChange("message")}
                    onBlur={onBlur("message")}
                    required
                    className="mt-1 w-full rounded-xl border border-neutral-900/10 bg-white/80 px-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900/30 dark:border-white/10 dark:bg-white/5"
                    placeholder="Tell us about your needs, timeline, budget range (optional), and success criteria."
                  />
                  {touched.message && errors.message && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.message}</p>
                  )}
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-neutral-900/10 bg-white/60 p-3 text-xs text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                  <ShieldCheck className="mt-0.5 h-4 w-4" />
                  <p>
                    By submitting, you agree to our privacy policy and consent to having your data processed. You can request deletion anytime.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={state.status === "submitting"}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90"
                  >
                    {state.status === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send message
                      </>
                    )}
                  </button>

                  <a
                    href="mailto:hello@your-domain"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-900/20 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                  >
                    <Mail className="h-4 w-4" /> Email us
                  </a>
                </div>
              </form>
            </div>
          </div>

          <aside className="md:col-span-2">
            <div className="rounded-2xl border border-neutral-900/10 bg-white/60 p-5 backdrop-blur-lg dark:border-white/10 dark:bg-white/5">
              <h3 className="text-base font-semibold">Quick questions</h3>
              <ul className="mt-3 space-y-3 text-sm text-neutral-700 dark:text-white/80">
                <li className="rounded-xl bg-neutral-900/5 p-3 dark:bg-white/5">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="font-medium">How fast is the response?</p>
                      <p className="text-[13px] opacity-80">We aim to reply as soon as possible on business days.</p>
                    </div>
                  </div>
                </li>
                <li className="rounded-xl bg-neutral-900/5 p-3 dark:bg-white/5">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="font-medium">Do you accept NDAs?</p>
                      <p className="text-[13px] opacity-80">Yes. We can sign an NDA before sharing sensitive materials.</p>
                    </div>
                  </div>
                </li>
                <li className="rounded-xl bg-neutral-900/5 p-3 dark:bg-white/5">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="font-medium">What’s your process?</p>
                      <p className="text-[13px] opacity-80">Brief → proposal → scope & timeline → kickoff → iterative milestones → release.</p>
                    </div>
                  </div>
                </li>
              </ul>

              <div className="mt-5 rounded-xl border border-dashed border-neutral-900/20 p-3 text-xs text-neutral-600 dark:border-white/20 dark:text-white/70">
                <p>
                  For fast sync licensing, go straight to{" "}
                  <a href="/publishing/inquiry" className="font-medium underline underline-offset-4">
                    Publishing / Rights
                  </a>.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent dark:from-neutral-950" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-neutral-950" />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "FMG Universe",
            url: "https://your-domain",
            contactPoint: [
              { "@type": "ContactPoint", contactType: "customer support", email: "hello@your-domain", availableLanguage: ["en"] },
            ],
          }),
        }}
      />
    </main>
  );
}
