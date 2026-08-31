import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Cara Bikin Lagu dari Ide hingga Siap Dirilis",
  description:
    "Pelajari cara bikin lagu mulai dari menemukan ide, menulis lirik dan melodi, menyusun aransemen, merekam vokal, hingga mixing dan mastering.",

  alternates: {
    canonical: "/id/cara-bikin-lagu",
    languages: {
      "id-ID": "/id/cara-bikin-lagu",
      "en-US": "/learn/how-to-make-a-song",
      "x-default": "/learn/how-to-make-a-song",
    },
  },

  openGraph: {
    title: "Cara Bikin Lagu dari Awal hingga Selesai",
    description:
      "Panduan praktis untuk mengembangkan ide sederhana menjadi lagu yang utuh dan siap dirilis.",
    url: "/id/cara-bikin-lagu",
    locale: "id_ID",
    type: "article",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/cara-bikin-lagu"
      eyebrow="Panduan praktis membuat lagu"
      title="Cara Bikin Lagu: Dari Ide Pertama hingga Siap Dirilis"
      intro="Kamu tidak perlu menunggu punya alat mahal atau rekaman yang sempurna untuk mulai membuat lagu. Sebuah lagu bisa berawal dari satu kalimat, potongan melodi, beberapa chord, pola ritme, atau voice note sederhana. Hal yang paling penting adalah menangkap ide tersebut, lalu mengembangkannya sedikit demi sedikit sampai menjadi lagu yang utuh."
      benefits={[
        "Pesan dan emosi lagu yang jelas",
        "Lirik dan melodi yang saling mendukung",
        "Struktur dan aransemen yang kuat",
        "Produksi yang sesuai dengan karakter artis",
        "Performa vokal yang lebih terarah",
        "Hasil akhir yang siap dirilis",
      ]}
      sections={[
        {
          title: "1. Tentukan cerita dan perasaan lagunya",
          paragraphs: [
            "Mulailah dengan menulis satu kalimat sederhana tentang apa yang ingin kamu ceritakan atau rasakan melalui lagu tersebut. Kalimat ini akan membantumu menentukan lirik, melodi, tempo, harmoni, dan pilihan instrumen agar semuanya bergerak ke arah yang sama.",
            "Pilih dua atau tiga lagu referensi dan tentukan bagian yang kamu sukai dari masing-masing lagu. Satu lagu bisa menjadi referensi untuk energi, satu untuk cara membawakan vokal, dan satu lagi untuk karakter produksinya.",
          ],
        },
        {
          title: "2. Kembangkan lirik, melodi, dan chord",
          paragraphs: [
            "Mulailah dari bagian yang paling mudah muncul. Kamu bisa menulis lirik terlebih dahulu, mencari chord, atau menyenandungkan melodi. Rekam setiap ide yang muncul agar tidak terlupa, meskipun hasilnya masih berupa voice note sederhana.",
            "Verse biasanya digunakan untuk membawa cerita, pre-chorus membangun rasa menuju bagian utama, sedangkan chorus menyampaikan inti lagu yang paling mudah diingat. Pastikan melodinya tetap nyaman dinyanyikan dan sesuai dengan jangkauan suara penyanyinya. Pilih chord yang mendukung emosi lagu, bukan hanya karena terdengar rumit.",
          ],
        },
        {
          title: "3. Susun perjalanan musiknya",
          paragraphs: [
            "Aransemen menentukan bagaimana pendengar dibawa dari awal sampai akhir lagu. Di tahap ini, kamu mengatur kapan instrumen mulai masuk, kapan energi bertambah, kapan musik perlu memberi ruang, dan bagaimana perpindahan antarbagiannya terasa alami.",
            "Jangan mengeluarkan seluruh energi lagu sejak awal. Chorus akan terasa lebih kuat jika bagian sebelumnya memberi ruang untuk berkembang. Buat catatan sederhana berisi urutan bagian, perkiraan durasi, perubahan dinamika, instrumen utama, transisi, dan hal yang ingin ditonjolkan pada setiap bagian.",
          ],
        },
        {
          title: "4. Produksi, rekam, mixing, dan mastering",
          paragraphs: [
            "Produksi adalah tahap ketika rancangan lagumu mulai diwujudkan menjadi suara yang utuh. Pilih instrumen, tekstur, dan karakter suara yang benar-benar mendukung identitas lagu. Saat merekam vokal atau instrumen, utamakan penyampaian rasa, lalu lakukan editing secukupnya agar hasilnya tetap terdengar hidup dan manusiawi.",
            "Mixing digunakan untuk menata keseimbangan volume, karakter suara, kedalaman, dinamika, dan fokus setiap elemen. Setelah hasil mixing disetujui, mastering menyempurnakan hasil akhir agar lagu terdengar konsisten saat diputar di berbagai perangkat dan platform. Mastering tidak dapat menggantikan aransemen, rekaman, atau mixing yang belum selesai dengan baik.",
          ],
        },
      ]}
      steps={[
        {
          title: "Tangkap idenya",
          text: "Simpan setiap lirik, melodi, chord, ritme, atau voice note yang muncul. Jangan terlalu cepat menilai apakah idenya sudah bagus atau belum.",
        },
        {
          title: "Kembangkan menjadi lagu",
          text: "Pilih ide yang paling kuat, lalu bentuk menjadi lirik, melodi, struktur, aransemen, dan arah produksi yang jelas.",
        },
        {
          title: "Selesaikan dengan baik",
          text: "Rekam setiap bagian, dengarkan kembali, lakukan mixing dan mastering, lalu siapkan informasi kredit serta file akhir untuk dirilis.",
        },
      ]}
      faqs={[
        {
          question: "Apakah membuat lagu harus mengerti teori musik?",
          answer:
            "Tidak harus. Teori musik dapat membantu kamu mengambil keputusan dengan lebih cepat, tetapi kemampuan mendengar, memahami referensi, mencoba berbagai kemungkinan, dan menyampaikan ide juga sangat penting.",
        },
        {
          question: "Bagaimana kalau saya baru punya lirik?",
          answer:
            "Tidak masalah. Lirik tersebut bisa menjadi titik awal untuk mengembangkan melodi dan chord. Setelah arah lagunya terbentuk, proses dapat dilanjutkan ke aransemen dan produksi.",
        },
        {
          question: "Apakah voice note saja sudah cukup?",
          answer:
            "Cukup untuk memulai. Voice note dapat membantu menjelaskan melodi, ritme, cara pengucapan, atau suasana yang kamu bayangkan. Tambahkan sedikit cerita tentang genre dan lagu referensi agar arah pengembangannya lebih mudah dipahami.",
        },
        {
          question: "Kapan saya perlu menggunakan jasa arranger atau produser?",
          answer:
            "Bantuan arranger atau produser akan berguna ketika kamu sudah memiliki ide utama, tetapi masih kesulitan menyusun struktur, memilih instrumen, menentukan karakter suara, merekam, atau menyelesaikan lagunya hingga siap dirilis.",
        },
      ]}
      primaryCta="Bantu wujudkan lagu saya"
      secondaryCta="Lihat jasa aransemen"
      secondaryHref="/id/jasa-aransemen-lagu"
      related={[
        {
          href: "/id/jasa-pembuatan-lagu",
          label: "Jasa pembuatan lagu",
        },
        {
          href: "/id/jasa-aransemen-lagu",
          label: "Jasa aransemen lagu",
        },
        {
          href: "/portfolio",
          label: "Dengarkan portofolio",
        },
        {
          href: "/learn/how-to-make-a-song",
          label: "English version",
        },
      ]}
    />
  );
}