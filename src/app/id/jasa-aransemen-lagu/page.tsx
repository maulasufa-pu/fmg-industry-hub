import type { Metadata } from "next";
import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Jasa Aransemen Lagu Profesional",
  description: "Jasa aransemen lagu online untuk mengubah melodi, chord, lirik, atau rekaman panduan menjadi lagu yang terstruktur dan siap dirilis.",
  alternates: { canonical: "/id/jasa-aransemen-lagu", languages: { "id-ID": "/id/jasa-aransemen-lagu", "en-US": "/arrangement", "x-default": "/arrangement" } },
  openGraph: { title: "Jasa Aransemen Lagu Profesional", description: "Aransemen, produksi, editing, mixing, mastering, dan vocal directing dalam alur kerja yang jelas.", url: "/id/jasa-aransemen-lagu", locale: "id_ID", type: "website" },
};

export default function Page() {
  return <SalesSeoLanding
    lang="id"
    path="/id/jasa-aransemen-lagu"
    eyebrow="Jasa aransemen lagu online"
    title="Jasa Aransemen Lagu Profesional untuk Membawa Ide Musik Anda Jadi Utuh"
    intro="Sudah punya melodi, chord, lirik, atau rekaman panduan sederhana? FMG membantu mengembangkannya menjadi aransemen yang terstruktur, sesuai karakter artis, dan siap masuk ke tahap rilis. Anda tetap memegang kendali kreatif; scope, revisi, timeline, deliverables, dan hak penggunaan dikonfirmasi sebelum produksi dimulai."
    serviceName="Jasa aransemen lagu profesional"
    benefits={["Komposisi dan aransemen sesuai brief", "Produksi audio digital", "Editing, mixing, dan mastering", "Vocal directing", "Scope dan jumlah revisi yang disepakati", "File akhir sesuai deliverables project"]}
    sections={[
      { title: "Apa itu jasa aransemen lagu?", paragraphs: ["Jasa aransemen lagu adalah proses mengembangkan ide dasar menjadi bentuk musik yang lengkap. Arranger menentukan struktur, dinamika, harmoni, pilihan instrumen, transisi, dan arah emosi agar lagu bekerja sebagai satu kesatuan.", "Layanan ini cocok untuk songwriter, penyanyi, band, kreator konten, brand, maupun siapa pun yang memiliki ide lagu tetapi membutuhkan partner produksi untuk mewujudkannya secara profesional."] },
      { title: "Bukan membeli lagu Anda", paragraphs: ["FMG menjual jasa kreatif dan produksi. Kami bukan label yang membeli lagu atau mengambil komposisi hanya karena Anda memesan aransemen. Kepemilikan, credit, aset sesi, material pihak ketiga, serta lisensi atau pengalihan apa pun harus tertulis pada quote, invoice, dan ketentuan project yang Anda setujui.", "Untuk customer baru tersedia paket hemat Rp6.000.000. Harga akhir, tambahan kebutuhan musisi, dan ruang lingkup khusus selalu ditampilkan atau dikonfirmasi sebelum project dimulai."] },
      { title: "Aransemen yang dibangun untuk tujuan lagu", paragraphs: ["Aransemen untuk single pop tentu berbeda dari lagu kompetisi, soundtrack, jingle, lagu pernikahan, atau materi live. Karena itu kami membaca referensi, target pendengar, range vokal, nuansa, dan tujuan rilis sebelum menentukan pendekatan produksi."] },
    ]}
    steps={[
      { title: "Kirim brief", text: "Isi judul, genre, referensi, rekaman panduan, dan tujuan lagu melalui form order." },
      { title: "Konfirmasi scope", text: "Tim mengonfirmasi layanan, timeline, revisi, deliverables, ownership, dan pembayaran." },
      { title: "Produksi & review", text: "Project berjalan melalui milestone yang jelas sampai file akhir disetujui dan diserahkan." },
    ]}
    faqs={[
      { question: "Apakah harus sudah punya demo?", answer: "Tidak perlu menyebutnya demo. Anda cukup mengirim panduan apa pun yang membantu kami memahami lagu: voice note, vokal, chord, lirik, atau referensi." },
      { question: "Apakah lagu saya dibeli FMG?", answer: "Tidak. Anda membeli jasa aransemen dan produksi. Ketentuan ownership dan credit ditulis secara jelas pada dokumen project." },
      { question: "Berapa harga jasa aransemen lagu?", answer: "Customer baru dapat memilih paket hemat Rp6.000.000. Kebutuhan di luar scope paket akan dikonfirmasi sebelum pengerjaan." },
      { question: "Bisa dikerjakan secara online?", answer: "Bisa. Brief, file, review, revisi, komunikasi, dan status project dikelola melalui flow online FMG." },
      { question: "Apakah termasuk mixing dan mastering?", answer: "Paket yang dipilih pada halaman order menampilkan layanan yang termasuk. Paket customer baru mencakup editing, mixing, dan mastering." },
    ]}
    primaryCta="Mulai order aransemen"
    secondaryCta="Lihat portofolio"
    secondaryHref="/portfolio?work_type=arrangement"
    related={[{ href: "/id/jasa-pembuatan-lagu", label: "Jasa pembuatan lagu" }, { href: "/id/cara-bikin-lagu", label: "Cara bikin lagu" }, { href: "/pricing", label: "Harga & paket" }, { href: "/arrangement", label: "English version" }]}
  />;
}
