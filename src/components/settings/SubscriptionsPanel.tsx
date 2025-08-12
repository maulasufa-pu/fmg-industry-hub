// src/components/settings/SubscriptionsPanel.tsx
"use client";
import React, { useState } from "react";

export default function SubscriptionsPanel() {
  const [changing, setChanging] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro" | "business">("pro");

  const changePlan = async (p: "free" | "pro" | "business") => {
    setChanging(true);
    try {
      // TODO: panggil API/Stripe untuk ubah langganan
      await new Promise(r => setTimeout(r, 700));
      setPlan(p);
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="flex flex-col w-[700px] items-start gap-4">
      {/* Current plan */}
      <section className="flex flex-col items-start gap-6 p-4 w-full bg-defaultwhite border border-coolgray-20">
        <h2 className="font-heading-6 text-coolgray-90">Current Plan</h2>
        <div className="w-full flex items-center justify-between rounded-lg bg-coolgray-10 p-4">
          <div>
            <div className="font-body-l text-coolgray-90 capitalize">{plan} plan</div>
            <div className="text-[12px] text-coolgray-60">
              {plan === "free" && "Basic features"}
              {plan === "pro" && "Advanced features for individuals"}
              {plan === "business" && "Team collaboration & priority support"}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="h-10 px-3 border-2 border-primary-60 text-primary-60 hover:bg-primary-10"
              onClick={() => changePlan("pro")}
              disabled={changing || plan === "pro"}
            >
              {changing && plan !== "pro" ? "Switching..." : "Set Pro"}
            </button>
            <button
              className="h-10 px-3 border-2 border-primary-60 text-primary-60 hover:bg-primary-10"
              onClick={() => changePlan("business")}
              disabled={changing || plan === "business"}
            >
              {changing && plan !== "business" ? "Switching..." : "Set Business"}
            </button>
            <button
              className="h-10 px-3 border-2 border-primary-60 text-primary-60 hover:bg-primary-10"
              onClick={() => changePlan("free")}
              disabled={changing || plan === "free"}
            >
              {changing && plan !== "free" ? "Switching..." : "Set Free"}
            </button>
          </div>
        </div>
      </section>

      {/* Usage / limits */}
      <section className="flex flex-col items-start gap-6 p-4 w-full bg-defaultwhite border border-coolgray-20">
        <h2 className="font-heading-6 text-coolgray-90">Usage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          {[
            { k: "Projects", v: 7, max: plan === "free" ? 3 : plan === "pro" ? 20 : 100 },
            { k: "Assets", v: 120, max: plan === "free" ? 100 : plan === "pro" ? 1000 : 10000 },
            { k: "Seats", v: plan === "business" ? 5 : 1, max: plan === "business" ? 50 : 1 },
          ].map((m) => {
            const pct = Math.min(100, Math.round((m.v / m.max) * 100));
            return (
              <div key={m.k} className="p-3 border border-coolgray-20 bg-defaultwhite">
                <div className="font-body-m text-coolgray-90">{m.k}</div>
                <div className="text-[12px] text-coolgray-60">{m.v} / {m.max}</div>
                <div className="mt-2 h-2 w-full bg-coolgray-10 rounded">
                  <div className="h-2 rounded bg-primary-60" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Billing cycle actions */}
      <section className="flex flex-col items-start gap-6 p-4 w-full bg-defaultwhite border border-coolgray-20">
        <h2 className="font-heading-6 text-coolgray-90">Billing Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button className="h-10 px-3 border-2 border-primary-60 text-primary-60 hover:bg-primary-10">
            Update Payment Method
          </button>
          <button className="h-10 px-3 border-2 border-primary-60 text-primary-60 hover:bg-primary-10">
            View Invoices
          </button>
          <button className="h-10 px-3 border-2 border-red-500 text-red-600 hover:bg-red-50">
            Cancel Subscription
          </button>
        </div>
      </section>
    </div>
  );
}
