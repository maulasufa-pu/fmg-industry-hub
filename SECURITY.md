# Security Policy

Jangan membuka kerentanan atau kredensial melalui public issue. Laporkan secara privat ke `legal@flemmomusic.com` dengan route terdampak, dampak, langkah reproduksi minimal, dan bukti yang sudah disanitasi.

FMG akan mengonfirmasi penerimaan, melakukan triage, menyiapkan perbaikan, dan memberi kabar sebelum disclosure. Jangan mengakses data user lain, melakukan denial of service, atau mempertahankan data yang tidak diperlukan untuk laporan.

Kredensial hanya disimpan di environment platform. Service-role Supabase tidak boleh masuk bundle browser. CI menjalankan lint, typecheck, test, audit dependency, migration repository checks, build, performance budget, dan browser smoke test.
