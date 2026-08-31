import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Perbedaan Mixing dan Mastering pada Lagu",
  description:
    "Pelajari perbedaan mixing dan mastering, urutan pengerjaan, file yang dibutuhkan, serta alasan keduanya memiliki fungsi berbeda dalam produksi lagu.",
  alternates: { canonical: "/id/perbedaan-mixing-dan-mastering" },
  openGraph: {
    title: "Mixing dan Mastering: Apa Bedanya?",
    description:
      "Pahami fungsi mixing dan mastering agar kamu tahu kapan sebuah lagu benar-benar siap masuk ke tahap akhir.",
    url: "/id/perbedaan-mixing-dan-mastering",
    locale: "id_ID",
    type: "article",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/perbedaan-mixing-dan-mastering"
      eyebrow="Panduan penyelesaian produksi lagu"
      title="Perbedaan Mixing dan Mastering yang Perlu Kamu Ketahui"
      intro="Mixing dan mastering sering disebut dalam satu kalimat sehingga terdengar seperti proses yang sama. Padahal, keduanya bekerja pada materi yang berbeda dan menyelesaikan masalah yang berbeda pula."
      benefits={[
        "Memahami fungsi mixing",
        "Memahami fungsi mastering",
        "Mengetahui urutan yang benar",
        "Menyiapkan file yang sesuai",
        "Memberikan masukan dengan lebih jelas",
        "Menghindari harapan yang keliru",
      ]}
      sections={[
        {
          title: "Mixing mengolah setiap elemen di dalam lagu",
          paragraphs: [
            "Pada tahap mixing, engineer menerima multitrack atau stems seperti vokal, drum, bass, gitar, keyboard, dan instrumen lainnya. Setiap elemen ditata agar memiliki keseimbangan, karakter, posisi, dinamika, dan ruang yang sesuai.",
            "Masalah seperti vokal tertutup instrumen, bass yang terlalu memenuhi ruang, snare yang menusuk, atau reverb yang mengaburkan lirik ditangani pada tahap ini. Hasilnya adalah satu file stereo mix yang sudah disetujui.",
          ],
        },
        {
          title: "Mastering bekerja pada hasil mix yang sudah selesai",
          paragraphs: [
            "Mastering biasanya dimulai setelah aransemen, rekaman, editing, dan mixing tidak lagi berubah. Engineer mengevaluasi tonal balance, dinamika, level, transien, stereo image, serta konsistensi hasil ketika diputar di berbagai perangkat.",
            "Jika sebuah rilisan memiliki beberapa lagu, mastering juga membantu menjaga perpindahan antartrack agar tidak terasa sangat berbeda dalam level dan karakter keseluruhannya.",
          ],
        },
        {
          title: "Mastering tidak dapat memperbaiki semua masalah mixing",
          paragraphs: [
            "Karena mastering bekerja pada satu hasil mix, ruang untuk mengubah elemen tertentu lebih terbatas. Jika vokal terlalu kecil tetapi snare sudah sangat keras, menaikkan area frekuensi tertentu dapat ikut memengaruhi keduanya.",
            "Itulah sebabnya revisi mixing sebaiknya dilakukan sebelum mastering. Hasil yang baik datang dari keputusan yang benar pada setiap tahap, bukan dari berharap satu proses terakhir akan memperbaiki semuanya.",
          ],
        },
        {
          title: "Urutannya tetap penting",
          paragraphs: [
            "Alur yang paling aman adalah menyelesaikan aransemen, recording, editing, dan mixing terlebih dahulu. Setelah hasil mix disetujui, barulah file dikirim untuk mastering dan disiapkan sesuai kebutuhan rilis.",
          ],
        },
      ]}
      steps={[
        {
          title: "Selesaikan produksinya",
          text: "Pastikan struktur, instrumen, rekaman, dan editing tidak lagi membutuhkan perubahan besar.",
        },
        {
          title: "Setujui hasil mixing",
          text: "Periksa keseimbangan, vokal, dinamika, efek, transisi, serta detail lagu sebelum mencetak mix final.",
        },
        {
          title: "Masuk ke mastering",
          text: "Kirim mix final tanpa clipping beserta catatan dan referensi agar hasil akhirnya dapat disiapkan untuk rilis.",
        },
      ]}
      faqs={[
        {
          question: "Apakah lagu bisa langsung di-master tanpa mixing?",
          answer:
            "Jika yang tersedia masih berupa multitrack yang belum ditata, lagu perlu melalui mixing terlebih dahulu. Mastering membutuhkan hasil mix stereo yang sudah selesai dan disetujui.",
        },
        {
          question: "Apakah mastering membuat lagu otomatis terdengar lebih keras?",
          answer:
            "Mastering dapat mengatur level akhir, tetapi tujuan utamanya bukan sekadar membuat lagu sekeras mungkin. Kejelasan, dinamika, tonal balance, karakter genre, dan kemampuan lagu diterjemahkan ke berbagai perangkat juga perlu dijaga.",
        },
        {
          question: "Apakah mixing dan mastering sebaiknya dikerjakan orang berbeda?",
          answer:
            "Tidak ada aturan mutlak. Engineer berbeda dapat memberi sudut pandang baru saat mastering, tetapi orang yang sama juga bisa mengerjakan keduanya selama memiliki proses evaluasi yang baik dan hasilnya sesuai kebutuhan.",
        },
        {
          question: "Kapan saya tahu mixing sudah selesai?",
          answer:
            "Mixing dapat dianggap selesai ketika keseimbangan, karakter, efek, dinamika, dan detail lagunya sudah disetujui serta tidak ada lagi perubahan aransemen atau editing yang dibutuhkan.",
        },
      ]}
      primaryCta="Selesaikan mixing dan mastering"
      secondaryCta="Jasa produksi musik"
      secondaryHref="/id/jasa-produksi-musik"
      related={[
        { href: "/id/jasa-mixing-mastering-lagu", label: "Jasa mixing dan mastering" },
        { href: "/id/jasa-editing-vokal", label: "Jasa editing vokal" },
        { href: "/id/jasa-produksi-musik", label: "Jasa produksi musik" },
        { href: "/id/cara-bikin-lagu", label: "Cara bikin lagu" },
      ]}
    />
  );
}
