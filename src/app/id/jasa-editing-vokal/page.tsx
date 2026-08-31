import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Jasa Editing Vokal dan Tuning | FMG Universe",
  description:
    "Jasa editing vokal untuk comping, tuning, timing, pembersihan noise, dan penataan napas agar vokal lebih rapi tanpa kehilangan karakter penyanyinya.",
  alternates: { canonical: "/id/jasa-editing-vokal" },
  openGraph: {
    title: "Jasa Editing Vokal dan Tuning",
    description:
      "Rapikan rekaman vokal dengan tetap menjaga emosi, artikulasi, dan karakter asli penyanyinya.",
    url: "/id/jasa-editing-vokal",
    locale: "id_ID",
    type: "website",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/jasa-editing-vokal"
      eyebrow="Jasa vocal editing dan tuning"
      title="Vokal Lebih Rapi tanpa Kehilangan Rasa dan Karakternya"
      intro="Editing vokal yang baik seharusnya membantu pendengar terhubung dengan performa, bukan membuat suara terdengar kaku atau tidak alami. FMG merapikan pilihan take, nada, timing, napas, dan detail rekaman sesuai kebutuhan lagumu."
      serviceName="Jasa editing vokal profesional"
      benefits={[
        "Pemilihan take vokal terbaik",
        "Koreksi nada secara terukur",
        "Perapian timing dan phrasing",
        "Penataan napas dan bunyi mulut",
        "Pembersihan noise yang memungkinkan",
        "Karakter vokal tetap dipertahankan",
      ]}
      sections={[
        {
          title: "Tidak semua ketidaksempurnaan harus dihapus",
          paragraphs: [
            "Sedikit perubahan nada, tarikan napas, atau pergeseran timing kadang menjadi bagian dari emosi sebuah performa. Karena itu, kami tidak memperlakukan vokal seperti data yang harus selalu lurus dan tepat secara mutlak.",
            "Editing dilakukan berdasarkan konteks. Lagu pop modern mungkin membutuhkan presisi yang lebih rapat, sedangkan lagu akustik atau emosional bisa terasa lebih kuat ketika sebagian gerakan alaminya tetap dipertahankan.",
          ],
        },
        {
          title: "Comping dimulai dari performa terbaik",
          paragraphs: [
            "Jika tersedia beberapa take, bagian terbaik dapat dipilih dan digabungkan menjadi satu performa utama. Penilaian tidak hanya berdasarkan nada, tetapi juga artikulasi, energi, emosi, konsistensi, dan hubungan antarfrasa.",
            "Setelah comping selesai, barulah tuning, timing, pembersihan, dan detail lain dikerjakan sesuai tingkat koreksi yang telah disepakati.",
          ],
        },
        {
          title: "Rekaman awal tetap menentukan hasil",
          paragraphs: [
            "Editing dapat membantu banyak hal, tetapi tidak dapat sepenuhnya mengganti rekaman dengan distorsi, pantulan ruangan berlebihan, noise berat, atau performa yang belum siap. Jika rekaman ulang akan memberi hasil yang lebih baik, kami akan menyampaikannya sebelum pengerjaan diteruskan.",
          ],
        },
      ]}
      steps={[
        {
          title: "Kirim semua take vokal",
          text: "Sertakan file vokal, instrumental atau rough mix, tempo, lirik, sample rate, dan catatan bagian yang kamu sukai.",
        },
        {
          title: "Tentukan tingkat koreksi",
          text: "Pilih hasil yang natural, modern dan rapat, atau karakter tertentu sesuai genre serta tujuan produksinya.",
        },
        {
          title: "Periksa hasil editing",
          text: "Dengarkan vokal di dalam musiknya, berikan catatan, lalu terima file yang sudah dirapikan.",
        },
      ]}
      faqs={[
        {
          question: "Apakah tuning akan membuat vokal terdengar seperti robot?",
          answer:
            "Tidak harus. Hasilnya bergantung pada gaya koreksi yang dipilih. Tuning dapat dilakukan secara halus untuk menjaga gerakan alami atau dibuat lebih terasa jika memang menjadi bagian dari karakter produksi.",
        },
        {
          question: "Apakah suara fals bisa diperbaiki sepenuhnya?",
          answer:
            "Kesalahan ringan hingga sedang biasanya dapat dibantu, tetapi hasilnya tetap bergantung pada rekaman, artikulasi, perpindahan nada, dan seberapa jauh koreksi yang dibutuhkan. Beberapa bagian mungkin akan terdengar lebih alami jika direkam ulang.",
        },
        {
          question: "Apakah backing vocal juga bisa diedit?",
          answer:
            "Bisa. Backing vocal dapat dirapikan nada, timing, panjang frasa, dan keseragamannya agar menyatu dengan vokal utama sesuai cakupan pengerjaan.",
        },
        {
          question: "Apakah editing vokal sudah termasuk mixing?",
          answer:
            "Tidak selalu. Editing menyiapkan dan merapikan rekaman vokal, sedangkan mixing menempatkannya bersama seluruh instrumen. Keduanya dapat dipilih sebagai layanan terpisah atau digabungkan sesuai kebutuhan.",
        },
      ]}
      primaryCta="Rapikan vokal laguku"
      secondaryCta="Jasa mixing dan mastering"
      secondaryHref="/id/jasa-mixing-mastering-lagu"
      related={[
        { href: "/id/persiapan-rekaman-vokal", label: "Persiapan rekaman vokal" },
        { href: "/id/jasa-mixing-mastering-lagu", label: "Jasa mixing dan mastering" },
        { href: "/id/jasa-produksi-musik", label: "Jasa produksi musik" },
        { href: "/portfolio", label: "Dengarkan portofolio" },
      ]}
    />
  );
}
