const copy = (id: string, en: string) => ({ id, en });

export const arrangementFaqs = [
  {
    q: copy("Apa yang perlu saya kirim untuk memulai?", "What do I need to send to get started?"),
    a: copy("Kirim materi yang paling jelas menggambarkan lagumu: voice note, vokal, melodi, chord, lirik, struktur kasar, serta dua atau tiga referensi. Beri tahu kami bagian mana yang paling kamu suka.", "Send whatever communicates the song best: a voice note, vocal, melody, chords, lyrics, a rough structure, and two or three references with notes about what you like."),
  },
  {
    q: copy("Apakah lagu saya akan dibeli atau diambil FMG?", "Will FMG buy or take my song?"),
    a: copy("Tidak. Di sini kamu membeli jasa aransemen dan produksi. Credit, ownership, session assets, material pihak ketiga, serta lisensi atau pengalihan apa pun hanya berlaku jika tertulis dalam dokumen project yang kamu setujui.", "No. This page sells arrangement and production services to you. Credits, ownership, session assets, third-party material, and any license or transfer only apply when written into the project documents you approve."),
  },
  {
    q: copy("Berapa harga jasa aransemen lagu?", "How much does music arrangement cost?"),
    a: copy("Paket project pertama tersedia seharga Rp6.000.000 untuk scope yang tercantum. Musisi sesi, rekaman studio, orkestrasi khusus, versi tambahan, kebutuhan rush, atau pekerjaan di luar scope akan dikonfirmasi terlebih dahulu.", "The first-project package is IDR 6,000,000 for the listed scope. Session musicians, studio recording, custom orchestration, additional versions, rush work, or anything outside the scope is confirmed separately."),
  },
  {
    q: copy("Berapa lama prosesnya?", "How long does the process take?"),
    a: copy("Timeline ditentukan setelah materi dan kompleksitas lagu diperiksa. Tanggal mulai, milestone review, dan target delivery ditulis sebelum produksi agar tidak ada janji waktu yang abstrak.", "The timeline is set after reviewing the material and complexity. The start date, review milestones, and target delivery are written down before production so there are no vague timing promises."),
  },
  {
    q: copy("Berapa kali revisi yang saya dapatkan?", "How many revision rounds do I receive?"),
    a: copy("Jumlah revisi mengikuti paket atau quote yang disetujui. Feedback dikumpulkan per milestone supaya setiap ronde revisi punya tujuan dan tidak mengulang keputusan yang sudah disetujui.", "The number of revisions follows the approved package or quote. Feedback is consolidated at each milestone so every revision round has a clear purpose."),
  },
  {
    q: copy("Apakah bisa dikerjakan sepenuhnya online?", "Can the project be completed fully online?"),
    a: copy("Bisa. Brief, referensi, komunikasi, review, revisi, status project, dan delivery dapat dijalankan secara online melalui flow FMG.", "Yes. The brief, references, communication, reviews, revisions, project status, and delivery can all run online through the FMG workflow."),
  },
  {
    q: copy("Apakah mixing dan mastering sudah termasuk?", "Are mixing and mastering included?"),
    a: copy("Ya, keduanya termasuk dalam Paket Project Pertama bersama editing. Detail format dan versi file akhir tetap mengikuti scope yang disetujui.", "Yes. Both are included in the First Project Package together with editing. Final file formats and versions still follow the approved scope."),
  },
  {
    q: copy("Apa bedanya aransemen dan pembuatan lagu?", "What is the difference between arrangement and song creation?"),
    a: copy("Aransemen cocok jika identitas inti lagunya—seperti melodi atau lirik—sudah ada dan perlu dikembangkan menjadi musik yang utuh. Kalau kamu baru punya cerita, tema, atau brief dan ingin membangun lagu dari awal, pilih jasa pembuatan lagu.", "Arrangement is ideal when the song's core identity—such as its melody or lyrics—already exists and needs to become a complete production. If you only have a story, theme, or brief and need the song built from the ground up, choose song creation."),
  },
];
