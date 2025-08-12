import { useEffect } from "react";
import { WAKE_EVENT } from "@/lib/wakeRefetch";

/**
 * Jalankan callback setiap kali tab kembali fokus/visible (via WAKE_EVENT).
 */
export function useWakeRefetch(cb: () => void | Promise<void>): void {
  useEffect(() => {
    const handler = () => { void cb(); };
    window.addEventListener(WAKE_EVENT, handler);
    return () => window.removeEventListener(WAKE_EVENT, handler);
  }, [cb]);
}