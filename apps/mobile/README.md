# WORK360 Mobile

Aplikasi Android (Expo / React Native) untuk mencatat kegiatan di lapangan. Semua data disimpan di HP (SQLite), jadi bisa dipakai tanpa internet. Sinkron ke server menyusul.

## Yang sudah ada (Fase 1, tahap awal)

- **Beranda**: kegiatan hari ini, tombol **+ Catat Aktivitas**, jumlah laporan yang belum dibuat dan follow-up terbuka.
- **Catat Aktivitas**: pilih jenis (Narasumber, Asistensi, Lapangan, Kantor, Rapat, Inisiatif, Koordinasi), isi judul, penyelenggara, lokasi (bisa dari posisi saat ini), tanggal/jam, serta data perjalanan dinas (SPT, DPA, transportasi).
- **Detail kegiatan**: timeline satu ketuk (Berangkat, Tiba, Mulai, Istirahat, Selesai, Pulang), foto dari kamera/galeri, catatan suara, dan bahan (undangan, bahan penyelenggara, bahan saya).
- **Selesaikan Kegiatan**: catatan suara, foto, catatan, hasil, kesimpulan, rekomendasi, follow-up. Isinya mengikuti bab III–IV laporan perjalanan dinas.

Foto, suara, dan dokumen disalin ke folder aplikasi supaya tetap ada walau file aslinya dihapus.

## Mencoba di HP Android

Cara tercepat, memakai aplikasi **Expo Go** (semua modul yang dipakai sudah ada di Expo Go):

1. Pasang Node.js 22 di laptop, lalu jalankan:
   ```bash
   cd apps/mobile
   npm install
   npx expo start
   ```
2. Pasang **Expo Go** dari Play Store di HP.
3. Pindai kode QR yang muncul di terminal dengan Expo Go (HP dan laptop harus satu jaringan Wi-Fi).

Membuat file APK untuk dipasang langsung (butuh akun Expo gratis):

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Setelah build selesai, EAS memberi link untuk mengunduh APK.

## Pengembangan

```bash
npm run typecheck   # pemeriksaan TypeScript
npm run lint        # ESLint
```

Struktur:

```
src/app/                 layar (Expo Router)
src/app/kegiatan/[id]/   detail dan "Selesaikan Kegiatan"
src/components/          tombol, perekam suara
src/db/schema.ts         tabel SQLite + migrasi
src/db/repo.ts           semua query
src/lib/                 tipe data, format tanggal Indonesia, penyimpanan file
```

Setiap tabel memakai UUID yang dibuat di HP serta kolom `updated_at` dan `deleted_at`, disiapkan untuk sinkronisasi dengan Supabase/PowerSync di tahap berikutnya.
