// app/auth/callback/CallbackClient.tsx
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { safeInternalPath, withNext } from "@/lib/safe-next";
import { TERMS_CONSENT_STORAGE_KEY } from "@/lib/legal";

type HashTokens = {
  access_token: string | null;
  refresh_token: string | null;
  token_type?: string | null;
  expires_in?: string | null;
  type?: string | null; 
};

const DEBUG_PKCE = true;
const RECOVERY_DEST = "/reset-password";

function parseHash(): HashTokens {
  const raw = typeof window !== "undefined" ? window.location.hash : "";
  const qs = new URLSearchParams(raw.startsWith("#") ? raw.slice(1) : raw);
  const get = (k: string): string | null => qs.get(k);
  return {
    access_token: get("access_token"),
    refresh_token: get("refresh_token"),
    token_type: get("token_type"),
    expires_in: get("expires_in"),
    type: get("type"),
  };
}

function stripHash(keepQuery?: string) {
  if (typeof window === "undefined") return;
  const base = window.location.pathname + (keepQuery ? `?${keepQuery}` : "");
  window.history.replaceState({}, "", base); 
}

function dumpPkce(label: string) {
  if (!DEBUG_PKCE || typeof window === "undefined") return;
  try {
    const keys = Object.keys(localStorage).filter((k) => /pkce|flow|sb-/i.test(k));
    const values: Record<string, string | null> = {};
    keys.forEach((k) => (values[k] = localStorage.getItem(k)));
    // eslint-disable-next-line no-console
    //console.log("[callback]", label, {
    //   href: location.href,
    //   origin: location.origin,
    //   pkceKeys: keys,
    //   pkceValues: values,
    // });
  } catch (e) {
    // eslint-disable-next-line no-console
    //console.warn("[callback] dumpPkce error:", e);
  }
}

async function recordPendingTermsConsent(supabase: ReturnType<typeof getSupabaseClient>): Promise<void> {
  const raw = window.localStorage.getItem(TERMS_CONSENT_STORAGE_KEY);
  if (!raw) return;
  try {
    const pending = JSON.parse(raw) as { version?: string; acceptedAt?: string };
    if (!pending.version || !pending.acceptedAt) return;
    const { error } = await supabase.auth.updateUser({ data: { terms_version: pending.version, terms_accepted_at: pending.acceptedAt } });
    if (!error) window.localStorage.removeItem(TERMS_CONSENT_STORAGE_KEY);
  } catch {
    window.localStorage.removeItem(TERMS_CONSENT_STORAGE_KEY);
  }
}

export default function CallbackClient() {
  const searchParams = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    void (async () => {
      const supabase = getSupabaseClient();
      const url = new URL(window.location.href);
      const requestedNext = searchParams.get("next") || searchParams.get("redirectedFrom");
      const next = safeInternalPath(requestedNext);
      const code = url.searchParams.get("code");
      const hash = parseHash();
      const flowType = url.searchParams.get("type") || hash.type;

      const fail = (reason: string) => {
        stripHash();
        window.location.replace(withNext(`/login?err=${encodeURIComponent(reason)}`, next));
      };

      if (hash.access_token && hash.refresh_token) {
        dumpPkce(`hash-tokens-detected:${flowType || "unknown"}`);
        const { data, error } = await supabase.auth.setSession({
          access_token: hash.access_token,
          refresh_token: hash.refresh_token,
        });
        if (error || !data.session) {
          fail("hash-setsession");
          return;
        }
        await recordPendingTermsConsent(supabase);
        const response = await fetch("/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) {
          fail("hash-setcookie");
          return;
        }
        stripHash(flowType ? `type=${flowType}` : undefined);
        if (flowType === "recovery") window.location.replace(RECOVERY_DEST);
        else if (flowType === "signup") window.location.replace("/auth/verified");
        else window.location.replace(requestedNext ? withNext("/login", next) : "/login");
        return;
      }

      if (!code) {
        fail("nocode");
        return;
      }

      dumpPkce("before-exchange");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        fail("oauth");
        return;
      }
      await recordPendingTermsConsent(supabase);
      const response = await fetch("/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) {
        fail("setcookie");
        return;
      }
      stripHash();
      const completedFlow = flowType || (data as typeof data & { redirectType?: string | null }).redirectType;
      if (completedFlow === "recovery") {
        window.location.replace(RECOVERY_DEST);
      } else if (completedFlow === "signup") {
        window.location.replace("/auth/verified");
      } else {
        window.location.replace(requestedNext ? withNext("/login", next) : "/login");
      }
    })();
  }, [searchParams]);

  return null;
}
