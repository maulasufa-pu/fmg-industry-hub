# Audit dan implementasi SEO + conversion Flemmo Music

Tanggal: 28 September 2026. Perubahan berada di working tree lokal; belum deploy. Baseline GSC berasal dari brief (28 hari: ~2.050 impressions, 35 clicks, CTR 1,7%), bukan akses langsung ke akun.

## A. Temuan audit dan prioritas

Audit HTTP homepage, halaman Indonesia, robots, sitemap, dan 124 URL dalam sitemap produksi. Seluruh URL sitemap merespons 200 pada saat crawl. Pemeriksaan HTML bukan bukti semua URL telah diindeks Google. Bukti: `live-audit.json`, `sitemap-crawl.json`.

| Prioritas | Temuan | Tindakan/status |
|---|---|---|
| CRITICAL | URL artikel dalam brief dengan ejaan `producer` merespons 404; `produser` merespons 200 | Tambahkan redirect permanen 308 ke URL yang tersedia. Tidak menghapus artikel. |
| HIGH | Title pembuatan lagu dan produksi menggandakan FMG Universe melalui template layout | Gunakan title absolute dengan Flemmo Music. |
| HIGH | Aransemen, pembuatan lagu, dan produksi menyebut rangkaian layanan serupa sehingga positioning beririsan | Pisahkan entry point: materi lagu → aransemen; ide/lirik → songwriting; demo → produksi lintas tahap. Cannibalization ranking belum terbukti tanpa data query per URL dari GSC. |
| HIGH | CTA template selalu menuju order aransemen, termasuk pembuatan lagu/produksi | CTA spesifik dan inquiry untuk kedua layanan tersebut; WhatsApp dengan pesan sesuai layanan. |
| HIGH | GA4 tersedia tetapi tidak ada event khusus funnel lead dalam kode awal | Implementasikan click dan submission events mengikuti consent. |
| HIGH | Banyak artikel CMS sudah membahas tema sama, termasuk dua voice-note articles dan dua artikel pekerjaan arranger | Jangan membuat URL baru. Tambahkan link layanan terkurasi; tandai overlapping content untuk audit query sebelum konsolidasi. |
| MEDIUM | FAQ schema aransemen memakai jawaban berbeda dari FAQ visual | Satukan sumber data bilingual untuk schema dan konten. |
| MEDIUM | Bukti karya berada jauh di bawah atau hanya link related | Tambahkan jalur portfolio lebih awal dan penjelasan apa yang dinilai. Tidak membuat testimonial atau credits. |
| MEDIUM | Penerjemah otomatis bisa mengubah teks sebelum hydration | Konten yang sudah ditulis dalam bahasa halaman dilindungi dari penerjemahan ulang; diuji ulang tanpa page errors. |
| MEDIUM | 14 URL di luar money pages tidak memiliki canonical dalam HTML HTTP audit; lima halaman divisi tidak menampilkan H1 pada respons HTML | Perlu pemeriksaan rendered HTML dan positioning tiap halaman sebelum perubahan metadata massal. Tidak disimpulkan sebagai deindexing. |
| LOW | Beberapa title legal/divisi memakai title global yang sama | Backlog setelah money pages; jangan mengubah halaman berperforma tanpa data. |
| LOW | Browser memberi warning dimensi logo/header dan kemungkinan logo sebagai LCP | Belum mengubah aset branding. Perlu lab performance + data field produksi. |

Audit kedalaman konten: 75 artikel CMS berbahasa Indonesia memiliki kurang dari 300 kata pada ekstraksi HTML. Ini sinyal untuk menilai kelengkapan jawaban dan overlap, bukan alasan menambah kata atau menetapkan thin content hanya dari panjang. Money pages awal sekitar 921/693/654 kata; masalah utamanya positioning, bukti karya, dan jalur konversi. Tidak ditemukan duplikasi title antarketiga money pages, tetapi beberapa artikel membahas topik yang berdekatan.

