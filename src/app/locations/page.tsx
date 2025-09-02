"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Clock, Phone, Mail, ExternalLink, Search } from "lucide-react";

/* **************************************
 * FMG Universe — /locations (EN)
 * - Elegant hero
 * - Search + region chips
 * - Interactive list with live local time
 * - Sticky map preview with Directions
 * - Light/Dark friendly, reduced-motion aware
 * - No any, mobile-first, accessible
 ************************************** */

type Region = "asia" | "americas" | "other";

type Location = {
  id: string;
  name: string;
  addressLines: string[]; // each line will wrap naturally
  city: string;
  country: string;
  region: Region;
  timezone: string; // IANA tz like "Asia/Jakarta"
  email?: string;
  phone?: string;
  mapsQuery: string; // used for Google Maps links and embed
};

const LOCATIONS: ReadonlyArray<Location> = [
  {
    id: "jakarta",
    name: "Jakarta",
    addressLines: ["Jl. Kebon Jeruk No. 8 Palmerah"],
    city: "Jakarta Barat",
    country: "Indonesia",
    region: "asia",
    timezone: "Asia/Jakarta",
    email: "admin@flemmomusic.com",
    phone: "+62 822 9828 8188",
    mapsQuery: encodeURIComponent("Jl. Kebon Jeruk No. 8 Palmerah, Jakarta Barat, Indonesia"),
  },
  {
    id: "kuala-lumpur",
    name: "Kuala Lumpur",
    addressLines: ["City Center"],
    city: "Kuala Lumpur",
    country: "Malaysia",
    region: "asia",
    timezone: "Asia/Kuala_Lumpur",
    email: "admin@flemmomusic.com",
    mapsQuery: encodeURIComponent("Kuala Lumpur, Malaysia"),
  },
  {
    id: "singapore",
    name: "Singapore",
    addressLines: ["Downtown Core"],
    city: "Singapore",
    country: "Singapore",
    region: "asia",
    timezone: "Asia/Singapore",
    email: "admin@flemmomusic.com",
    mapsQuery: encodeURIComponent("Singapore"),
  },
  {
    id: "new-york",
    name: "New York",
    addressLines: ["Manhattan"],
    city: "New York",
    country: "United States",
    region: "americas",
    timezone: "America/New_York",
    email: "admin@flemmomusic.com",
    mapsQuery: encodeURIComponent("New York, USA"),
  },
];

function formatTime(tz: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(now);
  } catch {
    return "--:--";
  }
}

