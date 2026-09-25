# WORK360 — Rencana Produk & Teknis (v0.2)

*Disusun 25 September 2026, diperbarui hari yang sama setelah keputusan dan contoh laporan diterima. Belum ada kode atau repositori.*

## 1. Inti produk

- **HP = alat kerja lapangan.** Menangkap aktivitas secepat mungkin, bisa tanpa internet.
- **Web = meja kerja.** Mengelola library, merapikan data, dan menyusun laporan perjalanan dinas.
- **Satu sumber data.** Semua yang dicatat di HP (kegiatan, foto, suara, dokumen, temuan) menjadi bahan laporan di web tanpa diketik ulang.

Ukuran keberhasilan MVP: satu kegiatan lapangan bisa dicatat di HP dalam waktu kurang dari 30 detik, dan laporannya bisa dihasilkan di web dalam bentuk dokumen Word sesuai template, tanpa menyalin manual.

## 2. Ruang lingkup per fase

### Fase 1 — MVP "Catat di lapangan" (mobile + web sederhana)
Mobile:
- Beranda "Hari ini": daftar kegiatan, tombol **+ Catat Aktivitas**, ringkasan (laporan tertunda, follow-up).
- Catat aktivitas cepat: pilih jenis (Narasumber, Asistensi, Lapangan, Kantor, Rapat, Inisiatif, Koordinasi) → judul, tanggal/jam, lokasi → simpan. Untuk perjalanan dinas ada isian tambahan opsional: nomor & tanggal SPT, DPA, transportasi, rekan pelaksana tugas.
- Foto dari kamera/galeri langsung ke kegiatan (dengan pertanyaan "Simpan ke aktivitas mana?").
- Catatan suara (rekam, putar ulang, lampirkan ke kegiatan). Transkripsi belum.
- Terima dokumen dari aplikasi lain (share dari WhatsApp/Files → pilih kegiatan → pilih peran: undangan / bahan penyelenggara / bahan saya).
- Lokasi: pilih dari posisi saat ini atau daftar lokasi yang pernah dipakai (tanpa GPS terus-menerus).
- Timeline otomatis dari catatan (Berangkat, Tiba, Rapat, Selesai) dengan tombol satu ketuk.
- "Selesaikan Kegiatan": catatan, temuan, rekomendasi, follow-up.
- **Offline penuh** untuk semua fitur di atas; sinkron otomatis saat ada internet.

Web:
- Login, daftar kegiatan (filter bulan/jenis/status), lihat detail + foto + dokumen + suara, edit teks.

### Fase 2 — Report Center
- Dashboard bulanan: jumlah kegiatan luar kantor, status laporan (selesai / draft / belum).
- **Generate Laporan** dari template laporan perjalanan dinas (struktur contoh Germas Tapin, bab I–VI, kop surat Bappeda) → file Word (.docx) untuk diedit dan dicetak.
- Library dasar hukum yang tinggal dipilih per kegiatan.
- Status laporan per kegiatan dan riwayat versi.

### Fase 3 — Persiapan Narasumber & Library
- Mode Persiapan: status, undangan, bahan penyelenggara, bahan saya, checklist "belum".
- Library materi (Knowledge): PPT/matriks/data yang dipakai ulang lintas kegiatan, dengan versi (mis. "PPT KDKMP V3").
- Dokumen yang ditandai "simpan offline" bisa dibuka di HP tanpa internet.
- Daftar follow-up lintas kegiatan dengan tenggat dan pengingat.

### Fase 4 — AI
- Transkripsi catatan suara → teks.
- Ringkasan kegiatan, ekstraksi temuan/rekomendasi.
- Draft bagian laporan (pendahuluan, hasil, kesimpulan) dari data kegiatan.
- Pencarian di library ("materi tentang BUMDesa pemasaran").

## 3. Model data

```text
User ─┬─< Activity >─┬─< TimelineEvent      (jam, label: berangkat/tiba/rapat/selesai)
      │              ├─< Media              (foto | suara; file di storage)
      │              ├─< ActivityDocument >── Document   (peran: undangan | bahan_penyelenggara | bahan_saya | lainnya)
      │              ├─< ChecklistItem      (persiapan: "Update data 2026")
      │              ├─< Finding            (jenis: hasil | kesimpulan | rekomendasi | catatan)
      │              ├─< ActivityLegalBasis >── LegalBasis   (dasar hukum pakai-ulang)
      │              ├─< FollowUp           (isi, tenggat, status)
      │              ├─< ActivityPerson >── Person        (nama + gelar, instansi, jabatan; peran: pelaksana tugas / pihak ditemui)
      │              └── Report             (0..1 per kegiatan, atau laporan bulanan gabungan)
      ├─< Document ──< DocumentVersion
      ├─< Knowledge >── Document           (materi pakai-ulang, tag, versi)
      └─< Location                          (nama, alamat, lat/lng, dipakai ulang)
ReportTemplate ─< Report
```

