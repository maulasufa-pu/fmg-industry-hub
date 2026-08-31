import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Biaya Pembuatan Lagu dan Faktor Harganya",
  description:
    "Pelajari hal yang memengaruhi biaya pembuatan lagu, mulai dari kondisi materi, aransemen, musisi, vokal, revisi, mixing, mastering, hingga hak penggunaan.",
  alternates: { canonical: "/id/biaya-pembuatan-lagu" },
  openGraph: {
    title: "Berapa Biaya Pembuatan Lagu?",
    description:
      "Pahami komponen biaya pembuatan lagu agar kamu dapat memilih layanan berdasarkan kebutuhan, bukan hanya angka paling murah.",
    url: "/id/biaya-pembuatan-lagu",
    locale: "id_ID",
    type: "article",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/biaya-pembuatan-lagu"
      eyebrow="Panduan biaya produksi lagu"
      title="Berapa Biaya Pembuatan Lagu dan Apa Saja yang Kamu Bayar?"
      intro="Harga pembuatan lagu tidak hanya ditentukan oleh durasinya. Lagu tiga menit yang dibuat dari ide awal bisa membutuhkan pekerjaan lebih banyak daripada lagu lima menit yang demo, aransemen, dan rekamannya sudah siap. Karena itu, bandingkan isi layanan sebelum membandingkan angka."
      benefits={[
        "Memahami komponen biaya",
        "Membedakan layanan dasar dan lengkap",
        "Menyiapkan materi agar lebih efisien",
        "Menghindari biaya tambahan yang tidak jelas",
        "Menentukan hasil akhir yang dibutuhkan",
        "Memilih layanan sesuai tujuan lagu",
      ]}
      sections={[
        {
          title: "Kondisi awal lagu sangat memengaruhi biaya",
          paragraphs: [
            "Jika kamu baru memiliki cerita atau beberapa baris lirik, prosesnya mungkin mencakup penulisan, komposisi, struktur, aransemen, dan produksi. Jika demo sudah lengkap, pekerjaan dapat lebih berfokus pada penyempurnaan aransemen, recording, editing, mixing, atau mastering.",
            "Sampaikan dengan jujur materi yang sudah ada dan bagian yang masih membutuhkan bantuan. Informasi ini membuat penawaran lebih tepat dan mengurangi perubahan besar ketika produksi sudah berjalan.",
          ],
        },
        {
          title: "Instrumen dan kebutuhan rekaman ikut menentukan",
          paragraphs: [
            "Produksi dengan virtual instruments memiliki kebutuhan berbeda dari rekaman musisi sesi, studio, alat khusus, penyanyi tambahan, paduan suara, atau ensemble. Jumlah pemain bukan satu-satunya faktor karena tingkat kesulitan aransemen dan persiapan notasi juga dapat memengaruhi pekerjaan.",
            "Tanyakan apakah biaya musisi, studio, vocal directing, editing, dan penyewaan alat sudah termasuk atau akan dihitung terpisah.",
          ],
        },
        {
          title: "Revisi, file akhir, dan hak penggunaan perlu jelas",
          paragraphs: [
            "Harga yang terlihat murah bisa berubah jika jumlah revisi tidak dibatasi atau file yang dibutuhkan ternyata belum termasuk. Pastikan kamu mengetahui tahapan review, jumlah revisi, format master, versi instrumental, stems, dan file sesi yang akan diterima.",
            "Untuk jingle, soundtrack, atau lagu komersial, media, wilayah, masa penggunaan, dan eksklusivitas juga perlu dibicarakan. Hak penggunaan bukan detail kecil yang sebaiknya diputuskan setelah lagu selesai.",
          ],
        },
        {
          title: "Pilih berdasarkan tujuan, bukan harga terendah",
          paragraphs: [
            "Lagu demo untuk presentasi, single resmi, hadiah personal, jingle iklan, dan soundtrack memiliki kebutuhan yang berbeda. Penawaran yang baik menjelaskan hubungan antara biaya, pekerjaan yang dilakukan, jadwal, dan hasil yang akan kamu terima.",
          ],
        },
      ]}
      steps={[
        {
          title: "Tentukan tujuan lagunya",
          text: "Jelaskan apakah lagu akan digunakan sebagai demo, dirilis, dipakai untuk brand, atau menjadi bagian dari karya visual.",
        },
        {
          title: "Catat materi yang sudah ada",
          text: "Siapkan lirik, melodi, chord, demo, multitrack, referensi, dan catatan agar kebutuhanmu dapat dinilai dengan tepat.",
        },
        {
          title: "Periksa isi penawaran",
          text: "Bandingkan layanan, jadwal, revisi, hak, dan file akhir yang diterima sebelum menyetujui harga.",
        },
      ]}
      faqs={[
        {
          question: "Kenapa harga pembuatan lagu bisa sangat berbeda?",
          answer:
            "Setiap penyedia dapat menawarkan pekerjaan, pengalaman, jumlah revisi, musisi, fasilitas, hak penggunaan, dan jenis file akhir yang berbeda. Harga baru dapat dibandingkan secara adil jika isi layanannya juga dibandingkan.",
        },
        {
          question: "Apakah harga dihitung berdasarkan durasi lagu?",
          answer:
            "Durasi dapat menjadi salah satu pertimbangan, tetapi bukan satu-satunya. Kompleksitas aransemen, kondisi materi awal, jumlah instrumen, recording, editing, revisi, dan penggunaan akhirnya sering lebih menentukan.",
        },
        {
          question: "Apa yang perlu ditanyakan sebelum membayar?",
          answer:
            "Tanyakan layanan yang termasuk, jadwal, tahapan review, jumlah revisi, biaya tambahan, hak atas karya, penggunaan materi pihak lain, serta format file yang akan diterima.",
        },
        {
          question: "Bagaimana cara mendapatkan perkiraan biaya yang tepat?",
          answer:
            "Kirim materi yang sudah kamu punya dan jelaskan hasil akhir yang diinginkan. Semakin jelas tujuan, referensi, tenggat, serta kebutuhan file dan hak penggunaan, semakin tepat perkiraan yang dapat diberikan.",
        },
      ]}
      primaryCta="Minta penilaian kebutuhan lagu"
      secondaryCta="Jasa pembuatan lagu"
      secondaryHref="/id/jasa-pembuatan-lagu"
      related={[
        { href: "/id/jasa-pembuatan-lagu", label: "Jasa pembuatan lagu" },
        { href: "/id/jasa-aransemen-lagu", label: "Jasa aransemen lagu" },
        { href: "/id/jasa-produksi-musik", label: "Jasa produksi musik" },
        { href: "/id/cara-memilih-jasa-aransemen-lagu", label: "Cara memilih arranger" },
      ]}
    />
  );
}