function RegionChip({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: Region | "all";
  active: boolean;
  onClick: (v: Region | "all") => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={[
        "rounded-full border px-3 py-1 text-sm transition",
        active
          ? "border-neutral-900/30 bg-neutral-900/10 text-neutral-900 dark:border-white/30 dark:bg-white/10 dark:text-white"
          : "border-neutral-900/10 bg-white/40 text-neutral-700 hover:border-neutral-900/20 dark:border-white/10 dark:bg-white/5 dark:text-white/80",
      ].join(" ")}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function LocationCard({
  loc,
  selected,
  onSelect,
  now,
}: {
  loc: Location;
  selected: boolean;
  onSelect: (id: string) => void;
  now: Date;
}): React.JSX.Element {
  const reduce = useReducedMotion();
  const time = formatTime(loc.timezone, now);

  return (
    <motion.button
      layout
      type="button"
      onClick={() => onSelect(loc.id)}
      className={[
        "group w-full rounded-2xl border p-4 text-left shadow-sm transition",
        selected
          ? "border-neutral-900/30 bg-white/70 ring-1 ring-neutral-900/10 dark:border-white/20 dark:bg-white/10 dark:ring-white/20"
          : "border-neutral-900/10 bg-white/50 hover:border-neutral-900/20 dark:border-white/10 dark:bg-white/5",
      ].join(" ")}
      initial={reduce ? undefined : { opacity: 0, y: 10 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-neutral-900/5 p-2 text-neutral-900 dark:bg-white/10 dark:text-white">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              {loc.name}
            </h3>
            <span className="rounded-full bg-neutral-900/5 px-2 py-0.5 text-[11px] text-neutral-600 dark:bg-white/10 dark:text-white/70">
              {loc.country}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-700 dark:text-white/80 break-words">
            {[...loc.addressLines, loc.city].filter(Boolean).join(", ")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-600 dark:text-white/70">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Local time: {time}</span>
            {loc.phone && (
              <a href={`tel:${loc.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1 hover:underline">
                <Phone className="h-3.5 w-3.5" /> {loc.phone}
              </a>
            )}
            {loc.email && (
              <a href={`mailto:${loc.email}`} className="inline-flex items-center gap-1 hover:underline">
                <Mail className="h-3.5 w-3.5" /> {loc.email}
              </a>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${loc.mapsQuery}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-900/20 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-900/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              Directions <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={async () => {
                const text = `${[...loc.addressLines, loc.city, loc.country].filter(Boolean).join(", ")}`;
                try {
                  await navigator.clipboard.writeText(text);
                } catch {
                  // ignore clipboard errors (no permissions)
                }
              }}
              className="rounded-lg border border-neutral-900/10 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-900/5 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
            >
              Copy address
            </button>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function LocationsPage(): React.JSX.Element {
  const reduce = useReducedMotion();
  const [query, setQuery] = useState<string>("");
  const [region, setRegion] = useState<Region | "all">("all");
  const [selectedId, setSelectedId] = useState<string>(LOCATIONS[0]?.id ?? "");
  const [now, setNow] = useState<Date>(new Date());

  // tick every 15s to refresh local times
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LOCATIONS.filter((l) => {
      const regionOk = region === "all" || l.region === region;
      const hit =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q);
      return regionOk && hit;
    });
  }, [query, region]);

  // keep selection valid when filters change
  useEffect(() => {
    if (!filtered.some((l) => l.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? "");
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((l) => l.id === selectedId) ?? filtered[0] ?? LOCATIONS[0];

  return (
    <main className="relative min-h-[100dvh] bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-white">
      {/* Background accents */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={reduce ? undefined : { opacity: 0.35, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute -top-28 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/16 to-sky-500/12 blur-3xl"
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
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            FMG Universe Locations
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            Wherever creativity grows.
          </h1>
          <p className="mt-3 max-w-2xl text-neutral-700 dark:text-white/80">
            Jakarta, Kuala Lumpur, Singapore, and New York. Global by design. Local in execution.
          </p>

          {/* Controls */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city or country"
                className="w-64 rounded-full border border-neutral-900/10 bg-white/60 pl-9 pr-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-900/30 dark:border-white/10 dark:bg-white/5"
                aria-label="Search locations"
              />
            </div>

            <div className="flex items-center gap-2">
              <RegionChip label="All" value="all" active={region === "all"} onClick={setRegion} />
              <RegionChip label="Asia" value="asia" active={region === "asia"} onClick={setRegion} />
              <RegionChip label="Americas" value="americas" active={region === "americas"} onClick={setRegion} />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative px-4 pb-24 pt-8 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-5">
          {/* List */}
          <div className="md:col-span-2 space-y-4">
            {filtered.map((l) => (
              <LocationCard key={l.id} loc={l} selected={l.id === selected?.id} onSelect={setSelectedId} now={now} />
            ))}
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-neutral-900/10 bg-white/50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                No results. Try a different keyword or region.
              </div>
            )}
          </div>

          {/* Map preview */}
          <div className="md:col-span-3">
            <div className="sticky top-20">
              <div className="overflow-hidden rounded-2xl border border-neutral-900/10 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="aspect-[16/10] w-full">
                  {/* Google Maps embed using query. You can swap with Mapbox if preferred. */}
                  <iframe
                    key={selected?.id}
                    title={`Map of ${selected?.name}`}
                    src={`https://www.google.com/maps?q=${selected?.mapsQuery ?? ""}&output=embed`}
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-semibold">{selected?.name}</p>
                    <p className="text-neutral-600 dark:text-white/70 break-words">
                      {[...(selected?.addressLines ?? []), selected?.city, selected?.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selected?.mapsQuery ?? ""}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 rounded-lg border border-neutral-900/20 px-3 py-1.5 font-medium text-neutral-900 hover:bg-neutral-900/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                  >
                    Open in Maps <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Edge fades */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent dark:from-neutral-950" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-neutral-950" />

      {/* Minimal JSON-LD */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "FMG Universe",
            department: LOCATIONS.map((l) => ({
              "@type": "Organization",
              name: `FMG Universe — ${l.name}`,
              address: [...l.addressLines, l.city, l.country].filter(Boolean).join(", "),
            })),
          }),
        }}
      />
    </main>
  );
}
