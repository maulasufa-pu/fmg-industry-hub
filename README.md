# FMG Industry Hub

Website penjualan jasa aransemen musik dan portal operasional client/admin FMG Universe. Public flow membawa calon client dari penjelasan layanan dan portfolio ke inquiry atau order; authenticated flow menangani project, draft, diskusi, invoice, meeting, dan publishing.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- Supabase PostgreSQL, Auth, Storage, dan RLS
- Midtrans untuk pembayaran
- Resend untuk email contact dan invoice reminder
- Jest serta Playwright untuk unit, mobile, accessibility, dan browser smoke tests

## Local setup

```bash
npm ci
copy .env.example .env.local
npm run validate:env
npm run dev
```

Jalankan migration berurutan dari `supabase/migrations`, lalu `supabase/seed.sql`. `supabase/schema.sql` adalah snapshot schema project yang sedang terhubung untuk audit dan pemulihan; migration tetap menjadi perubahan yang harus diaplikasikan berurutan. Environment produksi wajib menggunakan kredensial Supabase, Midtrans, captcha, dan email milik FMG sendiri.

## Quality commands

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run build
npm run perf:budget
npm run test:e2e
npm run db:check
npm audit --audit-level=high
```

`npm run db:types` memperbarui TypeScript types dari project Supabase yang terhubung. `npm run db:schema:export` menyegarkan snapshot schema tanpa menyimpan atau mencetak password database. Jalankan keduanya setelah migration produksi diterapkan. Build tidak lagi mengambil role dari database hidup sehingga hasil build deterministik.

## Operations

- Health check: `/api/health`
- Security policy: [SECURITY.md](SECURITY.md)
- Deployment, staging, rollback, backup, dan incident response: [docs/operations](docs/operations)
- P2 privacy migration: `supabase/migrations/202608230002_p2_privacy_and_reliability.sql`
- P2 RLS/RPC hardening: `supabase/migrations/202608230003_core_rls_hardening.sql`

Pembayaran yang benar-benar terpasang adalah Midtrans. Sentry, Stripe, PayPal, dan virus scanning tidak diklaim sebagai fitur aktif.
