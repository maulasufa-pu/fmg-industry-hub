import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: { absolute: "Jasa Produksi Musik Profesional | Flemmo Music" },
  description: "Kembangkan demo menjadi produksi musik utuh: aransemen, vocal production, editing, mixing dan mastering sesuai scope. Diskusikan proyekmu dengan Flemmo Music.",
  alternates: { canonical: "/id/jasa-produksi-musik" },
  openGraph: {
    title: "Jasa Produksi Musik Profesional",
    description:
      "Kembangkan demo atau rancangan lagumu menjadi produksi musik yang utuh dan sesuai dengan karakter artis.",
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
      title="Jasa Produksi Musik untuk Demo hingga Hasil Akhir"
      intro="Sudah punya lagu atau demo, tetapi hasilnya belum terdengar seperti yang kamu bayangkan? FMG membantu mengembangkan materi tersebut menjadi produksi yang utuh, berkarakter, dan tetap terasa sebagai karyamu."
      serviceName="Jasa produksi musik profesional"
      benefits={[
        "Arah produksi yang sesuai dengan identitas artis",
        "Aransemen dan pemilihan instrumen",
        "Sound design dan programming",
        "Editing vokal dan instrumen",
        "Mixing dan mastering",
        "Proses review yang jelas",
      ]}
      sections={[
        { title: "Dari aransemen hingga final delivery", paragraphs: ["Produksi menyatukan arah suara dan kebutuhan teknis: aransemen, pemilihan sound, vocal production atau pengarahan vokal, editing, mixing, dan mastering sesuai paket. Cocok untuk artis, band, atau songwriter yang ingin membawa demo ke hasil rekaman yang lebih utuh.", "Jika proyek membutuhkan rekaman studio atau musisi sesi, ketersediaan, lokasi, jadwal, dan biaya tambahannya perlu dikonfirmasi terlebih dahulu. Jangan menganggap semua sesi recording sudah termasuk. Rekaman vokal yang kamu miliki dapat diperiksa untuk menentukan apakah cukup untuk produksi atau memerlukan pengambilan ulang.", "Sebelum mulai, sepakati tahapan review, revisi, jadwal, dan final delivery. Format file, instrumental, stems, file sesi, credit, dan ownership mengikuti dokumen proyek. Beri tahu rencana rilis atau penggunaan agar spesifikasi akhir dapat ditentukan dengan tepat."], links: [{"href": "/id/jasa-aransemen-lagu", "label": "Fokus pada pengembangan instrumen dan dinamika? Lihat layanan aransemen."}, {"href": "/id/jasa-pembuatan-lagu", "label": "Belum memiliki komposisi lengkap? Mulai dari pembuatan lagu."}] },
        {
          title: "Produksi musik bukan sekadar menambah instrumen",
          paragraphs: [
            "Produser membantu menentukan bagaimana sebuah lagu sebaiknya terdengar dan dirasakan. Keputusan tentang tempo, groove, pilihan instrumen, tekstur, dinamika, serta cara vokal ditempatkan perlu mendukung pesan utama lagunya.",
            "Karena itu, kami memulai dengan memahami siapa kamu sebagai artis, siapa yang ingin kamu ajak bicara, dan pengalaman seperti apa yang ingin kamu berikan kepada pendengar. Referensi tetap penting, tetapi hasil akhirnya tidak harus menjadi tiruan dari lagu lain.",
          ],
        },
        {
          title: "Bisa dimulai dari demo sederhana",
          paragraphs: [
            "Kamu dapat mengirim demo gitar dan vokal, piano dan vokal, rekaman dari ponsel, MIDI, stems, atau sesi produksi yang sudah berjalan. Materi tersebut akan kami pelajari untuk menentukan bagian yang perlu dipertahankan, dikembangkan, direkam ulang, atau disederhanakan.",
            "Jika struktur lagu belum mantap, kita dapat membahas bentuk verse, pre-chorus, chorus, bridge, intro, dan outro sebelum masuk lebih jauh ke tahap produksi.",
          ],
        },
        {
          title: "Setiap keputusan dibicarakan bersama",
          paragraphs: [
            "Sebelum pengerjaan dimulai, kamu akan mengetahui layanan yang termasuk, jadwal review, jumlah revisi, biaya, dan file akhir yang akan diterima. Dengan begitu, kamu tidak perlu menebak-nebak perkembangan proyek atau arah pengerjaannya.",
          ],
        },
      ]}
      steps={[
        {
          title: "Kirim lagu dan referensimu",
          text: "Bagikan demo, lirik, catatan, referensi, dan ceritakan hasil akhir yang ingin kamu capai.",
        },
        {
          title: "Tentukan arah produksi",
          text: "Kita menyepakati karakter musik, susunan instrumen, tahapan pengerjaan, revisi, dan jadwalnya.",
        },
        {
          title: "Dengarkan perkembangannya",
          text: "Berikan masukan pada tahap review, lalu terima hasil akhir sesuai kesepakatan proyek.",
        },
      ]}
      faqs={[
        {
          question: "Apa bedanya produksi musik dan aransemen?",
          answer:
            "Aransemen berfokus pada susunan bagian, instrumen, dinamika, dan perjalanan musik. Produksi mencakup proses yang lebih luas untuk mewujudkan aransemen tersebut menjadi rekaman, termasuk pemilihan suara, recording, editing, mixing, dan tahap akhir lainnya sesuai kebutuhan.",
        },
        {
          question: "Apakah demo dari ponsel bisa digunakan?",
          answer:
            "Bisa. Demo ponsel cukup untuk menunjukkan melodi, chord, lirik, tempo, dan suasana dasar. Kualitas rekamannya tidak harus sempurna selama idenya masih bisa dipahami.",
        },
        {
          question: "Apakah saya boleh memberikan referensi lagu?",
          answer:
            "Boleh, bahkan sangat membantu. Jelaskan bagian yang kamu sukai dari setiap referensi agar kami memahami apakah kamu tertarik pada energinya, instrumennya, karakter vokalnya, atau warna produksinya.",
        },
        {
          question: "Apakah mixing dan mastering termasuk?",
          answer:
            "Keduanya dapat dimasukkan sesuai paket produksi yang dipilih. Rincian layanan dan file akhir akan dijelaskan sebelum pengerjaan dimulai.",
        },
      ]}
      primaryCta="Mulai Project Musik"
      primaryHref="/services/inquiry"
      secondaryCta="Jasa pembuatan lagu"
      secondaryHref="/id/jasa-pembuatan-lagu"
      related={[
        { href: "/id/jasa-pembuatan-lagu", label: "Jasa pembuatan lagu" },
        { href: "/id/jasa-aransemen-lagu", label: "Jasa aransemen lagu" },
        { href: "/id/jasa-mixing-mastering-lagu", label: "Jasa mixing dan mastering" },
        { href: "/portfolio", label: "Dengarkan portofolio" },
      ]}
    />
  );
}
