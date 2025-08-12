"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ensureFreshSession, withTimeout, withSignal, getSupabaseClient } from "@/lib/supabase/client";
import { Close } from "@/icons";

/** ---------- CONFIG: Genre ---------- */
const GENRES = [
  "Pop","R&B","Hip-Hop","Jazz","Rock","Indie","Electronic","EDM","House","Techno",
  "Folk","Country","Gospel","Classical","Lo-fi","Ambient","Reggae","Latin","K-Pop","J-Pop",
];

const SUBGENRES = [
  "Synth-pop","Bedroom Pop","Neo-Soul","Trap","Boom Bap","Bebop","Fusion","Alt-Rock","Shoegaze",
  "Indie Folk","Orchestral","Chillhop","Drum & Bass","Future Bass","Deep House","Afrobeats","City Pop","Bossa Nova",
];

/** ---------- CATALOG ---------- */
// Semua harga contoh (IDR). Silakan ganti sesuai rate kamu.
type ServiceKey =
  | "songwriting"
  | "composition"
  | "arrangement"
  | "digital_production"
  | "sound_design"
  | "editing"
  | "mixing"
  | "mastering"
  | "publishing_admin"
  | "recording_studio"
  | "vocal_directing"
  | "mv_directing"
  | "social_media_mgmt"
  | "artist_management"
  | "music_marketing";

