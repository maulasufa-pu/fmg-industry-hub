// app/auth/callback/CallbackClient.tsx
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type HashTokens = {
  access_token: string | null;
  refresh_token: string | null;
  token_type?: string | null;
  expires_in?: string | null;
  type?: string | null; 
};

const DEBUG_PKCE = true;
const RECOVERY_DEST = "/auth/callback?type=recovery"; 

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

export default function CallbackClient() {
  const sp = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const supabase = getSupabaseClient();

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const nextParam = sp.get("next") || sp.get("redirectedFrom") || "";
      const safeNext = nextParam.startsWith("/") ? nextParam : "/client/dashboard";

      const hash = parseHash();
    const flowType = url.searchParams.get("type") || hash.type; // "email" | "recovery" | "magiclink" | "invite" | ...
    const hasHashTokens = Boolean(hash.access_token && hash.refresh_token);

    if (hasHashTokens) {
    dumpPkce("hash-tokens-detected:" + (flowType || "unknown"));

    const { data: setData, error: setErr } = await supabase.auth.setSession({
        access_token: hash.access_token as string,
        refresh_token: hash.refresh_token as string,
    });
    if (setErr || !setData.session) {
        //console.error("[callback] setSession (hash) error:", setErr);
        stripHash();
        window.location.replace("/login?err=hash-setsession");
        return;
    }

    const resp = await fetch("/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({
        access_token: setData.session.access_token,
        refresh_token: setData.session.refresh_token,
        }),
        cache: "no-store",
        credentials: "same-origin",
    });
    if (!resp.ok) {
        let msg = "failed to set server session (hash)";
        try { msg = (await resp.json())?.error ?? msg; } catch {}
        //console.error("[callback] set-session (hash) error:", msg);
        stripHash();
        window.location.replace("/login?err=hash-setcookie");
        return;
    }

    stripHash(flowType ? `type=${flowType}` : undefined);
    if (flowType === "recovery") {
        window.location.replace(RECOVERY_DEST);     
    } else {
        const rawNext = sp.get("next") || sp.get("redirectedFrom") || "";
        const dest = rawNext.startsWith("/") ? rawNext : "/client/dashboard";
        window.location.replace(dest);
    }
    return;
    }
    
      if (code) {
        dumpPkce("before-exchange");
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error || !data.session) {
          //console.error("[callback] exchange error:", error);
          dumpPkce("exchange-failed");
          stripHash();
          window.location.replace("/login?err=oauth");
          return;
        }
        dumpPkce("after-exchange");

        const resp = await fetch("/auth/set", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!resp.ok) {
          let msg = "failed to set server session";
          try {
            msg = (await resp.json())?.error ?? msg;
          } catch {}
          //console.error("[callback] set-session error:", msg);
          dumpPkce("after-set-failed");
          stripHash();
          window.location.replace("/login?err=setcookie");
          return;
        }

        dumpPkce("after-set-success");
        stripHash();
        window.location.replace(safeNext);
        return;
      }

      //console.error("[callback] missing code and no recovery tokens");
      stripHash();
      window.location.replace("/login?err=nocode");
    })();
  }, [sp]);

  return null;
}