Teknis yang sudah tersedia: canonical self-referencing pada tiga money pages; robots index/follow; sitemap dan hreflang reciprocal untuk arrangement dan song creation ID/EN; Service/Breadcrumb/FAQ schema; heading H1 tunggal di money pages; tidak ditemukan img tanpa atribut alt dalam crawl. Alt kosong untuk gambar dekoratif tidak otomatis menjadi masalah. Produksi ID tidak dipasangkan dengan halaman global yang bukan terjemahan setara. FAQ schema bukan janji rich result Google.

## B. Perubahan

- Aransemen: title dan H1 sesuai brief, opening menyebut voice note/demo/melodi/chord/vokal/referensi, penjelasan definisi dan audience, input, genre sebagai arah konsultasi, deliverables/stems sesuai kesepakatan, CTA Kirim Demo Lagumu langsung ke WhatsApp dan CTA konsultasi alternatif. Portfolio tetap memakai filter arrangement yang sudah ada.
- Pembuatan lagu: fokus konsep, songwriting, komposisi, struktur; CTA Konsultasikan Ide Lagumu. Production dan arrangement dijelaskan sebagai scope/tahap berikutnya.
- Produksi: H1 menyebut jasa produksi musik, workflow demo–hasil akhir, hubungan aransemen/vocal production/editing/mixing/mastering, kebutuhan recording studio dan musisi harus dikonfirmasi. CTA Mulai Project Musik.
- Template layanan: primaryHref eksplisit, portfolio lebih awal, CTA penutup, breadcrumb Indonesia menuju /id, dukungan contextual links per section.
- Harga Rp6 juta hanya dipertahankan dari kode/paket lama untuk proyek pertama; tidak menjadi tarif semua layanan. Harga global dan pilihan currency tidak diturunkan. Deliverables, revisi, timeline, dan ownership tetap mengikuti dokumen proyek.
- Inquiry form: referensi form disimpan sebelum await sehingga reset setelah respons sukses tidak memakai event.currentTarget yang sudah kosong. Event submission hanya terjadi setelah respons sukses.

## C. File dan route

Daftar file final tercantum di `changed-files.txt`. Komponen utama: SalesSeoLanding, ArrangementServiceLanding, PublicArticlePage, ArticleIndexPage, ConversionTracking; helper arrangement-faqs, service-whatsapp, conversion-tracking, privacy-consent, article-service-links; AppShell; next.config; money pages; enam artikel statis; inquiry/contact dan popover project. Semua helper baru dan daftar route tercatat agar perubahan bisa direview.

## D. Title dan meta sebelum/sesudah

| Route | Title sebelum (HTML produksi) | Title sesudah |
|---|---|---|
| `/id/jasa-aransemen-lagu` | Jasa Aransemen Lagu Profesional Online | FMG Universe | Jasa Aransemen Lagu Profesional Online | Flemmo Music |
| `/id/jasa-pembuatan-lagu` | Jasa Pembuatan Lagu Profesional | FMG Universe â€” FMG Universe | Jasa Pembuatan Lagu dari Ide & Lirik | Flemmo Music |
| `/id/jasa-produksi-musik` | Jasa Produksi Musik Profesional | FMG Universe â€” FMG Universe | Jasa Produksi Musik Profesional | Flemmo Music |

### jasa-aransemen-lagu

Sebelum: Jasa aransemen lagu profesional secara online, mulai dari pengembangan demo, produksi, dan vocal directing hingga mixing dan mastering. Paket proyek pertama Rp6 juta.

Sesudah: Kirim voice note, demo, melodi, chord, atau vokal. Flemmo Music mengembangkan materi lagumu menjadi aransemen profesional. Konsultasikan kebutuhanmu via WhatsApp.

### jasa-pembuatan-lagu

Sebelum: Bikin lagu original dari ide, lirik, melodi, atau voice note hingga aransemen, produksi, vocal directing, mixing, dan mastering.

