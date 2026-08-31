import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Perbedaan Komposer, Arranger, dan Produser Musik",
  description:
    "Pahami perbedaan tugas komposer, arranger, dan produser musik agar kamu tahu bantuan yang dibutuhkan untuk menulis, mengaransemen, atau memproduksi lagu.",
  alternates: {
    canonical: "/id/perbedaan-komposer-arranger-produser-musik",
  },
  openGraph: {
    title: "Komposer, Arranger, dan Produser Musik: Apa Bedanya?",
    description:
      "Kenali peran setiap orang dalam proses pembuatan lagu supaya kamu tidak salah memilih layanan.",
    url: "/id/perbedaan-komposer-arranger-produser-musik",
    locale: "id_ID",
    type: "article",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/perbedaan-komposer-arranger-produser-musik"
      eyebrow="Mengenal peran dalam produksi lagu"
      title="Apa Bedanya Komposer, Arranger, dan Produser Musik?"
      intro="Ketiganya sama-sama terlibat dalam pembuatan musik, tetapi tidak selalu mengerjakan hal yang sama. Memahami perannya akan membantu kamu menjelaskan kebutuhan, menyusun anggaran, dan memilih orang yang tepat untuk menyelesaikan lagumu."
      benefits={[
        "Memahami tugas setiap peran",
        "Menentukan bantuan yang dibutuhkan",
        "Menyusun pembagian kerja yang jelas",
        "Menghindari harapan yang berbeda",
        "Membicarakan kredit sejak awal",
        "Menjaga proses produksi lebih terarah",
      ]}
      sections={[
        {
          title: "Komposer membentuk dasar musikal lagu",
          paragraphs: [
            "Komposer umumnya membuat unsur utama seperti melodi, harmoni, dan bentuk dasar komposisi. Dalam lagu populer, peran ini dapat berdekatan dengan songwriter, terutama jika musik dan lirik dikembangkan bersama.",
            "Jika kamu baru memiliki lirik, cerita, atau potongan melodi, komposer dapat membantu membentuknya menjadi lagu yang memiliki arah nada, chord, dan struktur dasar.",
          ],
        },
        {
          title: "Arranger menentukan bagaimana lagu disajikan",
          paragraphs: [
            "Arranger atau penata musik mengembangkan komposisi menjadi susunan yang lebih lengkap. Ia menentukan pilihan instrumen, pola permainan, pembagian bagian, dinamika, transisi, intro, interlude, hingga cara chorus berkembang dari verse.",
            "Komposisi yang sama dapat terdengar sebagai pop ballad, jazz, rock, orkestra, atau musik elektronik melalui keputusan aransemen yang berbeda.",
          ],
        },
        {
          title: "Produser menjaga arah hasil rekaman secara keseluruhan",
          paragraphs: [
            "Produser melihat gambaran yang lebih luas, mulai dari identitas artis, tujuan lagu, kualitas performa, pilihan suara, proses recording, hingga keputusan yang membawa proyek menuju hasil akhir. Dalam produksi modern, produser juga sering ikut membuat beat, programming, sound design, dan aransemen.",
            "Batas antarperan tidak selalu kaku. Satu orang bisa menjadi komposer, arranger, sekaligus produser, tetapi pekerjaan dan kreditnya tetap sebaiknya dijelaskan sejak awal.",
          ],
        },
        {
          title: "Pilih berdasarkan kondisi lagumu sekarang",
          paragraphs: [
            "Jika belum ada melodi, kamu mungkin membutuhkan komposer. Jika lagu sudah ada tetapi instrumennya belum terbentuk, arranger dapat membantu. Jika kamu membutuhkan seseorang untuk menjaga seluruh arah rekaman sampai selesai, peran produser menjadi penting.",
          ],
        },
      ]}
      steps={[
        {
          title: "Periksa materi yang sudah ada",
          text: "Catat apakah kamu sudah memiliki lirik, melodi, chord, struktur, demo, aransemen, atau multitrack.",
        },
        {
          title: "Tentukan bagian yang terhambat",
          text: "Jelaskan apakah masalahnya ada pada penulisan lagu, susunan musik, karakter suara, recording, atau penyelesaian produksi.",
        },
        {
          title: "Sepakati peran dan kredit",
          text: "Pastikan pekerjaan, keputusan kreatif, pencantuman nama, hak, jadwal, dan hasil akhirnya tertulis dengan jelas.",
        },
      ]}
      faqs={[
        {
          question: "Apakah produser musik sama dengan pembuat beat?",
          answer:
            "Tidak selalu. Pembuat beat berfokus membuat dasar instrumental atau beat, sedangkan produser dapat menangani arah produksi yang lebih luas. Namun, dalam praktiknya satu orang sering menjalankan kedua peran tersebut.",
        },
        {
          question: "Kalau sudah punya melodi dan chord, saya butuh siapa?",
          answer:
            "Jika kamu ingin mengembangkan susunan instrumen dan dinamika, arranger dapat membantu. Jika membutuhkan proses lengkap sampai rekaman dan hasil akhir, kamu mungkin memerlukan produser atau layanan produksi musik.",
        },
        {
          question: "Apakah arranger mendapatkan kredit?",
          answer:
            "Pencantuman kredit sebaiknya dibicarakan secara tertulis sesuai kontribusi dan kesepakatan proyek. Jangan menunggu lagu selesai untuk membahasnya.",
        },
        {
          question: "Bisakah satu orang mengerjakan semuanya?",
          answer:
            "Bisa, terutama dalam produksi musik modern. Yang terpenting adalah memastikan orang tersebut memang memiliki kemampuan yang sesuai dan setiap bagian pekerjaannya tercantum dengan jelas.",
        },
      ]}
      primaryCta="Bantu tentukan kebutuhan laguku"
      secondaryCta="Jasa produksi musik"
      secondaryHref="/id/jasa-produksi-musik"
      related={[
        { href: "/id/jasa-pembuatan-lagu", label: "Jasa pembuatan lagu" },
        { href: "/id/jasa-aransemen-lagu", label: "Jasa aransemen lagu" },
        { href: "/id/jasa-produksi-musik", label: "Jasa produksi musik" },
        { href: "/id/cara-memilih-jasa-aransemen-lagu", label: "Cara memilih arranger" },
      ]}
    />
  );
}
