import type { Metadata } from "next";

import SalesSeoLanding from "@/components/seo/SalesSeoLanding";

export const metadata: Metadata = {
  title: "Persiapan Rekaman Vokal agar Hasilnya Maksimal",
  description:
    "Panduan persiapan rekaman vokal, mulai dari latihan, pemilihan nada dasar, lirik, kondisi suara, ruangan, mikrofon, level rekaman, hingga penyimpanan take.",
  alternates: { canonical: "/id/persiapan-rekaman-vokal" },
  openGraph: {
    title: "Persiapan Rekaman Vokal yang Perlu Dilakukan",
    description:
      "Siapkan lagu, suara, ruangan, dan sesi rekaman agar kamu dapat berfokus pada performa terbaik.",
    url: "/id/persiapan-rekaman-vokal",
    locale: "id_ID",
    type: "article",
  },
};

export default function Page() {
  return (
    <SalesSeoLanding
      lang="id"
      path="/id/persiapan-rekaman-vokal"
      eyebrow="Panduan sebelum recording"
      title="Persiapan Rekaman Vokal agar Kamu Tidak Kehabisan Energi di Studio"
      intro="Hari rekaman sebaiknya digunakan untuk menangkap performa terbaik, bukan baru mencari nada, menghafal lirik, atau memperbaiki struktur lagu. Persiapan yang sederhana dapat menghemat waktu dan membuat penyanyi lebih tenang saat mulai merekam."
      benefits={[
        "Lagu dan lirik sudah dikuasai",
        "Nada dasar sesuai dengan suara",
        "Tubuh dan suara lebih siap",
        "Ruangan dan alat sudah diperiksa",
        "Take tersimpan dengan rapi",
        "Energi dapat difokuskan pada emosi",
      ]}
      sections={[
        {
          title: "Kuasai lagu sebelum hari rekaman",
          paragraphs: [
            "Latih melodi, lirik, pengucapan, napas, dan dinamika sampai kamu tidak perlu terus-menerus melihat catatan. Tandai bagian yang membutuhkan napas panjang, nada tinggi, perpindahan register, harmoni, atau pengucapan khusus.",
            "Rekam latihan dengan ponsel lalu dengarkan kembali. Cara ini sering memperlihatkan masalah timing, artikulasi, dan konsistensi yang tidak terasa ketika sedang bernyanyi.",
          ],
        },
        {
          title: "Pastikan nada dasar nyaman",
          paragraphs: [
            "Nada tertinggi bukan satu-satunya ukuran. Perhatikan juga bagian rendah, area yang paling sering dinyanyikan, warna suara, serta kemampuan menjaga emosi dari awal sampai akhir lagu.",
            "Jika hampir seluruh energi habis hanya untuk mencapai beberapa nada, bicarakan kemungkinan mengubah nada dasar sebelum produksi dan rekaman terlalu jauh berjalan.",
          ],
        },
        {
          title: "Jaga kondisi tubuh tanpa mencoba hal baru",
          paragraphs: [
            "Tidur yang cukup, minum air, dan hindari kebiasaan yang biasanya membuat tenggorokanmu tidak nyaman. Tidak perlu mencoba minuman, obat, atau teknik ekstrem yang belum pernah kamu gunakan hanya karena mendekati jadwal rekaman.",
            "Lakukan pemanasan secara bertahap. Jika suara terasa sakit atau kondisi tubuh sedang buruk, memaksakan rekaman dapat menghasilkan performa yang tidak maksimal dan memperpanjang proses editing.",
          ],
        },
        {
          title: "Periksa ruangan, alat, dan sesi rekaman",
          paragraphs: [
            "Kurangi pantulan ruangan dan suara dari AC, kipas, jalan, komputer, atau orang lain. Atur jarak mikrofon serta level input agar bagian paling keras tidak mengalami clipping. Gunakan pop filter jika diperlukan dan pastikan headphone tidak bocor terlalu keras ke mikrofon.",
            "Simpan setiap take dengan nama yang jelas dan jangan menghapusnya terlalu cepat. Take yang terasa kurang sempurna secara teknis kadang memiliki emosi terbaik dan masih dapat digunakan saat comping.",
          ],
        },
      ]}
      steps={[
        {
          title: "Latih dan tandai lagunya",
          text: "Kuasai lirik, melodi, napas, dinamika, harmoni, dan bagian sulit sebelum hari rekaman.",
        },
        {
          title: "Siapkan tubuh dan ruangan",
          text: "Jaga kondisi suara, kurangi gangguan ruangan, periksa mikrofon, headphone, dan level input.",
        },
        {
          title: "Rekam beberapa pilihan",
          text: "Ambil beberapa take utuh dan take bagian penting, beri nama dengan rapi, lalu simpan semuanya untuk proses comping.",
        },
      ]}
      faqs={[
        {
          question: "Berapa kali take vokal yang diperlukan?",
          answer:
            "Tidak ada jumlah yang selalu benar. Beberapa take utuh membantu menjaga alur emosi, sedangkan take tambahan dapat difokuskan pada bagian tertentu. Terlalu banyak mengulang juga dapat membuat suara dan konsentrasi menurun.",
        },
        {
          question: "Apakah harus merekam vokal dalam sekali jalan?",
          answer:
            "Tidak. Rekaman dapat dilakukan perbagian dan digabungkan melalui comping. Namun, mengambil beberapa take utuh tetap berguna untuk menjaga kesinambungan emosi dan phrasing.",
        },
        {
          question: "Seberapa jauh jarak dari mikrofon?",
          answer:
            "Jarak bergantung pada mikrofon, ruangan, kekuatan suara, dan karakter yang diinginkan. Mulailah dari jarak yang konsisten, gunakan pop filter, lalu lakukan tes pada bagian paling pelan dan paling keras sebelum merekam seluruh lagu.",
        },
        {
          question: "Apakah rekaman rumahan bisa menghasilkan vokal yang bagus?",
          answer:
            "Bisa jika ruangan cukup terkendali, alat digunakan dengan benar, level aman, dan performanya kuat. Mikrofon mahal tidak akan banyak membantu jika ruangan sangat memantul atau rekamannya mengalami clipping.",
        },
      ]}
      primaryCta="Bantu arahkan vokal laguku"
      secondaryCta="Jasa editing vokal"
      secondaryHref="/id/jasa-editing-vokal"
      related={[
        { href: "/id/jasa-editing-vokal", label: "Jasa editing vokal" },
        { href: "/id/jasa-mixing-mastering-lagu", label: "Jasa mixing dan mastering" },
        { href: "/id/jasa-produksi-musik", label: "Jasa produksi musik" },
        { href: "/id/cara-bikin-lagu", label: "Cara bikin lagu" },
      ]}
    />
  );
}
