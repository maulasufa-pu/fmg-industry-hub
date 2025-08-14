"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Close } from "@/icons";

/** ---------- CONFIG ---------- */
const GENRES = [
  "Pop","R&B","Hip-Hop","Jazz","Rock","Indie","Electronic","EDM","House","Techno",
  "Folk","Country","Gospel","Classical","Lo-fi","Ambient","Reggae","Latin","K-Pop","J-Pop",
];
const SUBGENRES = [
  "Synth-pop","Bedroom Pop","Neo-Soul","Trap","Boom Bap","Bebop","Fusion","Alt-Rock","Shoegaze",
  "Indie Folk","Orchestral","Chillhop","Drum & Bass","Future Bass","Deep House","Afrobeats","City Pop","Bossa Nova",
];

type ServiceKey =
  | "songwriting" | "composition" | "arrangement" | "digital_production" | "sound_design"
  | "editing" | "mixing" | "mastering" | "publishing_admin"
  | "recording_studio" | "vocal_directing"
  | "mv_directing" | "social_media_mgmt" | "artist_management" | "music_marketing";

type ProjectStatus =
  | "requested" | "pending" | "in_progress" | "revision"
  | "approved" | "published" | "archived" | "cancelled";

type ServiceItem = {
  key: ServiceKey;
  label: string;
  price: number; // default price
  isSubscription?: boolean;
  group: "core" | "additional" | "business";
};

const SERVICES: ServiceItem[] = [
  { key: "songwriting",        label: "Songwriting (Lyrics & Melody)", price: 5_000_000, group: "core" },
  { key: "composition",        label: "Composition",                    price: 4_000_000, group: "core" },
  { key: "arrangement",        label: "Arrangement",                    price: 6_000_000, group: "core" },
  { key: "digital_production", label: "Digital Audio Production",       price: 8_000_000, group: "core" },
  { key: "sound_design",       label: "Sound Design",                   price: 3_000_000, group: "core" },
  { key: "editing",            label: "Editing",                        price: 2_500_000, group: "core" },
  { key: "mixing",             label: "Mixing",                         price: 5_000_000, group: "core" },
  { key: "mastering",          label: "Mastering",                      price: 3_500_000, group: "core" },
  { key: "publishing_admin",   label: "Publishing Administration",      price: 2_500_000, group: "core" },

  { key: "recording_studio",   label: "Recording Studio",               price: 2_000_000, group: "additional" },
  { key: "vocal_directing",    label: "Vocal Directing",                price: 1_500_000, group: "additional" },

  { key: "mv_directing",       label: "Music Video Directing & Production",   price: 15_000_000, group: "business" },
  { key: "social_media_mgmt",  label: "Social Media Management (per month)",  price: 4_000_000, group: "business", isSubscription: true },
  { key: "artist_management",  label: "Artist Management (per month)",        price: 10_000_000, group: "business", isSubscription: true },
  { key: "music_marketing",    label: "Music Marketing (per month)",          price: 6_000_000, group: "business", isSubscription: true },
];

type BundleKey = "prod_bundle" | "full_audio_bundle";
type Bundle = {
  key: BundleKey;
  label: string;
  includes: ServiceKey[];
  bundlePrice: number;
  note?: string;
};
const BUNDLES: Bundle[] = [
  {
    key: "prod_bundle",
    label: "Production Bundle",
    includes: ["arrangement","digital_production","mixing","mastering"],
    bundlePrice: 19_000_000,
    note: "Hemat dibanding pilih satuan (A+DAP+Mix+Master).",
  },
  {
    key: "full_audio_bundle",
    label: "Full Audio Bundle",
    includes: ["songwriting","composition","arrangement","digital_production","editing","mixing","mastering"],
    bundlePrice: 27_000_000,
    note: "Paket lengkap dari penulisan hingga mastering.",
  },
];

const idr = (n: number) => `IDR ${Math.round(n).toLocaleString("id-ID")}`;

type Props = { open: boolean; onClose: () => void; onSaved?: () => void; };

