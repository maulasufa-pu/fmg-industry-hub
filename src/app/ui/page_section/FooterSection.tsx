"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Envelope,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  TikTok,
  Threads,
} from "@/icons";
import BrandMark from "../BrandMark";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedPathFor } from "@/i18n/language-routes";

type Column = {
  title: string;
  links: { label: string; href: string }[];
};

type SocialItem = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> & { name?: string };
  href: string;
};

export default function Footer(): React.JSX.Element {
  const [email, setEmail] = useState<string>("");
  const { language } = useLanguage();
  const localeHref = (href: string) => localizedPathFor(href, language) ?? href;

  const columns: Column[] = [
    {
      title: "Services",
      links: [
        { label: "Music Arrangement", href: "/arrangement" },
        { label: "Song Creation", href: "/song-creation-service" },
        { label: "Pricing", href: "/pricing" },
        { label: "Portfolio", href: "/portfolio" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "FMG Universe", href: "/company" },
        { label: "About", href: "/company#about" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
        { label: "Locations", href: "/locations" },
      ],
    },
    {
      title: "Platform",
      links: [
        { label: "Overview", href: "/company#about" },
        { label: "Products", href: "/company#features" },
        { label: "tuneXpert", href: "/tuneXpert" },
        { label: "Client Portal", href: "/login" },
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
    {
      title: "Divisions",
      links: [
        { label: "Creative", href: "/creative" },
        { label: "Talent", href: "/talent" },
        { label: "Labs (AI/tuneXpert)", href: "/labs" },
        { label: "Publishing", href: "/publishing" },
        { label: "Academy", href: "/academy" },
        { label: "Media", href: "/media" },
        { label: "Event & Festival", href: "/event" },
      ],
    },
  ];

  const socials: SocialItem[] = [
    { Icon: Youtube, href: "https://youtube.com/@FlemmoMusicGlobal" },
    { Icon: Facebook, href: "https://facebook.com/flemmomusicglobal" },
    { Icon: Twitter, href: "https://x.com/@flemmomusic" },
    { Icon: Instagram, href: "https://instagram.com/flemmomusicglobal" },
    { Icon: Linkedin, href: "https://linkedin.com/company/flemmomusicglobal" },
    { Icon: TikTok, href: "https://tiktok.com/@flemmomusicglobal" },
    { Icon: Threads, href: "https://threads.com/@flemmomusicglobal" },
  ];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    //console.log("Subscribe:", email);
  };

  return (
    <footer className="relative border-t border-neutral-900/10 bg-white/60 text-neutral-800 backdrop-blur-sm transition-colors dark:border-white/10 dark:bg-neutral-950/60 dark:text-neutral-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-neutral-900/10 to-transparent dark:via-white/10"
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark
            href={language === "id" ? "/id" : "/"}
            logoSrc="/logo/FMG-Universe-light.svg"
            logoDarkSrc="/logo/FMG-Universe-dark.svg"
            logoSize={60}
            logoClassName="h-10 w-[60px] rounded-md object-contain flex-shrink-0"
          />
          <form
            onSubmit={onSubmit}
            className="flex w-full max-w-md items-center gap-2 sm:w-auto"
          >
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <div className="flex h-10 flex-1 items-center rounded-md border border-neutral-900/10 bg-white/80 pl-3 pr-2 backdrop-blur-sm transition-colors dark:border-white/10 dark:bg-white/5">
              <Envelope className="shrink-0 text-neutral-600 dark:text-neutral-400" />
              <input
                id="footer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="Email for updates"
                aria-label="Email address"
                className="w-full bg-transparent pl-3 text-sm text-neutral-800 placeholder:text-neutral-500 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-400"
              />
            </div>
            <button
              type="submit"
              className="h-10 shrink-0 rounded-md 
                        bg-red-600 px-3 text-sm font-medium text-white
                        transition-opacity hover:opacity-90 
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"
            >
              Subscribe
            </button>

          </form>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 lg:grid-cols-5">
          {columns.map((col) => (
            <div key={col.title}>
              <div className="font-semibold text-neutral-900 dark:text-neutral-50">
                {col.title}
              </div>
              <ul className="mt-3 space-y-2 text-neutral-600 dark:text-neutral-300">
                {col.links.map((l) => {
                  const linkClass =
                    "hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded dark:hover:text-white dark:focus-visible:ring-white/30";
                  return (
                    <li key={l.label}>
                      {l.href.startsWith("http") ? (
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClass}
                        >
                          {l.label}
                        </a>
                      ) : (
                        <Link href={localeHref(l.href)} className={linkClass}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400 sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} PT. Flemmo Music Global (Powered by FMG Universe). All rights
            reserved.
          </div>
          <div className="flex items-center gap-2">
            {socials.map(({ Icon, href }, i) => {
              const label =
                Icon?.name ||
                href.replace(/^https?:\/\//, "").replace(/\/.*/, "").replace("www.", "");
              const isSpecial = Icon === TikTok || Icon === Threads;
              return (
                <a
                  key={i}
                  href={href}
                  aria-label={label}
                  className="rounded p-1 transition-colors 
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 
                            dark:focus-visible:ring-white/30
                            text-neutral-600 hover:text-neutral-900
                            dark:text-white dark:hover:text-neutral-200 text-black"
                >
                  {isSpecial ? (
                    <Icon className="h-5 w-5 !fill-current" />
                  ) : (
                    <Icon className="" />
                  )}
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-3 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          <div>Beyond Sound. Built-in Intelligence.</div>
        </div>
      </div>
    </footer>
  );
}
