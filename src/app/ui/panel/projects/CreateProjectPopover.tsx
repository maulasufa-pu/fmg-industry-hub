// src/app/client/projects/CreateProjectPopover.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Close, Check } from "@/icons";
import BrandMark from "@/app/ui/BrandMark"; 
import { motion, AnimatePresence } from "framer-motion";
import type {
  ServiceRow,
  BundleRow,
  BundleItemRow,
  BundleWithItems,
} from "@/components/catalog";

const GENRES = [
  "Pop","R&B","Hip-Hop","Jazz","Rock","Indie","Electronic","EDM","House","Techno",
  "Folk","Country","Gospel","Classical","Lo-fi","Ambient","Reggae","Latin","K-Pop","J-Pop",
];
const SUBGENRES = [
  "Synth-pop","Bedroom Pop","Neo-Soul","Trap","Boom Bap","Bebop","Fusion","Alt-Rock","Shoegaze",
  "Indie Folk","Orchestral","Chillhop","Drum & Bass","Future Bass","Deep House","Afrobeats","City Pop","Bossa Nova",
];
const MIN_DESC = 150;

// Bundles will use bundles from database

type ProjectStatus =
  | "requested" | "pending" | "in_progress" | "revision"
  | "approved" | "published" | "archived" | "cancelled" | "draft";

import { formatPrice, CURRENCY_OPTIONS } from '@/lib/currency';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencyDropdownAdvanced, type Currency } from '@/components/CurrencyDropdownAdvanced';

const idr = (n: number) => `IDR ${Math.round(n).toLocaleString("id-ID")}`;

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onSubmitted?: (info: { projectId: string | null; paymentPlan: "upfront" | "half" | "milestone" }) => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  width?: number;
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

const DRAFT_COOKIE_KEY = 'fmg_project_draft';

interface ProjectDraftData {
  songTitle: string;
  artistName: string;
  albumTitle: string;
  genre: string;
  subGenre: string;
  description: string;
  startDate: string;
  deadline: string;
  deliveryFormat: string[];
  referenceLinks: string;
  selectedServices: string[];
  selectedBundle: string | null;
  customPrices: Partial<Record<string, number>>;
  paymentPlan: "upfront" | "half" | "milestone";
  ndaRequired: boolean;
  preferredEngineerId: string | null;
  currentStep: number;
  currency: string;
}

