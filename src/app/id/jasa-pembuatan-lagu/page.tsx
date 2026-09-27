import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: { absolute: "Jasa Pembuatan Lagu dari Ide & Lirik | Flemmo Music" },
  description:
    "Punya cerita, lirik, atau potongan melodi? Ceritakan lagumu kepada Flemmo Music. Kami bantu menyusun lirik, melodi, dan bentuk lagunya dari awal.",
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
      "Mulai dari cerita, lirik, atau potongan melodi. Kami bantu membentuknya menjadi lagu yang bisa kamu kembangkan lebih lanjut.",
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
      eyebrow="Jasa pembuatan lagu"
      title="Jasa Pembuatan Lagu dari Cerita, Lirik, atau Melodi"
      intro="Mungkin kamu baru punya cerita, beberapa baris lirik, atau melodi yang direkam di ponsel. Kirim saja yang ada. Kami bantu mencari bentuk lagunya, lalu membicarakan apakah kamu juga membutuhkan aransemen dan produksi."
      serviceName="Jasa pembuatan lagu"
      benefits={[
        "Arah lagu yang sesuai dengan ceritamu",
        "Pengembangan lirik dan melodi sesuai kebutuhan",
        "Harmoni dan struktur lagu yang lebih jelas",
        "Ruang untuk mendengar dan memberi masukan",
        "Rencana tahap aransemen dan produksi bila diperlukan",
        "Kesepakatan tertulis soal revisi, hak, dan file akhir",
      ]}
      sections={[
        {
          title: "Kita mulai dari materi yang kamu punya",
          paragraphs: [
            "Belum punya lagu utuh? Kita bisa mulai dari tema, lirik, atau melodi pendek. Kalau lagu dan strukturnya sudah terbentuk, mungkin yang kamu butuhkan justru aransemen, bukan menulis lagu dari awal.",
            "Setelah mendengar materimu, kami jelaskan bagian mana yang akan dikerjakan dan hasil apa yang akan kamu terima. Aransemen, rekaman, mixing, dan mastering bisa dibicarakan bila diperlukan. Semuanya perlu disepakati lebih dulu, termasuk jumlah revisi dan waktu pengerjaan.",
          ],
          links: [
            { href: "/id/jasa-aransemen-lagu", label: "Lagunya sudah ada? Lihat jasa aransemen." },
            { href: "/id/jasa-produksi-musik", label: "Butuh bantuan merekam dan memproduksinya? Lihat jasa produksi musik." },
          ],
        },
        {
          title: "Lagu ini dibuat untuk siapa?",
          paragraphs: [
            "Lagu untuk dirilis sendiri tentu berbeda dari jingle merek atau lagu pernikahan. Ceritakan siapa yang akan mendengarnya, suasana yang ingin kamu bangun, dan bagian mana dari referensimu yang kamu suka. Dari situ kita bisa mencari arah musik yang pas.",
            "Kalau kamu sudah menulis lirik atau melodi, materi itu menjadi titik berangkatnya. Kami akan membahas apa yang perlu dipertahankan dan apa yang masih bisa dikembangkan, supaya lagu akhirnya tetap terasa milikmu.",
          ],
        },
        {
          title: "Soal hak lagu, kita bicarakan di awal",
          paragraphs: [
            "Sebelum mulai, kita sepakati siapa yang mengerjakan apa, siapa yang dicantumkan sebagai pencipta atau kontributor, dan bagaimana lagu ini boleh digunakan. Biaya, jadwal, revisi, serta file yang kamu terima juga dicatat. Memakai jasa kami tidak otomatis memindahkan hak atas lagumu ke FMG.",
          ],
        },
        {
          title: "Kamu ikut mendengar prosesnya",
          paragraphs: [
            "Pengerjaan lagu bukan proses sekali kirim lalu tiba-tiba jadi. Pada tahap yang disepakati, kamu bisa mendengar perkembangannya dan memberi masukan. Kami ingin tahu bagian yang sudah terasa tepat dan bagian yang masih perlu dicari bersama.",
          ],
        },
      ]}
      steps={[
        {
          title: "Ceritakan idenya",
          text: "Kirim lirik, rekaman melodi, referensi, atau cukup cerita tentang lagu yang ingin kamu buat. Sebutkan juga kalau ada tenggat waktu.",
        },
        {
          title: "Sepakati pekerjaannya",
          text: "Kami bahas arah lagu, tahap yang diperlukan, biaya, jadwal, revisi, serta hak atas karya sebelum mulai.",
        },
        {
          title: "Dengar dan beri masukan",
          text: "Kamu mendengar hasil pada tahap yang disepakati, memberi masukan, lalu menerima file akhir sesuai kesepakatan.",
        },
      ]}
      faqs={[
        {
          question: "Kalau baru punya ide, bisa mulai?",
          answer:
            "Bisa. Ceritakan tema, suasana, atau pesan yang ingin kamu sampaikan. Kalau ada rekaman suara atau potongan lirik, kirim juga. Dari sana kita tentukan bagian lagu yang perlu dibuat.",
        },
        {
          question: "Boleh memakai lirik atau melodi buatan saya?",
          answer:
            "Tentu. Kami akan memakai materi itu sebagai titik awal dan membahas bagian mana yang ingin kamu pertahankan. Pencantuman nama dan hak atas karya disepakati secara tertulis.",
        },
        {
          question: "Bisakah prosesnya dilakukan secara online?",
          answer:
            "Bisa. Kamu dapat mengirim materi, mendengar perkembangan lagu, memberi masukan, dan menerima file akhir secara online.",
        },
        {
          question: "Apakah mixing dan mastering sudah termasuk?",
          answer:
            "Tergantung pekerjaan yang kita sepakati. Kami akan menjelaskan apakah lagu ini perlu sampai tahap mixing dan mastering, berapa biayanya, dan file apa yang kamu terima sebelum mulai.",
        },
      ]}
      primaryCta="Ceritakan Ide Lagumu"
      primaryHref="/services/inquiry"
      secondaryCta="Lihat jasa aransemen"
      secondaryHref="/id/jasa-aransemen-lagu"
      related={[
        { href: "/id/jasa-aransemen-lagu", label: "Jasa aransemen lagu" },
        { href: "/id/cara-bikin-lagu", label: "Cara bikin lagu" },
        { href: "/portfolio", label: "Dengarkan karya kami" },
        { href: "/song-creation-service", label: "English version" },
      ]}
    />
  );
}
