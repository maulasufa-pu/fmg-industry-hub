"use client";

import { useState } from "react";
import Link from "next/link";
import { Envelope, Facebook, Instagram, Linkedin, Twitter, Youtube } from "@/icons";

export default function Footer() {
  const [email, setEmail] = useState("");

  const columns = [
    {
      title: "Flemmo",
      links: [
        { label: "About", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Services",
      links: [
        { label: "Creative", href: "/creative" },
        { label: "Academy", href: "/academy" },
        { label: "Publishing", href: "/publishing" },
      ],
    },
    {
      title: "FMG Universe",
      links: [
        { label: "Overview", href: "/about" },
        { label: "Products", href: "/#features" },
        { label: "Sign in", href: "/login" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms", href: "/legal/terms" },
        { label: "Privacy", href: "/legal/privacy" },
        { label: "Cookies", href: "/legal/cookies" },
        { label: "DMCA", href: "/legal/dmca" },
      ],
    },
  ];

  const socials = [
    { Icon: Youtube, href: "https://youtube.com/flemmo" },
    { Icon: Facebook, href: "https://facebook.com/flemmomusicglobal" },
    { Icon: Twitter, href: "https://x.com/flemmomusicglobal" },
    { Icon: Instagram, href: "https://instagram.com/flemmomusicglobal" },
    { Icon: Linkedin, href: "https://linkedin.com/company/flemmomusicglobal" },
  ];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire to your endpoint
    console.log("Subscribe:", email);
  };

  return (
    <footer className="border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Top row: logo + subscribe */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-fuchsia-500"
            />
            <div>
              <div className="font-semibold">Flemmo Music</div>
              <div className="text-xs text-black/60 dark:text-white/60">Global Universe</div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex w-full max-w-md items-center gap-2 sm:w-auto">
            <div className="flex h-10 flex-1 items-center rounded-md border border-black/10 bg-white/80 pl-3 pr-2 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <Envelope className="text-black/60 dark:text-white/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email for updates"
                aria-label="Email address"
                className="pl-3 w-full bg-transparent text-sm placeholder:text-black/50 focus:outline-none dark:placeholder:text-white/50"
              />
            </div>
            <button
              type="submit"
              className="h-10 shrink-0 rounded-md bg-black px-3 text-sm text-white hover:opacity-90 dark:bg-white dark:text-black"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Columns */}
        <div className="mt-10 grid grid-cols-2 gap-8 text-sm sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <div className="font-semibold">{col.title}</div>
              <ul className="mt-3 space-y-2 text-black/70 dark:text-white/70">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("http") ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-black dark:hover:text-white"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="hover:text-black dark:hover:text-white">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 text-xs text-black/60 dark:text-white/60 sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} Flemmo Music Global. All rights reserved.</div>

          <div className="flex items-center gap-4">
            {socials.map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                aria-label={Icon.name}
                className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 rounded"
              >
                <Icon className="" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-2 space-y-1 text-xs text-black/60 dark:text-white/60">
          <div>FMG Publishing is a division of Flemmo Music Global.</div>
        </div>
      </div>
    </footer>
  );
}
