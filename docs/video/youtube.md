# Unggahan YouTube: Video Demo PULIHIN

Visibilitas: **Unlisted** (Bab 14). Berkas: `video/out/pulihin-demo-final.mp4` (tanpa subtitle tertanam; unggah `docs/video/subtitle-en.srt` sebagai CC) atau `video/out/pulihin-demo-final-en.mp4` (subtitle Inggris tertanam).

<!-- OTOMATIS:DURASI -->
Durasi: **4:03** (243,6 dtk, dari `npm run srt`).
<!-- /OTOMATIS:DURASI -->

## Judul

```
PULIHIN: Pendamping Rehabilitasi Stroke di Rumah (Demo Prototype)
```

Alternatif (84 karakter, di bawah batas 100):

```
PULIHIN – Pendamping Rehabilitasi Stroke di Rumah | .id Developer Day Indonesia 2026
```

## Deskripsi

Deskripsi dibuat oleh `npm run srt`. Alamatnya = host yang saat ini aktif (`urlPublik` di `src/config/identitas.ts`), sama dengan yang diucapkan narator dan tampil di layar penutup. Setelah domain final pulihinapp.id mengarah ke Vercel, ubah `urlPublik`, lalu jalankan `npm run narasi && npm run scan && npm run srt` dan render ulang.

<!-- OTOMATIS:DESKRIPSI -->
```
PULIHIN adalah prototype aplikasi web pendamping rehabilitasi stroke di rumah. Kamera ponsel biasa menghitung repetisi latihan dan memberi koreksi gerakan dengan suara Bahasa Indonesia, diproses langsung di perangkat; keluarga melihat kepatuhan dan tren skor, dan pasien dengan afasia berlatih menyebut kata sehari-hari dalam Bahasa Indonesia.

Kategori lomba: .id Developer Day Indonesia 2026 - Health and Wellbeing
Coba prototype: https://pulihin.vercel.app/app

Penafian dan keterbukaan:
- Prototype kompetisi, bukan alat kesehatan teregulasi, bukan alat diagnosis, dan bukan pengganti terapis.
- Peragaan dengan karakter 3D, bukan pasien sungguhan. Karakter dirender di Blender, lalu videonya diputar sebagai kamera ke aplikasi PULIHIN yang asli; skeleton, hitungan, dan pesan koreksi di layar dihasilkan aplikasi itu sendiri.
- Narasi: suara sintetis (Microsoft Azure neural, id-ID).
- Suara aplikasi disuarakan ulang: pesan koreksi diucapkan ulang dengan kata dan waktu persis seperti yang tampil di aplikasi, karena suara peramban tidak ikut terekam.
- Data demo: "Pak Budi, 58 tahun" adalah nama samaran, dan seluruh data yang tampil adalah data demo.
- Angka di awal video: Kemenkes (rilis 25 Okt 2024), Survei Kesehatan Indonesia 2023, Profil Kesehatan Indonesia 2023.

Bab video:
0:00 Masalah klinis
0:33 Satu gerakan kecil
1:19 Satu sesi utuh
2:11 Keluarga dan afasia
3:08 Terapis dan penutup

Subtitle Bahasa Inggris tersedia (CC).
```
<!-- /OTOMATIS:DESKRIPSI -->

## Tag

```
PULIHIN, rehabilitasi stroke, latihan stroke di rumah, pasca stroke, afasia, terapi wicara, pendamping pasien, caregiver, keluarga pasien, kesehatan digital, Bahasa Indonesia, pose estimation, MediaPipe, PWA, stroke rehabilitation, aphasia, .id Developer Day Indonesia 2026, Health and Wellbeing
```

## Setelan unggah

- Visibilitas: Unlisted. Untuk anak-anak: Tidak. Bahasa video: Bahasa Indonesia. Kategori: Sains & Teknologi.
- Konten sintetis: YouTube Studio → "Konten yang diubah atau sintetis" → **Ya** (karakter 3D dan narasi sintetis yang tampak realistis).
- Subtitle: YouTube Studio → Subtitle → Tambah bahasa → Inggris → Unggah file → "Dengan pengaturan waktu" → `docs/video/subtitle-en.srt`. Opsional: Indonesia → `subtitle-id.srt`. Keduanya dibuat ulang oleh `npm run srt` (folder `video/`) dari waktu audio narasi yang terukur.
- Thumbnail: frame asli dari video, misalnya hitungan "5 / 10" dengan skeleton (still `video/out/stills/` pada momen adegan `s10-lima`). Jangan membuat thumbnail dengan isi aplikasi rekaan.
- Tautan YouTube unlisted: [DIISI setelah diunggah].
