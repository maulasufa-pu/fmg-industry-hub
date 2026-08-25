import type { Metadata } from "next";
import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Cara Bikin Lagu dari Ide sampai Siap Rilis",
  description: "Panduan cara bikin lagu melalui konsep, lirik, melodi, chord, struktur, aransemen, produksi, rekaman vokal, mixing, dan mastering.",
  alternates: { canonical: "/id/cara-bikin-lagu", languages: { "id-ID": "/id/cara-bikin-lagu", "en-US": "/learn/how-to-make-a-song", "x-default": "/learn/how-to-make-a-song" } },
  openGraph: { title: "Cara Bikin Lagu dari Awal sampai Selesai", description: "Langkah praktis mengubah ide sederhana menjadi lagu yang terstruktur dan siap diproduksi.", url: "/id/cara-bikin-lagu", locale: "id_ID", type: "article" },
};

export default function Page() {
  return <SalesSeoLanding
    lang="id"
    path="/id/cara-bikin-lagu"
    eyebrow="Panduan praktis membuat lagu"
    title="Cara Bikin Lagu: Dari Ide Pertama sampai Master Siap Rilis"
    intro="Membuat lagu tidak harus dimulai dari alat mahal atau rekaman yang sempurna. Lagu bisa lahir dari satu kalimat, potongan melodi, pola rhythm, chord, atau voice note. Yang penting adalah mengembangkan ide itu melalui proses yang jelas."
    benefits={["Tujuan dan emosi lagu yang jelas", "Lirik dan melodi yang saling mendukung", "Struktur serta aransemen yang kuat", "Produksi sesuai identitas artis", "Performa vokal yang terarah", "Master akhir yang siap dikirim"]}
    sections={[
      { title: "1. Tentukan tujuan lagu", paragraphs: ["Tulis satu kalimat yang menjelaskan pesan atau perasaan utama lagu. Kalimat ini menjadi filter untuk memilih lirik, melodi, tempo, harmony, dan instrumen.", "Pilih dua atau tiga lagu referensi dengan alasan spesifik. Satu referensi dapat menunjukkan energi, satu untuk pendekatan vokal, dan satu lagi untuk warna produksi."] },
      { title: "2. Bangun lirik, melodi, dan chord", paragraphs: ["Mulailah dari bagian yang paling alami. Rekam setiap ide melodi sebelum terlupa. Verse dapat membawa detail cerita, pre-chorus menciptakan dorongan, dan chorus menyampaikan inti emosi yang mudah diingat.", "Pastikan melodi nyaman dengan range vokal yang akan membawakannya. Chord harus mendukung rasa lagu, bukan sekadar terlihat rumit."] },
      { title: "3. Susun aransemen lagu", paragraphs: ["Aransemen mengatur perjalanan pendengar: kapan instrumen masuk, kapan energi naik, kapan musik memberi ruang, dan bagaimana satu bagian mengantar ke bagian berikutnya. Chorus akan terasa besar jika verse tidak menggunakan semua energi sejak awal.", "Draft aransemen yang berguna mencatat urutan bagian, durasi, perubahan dinamika, instrumen utama, transisi, dan fokus pada setiap bagian."] },
      { title: "4. Produksi, rekam, mixing, dan mastering", paragraphs: ["Produksi mengubah aransemen menjadi suara nyata. Pilih instrumen dan tekstur yang mendukung identitas lagu. Rekam performa dengan tujuan yang jelas, kemudian edit secukupnya agar emosi tetap hidup.", "Mixing menata balance, tone, depth, dynamics, dan fokus. Mastering menyiapkan mix yang sudah disetujui untuk playback dan delivery yang konsisten. Mastering bukan pengganti aransemen atau rekaman yang belum selesai."] },
    ]}
    steps={[{ title: "Tangkap ide", text: "Simpan lirik, melodi, chord, rhythm, atau voice note sebelum terlalu banyak menilai." }, { title: "Kembangkan", text: "Bentuk ide terbaik menjadi struktur, aransemen, dan arah produksi yang jelas." }, { title: "Selesaikan", text: "Rekam, review, mixing, mastering, catat credit, dan siapkan file delivery." }]}
    faqs={[{ question: "Apakah bikin lagu harus mengerti teori musik?", answer: "Tidak. Teori membantu mempercepat keputusan, tetapi kemampuan mendengar, menganalisis referensi, bereksperimen, dan berkomunikasi juga sangat penting." }, { question: "Bagaimana jika saya baru punya lirik?", answer: "Composer dapat membantu mengembangkan melodi dan chord, kemudian dilanjutkan ke aransemen serta produksi." }, { question: "Apakah voice note cukup?", answer: "Voice note dapat cukup untuk menjelaskan melodi, rhythm, phrasing, atau mood. Tambahkan catatan genre dan referensi agar arahnya lebih jelas." }, { question: "Kapan perlu memakai jasa arranger atau produser?", answer: "Gunakan bantuan profesional ketika ide inti sudah kuat tetapi struktur, instrumen, sound direction, rekaman, atau proses finishing masih menghambat tujuan lagu." }]}
    primaryCta="Bantu saya bikin lagu"
    secondaryCta="Jasa aransemen lagu"
    secondaryHref="/id/jasa-aransemen-lagu"
    related={[{ href: "/id/jasa-pembuatan-lagu", label: "Jasa pembuatan lagu" }, { href: "/id/jasa-aransemen-lagu", label: "Jasa aransemen lagu" }, { href: "/portfolio", label: "Dengarkan portofolio" }, { href: "/learn/how-to-make-a-song", label: "English version" }]}
  />;
}