function saveToCookie(data: Partial<ProjectDraftData>) {
  try {
    const existing = loadFromCookie();
    const updated = { ...existing, ...data };
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); 
    document.cookie = `${DRAFT_COOKIE_KEY}=${encodeURIComponent(JSON.stringify(updated))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (err) {
    //console.warn('Failed to save draft to cookie:', err);
  }
}

function loadFromCookie(): Partial<ProjectDraftData> {
  try {
    const cookies = document.cookie.split(';');
    const draftCookie = cookies.find(c => c.trim().startsWith(`${DRAFT_COOKIE_KEY}=`));
    if (!draftCookie) return {};
    const value = draftCookie.split('=')[1];
    return JSON.parse(decodeURIComponent(value));
  } catch (err) {
    //console.warn('Failed to load draft from cookie:', err);
    return {};
  }
}

function clearCookie() {
  document.cookie = `${DRAFT_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/** Package Card Component - Dynamic from Database */
function PackageCard({
  bundle,
  allServices,
  currency,
  rates,
  selected,
  onSelect,
  showAll,
}: {
  bundle: BundleWithItems;
  allServices: ServiceRow[];
  currency: Currency;
  rates: Record<string, number>;
  selected: boolean;
  onSelect: () => void;
  showAll: boolean;
}) {
  const bundleServiceKeys = new Set(bundle.items.map(it => it.service_key));
  
  // Get accent color based on bundle position (rotating colors)
  const accents = ['violet', 'blue', 'amber'] as const;
  const accentIdx = Math.abs(bundle.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % accents.length;
  const accent = accents[accentIdx];
  
  const accentColors = {
    blue: {
      border: "border-blue-400 dark:border-blue-500",
      bg: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/30",
      check: "border-blue-500 bg-blue-500",
      hover: "hover:border-blue-300 dark:hover:border-blue-500",
    },
    violet: {
      border: "border-violet-400 dark:border-violet-500",
      bg: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/40 dark:to-purple-900/30",
      check: "border-violet-500 bg-violet-500",
      hover: "hover:border-violet-300 dark:hover:border-violet-500",
    },
    amber: {
      border: "border-amber-400 dark:border-amber-500",
      bg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/30",
      check: "border-amber-500 bg-amber-500",
      hover: "hover:border-amber-300 dark:hover:border-amber-500",
    },
  };

  const colors = accentColors[accent];
  
  // Display services: show first 10 or all
  const displayedServices = showAll ? allServices : allServices.slice(0, 10);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onSelect}
        className={[
          "group relative flex flex-col gap-4 p-6 rounded-2xl border-2 text-left",
          "transition-all duration-300 ease-out hover:scale-[1.02]",
          selected
            ? `${colors.border} ${colors.bg} shadow-xl`
            : `border-slate-300 dark:border-slate-600 bg-white/95 dark:bg-slate-900/95 ${colors.hover}`,
        ].join(" ")}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              {bundle.label}
            </h4>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatPrice(Number(bundle.bundle_price), currency, rates)}
            </p>
            {currency !== 'USD' && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                ${Number(bundle.bundle_price)}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <div className={[
              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
              selected
                ? colors.check
                : "border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-900"
            ].join(" ")}>
              {selected && <Check className="text-white" style={{ fontSize: 16 }} />}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {displayedServices.map((service) => {
            const isIncluded = bundleServiceKeys.has(service.service_key);
            return (
              <div key={service.id} className="flex items-center gap-2 text-sm">
                {isIncluded ? (
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={isIncluded ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}>
                  {service.label}
                </span>
              </div>
            );
          })}
        </div>
      </button>
    </div>
  );
}

/** Auto-resize Textarea Component */
function AutoResizeTextarea({
  value,
  onChange,
  minRows = 3,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate the new height
    const lineHeight = 24; // approximate line height in pixels
    const minHeight = lineHeight * minRows;
    const newHeight = Math.max(minHeight, textarea.scrollHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, [value, minRows]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
}

export default function CreateProjectPopover({ open, onClose, onSaved, onSubmitted }: Props): React.JSX.Element {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const router = useRouter();
  const mountedRef = useRef<boolean>(true);
  const { currency, setCurrency, rates, loading: ratesLoading } = useCurrency();

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [bundles, setBundles] = useState<BundleWithItems[]>([]);
  const [individualServicesExpanded, setIndividualServicesExpanded] = useState(false);
  const [showAllBundles, setShowAllBundles] = useState(false);

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

  // Draft management
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [agree, setAgree] = useState(false);
  const [ndaRequired, setNdaRequired] = useState(false);
  const [preferredEngineerId, setPreferredEngineerId] = useState<string>("");

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

  // Debounced auto-save (cookie - fast)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const draftData: ProjectDraftData = {
        songTitle,
        artistName,
        albumTitle,
        genre,
        subGenre,
        description,
        startDate,
        deadline,
        deliveryFormat,
        referenceLinks,
        selectedServices: Array.from(selectedServices),
        selectedBundle: selectedBundleId,
        customPrices,
        paymentPlan,
        ndaRequired,
        preferredEngineerId,
        currentStep: step,
        currency
      };
      saveToCookie(draftData);
    }, 1000); 
  }, [songTitle, artistName, albumTitle, genre, subGenre, description, startDate, deadline, deliveryFormat, referenceLinks, selectedServices, selectedBundleId, customPrices, paymentPlan, ndaRequired, preferredEngineerId, step, currency]);

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
  }, [selectedBundle, selectedServices, customPrices, resolvedPriceOf]);

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

  // Debounced auto-save to database (slower, more persistent)
  const dbSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedDbSave = useCallback(() => {
    if (dbSaveTimeoutRef.current) clearTimeout(dbSaveTimeoutRef.current);
    dbSaveTimeoutRef.current = setTimeout(async () => {
      // Only save to database if we have minimum required data
      if (!songTitle.trim() || selectedServices.size === 0) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const payload: SubmitPayload = { ...buildPayload(), status: "draft" };
        
        if (draftId) {
          // Update existing draft
          const response = await fetch("/api/projects/submit", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, project_id: draftId }),
          });
          
          if (response.ok) {
            setLastSaved(new Date());
          }
        } else {
          // Create new draft
          const response = await fetch("/api/projects/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          
          if (response.ok) {
            const json = await response.json();
            setDraftId(json.project_id);
            setLastSaved(new Date());
          }
        }
      } catch (err) {
        // Silent fail for auto-save
      }
    }, 5000); // 5 seconds - less aggressive than cookie save
  }, [songTitle, selectedServices, supabase, buildPayload, draftId]);

  type EngineerRow = { id: string; name: string | null };
  const [engineers, setEngineers] = useState<Array<{ id: string; name: string }>>([]);

  /** ---------- LOAD CATALOG (services & bundles) ---------- */
  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();

    (async () => {
      const { data: svc } = await supabase
        .from("services")
        .select("id,service_key,label,group_name,price,is_subscription,is_active,sort_order")
        .eq("is_active", true)
        .order("group_name", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true })
        .returns<ServiceRow[]>();

      if (!ac.signal.aborted) setServices(svc ?? []);

      const { data: bdl } = await supabase
        .from("bundles")
        .select("id,bundle_key,label,bundle_price,note,is_active,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true })
        .returns<BundleRow[]>();
      if (!bdl?.length || ac.signal.aborted) return;

      const { data: items } = await supabase
        .from("bundle_items")
        .select("id,bundle_id,service_id")
        .in("bundle_id", bdl.map(b => b.id))
        .returns<BundleItemRow[]>();
      if (!items || ac.signal.aborted) return;

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
        .select("id, first_name, last_name, main_role, staff_role")
        .or("main_role.eq.admin,staff_role.cs.{engineer}")
        .order("first_name", { ascending: true });

    if (ac.signal.aborted || error) return;

      if (mountedRef.current) {
        setEngineers(
          (data ?? []).map((r) => ({
            id: r.id,
            name: [r.first_name, r.last_name].filter(Boolean).join(" ") || "Unnamed",
          }))
        );
      }
    })();

    return () => ac.abort();
  }, [open, supabase]);

  /** ---------- DRAFT MANAGEMENT ---------- */
  // Load draft when popover opens
  useEffect(() => {
    if (!open) return;
    setIsLoadingDraft(true);
    
    try {
      const draft = loadFromCookie();
      if (Object.keys(draft).length > 0) {
        // Load form data from cookie
        if (draft.songTitle) setSongTitle(draft.songTitle);
        if (draft.artistName) setArtistName(draft.artistName);
        if (draft.albumTitle) setAlbumTitle(draft.albumTitle);
        if (draft.genre) setGenre(draft.genre);
        if (draft.subGenre) setSubGenre(draft.subGenre);
        if (draft.description) setDescription(draft.description);
        if (draft.startDate) setStartDate(draft.startDate);
        if (draft.deadline) setDeadline(draft.deadline);
        if (draft.deliveryFormat) setDeliveryFormat(draft.deliveryFormat);
        if (draft.referenceLinks) setReferenceLinks(draft.referenceLinks);
        if (draft.selectedServices) setSelectedServices(new Set(draft.selectedServices));
        if (draft.selectedBundle) setSelectedBundleId(draft.selectedBundle);
        if (draft.customPrices) setCustomPrices(draft.customPrices);
        if (draft.paymentPlan) setPaymentPlan(draft.paymentPlan);
        if (draft.ndaRequired !== undefined) setNdaRequired(draft.ndaRequired);
        if (draft.preferredEngineerId) setPreferredEngineerId(draft.preferredEngineerId);
        if (draft.currentStep) setStep(draft.currentStep as 1 | 2 | 3);
        
        // Set lastSaved to indicate draft was restored
        setLastSaved(new Date());
      }
    } catch (err) {
      //console.warn('Failed to load draft:', err);
    } finally {
      setIsLoadingDraft(false);
    }
  }, [open]);

  // Auto-save to cookie when data changes (fast, local)
  useEffect(() => {
    if (!open || isLoadingDraft) return;
    debouncedSave();
  }, [open, isLoadingDraft, debouncedSave]);

  // Auto-save to database when data changes (slower, persistent)
  useEffect(() => {
    if (!open || isLoadingDraft) return;
    debouncedDbSave();
  }, [open, isLoadingDraft, debouncedDbSave]);

  // Clear draft on successful submit
  const clearDraft = useCallback(() => {
    clearCookie();
    setDraftId(null);
    setLastSaved(null);
  }, []);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset on first open
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
    if (!open) firstOpenRef.current = false;
  }, [open]);

  /** ---------- SCROLL LOCK & RESTORE ---------- */
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTopRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (savedScrollTopRef.current != null && scrollRef.current) {
      scrollRef.current.scrollTop = savedScrollTopRef.current;
      savedScrollTopRef.current = null;
    }
  });

  // prevent body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.setProperty("overflow-anchor", "none");
    }
  }, []);

  const [priceDraft, setPriceDraft] = useState<Partial<Record<string, string>>>({});

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

  /** ---------- DRAFT SAVE ---------- */
  const saveDraftToDatabase = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const payload: SubmitPayload = { ...buildPayload(), status: "draft" };
      
      if (draftId) {
        // Update existing draft
        const response = await fetch("/api/projects/submit", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, project_id: draftId }),
        });
        
        if (response.ok) {
          const json = await response.json();
          return json.project_id;
        }
      } else {
        // Create new draft
        const response = await fetch("/api/projects/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        if (response.ok) {
          const json = await response.json();
          setDraftId(json.project_id);
          return json.project_id;
        }
      }
    } catch (err) {
      //console.warn('Failed to save draft to database:', err);
    }
    return null;
  };

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
      
      // Clear draft on successful submission
      clearDraft();
      
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit project");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  /** ---------- UI SMALL PARTS ---------- */
  const Section = ({ title, children }: { title: string | React.ReactNode; children: React.ReactNode }) => (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
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
        className="w-5 h-5 flex items-center justify-center border border-slate-400 dark:border-slate-500 rounded-md bg-white/95 dark:bg-slate-900/95"
      >
        {checked && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-violet-500">
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
          "group relative flex items-center gap-5 p-6 rounded-2xl border-2 text-left",
          "transition-all duration-300 ease-out hover:scale-[1.02]",
          active
            ? "border-violet-400 dark:border-violet-500 bg-gradient-to-br from-violet-50/90 to-indigo-50/70 dark:from-violet-900/40 dark:to-indigo-900/30 shadow-lg shadow-violet-500/25"
            : "border-slate-300 dark:border-slate-600 bg-white/95 dark:bg-slate-900/95 hover:border-violet-300 dark:hover:border-violet-500 hover:bg-violet-50/60 dark:hover:bg-violet-900/20",
        ].join(" ")}
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Enhanced Checkbox */}
        <div className="relative shrink-0">
          <div className={[
            "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
            active 
              ? "border-violet-500 bg-violet-500 shadow-lg shadow-violet-500/30" 
              : "border-slate-400 dark:border-slate-500 bg-white/95 dark:bg-slate-900/95 group-hover:border-violet-400 dark:group-hover:border-violet-500"
          ].join(" ")}>
            {active && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8.25 8.25a1 1 0 01-1.414 0l-4.25-4.25a1 1 0 111.414-1.414L8 12.586l7.543-7.543a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          {active && (
            <div className="absolute inset-0 bg-violet-500 rounded-lg opacity-20 animate-ping"></div>
          )}
        </div>
        
        {/* Service Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-slate-900 dark:text-white text-base">
              {s.label}
            </h4>
            {s.is_subscription && (
              <span className="px-3 py-1 text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                Monthly
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 dark:text-white text-lg">
              {formatPrice(Number(s.price), currency, rates)}
            </span>
            {currency !== 'USD' && (
              <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                ${Number(s.price)}
              </span>
            )}
          </div>
        </div>
        
        {/* Selection Indicator */}
        {active && (
          <div className="shrink-0">
            <div className="w-2 h-8 bg-gradient-to-b from-violet-400 to-indigo-500 rounded-full"></div>
          </div>
        )}
      </button>
    );
  }

  const progress = (step / 3) * 100;

  // Enhanced modal with improved responsiveness and animations
  return (
    <div
      className={[
        "fixed inset-0 z-[80] flex transition-all duration-300",
        "bg-gradient-to-br from-black/70 via-slate-900/60 to-black/50 backdrop-blur-xl",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        // Responsive positioning: mobile bottom sheet, desktop centered
        "items-end sm:items-center justify-center p-2 sm:p-6 md:p-8",
      ].join(" ")}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-hidden={!open}
      onKeyDown={(e) => {
        // Prevent Enter key from submitting parent forms
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
      <div className="w-full max-w-none sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-2 sm:mx-0">
        <div
          className={[
            "transform transition-opacity transition-transform duration-500 ease-out",
            open 
              ? "translate-y-0 scale-100 opacity-100" 
              : "translate-y-8 sm:translate-y-0 scale-95 sm:scale-95 opacity-0",
            // Enhanced container styling with flex layout
            "flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl",
            "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
            "shadow-2xl shadow-black/30 dark:shadow-black/50",
            "ring-1 ring-slate-200/50 dark:ring-slate-700/50",
            // Better height management
            "h-[95vh] sm:h-auto sm:max-h-[88vh] sm:my-4",
          ].join(" ")}
          style={{
            // Ensure minimum viable height
            minHeight: "60vh",
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced Mobile Drag Handle */}
          <div className="sm:hidden pt-[max(env(safe-area-inset-top),8px)]">
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-16 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-400 dark:from-slate-500 dark:via-slate-400 dark:to-slate-500 rounded-full opacity-70" />
            </div>
          </div>

          {/* Enhanced Header */}
          <div
            className="
              sticky top-0 z-10
              bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600
              text-white px-6 sm:px-8 py-6
              shadow-lg backdrop-blur-md
              border-b border-white/10
            "
            style={{ paddingTop: "max(env(safe-area-inset-top),20px)" }}
          >
            <div className="flex items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                {/* Enhanced BRAND Section */}
                <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                  <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm">
                    <BrandMark
                      href="/"
                      logoSize={32}
                      gapClassName="gap-2"
                      className="select-none [&_*]:!text-white hover:scale-105 transition-transform"
                      subtitle="Client Portal"
                      subtitleBasePx={11}
                      subtitleMinPx={10}
                      subtitleMaxPx={13}
                      priority
                    />
                  </div>
                  <div className="hidden sm:block h-10 w-px bg-white/25" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight">
                    Request New Project
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-white/15 rounded-full text-sm font-medium backdrop-blur-sm">
                      Step {step} of 3
                    </div>
                    <div className="text-sm text-white/70 hidden md:block">
                      {step === 1 ? "Services & Pricing" : step === 2 ? "Project Details" : "Review & Submit"}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="
                  shrink-0 inline-flex h-10 w-10 items-center justify-center 
                  rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30
                  transition-all duration-200 ease-out
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
                  hover:scale-105 active:scale-95
                "
                aria-label="Close"
              >
                <Close className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm text-white/80">
                <div className="flex items-center gap-3">
                  <span>Progress</span>
                  {lastSaved && (
                    <span className="flex items-center gap-1.5 text-xs text-white/60">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Draft saved {new Date().getTime() - lastSaved.getTime() < 5000 ? 'just now' : 'automatically'}
                    </span>
                  )}
                </div>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white via-white/90 to-white shadow-sm transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Content Scrollable Area */}
          <div
            ref={scrollRef}
            className="
              px-6 sm:px-8 md:px-10 py-8
              overflow-y-auto overscroll-contain
              scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600
              scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500
              flex-1 min-h-0
            "
          >
            {/* Content Container with Better Spacing */}
            <div className="max-w-none space-y-8 pb-8">
              {step === 1 && (
                <div className="space-y-6">
                  {/* Mobile Currency Dropdown */}
                  <div className="flex justify-end sm:hidden">
                    <CurrencyDropdownAdvanced
                      value={currency as Currency}
                      onChange={(c) => {
                        setCurrency(c);
                      }}
                      loading={ratesLoading}
                      variant="compact"
                    />
                  </div>

                  {/* Bundles - Dynamic from Database */}
                  {bundles.length > 0 && (() => {
                    // Define service order according to user specification
                    const serviceOrder = [
                      'songwriting',
                      'composition',
                      'arrangement',
                      'editing',
                      'digital_production',
                      'mixing',
                      'mastering',
                      'vocal_directing',
                      'recording_studio',
                      'music_video_directing',
                      'distribution_administration',
                      'artist_management',
                      'social_media_management',
                      'music_marketing'
                    ];
                    // Sort services according to custom order
                    const sortedServices = [...services].sort((a, b) => {
                      const indexA = serviceOrder.indexOf(a.service_key);
                      const indexB = serviceOrder.indexOf(b.service_key);
                      // If not in order list, push to end
                      if (indexA === -1 && indexB === -1) return 0;
                      if (indexA === -1) return 1;
                      if (indexB === -1) return -1;
                      return indexA - indexB;
                    });
                    const hasMoreServices = services.length > 10;
                    
                    return (
                      <Section title={
                        <div className="flex items-center justify-between">
                          <span>Bundles</span>
                          <CurrencyDropdownAdvanced
                            value={currency as Currency}
                            onChange={(c) => {
                              setCurrency(c);
                            }}
                            loading={ratesLoading}
                            variant="compact"
                            size="sm"
                          />
                        </div>
                      }>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {bundles.map((bundle) => (
                            <PackageCard
                              key={bundle.id}
                              bundle={bundle}
                              allServices={sortedServices}
                              currency={currency}
                              rates={rates}
                              selected={selectedBundleId === bundle.id}
                              showAll={showAllBundles}
                              onSelect={() => {
                                if (scrollRef.current) savedScrollTopRef.current = scrollRef.current.scrollTop;
                                if (selectedBundleId === bundle.id) {
                                  setSelectedBundleId(null);
                                  setSelectedServices(new Set());
                                } else {
                                  setSelectedBundleId(bundle.id);
                                  // Auto-select included services
                                  const serviceKeys = bundle.items.map(it => it.service_key);
                                  setSelectedServices(new Set(serviceKeys));
                                }
                              }}
                            />
                          ))}
                        </div>
                        {hasMoreServices && (
                          <div className="flex justify-center mt-4">
                            <button
                              type="button"
                              onClick={() => setShowAllBundles(!showAllBundles)}
                              className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
                            >
                              {showAllBundles ? (
                                <>
                                  Show less
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  Show {services.length - 10} more
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </Section>
                    );
                  })()}

                  {/* Individual Services - Collapsible */}
                  <Section 
                    title={
                      <button
                        type="button"
                        onClick={() => setIndividualServicesExpanded(!individualServicesExpanded)}
                        className="flex items-center justify-between w-full group"
                      >
                        <span>Individual Services</span>
                        <motion.svg
                          className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                          animate={{ rotate: individualServicesExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </button>
                    }
                  >
                    <AnimatePresence>
                      {individualServicesExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                            {services.filter((s) => {
                              // Filter out services that are included in the selected bundle
                              if (!selectedBundle) return true;
                              const bundleServiceKeys = selectedBundle.items.map(it => it.service_key);
                              return !bundleServiceKeys.includes(s.service_key);
                            }).map((s) => (
                              <ServiceCardFromDb key={s.id} s={s} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Section>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <Section title="Song Information">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="songTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Song Title *
                        </label>
                        <input
                          id="songTitle"
                          type="text"
                          value={songTitle}
                          onChange={(e) => setSongTitle(e.target.value)}
                          placeholder="Enter song title"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                      </div>
                      <div>
                        <label htmlFor="artistName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Artist Name *
                        </label>
                        <input
                          id="artistName"
                          type="text"
                          value={artistName}
                          onChange={(e) => setArtistName(e.target.value)}
                          placeholder="Enter artist name"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                      </div>
                    </div>
                  </Section>

                  <Section title="Album & Genre">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="albumTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Album Title
                        </label>
                        <input
                          id="albumTitle"
                          type="text"
                          value={albumTitle}
                          onChange={(e) => setAlbumTitle(e.target.value)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                      </div>
                      <div>
                        <label htmlFor="genre" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Genre
                        </label>
                        <select
                          id="genre"
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        >
                          <option value="">Select...</option>
                          {GENRES.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="subGenre" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Sub-genre
                        </label>
                        <select
                          id="subGenre"
                          value={subGenre}
                          onChange={(e) => setSubGenre(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        >
                          <option value="">Select...</option>
                          {SUBGENRES.map((sg) => (
                            <option key={sg} value={sg}>{sg}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Section>

                  <Section title="Project Description">
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Description * (min {MIN_DESC} characters)
                      </label>
                      <AutoResizeTextarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your project vision, references, style, mood, etc."
                        minRows={4}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {description.length} / {MIN_DESC} characters
                      </p>
                    </div>
                  </Section>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  {/* Simplified Review Section */}
                  <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/60 dark:from-emerald-900/30 dark:to-teal-900/20 rounded-2xl p-8 border border-emerald-200/60 dark:border-emerald-700/50">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                      Project Review
                    </h3>
                    
                    {/* Clean Project Summary */}
                    <div className="space-y-6">
                      {/* Basic Info in Simple Grid with Soft Backgrounds */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="p-4 bg-white/60 dark:bg-slate-800/40 rounded-xl">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Song Title</span>
                          <div className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{songTitle || "-"}</div>
                        </div>
                        <div className="p-4 bg-white/60 dark:bg-slate-800/40 rounded-xl">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Artist</span>
                          <div className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{artistName || "-"}</div>
                        </div>
                        <div className="p-4 bg-white/60 dark:bg-slate-800/40 rounded-xl">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Album</span>
                          <div className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{albumTitle || "-"}</div>
                        </div>
                        <div className="p-4 bg-white/60 dark:bg-slate-800/40 rounded-xl">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Genre</span>
                          <div className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{genre || "-"}{subGenre ? ` / ${subGenre}` : ""}</div>
                        </div>
                      </div>

                      {/* Streamlined Services Display */}
                      <div>
                        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full"></div>
                          Selected Services
                        </h4>
                        {/* Bundle Display - Priority Position */}
                        {selectedBundle && (
                          <div className="mb-4 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-violet-900 dark:text-violet-100 flex items-center gap-2">
                                🎵 Bundle: {selectedBundle.label}
                              </span>
                              <span className="font-bold text-violet-900 dark:text-violet-100">
                                {formatPrice(Number(selectedBundle.bundle_price), currency, rates)}
                              </span>
                            </div>
                          </div>
                        )}
                        {/* Individual Services - Clean List */}
                        <div className="space-y-2">
                          {Array.from(selectedServices).map((k) => {
                            const s = services.find((x) => x.service_key === k);
                            if (!s) return null;
                            const inBundle = !!selectedBundle && selectedBundle.items.some(it => it.service_key === k);
                            const cus = customPrices[k];
                            const resolved = inBundle ? 0 : resolvedPriceOf(k);
                            const isCustom = !inBundle && cus != null;
                            return (
                              <div key={k} className="flex items-center justify-between py-2 px-3 bg-white/40 dark:bg-slate-800/30 rounded">
                                <span className="text-slate-900 dark:text-white">
                                  • {s.label}{s.is_subscription ? " (Monthly)" : ""}
                                </span>
                                <span className={`font-medium text-sm ${inBundle ? 'text-violet-600 dark:text-violet-400' : isCustom ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {inBundle ? "Included" : (
                                    <>
                                      {isCustom && "★ "}
                                      {formatPrice(resolved, currency, rates)}
                                    </>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Description - Simple Display */}
                      {description?.trim() && (
                        <div>
                          <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full"></div>
                            Project Description
                          </h4>
                          <div className="p-4 bg-white/60 dark:bg-slate-800/40 rounded-lg">
                            <div className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{description}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Preferences Section */}
                  <div className="bg-gradient-to-br from-cyan-50/90 to-blue-50/60 dark:from-cyan-900/30 dark:to-blue-900/20 rounded-2xl p-8 border border-cyan-200/60 dark:border-cyan-700/50">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                      Project Preferences
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Timeline Section */}
                      <div className="bg-white/90 dark:bg-slate-800/70 rounded-xl p-6 border border-cyan-100/80 dark:border-cyan-800/50">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          Project Timeline
                        </h4>
                        <div className="grid gap-6 lg:grid-cols-2">
                          <div>
                            <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
                              Proposed Start Date
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartWithPreserve(e.target.value)}
                              className="
                                w-full px-5 py-4 rounded-xl text-base
                                border-2 border-slate-300 dark:border-slate-600
                                bg-white/95 dark:bg-slate-900/95
                                text-slate-900 dark:text-slate-100
                                focus:border-cyan-500 dark:focus:border-cyan-400
                                focus:ring-4 focus:ring-cyan-500/20
                                transition-all duration-200
                              "
                            />
                          </div>
                          <div>
                            <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
                              Proposed Finish Date
                            </label>
                            <input
                              type="date"
                              value={deadline}
                              onChange={(e) => setDeadlineWithPreserve(e.target.value)}
                              className="
                                w-full px-5 py-4 rounded-xl text-base
                                border-2 border-slate-300 dark:border-slate-600
                                bg-white/95 dark:bg-slate-900/95
                                text-slate-900 dark:text-slate-100
                                focus:border-cyan-500 dark:focus:border-cyan-400
                                focus:ring-4 focus:ring-cyan-500/20
                                transition-all duration-200
                              "
                            />
                          </div>
                        </div>
                      </div>

                      {/* Team Selection */}
                      <div className="bg-white/90 dark:bg-slate-800/70 rounded-xl p-6 border border-cyan-100/80 dark:border-cyan-800/50">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                          </svg>
                          Team Preference
                        </h4>
                        <div className="max-w-md">
                          <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
                            Preferred Engineer
                          </label>
                          <select
                            value={preferredEngineerId}
                            onChange={(e) => setEngineerWithPreserve(e.target.value)}
                            className="
                              w-full px-5 py-4 rounded-xl text-base
                              border-2 border-slate-300 dark:border-slate-600
                              bg-white/95 dark:bg-slate-900/95
                              text-slate-900 dark:text-slate-100
                              focus:border-cyan-500 dark:focus:border-cyan-400
                              focus:ring-4 focus:ring-cyan-500/20
                              transition-all duration-200
                            "
                          >
                            <option value="">Alfath Flemmo (Default)</option>
                            {engineers.map((e) => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </select>
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Select your preferred engineer or leave default for automatic assignment
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Payment Plan Section */}
                  <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/60 dark:from-amber-900/30 dark:to-orange-900/20 rounded-2xl p-8 border border-amber-200/60 dark:border-amber-700/50">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                      Payment Plan
                    </h3>
                    
                    <div className="bg-white/90 dark:bg-slate-800/70 rounded-xl p-6 border border-amber-100/80 dark:border-amber-800/50">
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                        </svg>
                        Choose Payment Structure
                      </h4>
                      
                      <div className="grid gap-4 lg:grid-cols-3">
                        {[
                          { 
                            value: "upfront" as const, 
                            label: "100% Up-front", 
                            description: "Pay full amount before project starts",
                            icon: "💰",
                            benefit: "Best rate available"
                          },
                          { 
                            value: "half" as const, 
                            label: "50% DP / 50% Delivery", 
                            description: "Split payment in two installments",
                            icon: "⚖️",
                            benefit: "Balanced approach"
                          },
                          { 
                            value: "milestone" as const, 
                            label: "Milestone (25/50/25)", 
                            description: "Three-stage payment structure",
                            icon: "📊",
                            benefit: "Progress-based payments"
                          },
                        ].map((opt) => {
                          const active = paymentPlan === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setPlanWithPreserve(opt.value)}
                              className={[
                                "group relative p-6 rounded-2xl border-2 text-left transition-all duration-300",
                                "hover:scale-[1.02] focus:outline-none focus:ring-4",
                                active
                                  ? "border-amber-400 dark:border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 shadow-lg shadow-amber-500/20 focus:ring-amber-500/30"
                                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 focus:ring-amber-500/20",
                              ].join(" ")}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {/* Selection Indicator */}
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-2xl">{opt.icon}</span>
                                <div className={[
                                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                                  active 
                                    ? "border-amber-500 bg-amber-500" 
                                    : "border-slate-300 dark:border-slate-600 group-hover:border-amber-400"
                                ].join(" ")}>
                                  {active && (
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8.25 8.25a1 1 0 01-1.414 0l-4.25-4.25a1 1 0 111.414-1.414L8 12.586l7.543-7.543a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              
                              {/* Content */}
                              <div className="space-y-2">
                                <h5 className="font-bold text-slate-900 dark:text-white text-lg">
                                  {opt.label}
                                </h5>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {opt.description}
                                </p>
                                <div className={[
                                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                                  active 
                                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" 
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                ].join(" ")}>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                  </svg>
                                  {opt.benefit}
                                </div>
                              </div>
                              
                              {/* Active Indicator */}
                              {active && (
                                <div className="absolute top-4 right-4">
                                  <div className="w-3 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Agreement Section */}
                  <div className="bg-gradient-to-br from-rose-50/90 to-pink-50/60 dark:from-rose-900/30 dark:to-pink-900/20 rounded-2xl p-8 border border-rose-200/60 dark:border-rose-700/50">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"></div>
                      Final Agreement
                    </h3>
                    
                    <div className="bg-white/90 dark:bg-slate-800/70 rounded-xl p-6 border border-rose-100/80 dark:border-rose-800/50">
                      <div className="flex items-start gap-4">
                        {/* Enhanced Checkbox */}
                        <div className="relative shrink-0 mt-1">
                          <button
                            type="button"
                            onClick={() => setAgreeWithPreserve(!agree)}
                            className={[
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                              "focus:outline-none focus:ring-4 focus:ring-rose-500/30",
                              agree 
                                ? "border-rose-500 bg-rose-500 shadow-lg shadow-rose-500/30" 
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-rose-400"
                            ].join(" ")}
                          >
                            {agree && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8.25 8.25a1 1 0 01-1.414 0l-4.25-4.25a1 1 0 111.414-1.414L8 12.586l7.543-7.543a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          {agree && (
                            <div className="absolute inset-0 bg-rose-500 rounded-lg opacity-20 animate-ping"></div>
                          )}
                        </div>
                        
                        {/* Agreement Content */}
                        <div className="flex-1">
                          <label 
                            htmlFor="agree" 
                            className="block text-base font-medium text-slate-700 dark:text-slate-200 cursor-pointer leading-relaxed"
                          >
                            I have reviewed and agree with the project details, selected services, timeline, and payment plan outlined above.
                          </label>
                          <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            <p className="flex items-start gap-2">
                              <svg className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                              </svg>
                              By checking this box, you confirm that all information is accurate and authorize us to begin work on your project according to the specifications above.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Footer */}
          <div
            className="
              sticky bottom-0 z-10
              border-t border-slate-300/60 dark:border-slate-600/60
              bg-white/95 dark:bg-slate-900/95
              backdrop-blur-xl
              px-6 sm:px-8 md:px-10 py-6
              shadow-lg shadow-black/5 dark:shadow-black/20
            "
            style={{ paddingBottom: "max(env(safe-area-inset-bottom),24px)" }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Price Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-medium">Project Total:</span>{" "}
                  <span className="text-xl font-bold text-slate-900 dark:text-white bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                    {formatPrice(total, currency, rates)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {currency !== 'USD' && (
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                      ${total.toFixed(total < 100 ? 2 : 0)} USD
                    </span>
                  )}
                  {selectedBundle && (
                    <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full font-medium">
                      Bundle Discount Applied
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    inline-flex items-center gap-2 px-4 py-2.5 
                    text-sm font-medium text-slate-700 dark:text-slate-200
                    border-2 border-slate-300 dark:border-slate-600
                    rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800
                    hover:border-slate-400 dark:hover:border-slate-500
                    transition-all duration-200
                    focus:outline-none focus:ring-4 focus:ring-slate-500/20
                  "
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>

                {/* Save Draft Button */}
                <button
                  type="button"
                  onClick={saveDraftToDatabase}
                  disabled={saving || !songTitle.trim()}
                  className="
                    inline-flex items-center gap-2 px-4 py-2.5
                    text-sm font-medium text-emerald-700 dark:text-emerald-300
                    bg-emerald-50/90 dark:bg-emerald-900/30 border-2 border-emerald-300 dark:border-emerald-600
                    rounded-xl hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40
                    hover:border-emerald-400 dark:hover:border-emerald-500
                    transition-all duration-200
                    focus:outline-none focus:ring-4 focus:ring-emerald-500/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {draftId ? "Update Draft" : "Save Draft"}
                </button>

                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => goStep(step === 3 ? 2 : 1)}
                    className="
                      inline-flex items-center gap-2 px-4 py-2.5
                      text-sm font-medium text-slate-700 dark:text-slate-200
                      border-2 border-slate-300 dark:border-slate-600
                      rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800
                      hover:border-slate-400 dark:hover:border-slate-500
                      transition-all duration-200
                      focus:outline-none focus:ring-4 focus:ring-slate-500/20
                    "
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => goStep(step === 1 ? 2 : 3)}
                    disabled={
                      step === 1
                        ? (selectedServices.size === 0 && !selectedBundleId)
                        : !(songTitle.trim() && description.trim().length >= MIN_DESC)
                    }
                    className="
                      inline-flex items-center gap-2 px-6 py-2.5
                      text-sm font-semibold text-white
                      bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600
                      rounded-xl shadow-lg hover:shadow-xl
                      hover:scale-105 active:scale-95
                      transition-all duration-200
                      focus:outline-none focus:ring-4 focus:ring-violet-500/30
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    "
                  >
                    <span>Continue</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving || !agree || !songTitle.trim()}
                    className="
                      inline-flex items-center gap-2 px-6 py-2.5
                      text-sm font-semibold text-white
                      bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600
                      rounded-xl shadow-lg hover:shadow-xl
                      hover:scale-105 active:scale-95
                      transition-all duration-200
                      focus:outline-none focus:ring-4 focus:ring-violet-500/30
                      disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                    "
                  >
                    {saving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Request</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {/* Enhanced Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-rose-50/90 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-700 rounded-xl">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-rose-500 dark:text-rose-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-rose-700 dark:text-rose-200 font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
