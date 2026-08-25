import type { Metadata } from "next";
import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Jasa Pembuatan Lagu & Jasa Bikin Lagu",
  description: "Jasa pembuatan lagu dari konsep, lirik, melodi, atau brief hingga aransemen, produksi, vocal directing, mixing, dan mastering.",
  alternates: { canonical: "/id/jasa-pembuatan-lagu", languages: { "id-ID": "/id/jasa-pembuatan-lagu", "en-US": "/song-creation-service", "x-default": "/song-creation-service" } },
  openGraph: { title: "Jasa Pembuatan Lagu Profesional", description: "Bikin lagu original dengan alur kreatif, scope, ownership, dan deliverables yang jelas.", url: "/id/jasa-pembuatan-lagu", locale: "id_ID", type: "website" },
};

export default function Page() {
  return <SalesSeoLanding
    lang="id"
    path="/id/jasa-pembuatan-lagu"
    eyebrow="Jasa pembuatan lagu original"
    title="Jasa Pembuatan Lagu dari Ide Awal sampai Master Siap Rilis"
    intro="Punya cerita, lirik, melodi, voice note, atau kebutuhan lagu untuk brand? FMG membantu proses bikin lagu secara profesional melalui komposisi, aransemen, produksi, vocal directing, editing, mixing, dan mastering yang saling terhubung."
    serviceName="Jasa pembuatan lagu profesional"
    benefits={["Pengembangan konsep dan arah lagu", "Komposisi serta aransemen", "Produksi musik digital", "Vocal directing dan editing", "Mixing dan mastering", "Credit, ownership, dan deliverables tertulis"]}
    sections={[
      { title: "Jasa bikin lagu untuk kebutuhan yang berbeda", paragraphs: ["Single artis, soundtrack, jingle, lagu kampanye, mars, hymne, dan lagu personal memiliki tujuan yang berbeda. Kami menerjemahkan tujuan, audiens, pesan, referensi, dan format rilis menjadi keputusan musikal yang relevan.", "Anda bisa mulai dari tahap mana pun. Jika baru punya ide, proses dapat dimulai dari konsep. Jika sudah punya lirik atau melodi, kami mengembangkannya tanpa menghilangkan identitas utama karya."] },
      { title: "Semua kesepakatan penting dibuat jelas", paragraphs: ["Scope, timeline, revisi, pembayaran, credit, kepemilikan, session assets, material pihak ketiga, dan file akhir dikonfirmasi sebelum produksi. FMG tidak otomatis mengambil lagu Anda hanya karena Anda memakai jasa pembuatan lagu."] },
      { title: "Satu flow dari brief sampai delivery", paragraphs: ["Daripada mengatur banyak vendor terpisah, komunikasi dan keputusan project disatukan. Anda dapat melihat layanan yang dipilih, mengirim referensi, memberi feedback, dan mengikuti status pengerjaan melalui flow project FMG."] },
    ]}
    steps={[{ title: "Ceritakan kebutuhan", text: "Kirim tujuan lagu, target pendengar, lirik atau melodi yang tersedia, referensi, dan deadline." }, { title: "Setujui arah & scope", text: "Konfirmasi komposisi, aransemen, produksi, revisi, ownership, timeline, dan pembayaran." }, { title: "Review sampai final", text: "Tinjau milestone yang disepakati lalu terima file akhir sesuai deliverables." }]}
    faqs={[{ question: "Bisa bikin lagu jika saya baru punya ide?", answer: "Bisa. Project dapat dimulai dari konsep dan dikembangkan menjadi lirik, melodi, struktur, aransemen, serta produksi sesuai scope." }, { question: "Bisa menggunakan lirik atau melodi buatan saya?", answer: "Bisa. Materi milik Anda menjadi dasar kreatif dan credit serta ownership-nya dikonfirmasi secara tertulis." }, { question: "Apakah jasa ini tersedia online?", answer: "Ya. Brief, pertukaran file, review, revisi, dan monitoring project dapat dilakukan online." }, { question: "Apakah pembuatan lagu termasuk mixing dan mastering?", answer: "Layanan yang termasuk mengikuti paket atau scope yang dipilih. Semua komponen ditampilkan dan dikonfirmasi sebelum produksi." }]}
    primaryCta="Mulai bikin lagu"
    secondaryCta="Jasa aransemen lagu"
    secondaryHref="/id/jasa-aransemen-lagu"
    related={[{ href: "/id/jasa-aransemen-lagu", label: "Jasa aransemen lagu" }, { href: "/id/cara-bikin-lagu", label: "Cara bikin lagu" }, { href: "/portfolio", label: "Portofolio produksi" }, { href: "/song-creation-service", label: "English version" }]}
  />;
}
