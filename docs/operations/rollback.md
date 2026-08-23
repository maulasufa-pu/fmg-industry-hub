# Rollback

Rollback aplikasi dengan mempromosikan deployment terakhir yang sehat. Jangan membalik migration database secara otomatis setelah data baru ditulis.

Untuk kegagalan database: hentikan write path terkait, nilai apakah forward-fix lebih aman, lalu restore hanya jika kehilangan data dari restore lebih kecil daripada dampak insiden. Catat deployment ID, migration terakhir, waktu kejadian, keputusan, dan verifikasi setelah pemulihan.
