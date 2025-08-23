// src/lib/invoices/auto.ts
import type { SupabaseClient } from "@supabase/supabase-js";

type SelectedService = {
  key: string;
  label: string;
  price: number;            // sudah “resolved” dari client (0 jika termasuk bundle)
  isSubscription?: boolean; // tidak dipakai di invoice item, tapi ok untuk future
};

type BundleInput = {
  label: string;
  bundlePrice: number;
  includes: string[];       // daftar service_key yang “dibundle”
};

type CreateInvoiceArgs = {
  projectId: string;
  clientId: string;                     // id di tabel public.clients (biasanya = auth.uid)
  clientName: string | null;
  clientEmail: string | null;
  selectedServices: readonly SelectedService[];
  bundle?: BundleInput | null;
  currency?: "IDR" | "USD";
  status?: "draft" | "unpaid";
  dueDays?: number;                     // default 14
};

type CreateInvoiceResult = { invoiceId: string };

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fallbackInvoiceNo(): string {
  // fallback jika rpc(next_invoice_no) gagal
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `INV-${y}${m}${dd}-${hh}${mm}${ss}`;
}

export async function createInvoiceForProject(
  sb: SupabaseClient,
  args: CreateInvoiceArgs
): Promise<CreateInvoiceResult> {
  const {
    projectId,
    clientId,
    clientName,
    clientEmail,
    selectedServices,
    bundle = null,
    currency = "IDR",
    status = "unpaid",
    dueDays = 14,
  } = args;

  if (!projectId) throw new Error("Missing projectId");
  if (!clientId) throw new Error("Missing clientId");

  // 1) ambil nomor invoice dari RPC (fallback ke generator lokal)
  let invoiceNo = fallbackInvoiceNo();
  const rpc = await sb.rpc("next_invoice_no");
  if (!rpc.error && typeof rpc.data === "string" && rpc.data.trim()) {
    invoiceNo = rpc.data;
  }

  const today = new Date();
  const issueDate = dateOnly(today);
  const due = new Date(today);
  due.setDate(today.getDate() + dueDays);
  const dueDate = dateOnly(due);

  // 2) Buat invoice
  const { data: inv, error: e1 } = await sb
    .from("invoices")
    .insert({
      invoice_no: invoiceNo,
      client_id: clientId,
      client_name: clientName,
      client_email: clientEmail,
      currency,
      status,           // default "unpaid"
      issue_date: issueDate,
      due_date: dueDate,
      project_id: projectId, // **BUTUH kolom ini (lihat migrasi di bawah)**
    })
    .select("id")
    .single<{ id: string }>();

  if (e1 || !inv?.id) {
    throw new Error(e1?.message ?? "Failed to create invoice");
  }
  const invoiceId = inv.id;

  // 3) Map service_key -> service_id untuk mengisi invoice_items.service_id
  const keys = Array.from(new Set(selectedServices.map((s) => s.key)));
  const { data: svcRows, error: svcErr } = await sb
    .from("services")
    .select("id, service_key")
    .in("service_key", keys);

  if (svcErr) {
    // Bersihkan invoice agar tidak orphan
    await sb.from("invoices").delete().eq("id", invoiceId);
    throw new Error(svcErr.message);
  }

  const keyToId = new Map<string, string>();
  (svcRows ?? []).forEach((r) => keyToId.set(r.service_key, r.id));

  // 4) Susun line items
  type InvoiceItemInsert = {
    invoice_id: string;
    service_id: string | null;
    description: string;
    qty: number;
    unit_price: number;
    position: number;
  };

  const items: InvoiceItemInsert[] = [];
  let pos = 0;

  if (bundle) {
    items.push({
      invoice_id: invoiceId,
      service_id: null,
      description: `Bundle: ${bundle.label}`,
      qty: 1,
      unit_price: Number(bundle.bundlePrice),
      position: pos++,
    });
  }

  for (const s of selectedServices) {
    items.push({
      invoice_id: invoiceId,
      service_id: keyToId.get(s.key) ?? null, // aman jika suatu service sudah dihapus
      description: s.label,
      qty: 1,
      unit_price: Number.isFinite(s.price) ? Number(s.price) : 0,
      position: pos++,
    });
  }

  const { error: e2 } = await sb.from("invoice_items").insert(items).select("id");
  if (e2) {
    // Bersihkan jika gagal
    await sb.from("invoices").delete().eq("id", invoiceId);
    throw new Error(e2.message);
  }

  // 5) (opsional cepat) simpan backlink invoice_id di projects jika kolom ada
  //    Abaikan error jika kolom tidak ada (biar tidak patah).
  await sb.from("projects").update({ invoice_id: invoiceId }).eq("project_id", projectId);

  return { invoiceId };
}