type SubmitPayload = {
  songTitle: string;
  artistName: string;
  genre?: string;
  subGenre?: string;
  description?: string;
  selectedServices: { key: string; price: number; label: string; isSubscription?: boolean }[];
  bundle?: { label: string; bundlePrice: number; includes: string[] } | null;
  startDate?: string | null;
  deadline?: string | null;
  deliveryFormat?: string[];
  referenceLinks?: string; // newline separated
  paymentPlan: "upfront" | "half" | "milestone";
  ndaRequired?: boolean;
  preferredEngineerId?: string | null;
  total: number;
  status?: ProjectStatus;
};

export default function CreateProjectPopover({ open, onClose, onSaved }: Props): React.JSX.Element | null {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const router = useRouter();
  const mountedRef = useRef<boolean>(true);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After-submit dialog
  const [showSubmitted, setShowSubmitted] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  // Step 1
  const [songTitle, setSongTitle] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState<string>("");
  const [subGenre, setSubGenre] = useState<string>("");
  const [description, setDescription] = useState("");

  // Step 2
  const [selectedServices, setSelectedServices] = useState<Set<ServiceKey>>(new Set());
  const [selectedBundle, setSelectedBundle] = useState<BundleKey | null>(null);
  // custom price per service (optional)
  const [customPrices, setCustomPrices] = useState<Partial<Record<ServiceKey, number>>>({});

  // Step 3
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliveryFormat, setDeliveryFormat] = useState<string[]>([]);
  const referenceLinksRef = useRef<HTMLTextAreaElement>(null);
  const [paymentPlan, setPaymentPlan] = useState<"upfront" | "half" | "milestone">("half");
  const [agree, setAgree] = useState(false);
  const [ndaRequired, setNdaRequired] = useState(false);
  const [preferredEngineerId, setPreferredEngineerId] = useState<string>("");

  // derived
  const bundle = selectedBundle ? BUNDLES.find(b => b.key === selectedBundle) ?? null : null;

  // helpers
  const defaultPriceOf = (key: ServiceKey): number => SERVICES.find(s => s.key === key)?.price ?? 0;

  const resolvedPriceOf = (key: ServiceKey): number => {
    const def = defaultPriceOf(key);
    const cus = customPrices[key];
    if (cus == null || Number.isNaN(cus)) return def;
    return Math.max(def, Math.round(cus)); // clamp min default + bulatkan
  };

  const total = useMemo(() => {
    if (bundle) {
      const inside = new Set<ServiceKey>(bundle.includes);
      const outside = Array.from(selectedServices).filter(k => !inside.has(k));
      const outsideSum = outside.reduce((acc, k) => acc + resolvedPriceOf(k), 0);
      return bundle.bundlePrice + outsideSum;
    }
    return Array.from(selectedServices).reduce((acc, k) => acc + resolvedPriceOf(k), 0);
  }, [bundle, selectedServices, customPrices]);

  const buildPayload = (): SubmitPayload => {
    const chosen = Array.from(selectedServices);
    const inside = new Set<ServiceKey>(bundle?.includes ?? []);
    const selectedServicesForApi = chosen.map((k) => {
      const s = SERVICES.find((x) => x.key === k)!;
      const price = inside.has(k) ? 0 : resolvedPriceOf(k); // item dalam bundle dibayar via bundle
      return { key: s.key, price, label: s.label, isSubscription: s.isSubscription };
    });
    const bundleObj = bundle
      ? { label: bundle.label, bundlePrice: bundle.bundlePrice, includes: bundle.includes }
      : null;

    return {
      songTitle,
      artistName,
      genre,
      subGenre,
      description,
      selectedServices: selectedServicesForApi,
      bundle: bundleObj,
      startDate: startDate || null,
      deadline: deadline || null,
      deliveryFormat,
      referenceLinks: (referenceLinksRef.current?.value ?? ""),
      paymentPlan,
      ndaRequired,
      preferredEngineerId: preferredEngineerId || null,
      total,
    };
  };

  // engineers dropdown
  type EngineerRow = { id: string; name: string | null };
  const [engineers, setEngineers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,name")
        .eq("role", "engineer")
        .order("name", { ascending: true })
        .returns<EngineerRow[]>();

      if (ac.signal.aborted) return;
      if (error) {
        console.error(error);
        return;
      }

      if (mountedRef.current) {
        setEngineers(
          (data ?? []).map((r) => ({
            id: r.id,
            name: r.name ?? "Unnamed",
          }))
        );
      }
    })();

    return () => ac.abort();
  }, [open, supabase]);

  // lifecycle: esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // reset form setiap dibuka
  useEffect(() => {
    if (!open) return;
    setStep(1); setSaving(false); setError(null);
    setSongTitle(""); setAlbumTitle(""); setArtistName("");
    setGenre(""); setSubGenre(""); setDescription("");
    setSelectedServices(new Set()); setSelectedBundle(null);
    setCustomPrices({});
    setStartDate(""); setDeadline(""); setDeliveryFormat([]);
    // setReferenceLinks("");  // HAPUS
    setPaymentPlan("half"); setAgree(false);
    setNdaRequired(false); setPreferredEngineerId("");

    // kosongkan textarea via ref
    if (referenceLinksRef.current) referenceLinksRef.current.value = "";
  }, [open]);


  if (!open) return null;

  const toggleService = (key: ServiceKey) => {
    setSelectedServices(prev => {
      const n = new Set(prev);
      if (n.has(key)) {
        n.delete(key);
        // bersihkan custom price saat di-unselect
        setCustomPrices(p => {
          const { [key]: _omit, ...rest } = p;
          return rest;
        });
      } else {
        n.add(key);
      }
      return n;
    });
  };

  const toggleFormat = (fmt: string) => {
    setDeliveryFormat(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]);
  };

  const commitCustomPrice = (key: ServiceKey, raw: string) => {
    const def = defaultPriceOf(key);
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      // hapus custom, kembali ke default
      setCustomPrices(p => {
        const { [key]: _omit, ...rest } = p;
        return rest;
      });
      return;
    }
    const clamped = Math.max(def, Math.round(n));
    setCustomPrices(p => ({ ...p, [key]: clamped }));
  };

  const planPretty: Record<"upfront" | "half" | "milestone", string> = {
    upfront: "100% Up-front (dibayar penuh di awal)",
    half: "50% DP / 50% saat Delivery",
    milestone: "Milestone (25% – 50% – 25%)",
  };

  // SUBMIT
  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!songTitle.trim()) throw new Error("Song title is required");
      if (selectedServices.size === 0 && !selectedBundle) {
        throw new Error("Pick at least one service or a bundle");
      }

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) throw new Error("Not authenticated");

      const payload: SubmitPayload = { ...buildPayload(), status: "requested" };

      const res = await fetch("/api/projects/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      // SELALU coba baca sebagai text dulu → parse JSON kalau ada body
      const text = await res.text();
      const json = text ? JSON.parse(text) as { project_id?: string; error?: string } : {};

      if (!res.ok) {
        throw new Error(json?.error || `Request failed (${res.status})`);
      }

      // Berhasil
      setCreatedProjectId(json.project_id ?? null);
      setShowSubmitted(true); // tampilkan popover sukses (jangan langsung onClose)

      if (!res.ok) throw new Error(json?.error || "Failed to submit project");

      if (json.project_id) {
        await supabase
          .from("projects")
          .update({ status: "requested" })
          .eq("project_id", json.project_id);
      }
      onSaved?.();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit project");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </section>
  );

  const ServiceCard = ({ s }: { s: ServiceItem }) => {
    const active = selectedServices.has(s.key);
    return (
      <button
        type="button"
        onClick={() => toggleService(s.key)}
        className={[
          "group relative flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
          active ? "border-primary-60 bg-primary-50/10" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
        ].join(" ")}
      >
        <div className={["mt-0.5 h-4 w-4 rounded border", active ? "bg-primary-60 border-primary-60" : "bg-white border-gray-300"].join(" ")} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {s.label}{s.isSubscription ? " • /mo" : ""}
          </div>
          <div className="text-xs text-gray-500">{idr(s.price)}</div>
        </div>
      </button>
    );
  };

  // Komponen kecil untuk checkbox kustom
  function FancyCheckbox({
    id,
    checked,
    onChange,
  }: {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    const toggle = () => onChange(!checked);
    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggle();
      }
    };
    return (
      <>
        {/* input hidden agar tetap bisa di-submit di form kalau perlu */}
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div
          role="checkbox"
          aria-checked={checked}
          tabIndex={0}
          onClick={toggle}
          onKeyDown={onKeyDown}
          className="w-5 h-5 flex items-center justify-center border border-coolgray-40 rounded-sm bg-white cursor-pointer"
        >
          {checked && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary-60">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8.25 8.25a1 1 0 01-1.414 0l-4.25-4.25a1 1 0 111.414-1.414L8 12.586l7.543-7.543a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </>
    );
  }
  // END Komponen kecil untuk checkbox kustom
    
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mx-4 my-6 w-full max-w-6xl">
        <div
            className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
            onPointerDown={(e) => e.stopPropagation()} // cegah event awal (sebelum focus)
            onMouseDown={(e) => e.stopPropagation()}   // backup utk browser lama
            onClick={(e) => e.stopPropagation()}       // opsional: ekstra aman
          >
          {/* header */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white/90 px-5 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900">Create Project</h2>
              <div className="text-xs text-gray-500">Step {step} of 3</div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60"
              aria-label="Close"
            >
              <Close className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* content */}
          <div className="px-5 py-4">
            {step === 1 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Song Title</label>
                  <input
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                    placeholder="e.g., 'Aurora'"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Album Title</label>
                  <input
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Artist Name</label>
                  <input
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                    placeholder="Artist"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                  >
                    <option value="" disabled>Choose genre</option>
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sub-genre</label>
                  <select
                    value={subGenre}
                    onChange={(e) => setSubGenre(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                  >
                    <option value="" disabled>Choose sub-genre</option>
                    {SUBGENRES.map((sg) => <option key={sg} value={sg}>{sg}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                    placeholder="Short brief about the project..."
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Section title="Type of Service">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {SERVICES.filter((s) => s.group === "core").map((s) => <ServiceCard key={s.key} s={s} />)}
                  </div>
                </Section>

                <Section title="Additional Service">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {SERVICES.filter((s) => s.group === "additional").map((s) => <ServiceCard key={s.key} s={s} />)}
                  </div>
                </Section>

                <Section title="Business Management / Development / Others">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {SERVICES.filter((s) => s.group === "business").map((s) => <ServiceCard key={s.key} s={s} />)}
                  </div>
                </Section>

                <Section title="Bundles (Hemat)">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {BUNDLES.map((b) => {
                      const active = selectedBundle === b.key;
                      const sumNormal = b.includes.reduce((acc, k) => acc + (SERVICES.find((s) => s.key === k)?.price || 0), 0);
                      const saved = Math.max(sumNormal - b.bundlePrice, 0);
                      return (
                        <button
                          type="button"
                          key={b.key}
                          onClick={() => setSelectedBundle(active ? null : b.key)}
                          className={[
                            "rounded-xl border px-4 py-3 text-left transition",
                            active ? "border-primary-60 bg-primary-50/10" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{b.label}</div>
                              <div className="mt-0.5 text-xs text-gray-600">{b.note}</div>
                              <div className="mt-1 text-xs text-gray-500">
                                Includes: {b.includes.map((k) => SERVICES.find((s) => s.key === k)?.label).join(", ")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{idr(b.bundlePrice)}</div>
                              <div className="text-xs text-green-600">Save {idr(saved)}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                {/* Custom Price Editor */}
                <Section title="Custom Price (optional)">
                  <div className="rounded-xl border border-gray-200">
                    <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                      <div className="col-span-6">Service</div>
                      <div className="col-span-2 text-right">Default</div>
                      <div className="col-span-2 text-right">Custom (min default)</div>
                      <div className="col-span-2 text-right">Resolved</div>
                    </div>
                    <div>
                      {Array.from(selectedServices).length === 0 ? (
                        <div className="px-3 py-3 text-sm text-gray-500">Pilih service terlebih dahulu.</div>
                      ) : (
                        Array.from(selectedServices).map((key) => {
                          const s = SERVICES.find(x => x.key === key)!;
                          const def = s.price;
                          const inBundle = !!bundle && bundle.includes.includes(key);
                          const custom = customPrices[key];
                          const resolved = inBundle ? 0 : resolvedPriceOf(key);
                          return (
                            <div key={key} className="grid grid-cols-12 items-center border-t px-3 py-2 text-sm">
                              <div className="col-span-6">
                                <div className="font-medium text-gray-800">{s.label}{s.isSubscription ? " • /mo" : ""}</div>
                                {inBundle && <div className="text-[11px] text-primary-60">Bundled — dibayar via bundle</div>}
                              </div>
                              <div className="col-span-2 text-right text-gray-700">{idr(def)}</div>
                              <div className="col-span-2 text-right">
                                {inBundle ? (
                                  <span className="text-xs text-gray-400">—</span>
                                ) : (
                                  <input
                                    type="number"
                                    min={def}
                                    step={1000}
                                    inputMode="numeric"
                                    defaultValue={custom ?? def}
                                    onBlur={(e) => commitCustomPrice(key, e.currentTarget.value)}
                                    className="w-32 rounded-md border border-gray-300 px-2 py-1 text-right text-sm outline-none focus:ring-2 focus:ring-primary-60"
                                  />
                                )}
                              </div>
                              <div className="col-span-2 text-right font-medium text-gray-900">{idr(resolved)}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {/* Review */}
                <Section title="Review">
                  <div className="rounded-xl border p-3 text-sm">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div><span className="text-gray-500">Song</span><div className="font-medium">{songTitle || "-"}</div></div>
                      <div><span className="text-gray-500">Artist</span><div className="font-medium">{artistName || "-"}</div></div>
                      <div><span className="text-gray-500">Album</span><div className="font-medium">{albumTitle || "-"}</div></div>
                      <div><span className="text-gray-500">Genre</span><div className="font-medium">{genre || "-"}{subGenre ? ` / ${subGenre}` : ""}</div></div>
                    </div>
                    <div className="mt-3">
                      <div className="text-gray-500">Services</div>
                      <ul className="list-disc pl-5">
                        {Array.from(selectedServices).map((k) => {
                          const s = SERVICES.find((x) => x.key === k)!;
                          const inBundle = !!bundle && bundle.includes.includes(k);
                          const def = s.price;
                          const cus = customPrices[k];
                          const resolved = inBundle ? 0 : resolvedPriceOf(k);
                          return (
                            <li key={k}>
                              {s.label}{s.isSubscription ? " (subscription)" : ""} —{" "}
                              {inBundle ? (
                                <span className="text-primary-60">Bundled</span>
                              ) : (
                                <>
                                  {idr(resolved)}
                                  {cus && cus > def ? <span className="text-xs text-gray-500"> (custom ≥ default)</span> : null}
                                </>
                              )}
                            </li>
                          );
                        })}
                        {bundle && <li><strong>Bundle:</strong> {bundle.label} — {idr(bundle.bundlePrice)}</li>}
                      </ul>
                    </div>
                    {description?.trim() && (
                      <div className="mt-3">
                        <div className="text-gray-500">Brief</div>
                        <div className="whitespace-pre-wrap">{description}</div>
                      </div>
                    )}
                  </div>
                </Section>

                {/* Preferences */}
                <Section title="Preferences">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm text-gray-700">Target Start</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">Deadline</label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 text-sm text-gray-700">Delivery Format</div>
                    <div className="flex flex-wrap gap-2">
                      {["WAV 24-bit","MP3","STEMS","Project File"].map((fmt) => {
                        const active = deliveryFormat.includes(fmt);
                        return (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => toggleFormat(fmt)}
                            className={`rounded-full border px-3 py-1 text-xs ${active ? "border-primary-60 bg-primary-50/10" : "border-gray-300 hover:bg-gray-50"}`}
                          >
                            {fmt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm text-gray-700">
                      Reference links (YouTube/Spotify/Drive)
                    </label>
                    <textarea
                      ref={referenceLinksRef}
                      rows={2}
                      placeholder="Pisahkan dengan baris baru"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                    />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm text-gray-700">Preferred Engineer</label>
                      <select
                        value={preferredEngineerId}
                        onChange={(e) => setPreferredEngineerId(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                      >
                        <option value="">No preference</option>
                        {engineers.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* <div className="mt-6 flex items-center gap-2">
                      <input
                        id="nda"
                        type="checkbox"
                        checked={ndaRequired}
                        onChange={(e) => setNdaRequired(e.target.checked)}
                      />
                      <label htmlFor="nda" className="text-sm text-gray-700">NDA required</label>
                    </div> */}
                  </div>
                </Section>

                {/* Payment */}
                <Section title="Payment Plan">
                  <div className="flex gap-3">
                    {[
                      { value: "upfront", label: "100% Up-front" },
                      { value: "half", label: "50% DP / 50% Delivery" },
                      { value: "milestone", label: "Milestone (25/50/25)" },
                    ].map((opt) => {
                      const active = paymentPlan === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPaymentPlan(opt.value as typeof paymentPlan)}
                          className={`rounded-lg border px-3 py-2 text-sm transition-colors
                            ${active 
                              ? "border-primary-60 bg-primary-50 text-white" 
                              : "border-gray-300 hover:border-primary-60 hover:bg-primary-50/10"}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </Section>
                {/* Agreement */}
                <div className="flex items-start gap-2">
                  <FancyCheckbox id="agree" checked={agree} onChange={setAgree} />
                  <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                    I agree with the deliverables & payment plan above.
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="sticky bottom-0 z-10 border-t bg-white/90 px-5 py-3 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Total Estimate:</span>{" "}
                <span className="font-semibold text-gray-900">{idr(total)}</span>
                {bundle && <span className="ml-2 text-xs text-primary-60">(Bundle applied)</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>

                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                    className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
                    disabled={step === 1 ? !songTitle.trim() : (selectedServices.size === 0 && !selectedBundle)}
                    className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !agree || !songTitle.trim()}
                    className="inline-flex items-center rounded-lg bg-primary-60 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95 disabled:opacity-60"
                  >
                    {saving ? "Submitting…" : "Submit Request"}
                  </button>
                )}
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </div>
      {/* === AFTER-SUBMIT CONFIRMATION POPOVER === */}
      {showSubmitted && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-base font-semibold text-gray-900">Request Terkirim ✨</h3>
              <button
                onClick={() => { setShowSubmitted(false); onClose(); }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60"
                aria-label="Close confirmation"
              >
                <Close className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4 text-sm text-gray-700">
              <p>
                Terima kasih! Project kamu telah kami terima dan saat ini berstatus{" "}
                <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700 ring-1 ring-amber-200">Requested</span>.
              </p>
              <p>
                Tim Admin akan melakukan verifikasi & approval. Begitu project <span className="font-medium">di-ACC</span>,
                proses akan otomatis berlanjut ke tahap <span className="font-medium">pembayaran</span> sesuai plan yang kamu pilih:
              </p>
              <div className="rounded-lg border bg-gray-50 px-3 py-2 text-gray-800">
                <div className="text-sm">
                  <span className="mr-1 font-medium">Payment Plan:</span>
                  {planPretty[paymentPlan]}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Kamu akan menerima notifikasi/email ketika project sudah disetujui dan invoice siap dibayar.
                </div>
              </div>
              <p className="text-xs text-gray-500">
                *Jika ada penyesuaian brief atau harga, Admin akan menghubungi kamu sebelum approval.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
              <button
                onClick={() => { setShowSubmitted(false); onClose(); }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setShowSubmitted(false);
                  onClose();
                  router.push("/client/projects?tab=Requested");
                }}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Lihat di Requested
              </button>
              {createdProjectId && (
                <button
                  onClick={() => {
                    setShowSubmitted(false);
                    onClose();
                    router.push(`/client/projects/${createdProjectId}`);
                  }}
                  className="rounded-lg bg-primary-60 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                >
                  Buka Project
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* === /AFTER-SUBMIT CONFIRMATION POPOVER === */}
    </div>
  );
}
