// src/components/settings/BillingPanel.tsx
"use client";
import React, { useState } from "react";

export default function BillingPanel() {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onSave = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setSaving(true);
  setErr(null);
  setOk(false);

  try {
    // TODO: integrate gateway (Stripe/etc) or store billing profile
    await new Promise((r) => setTimeout(r, 600));
    setOk(true);
  } catch (e: unknown) { // ⬅️ was: any
    const msg = e instanceof Error ? e.message : "Failed";
    setErr(msg);
  } finally {
    setSaving(false);
  }
};


  return (
    <div className="flex flex-col w-[700px] items-start gap-4">
      {/* Payment method */}
      <section className="flex flex-col items-start gap-6 p-4 w-full bg-defaultwhite border border-coolgray-20">
        <div className="flex-col items-start justify-center gap-4 flex w-full">
          <h2 className="font-heading-6 text-coolgray-90">Payment Method</h2>
        </div>

        {err && <p className="text-[13px] text-red-600 -mt-2">{err}</p>}
        {ok && <p className="text-[13px] text-green-700 -mt-2">Saved.</p>}

        <form onSubmit={onSave} className="flex flex-col w-[616px] items-start gap-4">
          <div className="flex items-start gap-4 w-full">
            <div className="flex flex-col gap-1 flex-1">
              <label className="font-body-s text-coolgray-90">Name on Card</label>
              <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
                <input
                  value={cardName}
                  onChange={(e)=>setCardName(e.target.value)}
                  className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                  placeholder="John Doe"
                  disabled={saving}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="font-body-s text-coolgray-90">Card Number</label>
              <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
                <input
                  value={cardNumber}
                  onChange={(e)=>setCardNumber(e.target.value)}
                  className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                  placeholder="4242 4242 4242 4242"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 w-full">
            <div className="flex flex-col gap-1 w-1/2">
              <label className="font-body-s text-coolgray-90">Expiry</label>
              <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
                <input
                  value={exp}
                  onChange={(e)=>setExp(e.target.value)}
                  className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                  placeholder="MM/YY"
                  disabled={saving}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 w-1/2">
              <label className="font-body-s text-coolgray-90">CVC</label>
              <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
                <input
                  value={cvc}
                  onChange={(e)=>setCvc(e.target.value)}
                  className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                  placeholder="123"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="font-body-s text-coolgray-90">Billing Address</label>
            <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
              <input
                value={address}
                onChange={(e)=>setAddress(e.target.value)}
                className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                placeholder="Street, City, ZIP"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 w-full">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center px-4 bg-primary-60 border-2 border-primary-60 text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Billing"}
            </button>
          </div>
        </form>
      </section>

      {/* Invoices table (dummy) */}
      <section className="flex flex-col items-start gap-6 p-4 w-full bg-defaultwhite border border-coolgray-20">
        <h2 className="font-heading-6 text-coolgray-90">Invoices</h2>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left">
            <thead className="text-coolgray-60 text-sm">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="text-coolgray-90 text-sm">
              {[
                { d: "2025-07-01", desc: "Pro Plan – July", amt: "$24.00", st: "Paid" },
                { d: "2025-06-01", desc: "Pro Plan – June", amt: "$24.00", st: "Paid" },
              ].map((r, i) => (
                <tr key={i} className="border-t border-coolgray-20">
                  <td className="py-2 px-3">{r.d}</td>
                  <td className="py-2 px-3">{r.desc}</td>
                  <td className="py-2 px-3">{r.amt}</td>
                  <td className="py-2 px-3">{r.st}</td>
                  <td className="py-2 px-3">
                    <button className="text-primary-90 hover:underline">Download PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
