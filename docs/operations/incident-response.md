# Incident response

1. Triage severity, route/data terdampak, waktu mulai, dan apakah insiden masih aktif.
2. Contain: nonaktifkan integration key atau write path yang terdampak tanpa menghapus bukti.
3. Preserve log yang relevan dan rotasi kredensial bila ada kemungkinan bocor.
4. Eradicate melalui patch yang direview dan diuji di staging.
5. Recover dengan health check, role/RLS smoke test, dan monitoring intensif.
6. Dokumentasikan timeline, dampak user, root cause, tindakan, owner, dan deadline pencegahan berulang. Libatkan penasihat hukum untuk kewajiban notifikasi data.
