# Video Demo PULIHIN: Cara Merakit

Video demo (Deliverable B, maksimal 5 menit, 1080p, 16:9) dirakit secara terprogram dengan [Remotion](https://www.remotion.dev/) di folder `video/`. Folder itu adalah proyek terpisah dengan `package.json` dan `node_modules` sendiri; tidak memengaruhi aplikasi di root repo.

## Isi

| Berkas | Fungsi |
|---|---|
| `video/src/timeline.ts` | **Satu-satunya sumber kebenaran**: adegan, timecode, tata letak, slot rekaman, teks layar, narasi Indonesia, subtitle Inggris, momen screenshot. |
| `src/config/identitas.ts` (aplikasi) | Nama tim dan narasumber klinis untuk layar penutup dan lower third dokter; diimpor oleh `timeline.ts`. |
| `video/scripts/rekam-layar.mjs` | Merekam layar ASLI aplikasi untuk semua slot rekaman layar non-kamera (draf). Lihat bagian "Rekaman layar otomatis". |
| `video/scripts/tangkap-paper.mjs` | Memotret empat layar paper ke `docs/screenshots/` (Bab 13.2). Lihat `docs/screenshots/README.md`. |
| `docs/video/naskah-id.md` | Naskah narasi final (dibuat otomatis dari timeline, jumlah kata tercantum). |
| `docs/video/subtitle-en.srt`, `subtitle-id.srt` | Subtitle Inggris (untuk YouTube) dan Indonesia (dibuat otomatis). |
| `docs/video/shotlist.md` | Checklist hari perekaman, setelan ponsel/tripod/perekam layar, daftar berkas, shot per adegan, rencana cadangan, persetujuan pemeran, tabel audit jeda 30 detik. |
| `docs/video/youtube.md` | Judul, deskripsi, tag, setelan unggah. |
| `video/public/footage/` | Tempat rekaman (nama berkas persis seperti di shotlist). Tidak masuk git (`video/.gitignore`). |
| `video/public/audio/` | Narasi per adegan `<id-adegan>.mp3`, atau satu berkas `narasi-lengkap.mp3`; musik opsional `musik.mp3`. |
| `video/out/` | Hasil render dan berkas kerja rekaman (diabaikan git). |

## Prasyarat

- Node.js 22.18 atau lebih baru (skrip memuat `timeline.ts` langsung lewat type stripping Node; diuji dengan Node 24.19).
- Sekali saja: `cd video && npm install`. Render pertama mengunduh Chrome Headless Shell (sekitar 120 MB) secara otomatis. FFmpeg/ffprobe sudah disertakan Remotion; tidak perlu dipasang terpisah.
- Untuk `npm run rekam-layar` dan `npm run paper` saja: Google Chrome atau Chrome for Testing (dicari otomatis di `~/.cache/puppeteer/chrome`, atau set `CHROME_PATH`) dan ffmpeg (PATH, atau ffmpeg bawaan Remotion). Paket `puppeteer-core` sudah ada di `video/package.json`; tidak mengunduh peramban.

## Alur kerja

Semua perintah dijalankan di folder `video/`.

1. **Rekam** sesuai `docs/video/shotlist.md`. Untuk draf, rekaman layar non-kamera dapat dibuat otomatis dari aplikasi asli: `npm run rekam-layar` (lihat di bawah).
2. **Salin rekaman** ke `video/public/footage/` dengan nama berkas persis (misalnya `layar-02-sesi-tekuk-siku.mp4`). Narasi (bila direkam terpisah) ke `video/public/audio/`.
3. **Pindai:** `npm run scan`. Menulis `src/footage-manifest.json` dan melaporkan slot yang ADA/KOSONG, rekaman yang terlalu pendek, serta rekaman layar ponsel yang mendatar atau rekaman kamera/desktop yang tegak. Slot kosong tampil sebagai kartu **PLACEHOLDER** berisi instruksi perekaman (apa yang direkam, siapa yang merekam, nama berkas, durasi), sehingga draf lengkap selalu dapat dirender.
4. **Potong:** di `src/timeline.ts`, sesuaikan `mulaiDi` (detik di dalam berkas) per adegan dan, bila perlu, `ke` pada `sorot` (posisi vertikal label penunjuk). Setelah narasi direkam, isi `mulai`/`selesai` per baris narasi agar subtitle mengikuti suara.
5. **Pratinjau:** `npm run studio` (membuka Remotion Studio di peramban).
6. **Subtitle, naskah, shotlist:** `npm run srt`. Membuat ulang `docs/video/subtitle-en.srt`, `subtitle-id.srt`, `naskah-id.md`, dan tabel OTOMATIS di `shotlist.md`. Skrip gagal bila naskah lebih dari 650 kata, video lebih dari 300 detik, ada jendela 30 detik tanpa momen screenshot, atau ada isyarat subtitle yang melanggar aturan keterbacaan (maksimal 42 karakter per baris, 2 baris, 1–6 detik per isyarat).
7. **Audit jeda:** `npm run still` merender PNG di setiap 30 detik (0:30, 1:00, ... 4:30), di setiap momen screenshot, dan di detik 5 dan 297 ke `video/out/stills/`. Detik tertentu: `npm run still -- 96 140`. Centang tabel audit di `shotlist.md`.
8. **Render:** `npm run render` → `video/out/pulihin-demo-draft.mp4` (H.264, 1920x1080, 30 fps, subtitle Inggris tertanam). Tanpa subtitle tertanam: `npm run render:tanpa-subtitle` → `video/out/pulihin-demo-tanpa-subtitle.mp4` (unggah SRT sebagai CC di YouTube). Segmen pendek untuk cek cepat: `npx remotion render src/index.ts PulihinDemo out/segmen.mp4 --frames=0-150`.

## Rekaman layar otomatis (draf)

`npm run rekam-layar` merekam aplikasi yang **sedang berjalan** (bawaan `https://pulihin.vercel.app`, atau `--url=http://127.0.0.1:5173`) dengan Chrome tanpa jendela, lalu menyimpan MP4 H.264 30 fps ke `video/public/footage/` dengan nama slot di `timeline.ts`. Satu berkas saja: `npm run rekam-layar -- --hanya=layar-04-keluarga.mp4`. Butuh Chrome (otomatis dicari di cache Puppeteer, atau `CHROME_PATH=...`) dan ffmpeg (PATH, atau ffmpeg bawaan Remotion).

| Berkas | Isi | Durasi | Ukuran (13 Okt 2026) |
|---|---|---|---|
| `layar-01-beranda-detail.mp4` | 1080x2400: Beranda sebelum latihan, ketuk Tekuk Siku, Detail Latihan, gulir ke Utamakan keselamatan | 21,5 dtk | 1,0 MB |
| `layar-03-ringkasan-beranda.mp4` | 1080x2400: Ringkasan Sesi, Rincian skor, saran dan kalimat bukan diagnosis, Kembali ke Beranda (Tekuk Siku selesai) | 51 dtk | 1,8 MB |
| `layar-04-keluarga.mp4` | 1080x2400: Untuk Keluarga: tanda perlu perhatian, grafik 7 hari, skor 14 hari, Salin Ringkasan Mingguan dan pesan "Ringkasan disalin" | 31 dtk | 1,9 MB |
| `layar-05-afasia.mp4` | 1080x2400: Latihan Bicara, Mode Latihan Mandiri, Benda di Rumah, Dengar, Sudah Benar, "Benar!", Kata Berikutnya | 31,5 dtk | 0,8 MB |
| `layar-06-klinisi.mp4` | 1920x1080: Dashboard Terapis, Pak Budi, Tambah Luruskan Tungkai, Simpan Resep, Lihat sebagai pasien | 26 dtk | 3,4 MB |

Cara kerjanya, supaya jujur dan dapat diulang:

- **Perangkat.** Ponsel: viewport 360x800 CSS px dengan DPR 3, hasil tepat 1080x2400 (ponsel Android kelas bawah acuan Bab 17.4). Desktop terapis: 1280x720 CSS px dengan DPR 1,5, hasil tepat 1920x1080. Chrome dijalankan dengan `--force-device-scale-factor` karena tanpa itu screencast hanya 360x800 (buram setelah diperbesar). Frame CDP screencast disusun ulang ke 30 fps menurut stempel waktunya, sehingga tempo ketukan dan guliran sama dengan aslinya.
- **Data.** Setiap rekaman memakai profil peramban baru dan menyiapkan datanya lewat tombol aplikasi: Pilih Peran > Saya Pasien, Pengaturan > Petunjuk suara: Mati, Pengaturan > Data Demo > "Ada tanda perlu perhatian" > Reset Data Demo. Untuk adegan setelah sesi (Ringkasan, Beranda selesai, Untuk Keluarga, Latihan Bicara, Dashboard Terapis), skrip mengekspor data lewat Pengaturan > Ekspor Data (JSON), menambahkan **satu** sesi Tekuk Siku hari ini yang selesai (berlabel demo, `isDemo: true`, 10/10, satu koreksi bahu pada repetisi ke-7), lalu memulihkannya lewat Pengaturan > Impor Data (JSON). Skor, rincian, dan saran sesi itu dihitung oleh fungsi skor aplikasi sendiri (`src/features/pose/scoring.ts`, dimuat oleh `scripts/lib/skor-aplikasi.mjs`) dari catatan repetisinya. Salinan berkas yang diimpor: `video/out/rekam-layar/cadangan-demo-sesi-tekuk-siku.json`. Sesi ini **data demo**, bukan hasil sesi kamera; di video final, Ringkasan Sesi sebaiknya berasal dari sesi kamera nyata yang direkam bersama `layar-02`.
- **Interaksi.** Ketukan diberi penanda lingkaran abu-abu singkat (setara "Tampilkan ketukan" di Opsi Developer Android) dan, pada desktop, panah kursor; keduanya tidak menangkap ketukan dan tidak mengubah isi aplikasi. Guliran memakai easing pelan. Jadwal ketukan (detik di dalam berkas) ditulis di `rekam-layar.mjs` dan cocok dengan `mulaiDi` di `timeline.ts`; bila jadwal diubah, ubah keduanya.
- **Jam.** Zona waktu peramban diatur sehingga jam lokal sekitar pukul 10 pagi (sapaan "Selamat pagi"), karena aplikasi memakai jam perangkat. `--jam=asli` memakai jam komputer.
- **Tanpa audio.** Petunjuk suara mati dan rekaman tidak bersuara; peramban tidak punya bilah status atau notifikasi.
- **Latihan Bicara.** Pengenal suara Chrome tidak tersedia di peramban otomatis, jadi draf memakai **Mode Latihan Mandiri** (Sudah Benar diketuk). Versi final **wajib** memakai rekaman layar ponsel saat pemeran benar-benar berbicara di Mode Suara (tampil "Terdengar: ..."), karena narasi N19b menyebut aplikasi mendengarkan dan menilai.
- **Tidak direkam otomatis:** `layar-02-sesi-tekuk-siku.mp4` (sesi kamera dengan skeleton) dan semua rekaman kamera (dokter, pemeran). Itu wajib rekaman manusia (Bab 14.4). Kartu PLACEHOLDER-nya menjelaskan apa yang harus direkam.

Rekaman tidak masuk git (`video/.gitignore`); jalankan ulang skrip untuk membuatnya kembali. Rekaman layar ponsel asli dari tim boleh menimpa berkas otomatis dengan nama yang sama.

## Aturan audio

- Bila ada `public/audio/narasi-lengkap.mp3`, berkas itu diputar dari 0:00 dan narasi per adegan diabaikan. Bila tidak, `public/audio/<id-adegan>.mp3` diputar 0,4 detik setelah adegan dimulai.
- Suara asli talking head dokter dipakai bila tidak ada berkas narasi untuk adegan itu; bila ada (misalnya rekaman mikrofon lav terpisah), suara kamera dibisukan agar tidak dobel.
- Suara asli rekaman dipakai pada dua adegan bukti: suara koreksi aplikasi (1:30–1:44, dari rekaman layar) dan suara pemeran menyebut kata (3:42–4:00, dari shot lebar). Naskah menyisakan jeda di sana.
- Musik latar opsional: taruh `public/audio/musik.mp3`. Volumenya 12% dari narasi (`VOLUME_MUSIK`), di bawah batas 15% Bab 14.3. Tidak ada aset musik bawaan.

## Tata letak dan desain

- Rekaman layar ponsel tampil di bingkai ponsel di sisi kanan, rasio aslinya dipertahankan (letterbox), tidak pernah ditarik atau memenuhi lebar layar (Bab 14.3). Rekaman desktop Dashboard Terapis (4:00–4:25) tampil di bingkai peramban 16:9 di sisi kanan dengan tata yang sama.
- Subtitle tertanam berada di kiri bawah, jauh dari bingkai ponsel dan di bawah bingkai peramban, sehingga tidak menutupi angka skor atau pesan koreksi.
- Label penunjuk (misalnya "Skor sesi") berada di samping ponsel, tidak di atas layar aplikasi. Posisinya (`sorot.ke`) dan waktunya (`sorot.mulaiDi`) disesuaikan dengan rekaman di `timeline.ts`.
- Palet #0B4F4A / #EAF2F0 / #C46A1B / #1A2B2E di atas putih, font Plus Jakarta Sans (dimuat lokal dari `@fontsource-variable/plus-jakarta-sans`), transisi hanya crossfade lembut.
- Adegan 4:00–4:25: `ADEGAN_TERAPIS = 'klinisi'` (Dashboard Terapis P1, rekaman desktop) atau `'streak'` (kalender kepatuhan dan streak) di `timeline.ts`; jalankan `npm run srt` setelah mengubahnya.
- Nama dokter (lower third) dan nama tim (layar penutup) dibaca dari `src/config/identitas.ts` (`narasumberKlinis`, `namaTim`). Selama masih `null`, baris itu **tidak tampil** (bukan "[DIISI]"). Isi identitas.ts, lalu render ulang.

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