Sesudah: Punya ide, cerita, lirik, atau potongan melodi? Kembangkan menjadi lagu original bersama Flemmo Music. Konsultasikan konsep dan kebutuhan proyekmu.

### jasa-produksi-musik

Sebelum: Jasa produksi musik untuk mengembangkan lagu dari demo menjadi rekaman yang utuh, mulai dari aransemen, sound design, editing, mixing, hingga mastering.

Sesudah: Kembangkan demo menjadi produksi musik utuh: aransemen, vocal production, editing, mixing dan mastering sesuai scope. Diskusikan proyekmu dengan Flemmo Music.

Snapshot source sebelum perubahan: `before-money-pages.json`. Metadata hasil browser: `conversion-verification.json`. Homepage/global tidak diganti titlenya.

## E. Internal linking

- Artikel komposer/arranger/produser: tiga link berdasarkan kebutuhan melodi/demo, ide/komposisi, dan produksi rekaman.
- Artikel biaya → aransemen; cara bikin lagu/voice note → aransemen dan pembuatan lagu; memilih arranger/file hasil → aransemen.
- Persiapan rekaman vokal dan perbedaan mixing/mastering → produksi musik.
- Money pages saling menghubungkan berdasarkan tahap; aransemen menghubungkan biaya, panduan arranger, produksi, dan cara bikin lagu.
- Indeks artikel Indonesia menyediakan empat panduan yang dioptimalkan.
- 34 slug artikel CMS terkurasi mendapat contextual next-step link berdasarkan subjek: 9 aransemen, 11 songwriting, 14 produksi. Jika CTA artikel sudah menuju target yang sama, tambahan tidak dirender. Tidak mengubah record Supabase. Daftar tepatnya: `src/lib/article-service-links.ts`.

## F. Content cluster

Empat artikel lama diperluas, tanpa URL baru:

1. `/id/biaya-pembuatan-lagu`: komponen harga aransemen, scope, paket lama, cara meminta penawaran.
2. `/id/perbedaan-komposer-arranger-produser-musik`: contoh keputusan arranger vs producer, pemilihan tahap, credit.
3. `/id/cara-bikin-lagu`: langkah merekam voice note, memilih ide, struktur, referensi, pengiriman bahan.
4. `/id/cara-memilih-jasa-aransemen-lagu`: output, stems vs multitrack vs file DAW, revisi dan jadwal.

Artikel CMS terkait tetap di URL yang sama; konten editorial database tidak ditimpa. Tema waktu pengerjaan dan penyanyi independen sudah punya artikel, jadi tidak dibuat duplikat baru. Artikel overlapping perlu dibandingkan menggunakan GSC sebelum merge/redirect.

## G. Tracking

GA4 yang sudah tersedia: G-BED00R69W0 melalui ConsentManager. Vercel Analytics dan Speed Insights juga bergantung pada analytics consent; ID dan alur consent dipertahankan.

| Event | Trigger |
|---|---|
| click_whatsapp | Klik link ke wa.me atau api.whatsapp.com |
| click_project_start | Klik route order atau /services/inquiry |
| click_pricing | Klik /pricing, /id/harga, atau anchor #harga |
| portfolio_play | Native audio/video play pada route portfolio; belum mencakup iframe Spotify/YouTube |
| submit_contact | Contact/inquiry berhasil; bukan klik tombol submit |
| submit_project | Inquiry reason project atau CreateProjectPopover berhasil |

Tidak mengirim nama, email, nomor telepon, isi pesan, URL WhatsApp lengkap, atau ID project ke GA4. Tidak mengirim custom event sebelum consent/current consent version atau ketika gtag tidak tersedia. Klik WhatsApp mengukur niat kontak, bukan bukti percakapan/order. Jika diperlukan funnel tanpa double counting, bedakan submission inquiry dan project melalui page_path/form_type, jangan menjumlahkan semua event sebagai revenue.

## H. Verifikasi dan batasan

