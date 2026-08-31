import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Jasa Pembuatan Jingle untuk Brand | FMG Universe",
  description:
    "Jasa pembuatan jingle original untuk brand, produk, kampanye, iklan, dan konten dengan konsep, lirik, melodi, produksi, serta hak penggunaan yang jelas.",
  alternates: { canonical: "/id/jasa-pembuatan-jingle" },
  openGraph: {
    title: "Jasa Pembuatan Jingle untuk Brand",
    description:
      "Ubah pesan brand menjadi jingle original yang mudah dikenali dan sesuai dengan karakter audiensmu.",
    url: "/id/jasa-pembuatan-jingle",
    locale: "id_ID",
    type: "website",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/jasa-pembuatan-jingle"
      eyebrow="Jasa pembuatan jingle original"
      title="Buat Jingle yang Membawa Karakter Brand dalam Sekali Dengar"
      intro="Jingle yang efektif bukan hanya enak didengar. Melodi, lirik, durasi, dan produksinya perlu membantu orang mengenali brand serta mengingat pesan yang ingin disampaikan. FMG mengembangkan semuanya dari satu brief yang jelas."
      serviceName="Jasa pembuatan jingle profesional"
      benefits={[
        "Konsep yang sesuai dengan identitas brand",
        "Lirik singkat dan mudah dipahami",
        "Melodi original yang mudah diingat",
        "Pilihan durasi sesuai kebutuhan media",
        "Produksi, vokal, mixing, dan mastering",
        "Hak penggunaan yang disepakati sejak awal",
      ]}
      sections={[
        {
          title: "Dimulai dari pesan, bukan dari musik semata",
          paragraphs: [
            "Sebelum membuat melodi, kami perlu memahami siapa audiensmu, apa yang ditawarkan brand, dan satu pesan utama yang harus mereka ingat. Informasi ini menjadi dasar untuk menentukan gaya bahasa, tempo, genre, karakter vokal, dan suasana musik.",
            "Jingle untuk iklan digital tentu memiliki kebutuhan berbeda dari audio logo, pembuka acara, kampanye, atau materi yang akan diputar berulang kali di ruang publik.",
          ],
        },
        {
          title: "Durasi pendek tetap membutuhkan struktur",
          paragraphs: [
            "Dalam waktu yang terbatas, jingle perlu memperkenalkan ide, menyampaikan pesan, dan meninggalkan bagian yang mudah diingat. Karena itu, setiap kata dan nada harus memiliki fungsi yang jelas.",
            "Satu konsep utama dapat dikembangkan menjadi beberapa versi durasi, misalnya versi penuh, 30 detik, 15 detik, atau potongan audio logo, jika kebutuhan tersebut sudah disepakati dalam proyek.",
          ],
        },
        {
          title: "Hak penggunaan dibicarakan sebelum produksi",
          paragraphs: [
            "Media penggunaan, masa pemakaian, wilayah, versi, pencantuman nama, serta kebutuhan eksklusivitas dapat memengaruhi kesepakatan. Kami membicarakan hal tersebut sejak awal agar brand mengetahui dengan jelas apa yang dapat digunakan setelah proyek selesai.",
          ],
        },
      ]}
      steps={[
        {
          title: "Kirim brief brand",
          text: "Ceritakan produk, audiens, pesan utama, media penggunaan, durasi, referensi, dan target waktunya.",
        },
        {
          title: "Pilih arah kreatif",
          text: "Kita menyepakati konsep, gaya bahasa, karakter musik, kebutuhan vokal, versi, dan hak penggunaan.",
        },
        {
          title: "Produksi hingga final",
          text: "FMG mengembangkan jingle, menerima masukan pada tahap review, lalu menyiapkan file akhir yang disepakati.",
        },
      ]}
      faqs={[
        {
          question: "Berapa durasi jingle yang ideal?",
          answer:
            "Durasi terbaik bergantung pada media dan tujuan penggunaannya. Jingle iklan dapat membutuhkan versi 15 atau 30 detik, sedangkan lagu brand bisa lebih panjang. Brief akan membantu menentukan versi yang benar-benar diperlukan.",
        },
        {
          question: "Apakah FMG bisa membantu membuat lirik?",
          answer:
            "Bisa, sesuai cakupan proyek. Kami akan mengolah pesan utama, gaya komunikasi, nama produk, dan batasan kata dari brand menjadi lirik yang tetap alami saat dinyanyikan.",
        },
        {
          question: "Apakah bisa dibuatkan beberapa versi?",
          answer:
            "Bisa. Kebutuhan versi penuh, potongan pendek, instrumental, tanpa vokal utama, atau audio logo perlu ditentukan sebelum produksi agar jadwal dan biayanya jelas.",
        },
        {
          question: "Apakah jingle boleh digunakan untuk iklan?",
          answer:
            "Boleh jika penggunaan untuk iklan sudah termasuk dalam kesepakatan. Media, wilayah, masa penggunaan, dan bentuk pemakaian akan dicantumkan agar tidak menimbulkan perbedaan pemahaman.",
        },
      ]}
      primaryCta="Ceritakan kebutuhan jinglemu"
      secondaryCta="Jasa pembuatan lagu"
      secondaryHref="/id/jasa-pembuatan-lagu"
      related={[
        { href: "/id/jasa-pembuatan-lagu", label: "Jasa pembuatan lagu" },
        { href: "/id/jasa-produksi-musik", label: "Jasa produksi musik" },
        { href: "/id/jasa-pembuatan-soundtrack", label: "Jasa pembuatan soundtrack" },
        { href: "/portfolio", label: "Portofolio produksi" },
      ]}
    />
  );
}
