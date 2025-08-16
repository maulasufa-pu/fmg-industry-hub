// src/app/client/projects/CreateProjectPopover.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Close } from "@/icons";
import type {
  ServiceRow,
  BundleRow,
  BundleItemRow,
  BundleWithItems,
} from "@/components/catalog";

/** ---------- CONFIG ---------- */
const GENRES = [
  "Pop","R&B","Hip-Hop","Jazz","Rock","Indie","Electronic","EDM","House","Techno",
  "Folk","Country","Gospel","Classical","Lo-fi","Ambient","Reggae","Latin","K-Pop","J-Pop",
];
const SUBGENRES = [
  "Synth-pop","Bedroom Pop","Neo-Soul","Trap","Boom Bap","Bebop","Fusion","Alt-Rock","Shoegaze",
  "Indie Folk","Orchestral","Chillhop","Drum & Bass","Future Bass","Deep House","Afrobeats","City Pop","Bossa Nova",
];
const MIN_DESC = 150;

type ProjectStatus =
  | "requested" | "pending" | "in_progress" | "revision"
  | "approved" | "published" | "archived" | "cancelled";

const idr = (n: number) => `IDR ${Math.round(n).toLocaleString("id-ID")}`;

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onSubmitted?: (info: { projectId: string | null; paymentPlan: "upfront" | "half" | "milestone" }) => void;
};

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
  referenceLinks?: string;
  paymentPlan: "upfront" | "half" | "milestone";
  ndaRequired?: boolean;
  preferredEngineerId?: string | null;
  total: number;
  status?: ProjectStatus;
};