type ServiceItem = {
  key: ServiceKey;
  label: string;
  price: number;          // IDR (flat)
  isSubscription?: boolean; // per month
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
  bundlePrice: number; // total khusus bundle (lebih murah dari sum harga)
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

/** ---------- UTILS ---------- */
const idr = (n: number) => `IDR ${n.toLocaleString("id-ID")}`;

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export default function CreateProjectPopover({ open, onClose, onSaved }: Props) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  // step
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form 1
  const [songTitle, setSongTitle] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState<string>("");
  const [subGenre, setSubGenre] = useState<string>("");
  const [description, setDescription] = useState("");

  // form 2: services
  const [selectedServices, setSelectedServices] = useState<Set<ServiceKey>>(new Set());
  const [selectedBundle, setSelectedBundle] = useState<BundleKey | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    // reset when open
    setStep(1); setSaving(false); setError(null);
    setSongTitle(""); setAlbumTitle(""); setArtistName(""); setGenre(""); setSubGenre(""); setDescription("");
    setSelectedServices(new Set()); setSelectedBundle(null);
  }, [open]);

  if (!open) return null;

  // calc total
  const bundle = selectedBundle ? BUNDLES.find(b => b.key === selectedBundle) : null;
  const sumSelected = Array.from(selectedServices).reduce((acc, key) => {
    const s = SERVICES.find(x => x.key === key);
    return acc + (s ? s.price : 0);
  }, 0);

  const bundleValue = bundle
    ? (() => {
        // pastikan semua layanan bundle masuk hitungan bundle price, dan layanan lain di luar bundle ditambah normal
        const bundleSet = new Set(bundle.includes);
        const outside = Array.from(selectedServices).filter(k => !bundleSet.has(k));
        const outsideSum = outside.reduce((acc, k) => acc + (SERVICES.find(s => s.key === k)?.price || 0), 0);
        return bundle.bundlePrice + outsideSum;
      })()
    : sumSelected;

  const total = bundleValue;

  const toggleService = (key: ServiceKey) => {
    setSelectedServices(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true); setError(null);
      // await ensureFreshSession();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not authenticated");

      // Ringkasan layanan (tanpa ubah SQL): simpan ke description + budget_amount
      const chosenServices = Array.from(selectedServices);
      const serviceLines = chosenServices.map(k => {
        const s = SERVICES.find(x => x.key === k)!;
        return `- ${s.label}${s.isSubscription ? " (subscription)" : ""} — ${idr(s.price)}`;
      });

      const bundleLine = bundle ? `Bundle: ${bundle.label} — ${idr(bundle.bundlePrice)}` : null;

      const fullDescription =
        [
          description?.trim(),
          "",
          "— Requested Services —",
          ...(bundleLine ? [bundleLine] : []),
          ...serviceLines,
          "",
          `Total Estimate: ${idr(total)}`,
          "",
          `Song Title: ${songTitle || "-"}`,
          `Album Title: ${albumTitle || "-"}`,
          `Genre: ${genre || "-"} / ${subGenre || "-"}`,
        ].filter(Boolean).join("\n");

      const { error: insertErr } = await supabase
        .from("projects")
        .insert({
          client_id: uid,
          title: songTitle || "(Untitled)",
          artist_name: artistName || null,
          genre: genre || null,
          stage: "drafting",     // enum project_stage
          status: "pending",     // enum project_status
          description: fullDescription,
          budget_amount: total || null,
          budget_currency: "IDR",
          // progress_percent biarkan default
        });

      if (insertErr) throw insertErr;

      onSaved?.();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save draft");
    } finally {
      setSaving(false);
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
          active
            ? "border-primary-60 bg-primary-50/10"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
        ].join(" ")}
      >
        <div className={[
          "mt-0.5 h-4 w-4 rounded border",
          active ? "bg-primary-60 border-primary-60" : "bg-white border-gray-300",
        ].join(" ")} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {s.label}{s.isSubscription ? " • /mo" : ""}
          </div>
          <div className="text-xs text-gray-500">{idr(s.price)}</div>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-start justify-center overflow-y-auto" onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      {/* margin biar background nampak di pinggir */}
      <div className="mx-4 my-6 w-full max-w-6xl">
        <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
          {/* header */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white/90 backdrop-blur px-5 py-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900">Create Project</h2>
              <div className="text-xs text-gray-500">Step {step} of 2</div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60"
              aria-label="Close"
            >
              <Close className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* content */}
          <div className="px-5 py-4">
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Song Title</label>
                  <input value={songTitle} onChange={(e)=>setSongTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-60 outline-none" placeholder="e.g., 'Aurora'"/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Album Title</label>
                  <input value={albumTitle} onChange={(e)=>setAlbumTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-60 outline-none" placeholder="Optional"/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Artist Name</label>
                  <input value={artistName} onChange={(e)=>setArtistName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-60 outline-none" placeholder="Artist"/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Genre</label>
                  <select value={genre} onChange={(e)=>setGenre(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-60 outline-none">
                    <option value="" disabled>Choose genre</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sub-genre</label>
                  <select value={subGenre} onChange={(e)=>setSubGenre(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-60 outline-none">
                    <option value="" disabled>Choose sub-genre</option>
                    {SUBGENRES.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-60 outline-none" placeholder="Short brief about the project..." />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Section title="Type of Service">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SERVICES.filter(s => s.group === "core").map(s => <ServiceCard key={s.key} s={s} />)}
                  </div>
                </Section>

                <Section title="Additional Service">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SERVICES.filter(s => s.group === "additional").map(s => <ServiceCard key={s.key} s={s} />)}
                  </div>
                </Section>

                <Section title="Business Management / Development / Others">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SERVICES.filter(s => s.group === "business").map(s => <ServiceCard key={s.key} s={s} />)}
                  </div>
                </Section>

                <Section title="Bundles (Hemat)">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {BUNDLES.map(b => {
                      const active = selectedBundle === b.key;
                      const sumNormal = b.includes.reduce((acc,k)=>acc+(SERVICES.find(s=>s.key===k)?.price||0),0);
                      const saved = sumNormal - b.bundlePrice;
                      return (
                        <button
                          type="button"
                          key={b.key}
                          onClick={()=> setSelectedBundle(active ? null : b.key)}
                          className={[
                            "text-left rounded-xl border px-4 py-3 transition",
                            active ? "border-primary-60 bg-primary-50/10" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{b.label}</div>
                              <div className="mt-0.5 text-xs text-gray-600">{b.note}</div>
                              <div className="mt-1 text-xs text-gray-500">Includes: {b.includes.map(k => SERVICES.find(s=>s.key===k)?.label).join(", ")}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{idr(b.bundlePrice)}</div>
                              <div className="text-xs text-green-600">Save {idr(Math.max(saved,0))}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Section>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="sticky bottom-0 z-10 border-t bg-white/90 backdrop-blur px-5 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Total Estimate:</span>{" "}
                <span className="font-semibold text-gray-900">{idr(total)}</span>
                {selectedBundle && <span className="ml-2 text-xs text-primary-60">(Bundle applied)</span>}
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
                    onClick={()=>setStep(1)}
                    className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Back
                  </button>
                )}

                {step < 2 ? (
                  <button
                    onClick={()=>setStep(2)}
                    disabled={!songTitle.trim()}
                    className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving || !songTitle.trim()}
                    className="inline-flex items-center rounded-lg bg-primary-60 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save as draft"}
                  </button>
                )}
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
