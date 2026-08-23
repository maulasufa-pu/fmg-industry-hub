# Staging and deployment

1. Gunakan project Supabase staging terpisah dan environment staging yang tidak memakai data production.
2. Jalankan `npm ci`, quality commands di README, migration, seed, lalu smoke test sebagai anonymous, client, dan admin.
3. Verifikasi order arrangement, contact, invoice ownership, Midtrans sandbox webhook, publishing validation, consent, 404, mobile, dan `/api/health`.
4. Ambil backup production. Jalankan migration production satu per satu dan catat operator/waktu.
5. Deploy immutable build yang sudah lulus staging. Periksa health, error log, pembayaran sandbox/low-risk smoke, lalu pantau minimal 30 menit.
