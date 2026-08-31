import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Jasa Pembuatan Soundtrack Original | FMG Universe",
  description:
    "Jasa pembuatan soundtrack dan musik original untuk film, serial, gim, iklan, podcast, serta konten dengan arah emosi dan kebutuhan penggunaan yang jelas.",
  alternates: { canonical: "/id/jasa-pembuatan-soundtrack" },
  openGraph: {
    title: "Jasa Pembuatan Soundtrack Original",
    description:
      "Musik original yang mengikuti cerita, memperkuat emosi, dan memberi identitas pada karya visualmu.",
    url: "/id/jasa-pembuatan-soundtrack",
    locale: "id_ID",
    type: "website",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/jasa-pembuatan-soundtrack"
      eyebrow="Jasa soundtrack dan musik original"
      title="Musik yang Membantu Ceritamu Terasa Lebih Hidup"
      intro="Gambar dapat menunjukkan apa yang terjadi, tetapi musik membantu penonton merasakan maknanya. FMG membuat soundtrack original yang mengikuti alur cerita, membangun suasana, dan tetap memberi ruang bagi dialog serta elemen suara lainnya."
      serviceName="Jasa pembuatan soundtrack original"
      benefits={[
        "Arah musik berdasarkan cerita dan adegan",
        "Tema musikal yang dapat dikembangkan",
        "Penyesuaian durasi dan perubahan gambar",
        "Pilihan instrumen sesuai suasana",
        "Mixing yang mempertimbangkan dialog",
        "Ketentuan penggunaan yang jelas",
      ]}
      sections={[
        {
          title: "Soundtrack bekerja bersama cerita",
          paragraphs: [
            "Musik untuk film, serial, gim, iklan, podcast, dan konten tidak seharusnya berdiri sendiri tanpa memahami konteks. Kami mempelajari cerita, karakter, ritme penyuntingan, dialog, dan emosi yang ingin dibangun sebelum menentukan arah musiknya.",
            "Pada beberapa adegan, musik perlu terasa kuat. Pada adegan lain, justru ruang dan kesederhanaan yang membuat emosi bekerja. Setiap keputusan disesuaikan dengan fungsi musik di dalam karya, bukan hanya dengan selera genre.",
          ],
        },
        {
          title: "Tema yang sama dapat berkembang bersama adegan",
          paragraphs: [
            "Sebuah motif atau tema musikal dapat muncul dalam bentuk yang berbeda ketika cerita berubah. Melodi yang terasa hangat pada awal cerita bisa menjadi lebih tegang, sepi, atau megah melalui perubahan tempo, harmoni, instrumen, dan dinamika.",
            "Pendekatan ini membantu karya memiliki identitas suara yang konsisten tanpa membuat setiap adegan terdengar sama.",
          ],
        },
        {
          title: "Materi visual dan catatan yang tepat sangat membantu",
          paragraphs: [
            "Kirim video dengan timecode, sinopsis, catatan adegan, referensi, durasi yang dibutuhkan, serta versi gambar yang sudah mendekati final. Jika gambar masih mungkin berubah, jadwal dan mekanisme penyesuaiannya perlu dibicarakan sejak awal.",
          ],
        },
      ]}
      steps={[
        {
          title: "Ceritakan kebutuhan karyamu",
          text: "Kirim sinopsis, video, timecode, referensi, fungsi musik, durasi, media penggunaan, dan tenggat waktu.",
        },
        {
          title: "Tentukan arah musik",
          text: "Kita membahas tema, emosi, instrumen, titik masuk dan keluar musik, tahapan review, serta hak penggunaan.",
        },
        {
          title: "Sesuaikan dengan gambar",
          text: "Musik diproduksi dan diselaraskan dengan visual, lalu diselesaikan setelah tahap review yang disepakati.",
        },
      ]}
      faqs={[
        {
          question: "Apakah soundtrack harus dibuat setelah video selesai?",
          answer:
            "Tidak selalu, tetapi versi gambar yang stabil akan mengurangi perubahan durasi dan sinkronisasi. Jika penyuntingan masih berjalan, kita perlu menyepakati versi acuan dan cara menangani perubahan gambar.",
        },
        {
          question: "Apakah bisa membuat musik tanpa vokal?",
          answer:
            "Bisa. Soundtrack dapat berupa instrumental, menggunakan vokal sebagai tekstur, atau berbentuk lagu lengkap, tergantung kebutuhan cerita dan adegan.",
        },
        {
          question: "Apakah bisa dibuat agar mirip lagu referensi?",
          answer:
            "Referensi dapat digunakan untuk menjelaskan suasana, energi, instrumentasi, atau pendekatan produksi. Musik akhirnya tetap dibuat original dan tidak menyalin melodi maupun bagian khas dari karya lain.",
        },
        {
          question: "File apa yang akan diterima?",
          answer:
            "Format dapat mencakup master stereo, stems kelompok instrumen, versi alternatif, atau potongan durasi tertentu sesuai kebutuhan yang telah disepakati sebelum produksi.",
        },
      ]}
      primaryCta="Diskusikan soundtrackmu"
      secondaryCta="Jasa pembuatan lagu"
      secondaryHref="/id/jasa-pembuatan-lagu"
      related={[
        { href: "/id/jasa-pembuatan-lagu", label: "Jasa pembuatan lagu" },
        { href: "/id/jasa-produksi-musik", label: "Jasa produksi musik" },
        { href: "/id/jasa-pembuatan-jingle", label: "Jasa pembuatan jingle" },
        { href: "/portfolio", label: "Dengarkan portofolio" },
      ]}
    />
  );
}
