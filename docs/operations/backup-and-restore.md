# Backup and restore

Gunakan backup terkelola Supabase dan ambil logical backup sebelum migration material:

```bash
pg_dump --format=custom --no-owner --file=fmg-YYYYMMDD.dump "$DATABASE_URL"
pg_restore --list fmg-YYYYMMDD.dump
```

Uji restore secara berkala ke database kosong/staging, bukan ke production. Setelah restore, verifikasi jumlah row kritis, foreign key, function/view, Storage references, Auth linkage, dan RLS memakai empat role pengujian. Enkripsi backup dan batasi retensinya sesuai `data_retention_rules`.
