import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Jasa Pembuatan Lagu Profesional | FMG Universe",
  description:
    "Bikin lagu original dari ide, lirik, melodi, atau voice note hingga aransemen, produksi, vocal directing, mixing, dan mastering.",

  alternates: {
    canonical: "/id/jasa-pembuatan-lagu",
    languages: {
      "id-ID": "/id/jasa-pembuatan-lagu",
      "en-US": "/song-creation-service",
      "x-default": "/song-creation-service",
    },
  },

  openGraph: {
    title: "Jasa Pembuatan Lagu Profesional",
    description:
      "Wujudkan ide, lirik, atau melodi menjadi lagu original dengan proses pengerjaan, hak penggunaan, dan hasil akhir yang dibicarakan secara jelas sejak awal.",
    url: "/id/jasa-pembuatan-lagu",
    locale: "id_ID",
    type: "website",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/jasa-pembuatan-lagu"
      eyebrow="Jasa pembuatan lagu original"
      title="Jasa Pembuatan Lagu dari Ide Awal hingga Siap Dirilis"
      intro="Punya cerita, lirik, melodi, voice note, atau membutuhkan lagu khusus untuk brand? FMG akan membantumu mengembangkan materi tersebut menjadi lagu yang utuh melalui proses komposisi, aransemen, produksi, vocal directing, editing, mixing, dan mastering."
      serviceName="Jasa pembuatan lagu profesional"
      benefits={[
        "Pengembangan konsep dan arah lagu",
        "Komposisi dan aransemen musik",
        "Produksi musik dari awal hingga akhir",
        "Vocal directing dan editing",
        "Mixing dan mastering",
        "Kesepakatan hak dan file akhir yang jelas",
      ]}
      sections={[
        {
          title: "Setiap lagu dibuat sesuai tujuanmu",
          paragraphs: [
            "Single artis, soundtrack, jingle, lagu kampanye, mars, hymne, dan lagu personal tentu membutuhkan pendekatan yang berbeda. Karena itu, kami akan mempelajari tujuan, calon pendengar, pesan, referensi, dan rencana penggunaan lagumu sebelum menentukan arah musiknya.",
            "Kamu bisa memulai dari materi apa pun yang sudah tersedia. Jika baru memiliki ide, kita dapat mengembangkannya bersama dari konsep awal. Jika lirik atau melodinya sudah ada, FMG akan membantu menyempurnakannya tanpa menghilangkan identitas utama dari karyamu.",
          ],
        },
        {
          title: "Semua kesepakatan dibicarakan sejak awal",
          paragraphs: [
            "Sebelum produksi dimulai, kita akan membahas layanan yang dikerjakan, jadwal, revisi, pembayaran, pencantuman nama, hak atas karya, file produksi, penggunaan materi dari pihak lain, dan file akhir yang akan kamu terima. Menggunakan jasa FMG tidak berarti lagumu otomatis menjadi milik FMG.",
          ],
        },
        {
          title: "Satu tim untuk seluruh proses pembuatan lagu",
          paragraphs: [
            "Kamu tidak perlu mengatur banyak pihak secara terpisah. Mulai dari membahas ide, mengirim referensi, mendengarkan perkembangan lagu, memberikan masukan, hingga menerima hasil akhir dapat dilakukan dalam satu proses pengerjaan bersama FMG.",
          ],
        },
      ]}
      steps={[
        {
          title: "Ceritakan lagu yang ingin kamu buat",
          text: "Kirim tujuan lagu, calon pendengar, lirik atau melodi yang sudah tersedia, referensi musik, serta waktu penyelesaian yang kamu butuhkan.",
        },
        {
          title: "Tentukan arah pengerjaannya",
          text: "Kita akan menyepakati arah komposisi, aransemen, produksi, jumlah revisi, hak atas karya, jadwal pengerjaan, dan pembayarannya.",
        },
        {
          title: "Dengarkan dan berikan masukan",
          text: "Kamu dapat mendengarkan perkembangan lagu pada tahap yang telah disepakati, memberikan masukan, lalu menerima file akhir setelah pengerjaan selesai.",
        },
      ]}
      faqs={[
        {
          question: "Bisa membuat lagu kalau saya baru punya ide?",
          answer:
            "Bisa. Kamu tidak harus datang dengan materi yang sudah lengkap. Kita bisa mulai dari cerita, tema, suasana, atau gambaran lagu yang kamu inginkan, lalu mengembangkannya menjadi lirik, melodi, struktur, aransemen, dan produksi.",
        },
        {
          question: "Bisa menggunakan lirik atau melodi buatan saya?",
          answer:
            "Bisa. Lirik atau melodi yang kamu kirim akan menjadi fondasi utama dalam proses kreatifnya. Pencantuman nama dan ketentuan hak atas karya akan dibicarakan serta dikonfirmasi secara tertulis.",
        },
        {
          question: "Apakah seluruh prosesnya bisa dilakukan secara online?",
          answer:
            "Bisa. Mulai dari konsultasi, pengiriman materi, pembahasan referensi, review, revisi, hingga penyerahan file akhir dapat dilakukan secara online.",
        },
        {
          question: "Apakah sudah termasuk mixing dan mastering?",
          answer:
            "Tergantung paket dan kebutuhan lagu yang kamu pilih. Semua layanan yang termasuk, biaya, jumlah revisi, dan file akhir yang akan diterima akan dijelaskan sebelum produksi dimulai.",
        },
      ]}
      primaryCta="Mulai buat lagumu"
      secondaryCta="Lihat jasa aransemen"
      secondaryHref="/id/jasa-aransemen-lagu"
      related={[
        {
          href: "/id/jasa-aransemen-lagu",
          label: "Jasa aransemen lagu",
        },
        {
          href: "/id/cara-bikin-lagu",
          label: "Cara bikin lagu",
        },
        {
          href: "/portfolio",
          label: "Portofolio produksi",
        },
        {
          href: "/song-creation-service",
          label: "English version",
        },
      ]}
    />
  );
}