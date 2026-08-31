import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Cara Memilih Jasa Aransemen Lagu yang Tepat",
  description:
    "Panduan memilih jasa aransemen lagu dengan menilai portofolio, cara berkomunikasi, proses revisi, biaya, kredit, hak, serta file akhir yang diterima.",
  alternates: {
    canonical: "/id/cara-memilih-jasa-aransemen-lagu",
  },
  openGraph: {
    title: "Cara Memilih Jasa Aransemen Lagu",
    description:
      "Ketahui hal yang perlu diperiksa sebelum mempercayakan lagumu kepada arranger atau produser musik.",
    url: "/id/cara-memilih-jasa-aransemen-lagu",
    locale: "id_ID",
    type: "article",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/cara-memilih-jasa-aransemen-lagu"
      eyebrow="Panduan memilih arranger"
      title="Cara Memilih Jasa Aransemen Lagu tanpa Mengorbankan Identitas Karyamu"
      intro="Arranger yang tepat bukan hanya mampu membuat musik terdengar ramai atau modern. Ia perlu memahami inti lagumu, menjelaskan prosesnya dengan jujur, dan mampu mengembangkan karya tanpa menghilangkan hal yang membuatnya terasa personal."
      benefits={[
        "Menilai portofolio dengan lebih tepat",
        "Mengenali cara kerja arranger",
        "Menyiapkan pertanyaan sebelum memesan",
        "Memahami batas revisi",
        "Memastikan hak dan kredit",
        "Mengetahui file yang akan diterima",
      ]}
      sections={[
        {
          title: "Dengarkan portofolio, jangan hanya melihat daftar genre",
          paragraphs: [
            "Daftar genre menunjukkan pengalaman, tetapi portofolio memperlihatkan bagaimana arranger mengambil keputusan. Dengarkan apakah vokal tetap memiliki ruang, perpindahan bagian terasa alami, dinamika berkembang, dan pilihan instrumennya mendukung cerita lagu.",
            "Kamu tidak harus menemukan lagu yang sama persis dengan idemu. Cari bukti bahwa arranger mampu memahami karakter artis yang berbeda, bukan memaksakan satu pola produksi pada semua lagu.",
          ],
        },
        {
          title: "Perhatikan cara ia memahami brief",
          paragraphs: [
            "Arranger yang baik akan bertanya tentang pesan lagu, calon pendengar, referensi, hal yang ingin dipertahankan, dan hasil akhir yang kamu bayangkan. Ia juga berani menjelaskan jika sebuah ide kurang sesuai atau membutuhkan pendekatan lain.",
            "Komunikasi yang nyaman bukan berarti semua permintaan selalu disetujui. Yang lebih penting adalah setiap keputusan memiliki alasan musikal yang bisa kamu pahami.",
          ],
        },
        {
          title: "Pastikan proses dan batas pekerjaannya tertulis",
          paragraphs: [
            "Tanyakan apa yang termasuk dalam harga, kapan kamu dapat mendengarkan hasil, berapa kali revisi, perubahan seperti apa yang dihitung sebagai revisi besar, serta bagaimana jika jadwal bergeser.",
            "Pastikan juga pembahasan tentang kredit, kepemilikan, lisensi, materi pihak lain, stems, file sesi, dan format akhir tidak hanya disampaikan secara lisan.",
          ],
        },
        {
          title: "Harga perlu dilihat bersama nilai yang diterima",
          paragraphs: [
            "Penawaran termurah belum tentu paling hemat jika prosesnya tidak jelas atau hasilnya harus dikerjakan ulang. Sebaliknya, harga tinggi juga tidak otomatis menjamin kecocokan. Pilih berdasarkan kualitas keputusan, komunikasi, pengalaman yang relevan, serta kepastian hasil yang akan diterima.",
          ],
        },
      ]}
      steps={[
        {
          title: "Siapkan demo dan tujuan",
          text: "Kirim materi yang kamu punya dan jelaskan bagian yang ingin dipertahankan, dikembangkan, atau diubah.",
        },
        {
          title: "Bandingkan cara kerja",
          text: "Periksa portofolio, isi layanan, jadwal, review, revisi, komunikasi, hak, dan file akhirnya.",
        },
        {
          title: "Pilih berdasarkan kecocokan",
          text: "Gunakan kualitas pemahaman dan kejelasan proses sebagai pertimbangan, bukan hanya harga atau jumlah instrumen.",
        },
      ]}
      faqs={[
        {
          question: "Apa yang perlu saya kirim kepada arranger?",
          answer:
            "Kirim demo, lirik, chord jika ada, referensi, target pendengar, tujuan rilis, tenggat, serta catatan tentang bagian yang paling penting bagimu.",
        },
        {
          question: "Berapa banyak referensi yang sebaiknya diberikan?",
          answer:
            "Dua atau tiga referensi yang disertai alasan biasanya lebih berguna daripada daftar panjang tanpa penjelasan. Sebutkan apakah kamu menyukai energinya, groove, instrumen, karakter vokal, atau suasananya.",
        },
        {
          question: "Apakah arranger boleh mengubah chord dan struktur?",
          answer:
            "Boleh jika perubahan tersebut dibutuhkan dan kamu menyetujuinya. Batas keputusan arranger sebaiknya dibicarakan sebelum pengerjaan agar identitas lagu tetap terjaga.",
        },
        {
          question: "Apakah saya perlu meminta file sesi produksi?",
          answer:
            "Tergantung kebutuhan. Jika kamu hanya memerlukan master untuk dirilis, file sesi mungkin tidak dibutuhkan. Jika ingin melanjutkan produksi dengan pihak lain, tanyakan sejak awal apakah stems atau file sesi tersedia dan apakah ada biaya atau ketentuan tambahan.",
        },
      ]}
      primaryCta="Diskusikan aransemen laguku"
      secondaryCta="Lihat jasa aransemen"
      secondaryHref="/id/jasa-aransemen-lagu"
      related={[
        { href: "/id/jasa-aransemen-lagu", label: "Jasa aransemen lagu" },
        { href: "/id/biaya-pembuatan-lagu", label: "Biaya pembuatan lagu" },
        { href: "/id/perbedaan-komposer-arranger-produser-musik", label: "Peran arranger dan produser" },
        { href: "/portfolio", label: "Dengarkan portofolio" },
      ]}
    />
  );
}