- Typecheck lulus; tiga tes consent tracking lulus.
- Lint seluruh src: gagal karena 6 unused-import errors + 22 warnings yang sudah ada pada CompanyPageClient, PortfolioClient, dan signup. Lint file yang diubah: hasil final dicatat di validation.json.
- Browser: tujuh halaman × 390/1440 px, status 200, H1/canonical/schema tersedia, tidak ada overflow. Screenshot enam tampilan money pages disimpan. Pemeriksaan fresh tiga money pages tidak menghasilkan hydration/page errors.
- Build produksi lulus (TypeScript dan 90 halaman statis); redirect 308 lulus; 42 tujuan link lokal merespons tanpa error >=400; tiga artikel CMS perwakilan memiliki link layanan yang tepat dan layout mobile tanpa overflow.
- Tidak mengirim inquiry nyata atau membuat order/payment untuk pengujian. Tidak mengubah database produksi. Build/redirect dan link checks final tercantum di validation.json.
- CWV field, GA4 DebugView, key event settings, laporan query GSC, kualitas lead dan revenue belum dapat diverifikasi tanpa akses akun/dashboard. Dev timing bukan skor performance produksi.
- Portfolio third-party iframe memerlukan integrasi player API agar actual play bisa diukur; event native yang disiapkan tidak berarti playback Spotify/YouTube sudah terukur.
- Tidak ada testimonial asli yang dipilih/ditambahkan karena belum ada aset relevan yang terverifikasi untuk tiap layanan. Before/after audio tidak dibuat dari karya yang belum tersedia.
- Pricing Indonesia untuk pembuatan lagu/produksi, jumlah revisi, SLA waktu, stems dan file sesi tiap paket tetap perlu konfirmasi bisnis.
- Belum deploy; perubahan dapat ditinjau melalui git diff dan dokumen ini.

## I. Keputusan pemilik

Konfirmasikan scope setiap paket (terutama stems, file sesi, revisi, recording), pilih 2–3 karya nyata paling relevan per layanan beserta credit dan izin tampil, dan tentukan apakah perlu inquiry form khusus Indonesia. Tetapkan event GA4 yang dianggap qualified lead; submit_project dari inquiry berbeda dari order berbayar. Pilih langkah konsolidasi artikel hanya setelah membaca query/page performance.

## J. Pemantauan 2–4 minggu setelah deploy

Catat tanggal deploy, title/meta, dan baseline masing-masing URL. Di GSC, bandingkan 28 hari berikutnya terhadap periode sebelumnya untuk query jasa aransemen lagu, jasa pembuatan lagu, jasa produksi musik beserta variasinya. Nilai clicks, impressions, CTR dan posisi per query serta per URL; pisahkan mobile/desktop dan negara Indonesia. Jangan menyimpulkan perubahan CTR dari agregat jika posisi atau query mix berubah.

Periksa URL Inspection pada tiga money pages, canonical Google vs canonical deklarasi, indexing, redirect artikel producer→produser, sitemap, serta hreflang. Cari query sama yang memunculkan beberapa layanan/artikel untuk menilai cannibalization nyata. Di GA4, pantau landing page → WhatsApp/inquiry → submission, dengan batasan consent dan event click bukan order. Cocokkan inquiry dengan qualified leads, penawaran yang disetujui, dan revenue melalui proses bisnis. Review minggu kedua dan keempat; jangan terus mengganti title sebelum cukup data.

## Status tindak lanjut: review → deploy → indexing → GA4

Tidak menambah SEO atau artikel pada tindak lanjut ini. Review diff dan helper tracking telah dilakukan; tidak ditemukan blocker baru pada perubahan yang direview. Validasi build dan browser sebelumnya tetap berlaku karena kode aplikasi tidak berubah. `git diff --check` lulus lagi.

Deploy belum dilakukan: Vercel CLI melaporkan Logged out, dan dashboard Vercel menampilkan login. Search Console serta GA4 juga menampilkan login Google. Tidak ada request indexing atau klaim event diterima GA4. Tab login telah disiapkan untuk pengguna; password/token tidak perlu dikirim melalui chat. Bukti status dan checksum file aplikasi yang direview disimpan di `release-status.json`.