Field utama:

| Entitas | Field penting |
|---|---|
| **Activity** | id (UUID dibuat di HP), type, title, organizer, location_id, start_at, end_at, status (rencana/persiapan/berlangsung/selesai), background, objectives, spt_number, spt_date, dpa, transport, summary, report_status (belum/draft/selesai), updated_at, deleted_at |
| **ActivityPerson** | activity_id, person_id, role (pelaksana_tugas / narasumber / pihak_ditemui), urutan |
| **LegalBasis** | id, text (mis. "Instruksi Presiden Nomor 1 Tahun 2017 tentang GERMAS"), tags; dihubungkan ke kegiatan lewat ActivityLegalBasis |
| **Media** | id, activity_id, kind (photo/voice), local_path, storage_key, taken_at, lat/lng, duration, caption, include_in_report, transcript (Fase 4), upload_status |
| **Document** | id, title, file_type, storage_key, size, source (share/upload), available_offline |
| **Knowledge** | id, title, topic/tags, current_document_id, notes |
| **Report** | id, activity_id atau periode, template_id, content (JSON per bagian), generated_file_key, status, version |

Aturan teknis: semua ID berupa UUID yang dibuat di perangkat (supaya bisa membuat data saat offline), setiap tabel punya `updated_at` dan `deleted_at` (hapus lunak) untuk sinkronisasi.

## 4. Template laporan (berdasarkan contoh "Laporan Germas Tapin")

Contoh asli disimpan di `work360/contoh/LAPORAN GERMAS TAPIN.docx`. Template dibuat dari file Word ini sendiri (kop surat Bappeda, logo, gaya huruf, penomoran), lalu bagian isinya diganti placeholder. Hasil generate: file **.docx** yang tampilannya sama dengan laporan Anda sekarang.

| Bagian di laporan | Diisi dari | Cara mengisi |
|---|---|---|
| Judul: "LAPORAN PERJALANAN DINAS DALAM RANGKA …" | Activity.title | Otomatis |
| **I. Pendahuluan** — Umum/Latar belakang | Activity.background | Ditulis/diedit di web (Fase 4: draft AI dari bahan kegiatan) |
| — Landasan Hukum | Daftar dasar hukum pakai-ulang + nomor dan tanggal SPT + DPA | Pilih dari library dasar hukum; SPT & DPA diisi saat membuat kegiatan |
| — Maksud dan Tujuan | Activity.objectives (daftar) | Diisi di HP/web, bisa diambil dari TOR undangan |
| **II. Kegiatan yang Dilaksanakan** — nama, tanggal, tujuan, transportasi | Activity (title, tanggal mulai–selesai, lokasi/kabupaten, transport) | Otomatis |
| — Peserta | Daftar pelaksana tugas (tim perjalanan) | Pilih dari daftar rekan yang pernah ikut |
| **III. Hasil yang Dicapai** — kalimat pembuka | Hari, tanggal, tempat | Otomatis: "Kegiatan dilaksanakan pada Jum'at, 28 Agustus 2026, bertempat di …" |
| — Butir-butir hasil | Finding (jenis hasil) + catatan + transkrip suara | Catatan lapangan dirapikan di web menjadi butir bernomor |
| **IV. Kesimpulan, Saran dan Rekomendasi** | Finding (kesimpulan / rekomendasi) | Dari layar "Selesaikan Kegiatan", dirapikan di web |
| **V. Dokumentasi Kegiatan** | Foto yang ditandai "masuk laporan" | Otomatis, disusun 2 per baris dengan keterangan |
| **VI. Penutup** | Kalimat baku | Otomatis |
| Dibuat di / Pada tanggal | Kota kantor (default Banjarbaru) + tanggal laporan | Otomatis, bisa diubah |
| Tabel tanda tangan | Daftar pelaksana tugas | Otomatis, satu baris per orang |

Temuan penting dari contoh:
- Laporan mencatat **satu tim** (4 pelaksana), walau aplikasinya hanya Anda yang memakai. Jadi rekan perjalanan disimpan sebagai data orang (bukan akun pengguna).
- **Nomor SPT, DPA, dan transportasi** harus bisa dicatat sejak kegiatan dibuat, supaya laporan tidak menunggu data ini di kantor.
- **Landasan hukum** berulang antar kegiatan sejenis (mis. Inpres GERMAS), cocok disimpan sebagai library yang tinggal dipilih.

