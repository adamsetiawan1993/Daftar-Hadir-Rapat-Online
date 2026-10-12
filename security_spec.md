# Security Specification: Daftar Hadir Rapat Online

## 1. Data Invariants
1. Peserta publik HANYA boleh menambahkan catatan kehadiran (`create`) pada koleksi `attendance`. Mereka TIDAK BOLEH membaca (`read`), memodifikasi (`update`), atau menghapus (`delete`) catatan kehadiran siapa pun.
2. Catatan kehadiran baru harus mereferensikan rapat yang valid di `meetings/{meetingId}`.
3. Kode akses rapat (`accessCode`) jika ditentukan harus dicocokkan dengan data rapat sebelum kehadiran disimpan.
4. Timestamps harus memakai waktu server (`request.time`).
5. Hanya Administrator (Super Admin dan Operator terverifikasi, atau email bootstrapped `adamsetiawanbsn@gmail.com`) yang boleh membaca seluruh data kehadiran, mengunduh data, membuat/mengedit rapat, dan menghapus data.
6. Perubahan terhadap data administrator (`admins`) hanya boleh dilakukan oleh Super Admin.

## 2. The Dirty Dozen Payloads (Target Denial)
1. Peserta mencoba melakukan `list` atau `get` pada `/attendance` -> DITOLAK (PERMISSION_DENIED).
2. Peserta mencoba melakukan `update` status atau data nama orang lain di `/attendance/{id}` -> DITOLAK.
3. Peserta mencoba mengirim data `attendance` dengan field tersembunyi `isAdmin: true` -> DITOLAK.
4. Peserta mencoba mengirim data kehadiran pada rapat yang berstatus `manual_closed` -> DITOLAK.
5. Peserta mencoba mengubah status rapat `meetings/{meetingId}` tanpa autentikasi admin -> DITOLAK.
6. Pengguna non-admin mencoba membaca audit log `/auditLogs` -> DITOLAK.
7. Pengguna non-admin mencoba memodifikasi konfigurasi instansi `/settings/app_config` -> DITOLAK.
8. Pengguna non-admin mencoba menambahkan akun admin baru di `/admins/{uid}` -> DITOLAK.
9. Operator biasa mencoba mengubah dokumen role Super Admin di `/admins/{uid}` -> DITOLAK.
10. Peserta mencoba mengirim kehadiran dengan string nama melebihi batas 150 karakter (Denial of Wallet) -> DITOLAK.
11. Pengguna mencoba menginject ID tidak valid yang mengandung karakter acak ilegal -> DITOLAK.
12. Pengguna mencoba menipu kepemilikan akun admin tanpa email terverifikasi -> DITOLAK.
