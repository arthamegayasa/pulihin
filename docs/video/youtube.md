# Unggahan YouTube: Video Demo PULIHIN

Visibilitas: **Unlisted** (Bab 14). Berkas: `video/out/pulihin-demo-final.mp4` (tanpa subtitle tertanam; unggah `docs/video/subtitle-en.srt` sebagai CC) atau `video/out/pulihin-demo-final-en.mp4` (subtitle Inggris tertanam).

<!-- OTOMATIS:DURASI -->
Durasi: **4:22** (262,0 dtk, dari `npm run srt`).
<!-- /OTOMATIS:DURASI -->

## Judul

```
PULIHIN: Pendamping Rehabilitasi Stroke di Rumah (Demo Prototype)
```

Alternatif (di bawah batas 100 karakter):

```
PULIHIN – Pendamping Rehabilitasi Stroke di Rumah | .id Developer Day Indonesia 2026
```

## Deskripsi

Deskripsi dibuat oleh `npm run srt` (dua kalimat produk, kategori, alamat, penafian prototype, pengungkapan lengkap, bab). Alamatnya = host yang saat ini aktif (`urlPublik` di `src/config/identitas.ts`), sama dengan yang diucapkan narator dan tampil di layar penutup. Setelah domain final pulihinapp.id mengarah ke Vercel, ubah `urlPublik`, lalu jalankan `npm run narasi && npm run scan && npm run srt` dan render ulang.

<!-- OTOMATIS:DESKRIPSI -->
```
PULIHIN adalah prototype aplikasi web pendamping rehabilitasi stroke di rumah: kamera ponsel biasa menghitung repetisi latihan dan memberi koreksi gerakan dengan suara Bahasa Indonesia, diproses langsung di perangkat. Keluarga melihat kepatuhan dan tren skor, terapis menyusun program dari dashboard, dan pasien dengan afasia berlatih menyebut kata sehari-hari.

Kategori lomba: .id Developer Day Indonesia 2026 - Health and Wellbeing
Coba prototype: https://pulihin.vercel.app/app

Penafian dan keterbukaan:
- Prototype kompetisi, bukan alat kesehatan teregulasi, bukan alat diagnosis, dan bukan pengganti terapis.
- Adegan pasien dan keluarga (Pak Budi dan Rina) adalah video buatan AI (HeyGen), bukan pasien sungguhan; label di layar setiap kali tampil. Video kamera di layar ponsel saat sesi latihan juga dibuat dengan AI, lalu diputar sebagai kamera ke aplikasi PULIHIN yang asli; skeleton, hitungan, koreksi, dan skor dihasilkan aplikasi itu sendiri.
- Narasi: suara sintetis ElevenLabs Eleven v4.
- Musik latar: dibuat dengan AI, Google Lyria 3 Pro.
- Semua layar aplikasi adalah rekaman asli aplikasi yang berjalan di pulihin.vercel.app. Suara aplikasi di video adalah klip suara aplikasi itu sendiri, pada detik yang sama saat aplikasi memutarnya.
- Data demo: "Pak Budi" dan "Rina" adalah nama samaran, dan seluruh data yang tampil adalah data demo.
- Angka di awal video: Kemenkes (rilis 25 Okt 2024), Survei Kesehatan Indonesia 2023, Profil Kesehatan Indonesia 2023.

Bab video:
0:00 Masalah di rumah
0:42 Satu gerakan kecil
1:41 Satu sesi utuh
2:32 Keluarga dan bicara
3:34 Terapis dan penutup

Subtitle Bahasa Inggris dan Indonesia tersedia (CC).
```
<!-- /OTOMATIS:DESKRIPSI -->

## Tag

```
PULIHIN, rehabilitasi stroke, latihan stroke di rumah, pasca stroke, afasia, terapi wicara, pendamping pasien, caregiver, keluarga pasien, kesehatan digital, Bahasa Indonesia, pose estimation, MediaPipe, PWA, stroke rehabilitation, aphasia, .id Developer Day Indonesia 2026, Health and Wellbeing
```

## Setelan unggah

- Visibilitas: Unlisted. Untuk anak-anak: Tidak. Bahasa video: Bahasa Indonesia. Kategori: Sains & Teknologi.
- Konten sintetis: YouTube Studio → "Konten yang diubah atau sintetis" → **Ya** (orang yang tampak nyata dibuat dengan AI: adegan pasien dan keluarga HeyGen, video kamera AI di sesi latihan; narasi sintetis; musik AI).
- Subtitle: YouTube Studio → Subtitle → Tambah bahasa → Inggris → Unggah file → "Dengan pengaturan waktu" → `docs/video/subtitle-en.srt`. Opsional: Indonesia → `subtitle-id.srt`. Keduanya dibuat ulang oleh `npm run srt` (folder `video/`) dari waktu audio terukur, termasuk suara penting aplikasi (penanda "[App]").
- Thumbnail: frame asli dari video, misalnya pesan koreksi bahu dengan skeleton (still `video/out/stills/` pada momen adegan `s11-koreksi`). Jangan membuat thumbnail dengan isi aplikasi rekaan.
- Tautan YouTube unlisted: [DIISI setelah diunggah].
