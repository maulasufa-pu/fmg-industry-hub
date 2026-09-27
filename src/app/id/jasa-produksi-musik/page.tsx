import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: { absolute: "Jasa Produksi Musik Profesional | Flemmo Music" },
  description:
    "Punya demo tapi hasilnya belum sesuai bayangan? Flemmo Music membantu mengembangkan aransemen, rekaman, editing, mixing, dan mastering sesuai kebutuhan lagumu.",
  alternates: { canonical: "/id/jasa-produksi-musik" },
  openGraph: {
    title: "Jasa Produksi Musik Profesional",
    description:
      "Bawa demo atau rancangan lagumu ke tahap produksi. Ceritakan suara yang kamu cari dan dengarkan perkembangannya bersama kami.",
    url: "/id/jasa-produksi-musik",
    locale: "id_ID",
    type: "website",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/jasa-produksi-musik"
      eyebrow="Jasa produksi musik"
      title="Jasa Produksi Musik untuk Lagu yang Sudah Kamu Mulai"
      intro="Lagunya sudah ada, tapi rekamannya belum terdengar seperti yang kamu inginkan? Kirim demo dan ceritakan bagian yang masih mengganjal. Kami bantu mencari suara, susunan, dan cara produksi yang cocok untuk lagumu."
      serviceName="Jasa produksi musik"
      benefits={[
        "Arah suara yang dibahas bersama",
        "Pilihan instrumen dan aransemen sesuai kebutuhan",
        "Pengolahan vokal dan instrumen bila diperlukan",
        "Kesempatan mendengar hasil di tahap yang disepakati",
        "Mixing dan mastering sesuai penawaran",
        "Kejelasan biaya, revisi, dan file yang diterima",
      ]}
      sections={[
        {
          title: "Apa yang perlu dikerjakan pada lagumu?",
          paragraphs: [
            "Ada lagu yang cukup dibantu dengan aransemen. Ada yang perlu rekaman vokal ulang, perbaikan suara instrumen, atau mixing yang lebih rapi. Setelah mendengar demomu, kami akan membahas pekerjaan yang masuk akal untuk lagu itu. Tidak semua tahap harus diambil sekaligus.",
            "Kalau perlu rekaman studio atau musisi tambahan, kami cek dulu ketersediaan, lokasi, jadwal, dan biayanya. Rekaman vokal yang sudah kamu punya juga bisa kami dengar untuk menentukan apakah masih bisa dipakai.",
            "Sebelum mulai, kita sepakati kapan kamu bisa mendengar hasil sementara, berapa kali revisi, dan file apa yang akan diserahkan. Kalau kamu membutuhkan versi instrumental, stems, atau file sesi, sebutkan sejak awal agar bisa masuk dalam penawaran.",
          ],
          links: [
            { href: "/id/jasa-aransemen-lagu", label: "Ingin mengembangkan susunan musiknya? Lihat jasa aransemen." },
            { href: "/id/jasa-pembuatan-lagu", label: "Lagunya belum terbentuk? Mulai dari pembuatan lagu." },
          ],
        },
        {
          title: "Kita cari suara yang cocok untuk lagunya",
          paragraphs: [
            "Pilihan tempo, instrumen, bunyi drum, dan cara menempatkan vokal bisa mengubah rasa sebuah lagu. Kami mendengar apa yang sudah bekerja dalam demomu, lalu membahas bagian yang perlu dibuat lebih kuat atau justru lebih sederhana.",
            "Referensi membantu, terutama kalau kamu bisa menunjuk bagian yang kamu suka. Mungkin drum-nya, ruang vokalnya, atau energi di bagian reff. Itu memberi kami arah tanpa harus membuat lagumu terdengar seperti salinan karya lain.",
          ],
        },
        {
          title: "Rekaman ponsel pun boleh dikirim",
          paragraphs: [
            "Demo gitar dan vokal, rekaman piano, MIDI, atau lagu yang produksinya sudah setengah jalan sama-sama bisa jadi bahan awal. Kami dengarkan dulu sebelum menyarankan apa yang perlu dipertahankan, diperbaiki, atau direkam ulang.",
            "Kalau bentuk lagunya masih berubah-ubah, kita bisa rapikan bagian bait, reff, atau jembatannya sebelum sibuk memilih suara dan efek.",
          ],
        },
        {
          title: "Kamu tahu apa yang sedang dikerjakan",
          paragraphs: [
            "Di awal proyek, kami jelaskan tahap kerja, jadwal untuk mendengar hasil, jumlah revisi, biaya, dan file akhirnya. Kalau ada kebutuhan baru di tengah jalan, kita bicarakan dampaknya pada biaya dan waktu sebelum dikerjakan.",
          ],
        },
      ]}
      steps={[
        {
          title: "Kirim demomu",
          text: "Bagikan lagu, lirik, dan referensi. Ceritakan bagian yang sudah kamu suka dan bagian yang menurutmu belum pas.",
        },
        {
          title: "Tentukan pekerjaannya",
          text: "Kami dengarkan materinya, lalu sepakati arah suara, tahap produksi, biaya, revisi, dan jadwal.",
        },
        {
          title: "Dengar hasilnya",
          text: "Kamu memberi masukan pada tahap yang disepakati. Setelah selesai, kami serahkan file sesuai penawaran.",
        },
      ]}
      faqs={[
        {
          question: "Apa bedanya produksi musik dan aransemen?",
          answer:
            "Aransemen mengatur susunan lagu dan pilihan instrumennya. Produksi bisa mencakup pekerjaan sesudah itu, seperti rekaman, pengolahan suara, editing, mixing, dan mastering. Tahap yang kamu perlukan ditentukan setelah kami mendengar lagunya.",
        },
        {
          question: "Apakah demo dari ponsel bisa digunakan?",
          answer:
            "Bisa. Rekamannya cukup untuk menunjukkan melodi, lirik, dan suasana lagu. Kalau ada bagian yang sulit terdengar, kami akan bertanya atau meminta rekaman panduan tambahan.",
        },
        {
          question: "Bolehkah saya mengirim lagu referensi?",
          answer:
            "Boleh. Akan lebih membantu kalau kamu menyebut bagian yang kamu suka, misalnya karakter vokal, permainan drum, atau suasana lagunya.",
        },
        {
          question: "Apakah mixing dan mastering termasuk?",
          answer:
            "Bisa termasuk, tergantung pekerjaan yang kita sepakati. Kami akan menyebutkannya dengan jelas dalam penawaran, bersama format file yang akan kamu terima.",
        },
      ]}
      primaryCta="Ceritakan Proyek Musikmu"
      primaryHref="/services/inquiry"
      secondaryCta="Jasa pembuatan lagu"
      secondaryHref="/id/jasa-pembuatan-lagu"
      related={[
        { href: "/id/jasa-pembuatan-lagu", label: "Jasa pembuatan lagu" },
        { href: "/id/jasa-aransemen-lagu", label: "Jasa aransemen lagu" },
        { href: "/id/jasa-mixing-mastering-lagu", label: "Jasa mixing dan mastering" },
        { href: "/portfolio", label: "Dengarkan karya kami" },
      ]}
    />
  );
}
