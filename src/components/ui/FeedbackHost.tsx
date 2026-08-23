"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
type ConfirmRequest = { message: string; resolve: (value: boolean) => void };

export const FEEDBACK_TOAST_EVENT = "fmg:toast";
export const FEEDBACK_CONFIRM_EVENT = "fmg:confirm";

export function notify(message: string, tone: Toast["tone"] = "info"): void {
  window.dispatchEvent(new CustomEvent(FEEDBACK_TOAST_EVENT, { detail: { message, tone } }));
}

export function confirmAction(message: string): Promise<boolean> {
  return new Promise((resolve) => window.dispatchEvent(new CustomEvent(FEEDBACK_CONFIRM_EVENT, { detail: { message, resolve } })));
}

export default function FeedbackHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<Omit<Toast, "id">>).detail;
      const toast = { ...detail, id: Date.now() + Math.random() };
      setToasts((current) => [...current.slice(-2), toast]);
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), 4500);
    };
    const onConfirm = (event: Event) => setConfirmation((event as CustomEvent<ConfirmRequest>).detail);
    window.addEventListener(FEEDBACK_TOAST_EVENT, onToast);
    window.addEventListener(FEEDBACK_CONFIRM_EVENT, onConfirm);
    return () => {
      window.removeEventListener(FEEDBACK_TOAST_EVENT, onToast);
      window.removeEventListener(FEEDBACK_CONFIRM_EVENT, onConfirm);
    };
  }, []);

  const answer = (value: boolean) => {
    confirmation?.resolve(value);
    setConfirmation(null);
  };

  const onConfirmKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      answer(false);
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return <>
    <div className="fixed right-4 top-4 z-[120] grid w-[min(24rem,calc(100vw-2rem))] gap-2" aria-live="polite">{toasts.map((toast) => <div key={toast.id} role={toast.tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur ${toast.tone === "error" ? "border-red-300 bg-red-950/95 text-red-50" : toast.tone === "success" ? "border-emerald-300 bg-emerald-950/95 text-emerald-50" : "border-white/15 bg-neutral-950/95 text-white"}`}>{toast.message}</div>)}</div>
    {confirmation ? <div className="fixed inset-0 z-[130] grid place-items-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onKeyDown={onConfirmKeyDown}><div className="w-full max-w-md rounded-2xl bg-white p-6 text-neutral-950 shadow-2xl dark:bg-neutral-900 dark:text-white"><h2 id="confirm-title" className="text-lg font-semibold">Confirm action</h2><p className="mt-3 text-sm leading-6 opacity-70">{confirmation.message}</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => answer(false)} className="rounded-xl border border-current/20 px-4 py-2 text-sm font-semibold">Cancel</button><button autoFocus type="button" onClick={() => answer(true)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Continue</button></div></div></div> : null}
  </>;
}
