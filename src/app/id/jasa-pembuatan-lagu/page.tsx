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
      { title: "Jasa bikin lagu untuk kebutuhan yang berbeda", paragraphs: ["Single artis, soundtrack, jingle, lagu kampanye, mars, hymne, dan lagu personal punya tujuan yang berbeda. Kami mengolah tujuan, audiens, pesan, referensi, serta format rilis menjadi keputusan musikal yang relevan.", "Kamu bisa mulai dari tahap mana saja. Kalau baru punya ide, kita mulai dari konsep. Kalau lirik atau melodinya sudah ada, kami akan mengembangkannya tanpa menghilangkan identitas utama karyamu."] },
      { title: "Semua kesepakatan penting dibuat jelas", paragraphs: ["Scope, timeline, revisi, pembayaran, credit, ownership, session assets, material pihak ketiga, dan file akhir dikonfirmasi sebelum produksi. FMG tidak otomatis mengambil alih lagumu hanya karena kamu menggunakan jasa pembuatan lagu."] },
      { title: "Satu flow dari brief sampai delivery", paragraphs: ["Kamu tidak perlu mengatur banyak vendor secara terpisah. Komunikasi dan keputusan project disatukan dalam satu alur: pilih layanan, kirim referensi, berikan feedback, lalu pantau status pengerjaannya melalui project FMG."] },
    ]}
    steps={[{ title: "Ceritakan kebutuhan", text: "Kirim tujuan lagu, target pendengar, lirik atau melodi yang tersedia, referensi, dan deadline." }, { title: "Setujui arah & scope", text: "Konfirmasi komposisi, aransemen, produksi, revisi, ownership, timeline, dan pembayaran." }, { title: "Review sampai final", text: "Tinjau milestone yang disepakati lalu terima file akhir sesuai deliverables." }]}
    faqs={[{ question: "Bisa bikin lagu kalau saya baru punya ide?", answer: "Bisa. Kita dapat memulai dari konsep, lalu mengembangkannya menjadi lirik, melodi, struktur, aransemen, dan produksi sesuai scope." }, { question: "Bisa menggunakan lirik atau melodi buatan saya?", answer: "Bisa. Materimu menjadi fondasi kreatifnya. Credit dan ownership akan dikonfirmasi secara tertulis." }, { question: "Apakah prosesnya bisa sepenuhnya online?", answer: "Bisa. Brief, pertukaran file, review, revisi, dan pemantauan project dapat dilakukan secara online." }, { question: "Apakah pembuatan lagu sudah termasuk mixing dan mastering?", answer: "Tergantung paket atau scope yang kamu pilih. Semua komponen akan ditampilkan dan dikonfirmasi sebelum produksi dimulai." }]}
    primaryCta="Mulai bikin lagu"
    secondaryCta="Jasa aransemen lagu"
    secondaryHref="/id/jasa-aransemen-lagu"
    related={[{ href: "/id/jasa-aransemen-lagu", label: "Jasa aransemen lagu" }, { href: "/id/cara-bikin-lagu", label: "Cara bikin lagu" }, { href: "/portfolio", label: "Portofolio produksi" }, { href: "/song-creation-service", label: "English version" }]}
  />;
}
