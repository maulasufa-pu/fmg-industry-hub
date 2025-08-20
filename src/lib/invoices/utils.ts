export function formatIDRCurrency(amount: number): string {
  return `IDR ${amount.toLocaleString("id-ID")}`;
}

export function isOverdue(status: string, due_date: string | null): boolean {
  if (status !== "unpaid" || !due_date) return false;
  // DATE tanpa waktu → anggap akhir hari lokal
  const d = new Date(due_date + "T23:59:59");
  return d.getTime() < Date.now();
}

export function nextStatusColor(
  status: "draft" | "unpaid" | "paid" | "cancelled",
  overdue: boolean
): string {
  if (overdue && status === "unpaid") return "bg-red-100 text-red-700";
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700";
    case "unpaid":
      return "bg-amber-100 text-amber-700";
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
  }
}

export function defaultDueDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, days));
  return d;
}

export function clientSideNextInvoiceNo(date: Date = new Date()): string {
  // Fallback jika tidak ada RPC di DB. Format: INV-YYYYMM-#### (zero-padded 4 digit)
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000); // fallback non-sekuensial; gunakan RPC untuk produksi
  const seq = rand.toString().padStart(4, "0");
  return `INV-${y}${m}-${seq}`;
}

type LineItem = { description: string; qty: number; unit_price: number };

export function calcTotals(items: LineItem[], taxPercent: number): {
  subtotal: number;
  tax: number;
  grand_total: number;
} {
  const subtotal = items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0);
  const tax = Math.round((subtotal * (Number(taxPercent) || 0)) / 100);
  const grand_total = subtotal + tax;
  return { subtotal, tax, grand_total };
}
