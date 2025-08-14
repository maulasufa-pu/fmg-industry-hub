"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Close } from "@/icons";

type PaymentPlan = "upfront" | "half" | "milestone";

const planPretty: Record<PaymentPlan, string> = {
  upfront: "100% Up-front (dibayar penuh di awal)",
  half: "50% DP / 50% saat Delivery",
  milestone: "Milestone (25% – 50% – 25%)",
};

type Props = {
  open: boolean;
  onClose: () => void;
  projectId?: string | null;
  paymentPlan: PaymentPlan;
};

export default function SubmitSuccessModal({
  open,
  onClose,
  projectId = null,
  paymentPlan,
}: Props): React.JSX.Element | null {
  const router = useRouter();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-base font-semibold text-gray-900">Request Sent! ✨</h3>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-60"
            aria-label="Close confirmation"
          >
            <Close className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm text-gray-700">
          <p>
            Thank you! We have received your project and it is currently in progress.{" "}
            <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700 ring-1 ring-amber-200">Requested</span>.
          </p>
          <p>
            The Admin Team will verify and approve the project. Once the project{" "}
            <span className="font-medium">is approved</span>, the process will automatically proceed to the{" "}
            <span className="font-medium">payment stage</span> according to the plan you selected:
          </p>
          <div className="rounded-lg border bg-gray-50 px-3 py-2 text-gray-800">
            <div className="text-sm">
              <span className="mr-1 font-medium">Payment Plan:</span>
              {planPretty[paymentPlan]}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              You will receive a notification/email when the project has been approved and the invoice is ready to be paid.
            </div>
          </div>
          <p className="text-xs text-gray-500">
            *If there are any adjustments to the brief or price, the Admin will contact you before approval.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Tutup
          </button>
          <button
            onClick={() => {
              onClose();
              router.push("/client/projects?tab=Requested");
            }}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Open in Project Requested
          </button>
          {projectId && (
            <button
              onClick={() => {
                onClose();
                router.push(`/client/projects/${projectId}`);
              }}
              className="rounded-lg bg-primary-60 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
            >
              Open Project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
