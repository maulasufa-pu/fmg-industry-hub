export default function DashboardPage() {
  if (typeof window === "undefined") return null;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p>Ringkasan proyek aktif, status pembayaran terakhir, notifikasi penting.</p>
    </div>
  );
}