export default function CreateProjectPopover({ open, onClose, onSaved, onSubmitted }: Props): React.JSX.Element {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const router = useRouter();
  const mountedRef = useRef<boolean>(true);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [bundles, setBundles] = useState<BundleWithItems[]>([]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [songTitle, setSongTitle] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState<string>("");
  const [subGenre, setSubGenre] = useState<string>("");
  const [description, setDescription] = useState("");

  // Step 2
  // selectedServices berisi service_key
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [customPrices, setCustomPrices] = useState<Partial<Record<string, number>>>({});

  // Step 3
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliveryFormat, setDeliveryFormat] = useState<string[]>([]);
  const [referenceLinks, setReferenceLinks] = useState<string>("");
  const [refLinksDraft, setRefLinksDraft] = useState<string>("");
  const [paymentPlan, setPaymentPlan] = useState<"upfront" | "half" | "milestone">("half");
  const [agree, setAgree] = useState(false);
  const [ndaRequired, setNdaRequired] = useState(false);
  const [preferredEngineerId, setPreferredEngineerId] = useState<string>("");

  /** ---------- HELPERS ---------- */
  function withPreservedScroll<A extends unknown[]>(fn: (...args: A) => void) {
    return (...args: A) => {
      if (scrollRef.current) savedScrollTopRef.current = scrollRef.current.scrollTop;
      fn(...args);
    };
  }

  const setStartWithPreserve = withPreservedScroll((v: string) => setStartDate(v));
  const setDeadlineWithPreserve = withPreservedScroll((v: string) => setDeadline(v));
  const setEngineerWithPreserve = withPreservedScroll((v: string) => setPreferredEngineerId(v));
  const setAgreeWithPreserve = withPreservedScroll((v: boolean) => setAgree(v));

  const selectedBundle = useMemo(
    () => bundles.find(b => b.id === selectedBundleId) ?? null,
    [selectedBundleId, bundles]
  );

  const defaultPriceOf = (serviceKey: string): number => {
    const s = services.find(x => x.service_key === serviceKey);
    return s ? Number(s.price) : 0;
  };

  const resolvedPriceOf = (serviceKey: string): number => {
    const def = defaultPriceOf(serviceKey);
    const cus = customPrices[serviceKey];
    if (cus == null || Number.isNaN(cus)) return def;
    return Math.max(def, Math.round(cus));
  };

  const total = useMemo(() => {
    if (selectedBundle) {
      const bundleKeys = new Set(selectedBundle.items.map(it => it.service_key));
      const outside = Array.from(selectedServices).filter(k => !bundleKeys.has(k));
      const outsideSum = outside.reduce((acc, k) => acc + resolvedPriceOf(k), 0);
      return Number(selectedBundle.bundle_price) + outsideSum;
    }
    return Array.from(selectedServices).reduce((acc, k) => acc + resolvedPriceOf(k), 0);
  }, [selectedBundle, selectedServices, customPrices]);

  const buildPayload = (): SubmitPayload => {
    const chosenKeys = Array.from(selectedServices);
    const selectedBundleObj = selectedBundle
      ? {
          label: selectedBundle.label,
          bundlePrice: Number(selectedBundle.bundle_price),
          includes: selectedBundle.items.map(it => it.service_key),
        }
      : null;

    const inside = new Set<string>(selectedBundleObj?.includes ?? []);
    const selectedServicesForApi = chosenKeys.map((key) => {
      const s = services.find(x => x.service_key === key)!;
      const price = inside.has(key) ? 0 : resolvedPriceOf(key);
      return {
        key: s.service_key,
        price,
        label: s.label,
        isSubscription: s.is_subscription,
      };
    });

    return {
      songTitle,
      artistName,
      genre,
      subGenre,
      description,
      selectedServices: selectedServicesForApi,
      bundle: selectedBundleObj,
      startDate: startDate || null,
      deadline: deadline || null,
      deliveryFormat,
      referenceLinks,
      paymentPlan,
      ndaRequired,
      preferredEngineerId: preferredEngineerId || null,
      total,
    };
  };

  type EngineerRow = { id: string; name: string | null };
  const [engineers, setEngineers] = useState<Array<{ id: string; name: string }>>([]);

  /** ---------- LOAD CATALOG (services & bundles) ---------- */
  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();

    (async () => {
      // 1) Services aktif
      const { data: svc, error: svcErr } = await supabase
        .from("services")
        .select("id,service_key,label,group_name,price,is_subscription,is_active,sort_order")
        .eq("is_active", true)
        .order("group_name", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true })
        .returns<ServiceRow[]>();

      if (!svcErr && !ac.signal.aborted) setServices(svc ?? []);

      // 2) Bundles aktif
      const { data: bdl, error: bdlErr } = await supabase
        .from("bundles")
        .select("id,bundle_key,label,bundle_price,note,is_active,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true })
        .returns<BundleRow[]>();
      if (bdlErr || !bdl?.length || ac.signal.aborted) return;

      // 3) Bundle items
      const { data: items, error: itErr } = await supabase
        .from("bundle_items")
        .select("id,bundle_id,service_id")
        .in("bundle_id", bdl.map(b => b.id))
        .returns<BundleItemRow[]>();
      if (itErr || !items || ac.signal.aborted) return;

      // map service id -> minimal info
      const svcMap = new Map<string, { id: string; service_key: string; label: string }>(
        (svc ?? []).map(s => [s.id, { id: s.id, service_key: s.service_key, label: s.label }])
      );

      const grouped: BundleWithItems[] = bdl.map(b => ({
        ...b,
        items: items
          .filter(it => it.bundle_id === b.id)
          .map(it => svcMap.get(it.service_id))
          .filter((x): x is { id: string; service_key: string; label: string } => !!x),
      }));

      setBundles(grouped);
    })();

    return () => ac.abort();
  }, [open, supabase]);

  /** ---------- LOAD ENGINEERS ---------- */
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const firstOpenRef = useRef(false);
  useEffect(() => {
    if (open && !firstOpenRef.current) {
      firstOpenRef.current = true;
      setStep(1); setSaving(false); setError(null);
      setSongTitle(""); setAlbumTitle(""); setArtistName("");
      setGenre(""); setSubGenre(""); setDescription("");
      setSelectedServices(new Set()); setSelectedBundleId(null);
      setCustomPrices({});
      setStartDate(""); setDeadline(""); setDeliveryFormat([]);
      setReferenceLinks("");
      setPaymentPlan("half"); setAgree(false);
      setNdaRequired(false); setPreferredEngineerId("");
    }
    if (!open) {
      firstOpenRef.current = false;
    }
  }, [open]);

  /** ---------- SCROLL LOCK HELPERS ---------- */
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTopRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (savedScrollTopRef.current != null && scrollRef.current) {
      scrollRef.current.scrollTop = savedScrollTopRef.current;
      savedScrollTopRef.current = null;
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.setProperty("overflow-anchor", "none");
    }
  }, []);

  useEffect(() => {
    if (step === 3) setRefLinksDraft(referenceLinks ?? "");
  }, [step, referenceLinks]);

  /** ---------- HANDLERS ---------- */
  const toggleService = withPreservedScroll((serviceKey: string) => {
    setSelectedServices(prev => {
      const n = new Set(prev);
      if (n.has(serviceKey)) {
        n.delete(serviceKey);
        setCustomPrices(p => {
          const { [serviceKey]: _omit, ...rest } = p;
          return rest;
        });
      } else {
        n.add(serviceKey);
      }
      return n;
    });
  });

  const setBundleWithPreserve = withPreservedScroll((b: string | null) => {
    setSelectedBundleId(b);
  });

  const toggleFormat = withPreservedScroll((fmt: string) => {
    setDeliveryFormat(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]);
  });

  const setPlanWithPreserve = withPreservedScroll((val: "upfront" | "half" | "milestone") => {
    setPaymentPlan(val);
  });

  const goStep = withPreservedScroll((next: 1 | 2 | 3) => setStep(next));

  // draft untuk harga custom (Step 2)
  const [priceDraft, setPriceDraft] = useState<Partial<Record<string, string>>>({});

  const commitCustomPrice = (serviceKey: string, raw: string) => {
    const def = defaultPriceOf(serviceKey);
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setCustomPrices(p => {
        const { [serviceKey]: _omit, ...rest } = p;
        return rest;
      });
    } else {
      const clamped = Math.max(def, Math.round(n));
      setCustomPrices(p => ({ ...p, [serviceKey]: clamped }));
    }
    setPriceDraft(p => {
      const { [serviceKey]: _omit, ...rest } = p;
      return rest;
    });
  };

  const setRefsWithPreserve = withPreservedScroll((v: string) => setReferenceLinks(v));

  /** ---------- SUBMIT ---------- */
  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!songTitle.trim()) throw new Error("Song title is required");
      if (description.trim().length < MIN_DESC) {
        throw new Error(`Description must be at least ${MIN_DESC} characters`);
      }
      if (selectedServices.size === 0 && !selectedBundleId) {
        throw new Error("Pick at least one service or a bundle");
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload: SubmitPayload = { ...buildPayload(), status: "requested" };

      const res = await fetch("/api/projects/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const json = text ? (JSON.parse(text) as { project_id?: string; error?: string }) : {};

      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);

      const newProjectId = json.project_id ?? null;

      if (json.project_id) {
        await supabase.from("projects").update({ status: "requested" }).eq("project_id", json.project_id);
      }
      onSaved?.();
      onSubmitted?.({ projectId: newProjectId, paymentPlan });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit project");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  /** ---------- UI ---------- */
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </section>
  );

  function FancyCheckbox({
    id,
    checked,
    onChange,
  }: {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <button
        type="button"
        id={id}
        onClick={() => onChange(!checked)}
        className="w-5 h-5 flex items-center justify-center border border-coolgray-40 rounded-sm bg-white"
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
      </button>
    );
  }

  function ServiceCardFromDb({ s }: { s: ServiceRow }) {
    const active = selectedServices.has(s.service_key);
    return (
      <button
        type="button"
        onClick={() => toggleService(s.service_key)}
        className={[
          "group relative flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
          active ? "border-primary-60 bg-primary-50/10" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
        ].join(" ")}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className={["mt-0.5 h-4 w-4 rounded border", active ? "bg-primary-60 border-primary-60" : "bg-white border-gray-300"].join(" ")} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {s.label}{s.is_subscription ? " • /mo" : ""}
          </div>
          <div className="text-xs text-gray-500">{idr(Number(s.price))}</div>
        </div>
      </button>
    );
  }

  // NOTE: komponen selalu mounted; visibilitas pakai class
  return (
    <div
      className={[
        "fixed inset-0 z-40 flex items-start justify-center bg-black/40 backdrop-blur-sm transition",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-hidden={!open}
      // tahan Enter agar tidak submit form induk jika ada
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const target = e.target as HTMLElement;
          if (target && target.tagName.toLowerCase() !== "textarea") {
            e.preventDefault();
          }
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-4 my-6 w-full max-w-6xl">
        <div
          className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white/90 px-5 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900">Order Form</h2>
              <div className="text-xs text-gray-500">Step {step} of 3</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60"
              aria-label="Close"
            >
              <Close className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* content scrollable */}
          <div ref={scrollRef} className="px-5 py-4 overflow-y-auto max-h-[75vh] overscroll-contain">
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
                  <label className="block text-sm font-medium text-gray-700">Song Synopsis / Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                      description.trim().length < MIN_DESC ? "border-red-300 focus:ring-red-400" : "border-gray-300 focus:ring-primary-60"
                    }`}
                    placeholder={`Write a synopsis / description about the project (min ${MIN_DESC} characters)`}
                  />
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className={description.trim().length < MIN_DESC ? "text-red-600" : "text-gray-500"}>
                      {description.trim().length}/{MIN_DESC} characters
                    </span>
                    {description.trim().length < MIN_DESC && (
                      <span className="text-red-600">Please add more details to reach at least {MIN_DESC} characters.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {(["core","additional","business"] as const).map((grp) => (
                  <Section
                    key={grp}
                    title={grp === "core" ? "Music Services" : grp === "additional" ? "Add-on Services" : "Artist Support Services"}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {services.filter(s => s.group_name === grp).map(s => (
                        <ServiceCardFromDb key={s.id} s={s} />
                      ))}
                    </div>
                  </Section>
                ))}

                <Section title="Bundles (More Cheap)">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {bundles.map((b) => {
                      const active = selectedBundleId === b.id;
                      const sumNormal = b.items.reduce((acc, it) => acc + defaultPriceOf(it.service_key), 0);
                      const saved = Math.max(sumNormal - Number(b.bundle_price), 0);

                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => setBundleWithPreserve(active ? null : b.id)}
                          className={[
                            "rounded-xl border px-4 py-3 text-left transition",
                            active ? "border-primary-60 bg-primary-50/10" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                          ].join(" ")}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{b.label}</div>
                              {b.note && <div className="mt-0.5 text-xs text-gray-600">{b.note}</div>}
                              <div className="mt-1 text-xs text-gray-500">
                                Includes: {b.items.map(it => it.label).join(", ")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{idr(Number(b.bundle_price))}</div>
                              <div className="text-xs text-green-600">Save {idr(saved)}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                {/* Custom Price Editor */}
                <Section title="Service Details">
                  <div className="rounded-xl border border-gray-200">
                    <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                      <div className="col-span-6">Service</div>
                      <div className="col-span-2 text-right">Default Price</div>
                      <div className="col-span-2 text-right">Premium Price</div>
                      <div className="col-span-2 text-right">Amount</div>
                    </div>
                    <div>
                      {Array.from(selectedServices).length === 0 ? (
                        <div className="px-3 py-3 text-sm text-gray-500">Pilih service terlebih dahulu.</div>
                      ) : (
                        Array.from(selectedServices)
                          .map(k => services.find(s => s.service_key === k))
                          .filter((s): s is ServiceRow => !!s)
                          .sort((a, b) => a.label.localeCompare(b.label))
                          .map((s) => {
                            const key = s.service_key;
                            const def = Number(s.price);
                            const inBundle = !!selectedBundle && selectedBundle.items.some(it => it.service_key === key);
                            const custom = customPrices[key];
                            const resolved = inBundle ? 0 : resolvedPriceOf(key);
                            const isCustom = !inBundle && custom != null;

                            return (
                              <div key={key} className="grid grid-cols-12 items-center border-t px-3 py-2 text-sm">
                                <div className="col-span-6">
                                  <div className="font-medium text-gray-800">
                                    {s.label}{s.is_subscription ? " • /mo" : ""}
                                  </div>
                                  {inBundle && (
                                    <div className="text-[11px] text-primary-60">
                                      Bundled — harga sudah termasuk di bundle
                                    </div>
                                  )}
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
                                      value={priceDraft[key] ?? (custom != null ? String(custom) : String(def))}
                                      onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        setPriceDraft(p => ({ ...p, [key]: v }));
                                      }}
                                      onBlur={(e) => commitCustomPrice(key, e.currentTarget.value)}
                                      className="w-32 rounded-md border border-gray-300 px-2 py-1 text-right text-sm outline-none focus:ring-2 focus:ring-primary-60"
                                    />
                                  )}
                                </div>
                                <div className="col-span-2 text-right">
                                  {inBundle ? (
                                    <span className="font-medium text-gray-900">{idr(resolved)}</span>
                                  ) : isCustom ? (
                                    <span className="font-semibold text-gray-900"><span aria-hidden>★ </span>{idr(resolved)}</span>
                                  ) : (
                                    <span className="font-medium text-gray-900">{idr(resolved)}</span>
                                  )}
                                </div>
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
                          const s = services.find((x) => x.service_key === k);
                          if (!s) return null;
                          const inBundle = !!selectedBundle && selectedBundle.items.some(it => it.service_key === k);
                          const cus = customPrices[k];
                          const resolved = inBundle ? 0 : resolvedPriceOf(k);
                          const isCustom = !inBundle && cus != null;
                          return (
                            <li key={k}>
                              {s.label}{s.is_subscription ? " (subscription)" : ""} —{" "}
                              {inBundle ? (
                                <span className="text-primary-60">Bundled</span>
                              ) : isCustom ? (
                                <strong><span aria-hidden>★ </span>{idr(resolved)}</strong>
                              ) : (
                                idr(resolved)
                              )}
                            </li>
                          );
                        })}
                        {selectedBundle && (
                          <li><strong>Bundle:</strong> {selectedBundle.label} — {idr(Number(selectedBundle.bundle_price))}</li>
                        )}
                      </ul>
                    </div>
                    {description?.trim() && (
                      <div className="mt-3">
                        <div className="text-gray-500">Description</div>
                        <div className="whitespace-pre-wrap">{description}</div>
                      </div>
                    )}
                  </div>
                </Section>

                {/* Preferences */}
                <Section title="Preferences">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm text-gray-700">Project Start</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartWithPreserve(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">Project End</label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadlineWithPreserve(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm text-gray-700">Preferred Engineer</label>
                      <select
                        value={preferredEngineerId}
                        onChange={(e) => setEngineerWithPreserve(e.target.value)}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-60"
                      >
                        <option value="">Alfath Flemmo</option>
                        {engineers.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Section>

                {/* Payment */}
                <Section title="Payment Plan">
                  <div className="flex gap-3">
                    {[
                      { value: "upfront" as const, label: "100% Up-front" },
                      { value: "half" as const, label: "50% DP / 50% Delivery" },
                      { value: "milestone" as const, label: "Milestone (25/50/25)" },
                    ].map((opt) => {
                      const active = paymentPlan === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPlanWithPreserve(opt.value)}
                          className={`rounded-lg border px-3 py-2 text-sm transition-colors
                            ${active
                              ? "border-primary-60 bg-primary-50 text-white"
                              : "border-gray-300 hover:border-primary-60 hover:bg-primary-50/10"}`}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </Section>

                {/* Agreement */}
                <div className="flex items-start gap-2">
                  <FancyCheckbox id="agree" checked={agree} onChange={setAgreeWithPreserve} />
                  <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                    I agree with the deliverables & payment plan above.
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="border-t bg-white/90 px-5 py-3 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Total:</span>{" "}
                <span className="font-semibold text-gray-900">{idr(total)}</span>
                {selectedBundle && <span className="ml-2 text-xs text-primary-60">(Bundle Applied)</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>

                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => goStep(step === 3 ? 2 : 1)}
                    className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => goStep(step === 1 ? 2 : 3)}
                    disabled={
                      step === 1
                        ? !(songTitle.trim() && description.trim().length >= MIN_DESC)
                        : (selectedServices.size === 0 && !selectedBundleId)
                    }
                    className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving || !agree || !songTitle.trim()}
                    className="inline-flex items-center rounded-lg bg-primary-60 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95 disabled:opacity-60"
                  >
                    {saving ? "Sending Request..." : "Send Request"}
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
