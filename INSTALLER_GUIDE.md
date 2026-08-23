# FMG Industry Hub — Installation and Deployment

Dokumen ini hanya mencantumkan fitur yang tersedia di repository.

## Requirements

- Node.js 20+
- npm 10+
- Supabase project
- Midtrans account
- Resend account jika email contact/invoice diaktifkan

## Install

```bash
git clone https://github.com/maulasufa-pu/fmg-industry-hub.git
cd fmg-industry-hub
npm ci
copy .env.example .env.local
npm run validate:env
```

Jalankan migration berurutan di Supabase SQL editor atau CLI. Karena database production lama dibuat sebelum migration repository lengkap, ambil backup lebih dulu dan review output SQL sebelum menjalankan migration baru. Setelah migration, jalankan `supabase/seed.sql` untuk katalog dasar yang reproducible.

## Verify

```bash
npm run lint
npm run typecheck
npm run db:check
npm run test:ci
npm run build
npm run perf:budget
npm run test:e2e
npm audit --audit-level=high
```

## Deploy

Deploy ke Vercel atau host Node.js yang mendukung Next.js. Isi semua environment production di platform, deploy ke staging, jalankan `/api/health` dan browser smoke test, baru promosikan ke production.

Payment gateway aktif adalah Midtrans. Stripe/PayPal, Sentry, dan antivirus upload belum menjadi dependency atau integrasi aktif. Rujuk [docs/operations](docs/operations) untuk staging, rollback, backup/restore, dan incident response.