Urutan berikutnya setelah autentikasi tersedia:

1. Verifikasi project produksi Vercel yang sudah terhubung, lalu deploy perubahan yang direview.
2. Verifikasi title, H1, canonical, robots, CTA, tampilan desktop/mobile, dan redirect pada URL produksi.
3. Di Search Console, periksa live URL lalu Request Indexing untuk `/id/jasa-aransemen-lagu`, `/id/jasa-pembuatan-lagu`, dan `/id/jasa-produksi-musik`. Request bukan jaminan URL langsung diindeks.
4. Verifikasi GA4 dengan analytics consent: WhatsApp/project/pricing click dan submission sukses; gunakan sesi debug untuk DebugView. Jangan membuat inquiry/order/payment asli hanya untuk tes tanpa menentukan data uji.
5. Catat tanggal deploy dan baseline query/page. Pertahankan title/konten selama observasi, lalu evaluasi minggu kedua dan keempat berdasarkan query, CTR/posisi, serta qualified leads.

Testimonial, audio before/after, pricing baru dan detail scope tetap backlog bisnis; tidak diisi dengan asumsi dan tidak ditambahkan sebagai syarat deploy baru. Periode observasi 2–4 minggu dimulai setelah deploy yang terverifikasi, sehingga jadwal evaluasi belum ditetapkan.

### Pembaruan: login Vercel berhasil, deployment diblokir

Login CLI berhasil sebagai `maulasufa-pu`. Project/domain terverifikasi benar dan checksum kode aplikasi tetap cocok dengan versi yang direview. Deploy produksi diajukan melalui CLI; API Vercel melaporkan **BLOCKED** dengan alasan author commit tidak memiliki izin untuk membuat deployment pada project ini. Deployment: `dpl_3D8dsJVRRHp5EGcpb3ddhf5pN6mV`.

Commit terakhir memiliki author `Alfath Dev`; email author berbeda dari email utama akun Vercel yang sedang login. Perbedaan email adalah petunjuk pemeriksaan identitas, bukan bukti tunggal penyebab blokir. Perlu memastikan akun Git author terhubung ke akun Vercel yang berhak dan author mempunyai akses sesuai paket/team. Tidak mengubah identitas author atau pengaturan akses untuk melewati blokir.

Deployment lama `dpl_GKkChhzNHChzT9QR1Z7QrKzUL5w6` masih **Ready** dan tetap melayani `flemmomusic.com`; perubahan ini belum live. Request indexing dan verifikasi GA4 produksi untuk rilis baru belum dijalankan. Login Google juga masih pending berdasarkan informasi pengguna.

[Detail deployment diblokir](https://vercel.com/maulasufa-pus-projects/fmg-industry-hub/3D8dsJVRRHp5EGcpb3ddhf5pN6mV). [Dokumentasi pemeriksaan akses author Vercel](https://vercel.com/docs/deployments/troubleshoot-project-collaboration).

### Jalur GitHub auto-deploy

Integrasi Vercel terkonfirmasi ke `maulasufa-pu/fmg-industry-hub`, production branch `main`. HEAD sama dengan origin/main. Akun GitHub aktif `maulasufa-code` hanya memiliki READ permission; `git push --dry-run origin main` ditolak HTTP 403. Perubahan belum di-commit/push. Perlu autentikasi akun owner atau writer yang sah sebelum push dan verifikasi auto-deploy.

### Autentikasi Git sudah diperbaiki

Git Credential Manager berhasil mengautentikasi akun owner `maulasufa-pu`; izin push diverifikasi melalui GitHub API. Credential helper khusus repository diarahkan ke Git Credential Manager, menggantikan helper GitHub CLI yang memakai akun lama. Identitas email untuk commit baru memakai noreply GitHub akun owner yang sudah diautentikasi; riwayat commit lama tidak diubah. Kode aplikasi tetap sesuai checksum versi yang direview.
