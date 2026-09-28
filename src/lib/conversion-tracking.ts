import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from "@/lib/privacy-consent";
import { GOOGLE_ADS_LEAD_CONVERSION } from "@/lib/google-tag-config";

type ConversionEvent = "click_whatsapp" | "click_project_start" | "click_pricing" | "portfolio_play" | "submit_contact" | "submit_project";

function sendTrackingEvent(event: string, parameters: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  try {
    const consent = JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) || "null");
    if (consent?.version !== CONSENT_VERSION || consent?.analytics !== true) return;
    const analyticsWindow = window as typeof window & { gtag?: (command: string, name: string, values: Record<string, string | number>) => void };
    analyticsWindow.gtag?.("event", event, parameters);
  } catch {
    // Analytics must never interrupt navigation or a successful submission.
  }
}

export function trackConversion(event: ConversionEvent, parameters: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  sendTrackingEvent(event, { page_path: window.location.pathname, ...parameters });
}

// Call only after a public inquiry form has been accepted by the server.
export function trackLeadSubmission(event: "submit_contact" | "submit_project", parameters: Record<string, string> = {}) {
  trackConversion(event, parameters);
  sendTrackingEvent("conversion", {
    send_to: GOOGLE_ADS_LEAD_CONVERSION,
    value: 1.0,
    currency: "IDR",
  });
}
