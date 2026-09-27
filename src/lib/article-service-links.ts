// Curated existing article slugs. Keep informational pages tied to the
// service that matches their subject, rather than adding sitewide exact anchors.
const arrangement = new Set([
  "apa-yang-didapat-dari-jasa-aransemen-lagu",
  "apa-yang-dikerjakan-arranger-dalam-jasa-aransemen-lagu",
  "cara-membuat-lagu-dari-voice-note-atau-demo-sederhana",
  "ciri-aransemen-lagu-yang-profesional",
  "fungsi-bass-dalam-aransemen-dan-cara-membuat-bassline",
  "jasa-aransemen-musik-apa-yang-dikerjakan-arranger",
  "jasa-aransemen-lagu-online-cara-kerjanya",
  "punya-melodi-belum-ada-musik-cara-aransemen-dari-nol",
  "kapan-lagu-membutuhkan-strings-piano-gitar-synth-brass",
]);
const songwriting = new Set([
  "apa-yang-harus-disiapkan-sebelum-pesan-jasa-pembuatan-lagu",
  "cara-membuat-lagu-dari-lirik-menjadi-musik",
  "cara-memilih-jasa-pembuatan-lagu-terpercaya",
  "dari-lirik-menjadi-lagu-yang-siap-diproduksi",
  "harga-jasa-pembuatan-lagu-dan-faktor-biayanya",
  "harga-jasa-pembuatan-lagu-2026",
  "jasa-pembuatan-lagu-mencakup-apa-saja",
  "jasa-pembuatan-lagu-murah-vs-profesional",
  "jasa-pembuatan-lagu-profesional-dari-ide-sampai-siap-rilis",
  "jasa-pembuatan-lagu-untuk-penyanyi-solo",
  "punya-lirik-belum-ada-melodi-cara-jadi-lagu",
]);
const production = new Set([
  "ai-dalam-produksi-musik",
  "berapa-lama-proses-pembuatan-satu-lagu",
  "cara-membuat-brief-produksi-musik",
  "cara-menilai-portofolio-produser-musik",
  "cara-menentukan-budget-produksi-lagu",
  "dari-voice-note-menjadi-lagu-profesional",
  "jasa-produksi-musik-online-tanpa-datang-ke-studio",
  "jasa-produksi-musik-berbagai-genre-pop-rnb-rock-jazz-edm",
  "mengapa-karya-musik-perlu-strategi-produksi",
  "proses-produksi-lagu-dari-ide-sampai-rilis",
  "recording-editing-mixing-mastering-apa-bedanya",
  "studio-rekaman-vs-jasa-produksi-musik-lengkap",
  "stems-instrumental-acapella-dan-file-final-produksi-musik",
  "workflow-produksi-musik-dari-demo-sampai-master",
]);

export function articleServiceLink(slug: string) {
  if (arrangement.has(slug)) return {
    href: "/id/jasa-aransemen-lagu",
    context: "Jika melodi atau demo sudah tersedia dan kamu membutuhkan susunan instrumen yang lebih lengkap, kirim materi tersebut untuk menentukan arah aransemen dan scope pengerjaan.",
    label: "Pelajari layanan aransemen untuk demo lagumu",
  };
  if (songwriting.has(slug)) return {
    href: "/id/jasa-pembuatan-lagu",
    context: "Jika lagumu masih berupa ide, cerita, atau lirik, diskusikan kebutuhan komposisi dan songwriting terlebih dahulu. Arah kreatif, biaya, serta hasil tiap tahap dikonfirmasi sebelum proyek dimulai.",
    label: "Konsultasikan ide melalui layanan pembuatan lagu",
  };
  if (production.has(slug)) return {
    href: "/id/jasa-produksi-musik",
    context: "Jika kebutuhanmu mencakup beberapa tahap dari demo hingga hasil rekaman, jelaskan materi yang sudah selesai dan tahap yang masih membutuhkan bantuan agar scope produksi dapat ditentukan secara tepat.",
    label: "Lihat dukungan produksi musik untuk proyekmu",
  };
}
