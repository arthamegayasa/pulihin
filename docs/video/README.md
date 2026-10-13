# Video Demo PULIHIN: Cara Merakit

Video demo (Deliverable B, maksimal 5 menit, 1080p, 16:9) dirakit secara terprogram dengan [Remotion](https://www.remotion.dev/) di folder `video/`. Folder itu adalah proyek terpisah dengan `package.json` dan `node_modules` sendiri; tidak memengaruhi aplikasi di root repo.

## Isi

| Berkas | Fungsi |
|---|---|
| `video/src/timeline.ts` | **Satu-satunya sumber kebenaran**: adegan, timecode, tata letak, slot rekaman, teks layar, narasi Indonesia, subtitle Inggris, momen screenshot. |
| `docs/video/naskah-id.md` | Naskah narasi final (dibuat otomatis dari timeline, jumlah kata tercantum). |
| `docs/video/subtitle-en.srt`, `subtitle-id.srt` | Subtitle Inggris (untuk YouTube) dan Indonesia (dibuat otomatis). |
| `docs/video/shotlist.md` | Checklist hari perekaman, setelan ponsel/tripod/perekam layar, daftar berkas, shot per adegan, rencana cadangan, persetujuan pemeran, tabel audit jeda 30 detik. |
| `docs/video/youtube.md` | Judul, deskripsi, tag, setelan unggah. |
| `video/public/footage/` | Tempat rekaman (nama berkas persis seperti di shotlist). |
| `video/public/audio/` | Narasi per adegan `<id-adegan>.mp3`, atau satu berkas `narasi-lengkap.mp3`; musik opsional `musik.mp3`. |
| `video/out/` | Hasil render (diabaikan git). |

## Prasyarat

- Node.js 22.18 atau lebih baru (skrip memuat `timeline.ts` langsung lewat type stripping Node; diuji dengan Node 24.19).
- Sekali saja: `cd video && npm install`. Render pertama mengunduh Chrome Headless Shell (sekitar 120 MB) secara otomatis. FFmpeg/ffprobe sudah disertakan Remotion; tidak perlu dipasang terpisah.

## Alur kerja

Semua perintah dijalankan di folder `video/`.

1. **Rekam** sesuai `docs/video/shotlist.md`.
2. **Salin rekaman** ke `video/public/footage/` dengan nama berkas persis (misalnya `layar-02-sesi-tekuk-siku.mp4`). Narasi (bila direkam terpisah) ke `video/public/audio/`.
3. **Pindai:** `npm run scan`. Menulis `src/footage-manifest.json` dan melaporkan slot yang ADA/KOSONG, rekaman yang terlalu pendek, serta rekaman layar yang mendatar. Slot kosong tampil sebagai kartu **PLACEHOLDER** (nama shot, apa yang harus direkam, durasi), sehingga draf lengkap selalu dapat dirender.
4. **Potong:** di `src/timeline.ts`, sesuaikan `mulaiDi` (detik di dalam berkas) per adegan dan, bila perlu, `ke` pada `sorot` (posisi vertikal label penunjuk). Setelah narasi direkam, isi `mulai`/`selesai` per baris narasi agar subtitle mengikuti suara.
5. **Pratinjau:** `npm run studio` (membuka Remotion Studio di peramban).
6. **Subtitle, naskah, shotlist:** `npm run srt`. Membuat ulang `docs/video/subtitle-en.srt`, `subtitle-id.srt`, `naskah-id.md`, dan tabel OTOMATIS di `shotlist.md`. Skrip gagal bila naskah lebih dari 650 kata, video lebih dari 300 detik, ada jendela 30 detik tanpa momen screenshot, atau ada isyarat subtitle yang melanggar aturan keterbacaan (maksimal 42 karakter per baris, 2 baris, 1–6 detik per isyarat).
7. **Audit jeda:** `npm run still` merender PNG di setiap momen screenshot (dan detik 5, 45, 100, 200, 297) ke `video/out/stills/`. Detik tertentu: `npm run still -- 96 140`. Centang tabel audit di `shotlist.md`.
8. **Render:** `npm run render` → `video/out/pulihin-demo-draft.mp4` (H.264, 1920x1080, 30 fps, subtitle Inggris tertanam). Tanpa subtitle tertanam: `npm run render:tanpa-subtitle` → `video/out/pulihin-demo-tanpa-subtitle.mp4` (unggah SRT sebagai CC di YouTube). Segmen pendek untuk cek cepat: `npx remotion render src/index.ts PulihinDemo out/segmen.mp4 --frames=0-150`.

## Aturan audio

- Bila ada `public/audio/narasi-lengkap.mp3`, berkas itu diputar dari 0:00 dan narasi per adegan diabaikan. Bila tidak, `public/audio/<id-adegan>.mp3` diputar 0,4 detik setelah adegan dimulai.
- Suara asli talking head dokter dipakai bila tidak ada berkas narasi untuk adegan itu; bila ada (misalnya rekaman mikrofon lav terpisah), suara kamera dibisukan agar tidak dobel.
- Suara asli rekaman dipakai pada dua adegan bukti: suara koreksi aplikasi (1:30–1:44, dari rekaman layar) dan suara pemeran menyebut kata (3:42–4:00, dari shot lebar). Naskah menyisakan jeda di sana.
- Musik latar opsional: taruh `public/audio/musik.mp3`. Volumenya 12% dari narasi (`VOLUME_MUSIK`), di bawah batas 15% Bab 14.3. Tidak ada aset musik bawaan.

## Tata letak dan desain

- Rekaman layar ponsel tampil di bingkai ponsel di sisi kanan, rasio aslinya dipertahankan (letterbox), tidak pernah ditarik atau memenuhi lebar layar (Bab 14.3).
- Subtitle tertanam berada di kiri bawah, jauh dari bingkai ponsel, sehingga tidak menutupi angka skor atau pesan koreksi.
- Label penunjuk (misalnya "Skor sesi") berada di samping ponsel, tidak di atas layar aplikasi.
- Palet #0B4F4A / #EAF2F0 / #C46A1B / #1A2B2E di atas putih, font Plus Jakarta Sans (dimuat lokal dari `@fontsource-variable/plus-jakarta-sans`), transisi hanya crossfade lembut.
- Adegan 4:00–4:25: `ADEGAN_TERAPIS = 'klinisi'` (dashboard klinisi P1) atau `'streak'` (kalender kepatuhan dan streak) di `timeline.ts`; jalankan `npm run srt` setelah mengubahnya.

## Aturan etika (Bab 14.4, 15.1, 17)

- Wajah dokter dan gerakan pasien direkam oleh manusia. **Dilarang** memakai avatar buatan AI, wajah atau suara sintetis yang berpura-pura menjadi dokter, atau rekaman stok yang berpura-pura menjadi pasien.
- Pasien demo adalah pemeran. Label "Peragaan oleh pemeran" tampil setiap kali pemeran terlihat, diucapkan di narasi, dan ditulis di deskripsi YouTube. Jangan menyebut pemeran sebagai pasien asli.
- Isi aplikasi di video hanya berasal dari rekaman layar asli. Jangan menempel skor, hitungan, atau pesan koreksi rekaan saat menyunting. Kartu PLACEHOLDER hanya untuk draf dan harus hilang di versi final (`npm run scan` harus melaporkan semua slot ADA).
- Tanpa klaim diagnosis, prognosis, atau kesembuhan; PULIHIN adalah prototype kompetisi, bukan alat kesehatan teregulasi.
- Tanpa notifikasi pribadi, nomor telepon, email pribadi, atau data pasien asli di frame mana pun. Mode Jangan Ganggu aktif selama perekaman.

## Alat opsional yang meningkatkan kualitas

- **Remotion (sudah terpasang)** cukup untuk merakit, memberi teks, subtitle tertanam, dan merender; tidak perlu editor video lain.
- **Perekam layar bawaan Android** untuk rekaman layar 1080x2400 dengan suara internal.
- **Mikrofon lav (klip) eksternal** untuk talking head dan narasi; perbedaan kejernihan suara paling terasa dibanding mikrofon bawaan ponsel.
- **Lampu dari depan** (lampu LED/ring light sederhana) bila cahaya ruangan kurang; juga membantu pose estimation.
- **Tripod dengan penjepit ponsel** untuk ponsel uji dan kamera shot lebar.
- **Editor audio** (misalnya Audacity, gratis) untuk memotong jeda dan menyamakan volume narasi sebelum disimpan sebagai MP3.