## 5. Arsitektur & stack yang disarankan

```text
 HP (Android/iOS)                         Web (laptop)
 Expo / React Native                      Next.js
 SQLite lokal + antrean unggah            ── baca/tulis langsung ──┐
        │  sinkron (PowerSync)                                      │
        └──────────────┬────────────────────────────────────────────┘
                       ▼
                 Supabase
      Postgres (data) · Auth (login) · Storage (foto, suara, dokumen)
                       │
          Fungsi server: generate .docx (Fase 2), AI (Fase 4)
```

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Mobile | **Expo (React Native, TypeScript)** | Satu kode untuk Android + iOS; dukungan kamera, perekam suara, share-intent, file offline sudah matang. |
| Web | **Next.js (TypeScript)** | Satu bahasa dengan mobile; tipe data dan validasi bisa dipakai bersama. |
| Backend | **Supabase** (Postgres + Auth + Storage) | Tidak perlu membangun server dari nol; ada paket gratis untuk mulai; tetap Postgres standar sehingga bisa pindah. |
| Offline sync | **PowerSync** (SQLite di HP ↔ Postgres) | Sinkron dua arah yang sudah jadi untuk Supabase; menangani antrean perubahan saat offline. Alternatif: WatermelonDB dengan endpoint sync sendiri. |
| File | Supabase Storage, antrean unggah di HP | Foto/suara disimpan lokal dulu, diunggah bertahap (kompresi foto, lanjut ulang jika putus). |
| Laporan | **docxtemplater** (template .docx dengan placeholder) | Hasil berupa Word asli yang bisa diedit dan sesuai format dinas. |
| AI (nanti) | Claude API untuk ringkasan/draft; layanan speech-to-text untuk transkripsi Bahasa Indonesia | Ditambahkan tanpa mengubah model data (kolom transcript/summary sudah disiapkan). |

Alternatif yang juga layak: **Flutter + Drift**, jika lebih memilih Dart. Rekomendasi tetap Expo + Next.js karena mobile dan web berbagi satu bahasa.

## 6. Pendekatan offline-first

1. Semua penulisan di HP masuk ke SQLite lokal lebih dulu; tampilan membaca dari lokal, jadi aplikasi selalu cepat.
2. Perubahan dicatat di antrean dan dikirim saat ada koneksi; indikator 🔄 menunjukkan jumlah yang belum tersinkron.
3. Konflik: untuk MVP satu pengguna, "perubahan terakhir menang" per field sudah cukup. Catatan teks panjang tidak ditimpa, versi lama disimpan.
4. File besar (foto, suara) dipisah dari data: data kegiatan tersinkron dulu, file menyusul. Foto dikompres (mis. sisi terpanjang 2048 px) dengan opsi simpan asli.
5. Dokumen dari server hanya diunduh ke HP jika ditandai "simpan offline" atau terkait kegiatan 7 hari ke depan, supaya penyimpanan HP tidak penuh.

## 7. Keamanan & privasi dasar

- Login email (atau Google); data per pengguna dengan Row Level Security di Postgres.
- File di storage privat, diakses lewat URL bertanda waktu.
- Data lokal di HP ikut terhapus saat logout; opsi kunci aplikasi dengan PIN/biometrik (Fase 2).

## 8. Urutan kerja yang disarankan

1. Tentukan repositori di akun GitHub pribadi (lihat bagian 9).
2. Prototipe layar (Beranda, Catat Aktivitas, Selesaikan Kegiatan, Report Center) untuk diuji alurnya sebelum coding.
3. Siapkan repositori (monorepo: `apps/mobile`, `apps/web`, `packages/shared`) dan proyek Supabase.
4. Bangun Fase 1, uji langsung di lapangan 1–2 minggu, baru lanjut Fase 2.

## 9. Keputusan

Sudah diputuskan (25 September 2026):
1. **Pengguna:** Anda sendiri. Rekan perjalanan dicatat sebagai data, bukan akun.
2. **Format laporan:** Word (.docx).
3. **Perangkat:** Android dulu. iOS tidak dikerjakan di awal (kode tetap bisa dipakai nanti). Aplikasi dipasang langsung dari file APK/EAS tanpa Play Store.
4. **Contoh laporan:** sudah diterima, template di bagian 4 disesuaikan.

Masih terbuka:
- **Tempat kode:** akun GitHub pribadi Anda yang lain. Perlu nama akun dan nama repositori, serta akun itu dihubungkan ke Claude agar kode bisa disimpan di sana.
