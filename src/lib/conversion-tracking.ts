import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from "@/lib/privacy-consent";

type ConversionEvent = "click_whatsapp" | "click_project_start" | "click_pricing" | "portfolio_play" | "submit_contact" | "submit_project";

export function trackConversion(event: ConversionEvent, parameters: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  try {
    const consent = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) || "null");
    if (consent?.version !== CONSENT_VERSION || consent?.analytics !== true) return;
    const analyticsWindow = window as typeof window & { gtag?: (command: string, name: string, values: Record<string, string>) => void };
    analyticsWindow.gtag?.("event", event, { page_path: window.location.pathname, ...parameters });
  } catch {
    // Analytics must never interrupt navigation or a successful submission.
  }
}
