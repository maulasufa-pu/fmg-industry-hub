"use client";

import { useEffect } from "react";
import { trackConversion } from "@/lib/conversion-tracking";

export default function ConversionTracking() {
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href, window.location.origin);
      if (url.hostname === "wa.me" || url.hostname === "api.whatsapp.com") {
        trackConversion("click_whatsapp");
      } else if (url.origin === window.location.origin) {
        if (url.pathname.startsWith("/order/") || url.pathname === "/services/inquiry") trackConversion("click_project_start", { destination: url.pathname });
        if (["/pricing", "/id/harga"].includes(url.pathname) || url.hash === "#harga") trackConversion("click_pricing", { destination: url.pathname });
      }
    };
    const play = (event: Event) => {
      if (event.target instanceof HTMLMediaElement && /\/(portfolio|id\/portofolio)(\/|$)/.test(window.location.pathname)) trackConversion("portfolio_play");
    };
    document.addEventListener("click", click);
    document.addEventListener("play", play, true);
    return () => {
      document.removeEventListener("click", click);
      document.removeEventListener("play", play, true);
    };
  }, []);
  return null;
}
