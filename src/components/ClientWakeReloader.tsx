"use client";
import { useEffect } from "react";

export default function ClientAutoF5() {
  useEffect(() => {
    const reload = () => {
      window.location.reload();
    };

    window.addEventListener("focus", reload, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reload();
    });

    return () => {
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", reload);
    };
  }, []);

  return null;
}
