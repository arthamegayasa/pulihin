# Video Demo PULIHIN: Produksi Tanpa Rekaman Manusia

Video demo (Deliverable B, maksimal 5 menit, 1080p, 16:9) dirakit secara terprogram dengan [Remotion](https://www.remotion.dev/) di folder `video/` (proyek terpisah dengan `package.json` sendiri). Keputusan pemilik produk (15 Okt 2026): **tidak ada rekaman manusia dan tidak ada dokter**.

- Pemeran pasien = **karakter 3D** bergaya patung digital yang dirender di Blender. Render itu diputar sebagai kamera Chrome (`--use-fake-device-for-media-stream --use-file-for-fake-video-capture`) ke aplikasi PULIHIN produksi yang asli, sehingga skeleton, hitungan, dan pesan koreksi di layar benar-benar dihasilkan aplikasi. Label **"Peragaan dengan karakter 3D, bukan pasien sungguhan"** tampil setiap kali karakter terlihat.
- Narasi = **suara sintetis** (Microsoft Azure neural, `id-ID-ArdiNeural`). Pembuka 0:00–0:30 = tipografi data bersumber (`docs/bahan-paper.md`, label sumber di layar) + b-roll 3D.
- Suara aplikasi (TTS peramban) tidak terekam pada peramban otomatis. Pesan koreksi **disuarakan ulang** dengan kata persis dan pada detik persis dari `sesi-meta.json`, dengan warna speaker ponsel (`id-ID-GadisNeural`). Tidak ada bunyi yang menyiratkan fitur yang tidak ada.
- Semua pengungkapan ada di layar penutup dan deskripsi YouTube (`youtube.md`).

## Isi

| Berkas | Fungsi |
|---|---|
| `video/src/timeline.ts` | **Satu-satunya sumber kebenaran**: adegan, durasi minimal, tata letak, slot rekaman, teks layar, data bersumber, narasi (ID, EN, ucapan TTS), momen screenshot. Waktu dihitung otomatis dari durasi audio terukur dan peristiwa `sesi-meta.json`. |
| `video/src/terukur.ts` | Dibuat `npm run scan`: durasi setiap MP3 narasi/SFX (ffprobe) dan isi `video/blender/out/sesi-meta.json`. |
| `src/config/identitas.ts` (aplikasi) | Alamat aktif (`urlPublik` → host yang diucapkan dan ditampilkan) dan nama tim (layar penutup). |
| `video/scripts/narasi.mjs` | `npm run narasi`: satu MP3 per baris narasi (`public/audio/narasi/<id>.mp3`) dan suara aplikasi (`public/audio/aplikasi/<id>.mp3`). Penyedia: `azure-edge` (bawaan) atau `--penyedia=elevenlabs`. |
| `video/scripts/rekam-layar.mjs` | `npm run rekam-layar`: rekaman layar ASLI aplikasi produksi untuk slot non-kamera (`layar-01`, `layar-03` sampai `layar-06`). Jadwal ketukannya juga menjadi waktu bunyi ketukan (`KETUKAN` di timeline.ts). |
| `video/blender/`, `video/scripts/rekam-sesi-3d.mjs` | Karakter 3D, render, dan rekaman sesi kamera dengan kamera palsu. Lihat `docs/video/produksi-3d.md`. |
| `video/src/components/Ponsel3D.tsx` | Ponsel 3D (react-three-fiber lewat `@remotion/three`): badan bersudut bulat, bayangan studio lembut, layar = rekaman asli sebagai tekstur video (`@remotion/media` `<Video headless>`), gerak kamera sangat pelan. Satu kanvas per blok adegan ponsel agar badan ponsel diam dan hanya layar yang crossfade. |
| `docs/video/naskah-id.md` | Naskah final (otomatis), jumlah kata, timecode terukur. |
| `docs/video/subtitle-en.srt`, `subtitle-id.srt` | Subtitle dari waktu audio terukur (otomatis). |
| `docs/video/shotlist.md` | Checklist produksi + tabel otomatis berkas, adegan, audit jeda 30 detik. |
| `docs/video/youtube.md` | Judul, deskripsi dengan pengungkapan, bab (otomatis), setelan unggah. |
| `video/public/audio/sfx/` | SFX siap pakai: ketukan, transisi, suasana rumah, `repetisi` (hanya tipografi data), `berhasil` (layar penutup). |

## Prasyarat

- Node.js 22.18+ (skrip memuat `timeline.ts` lewat type stripping), `cd video && npm install`.
- ffmpeg/ffprobe (PATH atau bawaan Remotion).
- Narasi `azure-edge`: Python dengan modul `edge-tts` (`pip install edge-tts`; bila dipasang ke folder lain, set `PYTHONPATH`). Narasi `elevenlabs`: kunci dengan izin `text_to_speech` di `ELEVENLABS_API_KEY_TTS` (atau `ELEVENLABS_API_KEY`) dan `ELEVENLABS_VOICE_ID`; paralel maksimal 2.
- Render: Chrome Headless Shell (diunduh Remotion) dengan WebGL ANGLE (`--gl=angle`, sudah di `remotion.config.ts` dan skrip render).

## Alur kerja (folder `video/`)

1. **Footage**: Blender3D mengisi `public/footage/` dengan render 3D + `layar-02-sesi-tekuk-siku.mp4` dan menulis `blender/out/sesi-meta.json`; `npm run rekam-layar` membuat rekaman layar lainnya. Footage ponsel ≤ 720 px lebar, lainnya ≤ 1920 px, keyframe tiap 1 dtk (hemat memori render).
2. **Narasi**: `npm run narasi` (cache per baris; `--paksa` untuk membuat ulang semua).
3. **Ukur**: `npm run scan` → `src/footage-manifest.json` + `src/terukur.ts`; melaporkan slot KOSONG/terlalu pendek dan baris tanpa audio. Slot kosong dirender sebagai kartu PLACEHOLDER.
4. **Teks**: `npm run srt` → SRT EN/ID, `naskah-id.md`, blok otomatis `shotlist.md` dan `youtube.md`. Gagal bila naskah > 650 kata, video > 300 dtk, layar penutup < 5 dtk, label karakter hilang, ada jendela 30 dtk tanpa momen screenshot, atau isyarat subtitle melanggar keterbacaan (≤ 42 karakter/baris, 2 baris, 1–6 dtk).
5. **Audit jeda**: `npm run still` → PNG tiap 30 dtk dan di setiap momen ke `out/stills/`; periksa satu per satu.
6. **Render** (jangan bersamaan dengan render Blender): `npm run render:final` → `out/pulihin-demo-final.mp4` (tanpa subtitle tertanam) dan `npm run render:final-en` → `out/pulihin-demo-final-en.mp4` (subtitle Inggris tertanam). H.264 + AAC 192 kbps, 1920x1080, 30 fps, `--concurrency=2`.

## Cara waktu disusun

- Setiap baris narasi diletakkan berurutan di adegannya (jeda awal 0,6 dtk, antar baris 0,5 dtk, akhir 0,9 dtk); adegan sepanjang `max(durasi minimal, narasi)`. Mengganti suara atau teks cukup dengan `npm run narasi && npm run scan && npm run srt`.
- Adegan sesi kamera memakai detik di dalam `layar-02` yang **sama** dengan `kamera-sesi-lebar` (sinkron frame-ke-frame) dan diputar berurutan tanpa mundur: `s10-lima` dijangkarkan pada `repetisiDetik[4]` (angka berubah menjadi 5 saat narator mengucapkan "lima dari sepuluh"), `s11-koreksi` pada `koreksi[0].mulaiDetik` (suara aplikasi yang disuarakan ulang dimulai tepat di detik itu), `s13-sepuluh` berlangsung sampai `selesaiDetik` + 2 dtk. Adegan sebelum jangkar diperpanjang (maks. 8 dtk) agar sambungan tanpa lompatan.
- Tanpa `sesi-meta.json`, timeline memakai perkiraan dan `npm run srt` memberi peringatan (draf saja).

## Desain

- Palet #0B4F4A / #EAF2F0 / #C46A1B / #1A2B2E di atas putih, Plus Jakarta Sans lokal, hanya crossfade lembut (14 frame), gerak kamera ≤ 3%.
- Rekaman layar ponsel di ponsel 3D sisi kanan, rasio asli (tidak ditarik). Dashboard Terapis di bingkai peramban dengan perspektif 3D halus.
- Label penunjuk di samping ponsel, posisinya diproyeksikan dari pose ponsel 3D (`titikLayar`). Subtitle tertanam kiri bawah, tidak menutupi skor atau pesan koreksi.
- Grade render 3D seragam (sedikit lembut, vinyet tipis). Suasana rumah 7% di bawah adegan 3D; ketukan pada waktu ketukan rekaman; transisi lembut antar tahap. **Tanpa musik.**

## Aturan kejujuran

- Isi layar aplikasi hanya dari aplikasi asli yang berjalan (produksi https://pulihin.vercel.app). Tidak ada skor, hitungan, atau pesan koreksi yang ditempel saat menyunting.
- Angka hanya dari `docs/bahan-paper.md` atau README, dengan label sumber. Tanpa klaim diagnosis, prognosis, atau kesembuhan. Prototype kompetisi, bukan alat kesehatan teregulasi. Data demo, nama samaran.
- Latihan Bicara direkam dalam Mode Latihan Mandiri (pengenal suara Chrome tidak tersedia di peramban otomatis), jadi narasi menyebut penilaian oleh pendamping, bukan pengenalan suara.
- Tidak ada avatar AI yang berbicara, tidak ada dokter rekaan, tidak ada rekaman stok yang berpura-pura menjadi pasien.
