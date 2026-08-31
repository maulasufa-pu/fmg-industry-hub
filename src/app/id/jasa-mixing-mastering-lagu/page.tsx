import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Jasa Mixing dan Mastering Lagu | FMG Universe",
  description:
    "Jasa mixing dan mastering lagu secara online untuk menata vokal, instrumen, dinamika, ruang, dan hasil akhir agar terdengar lebih utuh di berbagai perangkat.",
  alternates: { canonical: "/id/jasa-mixing-mastering-lagu" },
  openGraph: {
    title: "Jasa Mixing dan Mastering Lagu",
    description:
      "Bantu lagumu terdengar lebih seimbang, jelas, dan siap dirilis tanpa menghilangkan karakter musiknya.",
    url: "/id/jasa-mixing-mastering-lagu",
    locale: "id_ID",
    type: "website",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/jasa-mixing-mastering-lagu"
      eyebrow="Jasa mixing dan mastering online"
      title="Buat Setiap Bagian Lagumu Terdengar Utuh dan Seimbang"
      intro="Produksi yang bagus tetap bisa terasa kurang jelas jika vokal, instrumen, dinamika, dan ruangnya belum tertata. FMG membantu menyelesaikan mixing dan mastering dengan tetap menjaga emosi serta karakter asli lagumu."
      serviceName="Jasa mixing dan mastering lagu"
      benefits={[
        "Keseimbangan vokal dan instrumen",
        "Karakter suara yang lebih jelas",
        "Dinamika yang tetap terasa hidup",
        "Ruang dan kedalaman yang terarah",
        "Master yang konsisten di berbagai perangkat",
        "File akhir sesuai kebutuhan rilis",
      ]}
      sections={[
        {
          title: "Mixing membantu semua elemen menemukan tempatnya",
          paragraphs: [
            "Dalam sebuah lagu, setiap suara perlu terdengar sebagai bagian dari satu kesatuan. Mixing menata level, frekuensi, panning, dinamika, efek, dan ruang agar elemen penting terasa jelas tanpa saling menutupi.",
            "Tujuannya bukan membuat semua suara sama keras. Vokal, drum, bass, gitar, piano, strings, dan elemen lainnya membutuhkan prioritas yang berbeda sesuai dengan genre serta cerita lagunya.",
          ],
        },
        {
          title: "Mastering menyempurnakan hasil yang sudah disetujui",
          paragraphs: [
            "Setelah mixing selesai, mastering menyiapkan lagu agar level, tonal balance, dinamika, dan format akhirnya lebih konsisten saat diputar melalui earphone, speaker, mobil, ponsel, maupun layanan streaming.",
            "Mastering bukan cara untuk menyembunyikan masalah besar pada rekaman atau aransemen. Jika ada bagian yang perlu diperbaiki sebelum mastering, kami akan menyampaikannya agar hasil akhirnya tidak dipaksakan.",
          ],
        },
        {
          title: "File yang rapi mempercepat pengerjaan",
          paragraphs: [
            "Kirim stems atau multitrack mulai dari titik waktu yang sama, tanpa clipping, dan dengan nama file yang mudah dipahami. Sertakan rough mix serta satu atau dua referensi agar arah yang kamu inginkan lebih mudah ditangkap.",
          ],
        },
      ]}
      steps={[
        {
          title: "Siapkan file lagumu",
          text: "Kirim multitrack atau stems, rough mix, tempo, sample rate, dan referensi suara yang kamu inginkan.",
        },
        {
          title: "Kami pelajari materinya",
          text: "FMG memeriksa kelengkapan file serta membicarakan arah mixing, kebutuhan editing, dan hasil akhir.",
        },
        {
          title: "Review dan finalisasi",
          text: "Dengarkan hasilnya, sampaikan masukan secara terarah, lalu terima master final sesuai format yang disepakati.",
        },
      ]}
      faqs={[
        {
          question: "Apa bedanya mixing dan mastering?",
          answer:
            "Mixing mengolah dan menyeimbangkan setiap track di dalam lagu. Mastering bekerja pada hasil mix yang sudah selesai untuk menyiapkan karakter, level, konsistensi, dan format akhir sebelum dirilis.",
        },
        {
          question: "Apakah vokal fals bisa diperbaiki saat mixing?",
          answer:
            "Koreksi nada termasuk editing vokal dan perlu disepakati sebagai bagian pengerjaan. Perbaikan ringan umumnya memungkinkan, tetapi rekaman dengan masalah besar mungkin lebih baik direkam ulang.",
        },
        {
          question: "Format file apa yang perlu dikirim?",
          answer:
            "Umumnya gunakan WAV dengan sample rate dan bit depth yang sama seperti sesi rekaman. Semua file sebaiknya dimulai dari titik waktu yang sama dan tidak menggunakan limiter pada master bus, kecuali limiter tersebut memang bagian penting dari karakter produksi.",
        },
        {
          question: "Apakah prosesnya bisa dilakukan secara online?",
          answer:
            "Bisa. Pengiriman file, pembahasan referensi, review, revisi, dan penyerahan hasil akhir dapat dilakukan secara online.",
        },
      ]}
      primaryCta="Mixing dan mastering laguku"
      secondaryCta="Pelajari perbedaannya"
      secondaryHref="/id/perbedaan-mixing-dan-mastering"
      related={[
        { href: "/id/perbedaan-mixing-dan-mastering", label: "Perbedaan mixing dan mastering" },
        { href: "/id/jasa-produksi-musik", label: "Jasa produksi musik" },
        { href: "/id/jasa-editing-vokal", label: "Jasa editing vokal" },
        { href: "/portfolio", label: "Dengarkan portofolio" },
      ]}
    />
  );
}
