# Video Demo PULIHIN: Produksi dengan Video AI dan Rekaman Layar Asli

Video demo (Deliverable B, maksimal 5 menit, 1080p, 16:9) dirakit secara terprogram dengan [Remotion](https://www.remotion.dev/) di folder `video/` (proyek terpisah dengan `package.json` sendiri). Keputusan pemilik produk (18 Okt 2026):

- **Adegan pasien dan keluarga** (Pak Budi, Rina) = video AI **HeyGen** (`heygen/heygen-video-1` lewat OpenRouter), fotorealistis dan hangat. Label **"Adegan dibuat dengan AI, bukan pasien sungguhan"** tampil setiap kali orang AI terlihat. Tanpa dokter atau terapis rekaan, tanpa presenter AI.
- **Layar aplikasi** = rekaman ASLI aplikasi produksi https://pulihin.vercel.app. Sesi kamera: video POV buatan AI diputar sebagai kamera Chrome (`--use-file-for-fake-video-capture`), sehingga Siap, skeleton, hitungan, koreksi, dan skor dihasilkan aplikasi itu sendiri.
- **Suara aplikasi** = klip suara ASLI aplikasi (`public/suara/`, Eleven v4 suara Matilda) yang diputar aplikasi saat direkam. Perekam mencatat setiap pemutaran (event `playing`/`pause`/`ended` elemen audio, detik di dalam rekaman); Remotion mencampur berkas yang sama pada detik yang sama dengan warna speaker ponsel tipis.
- **Narasi** = ElevenLabs **Eleven v4** lewat OpenRouter (`elevenlabs/eleven-v4`, suara `daniel`, dipilih lewat audisi banding 6 suara; jelas berbeda dari suara aplikasi). **Musik** = Google **Lyria 3 Pro** lewat OpenRouter, instrumental.
- Semua pengungkapan ada di layar penutup dan deskripsi YouTube (`youtube.md`).

## Isi

| Berkas | Fungsi |
|---|---|
| `video/src/timeline.ts` | **Satu-satunya sumber kebenaran**: adegan, durasi minimal, tata letak, slot rekaman, teks layar, data bersumber, narasi (ID, EN, ucapan TTS, tag nada v4), momen screenshot, terjemahan suara aplikasi. Waktu dihitung dari durasi audio terukur dan peristiwa aplikasi asli. |
| `video/src/suara.ts` | Rencana suara: narasi, klip aplikasi pada detik tercatat (hitungan dikecilkan bila tertimpa narasi), suara video AI (ai-07), SFX, dan musik bersegmen dengan ducking. |
| `video/src/terukur.ts` | Dibuat `npm run scan`: durasi audio dan footage, kekerasan musik/suara AI (LUFS), `data/sesi-meta.json`, `data/suara-aplikasi.json`, `data/ketukan.json`. |
| `video/data/` | Catatan rekaman (dibuat perekam): `sesi-meta.json` (detik Siap, hitungan, koreksi dari teks layar), `sesi-asli.json` (sesi kamera yang disimpan aplikasi), `suara-aplikasi.json` (klip suara aplikasi per rekaman), `ketukan.json` (detik ketukan). |
| `src/config/identitas.ts` (aplikasi) | Alamat aktif (`urlPublik` → host yang diucapkan dan ditampilkan) dan nama tim (layar penutup). |
| `video/scripts/rekam-sesi.mjs` | `npm run rekam-sesi`: sesi kamera Tekuk Siku dengan video POV AI sebagai kamera; menulis `layar-02-sesi-tekuk-siku.mp4` dan catatan di `data/`. Harus LULUS (10 hitungan, satu koreksi bahu bersuara, tanpa koreksi lain). |
| `video/scripts/rekam-layar.mjs` | `npm run rekam-layar`: rekaman layar lain (`layar-01`, `layar-03` sampai `layar-06`) dengan suara aplikasi menyala. Rekaman yang memakai data sesi memulihkan sesi kamera ASLI (`data/sesi-asli.json`) lewat Pulihkan dari cadangan, sehingga skor sama di semua layar. Jalankan setelah `rekam-sesi`. |
| `video/scripts/narasi.mjs` | `npm run narasi`: satu MP3 per baris (`public/audio/narasi/<id>.mp3`), penyedia bawaan `openrouter` (Eleven v4); alternatif `--penyedia=azure-edge`. Biaya tercatat di `public/audio/narasi/indeks.json`. |
| `video/scripts/musik.mjs` | `npm run musik`: skor Lyria 3 Pro (`public/audio/musik/latar-1.mp3`), biaya dan analisis di `indeks.json`. |
| `video/src/components/Ponsel3D.tsx` | Ponsel 3D (react-three-fiber lewat `@remotion/three`), layar = rekaman asli sebagai tekstur video. |
| `video/src/components/Tata.tsx` | Tata letak; `VideoAI` = grade sinematik seragam (kontras, kehangatan tipis, vinyet, butiran halus, dorongan kamera pelan). |
| `docs/video/naskah-id.md`, `subtitle-en.srt`, `subtitle-id.srt`, `shotlist.md`, `youtube.md` | Dibuat/diperbarui `npm run srt`. |
| `video/public/audio/sfx/` | SFX: ketukan, transisi, suasana rumah. Tanpa bunyi per repetisi. |

## Kontrak footage AI (FootageAI)

Di `video/public/footage/` (tidak di git), H.264 yuv420p rentang terbatas, keyframe tiap 1 dtk, faststart, 1920x1080 30 fps, tanpa audio kecuali `ai-07-bicara.wav`. Asli, prompt, dan frame kunci di `D:/Temp/pulihin-video/`.

| Berkas | Isi |
|---|---|
| `ai-01-pagi.mp4` | Ruang tamu pagi tanpa orang (latar tipografi data), 24 dtk |
| `ai-02-kertas.mp4` | Tangan Pak Budi meletakkan lembar latihan (tanpa teks terbaca) |
| `ai-03-ragu.mp4` | Pak Budi ragu memegang lembar latihan |
| `ai-04-pasang-ponsel.mp4` | Memasang ponsel di tripod, lalu duduk |
| `ai-05-latihan-lebar.mp4` | Shot lebar latihan tekuk siku (juga menutupi titik ulang video POV) |
| `ai-06-rina.mp4` | Rina memeriksa ponsel dan tersenyum lega |
| `ai-07-bicara.mp4` + `.wav` | Pak Budi menyebut "sabun" (kata ke-4 sesi Benda di Rumah hari rekaman) |
| `ai-08-penutup.mp4` | Pak Budi dan Rina di sofa (dibingkai ulang agar TV di tepi kanan tidak terlihat) |
| `D:/Temp/pulihin-video/pov/pov-tekuk-siku.y4m` | Video POV 480x480 30 fps, 30,13 dtk, untuk kamera palsu (diulang Chrome setelah habis) |

## Prasyarat

- Node.js 22.18+ (skrip memuat `timeline.ts` lewat type stripping), `cd video && npm install`, ffmpeg/ffprobe.
- `OPENROUTER_API_KEY` untuk narasi dan musik (jangan dicetak atau di-commit).
- Render: Chrome Headless Shell (diunduh Remotion) dengan WebGL ANGLE (`--gl=angle`).
- Mesin: hanya satu Chrome otomatis pada satu waktu (`D:/Temp/pulihin-video/chrome.lock`); render `--concurrency=2`, tidak bersamaan dengan pekerjaan berat lain.

## Alur kerja (folder `video/`)

1. **Footage AI** dari FootageAI (kontrak di atas).
2. **Rekaman aplikasi**: `npm run rekam-sesi`, lalu `npm run rekam-layar`.
3. **Narasi dan musik**: `npm run narasi` (cache per baris; `--paksa` untuk membuat ulang), `npm run musik`.
4. **Ukur**: `npm run scan` → manifest, `src/terukur.ts`, salinan suara aplikasi berwarna ponsel; melaporkan slot kosong/terlalu pendek.
5. **Teks dan pemeriksaan**: `npm run srt`. Gagal bila naskah > 650 kata, video > 300 dtk, layar penutup < 5 dtk, label AI hilang saat orang AI terlihat, narasi menimpa suara penting aplikasi, suara penting tanpa terjemahan, titik ulang video POV terlihat di ponsel, ada jendela 30 dtk tanpa momen screenshot, atau isyarat subtitle melanggar keterbacaan (≤ 42 karakter/baris, 2 baris, 1–6 dtk).
6. **Audit jeda**: `npm run still` → PNG tiap 30 dtk dan di setiap momen ke `out/stills/`; periksa satu per satu.
7. **Render**: `npm run render:final` → `out/pulihin-demo-final.mp4` (tanpa subtitle tertanam) dan `npm run render:final-en` → `out/pulihin-demo-final-en.mp4` (subtitle Inggris tertanam). H.264 + AAC 192 kbps, 1920x1080, 30 fps. Setelah render, `scripts/normalisasi-audio.mjs` (dipanggil otomatis) menyetel kenyaringan secara linear ke -16 LUFS terintegrasi, puncak ≤ -1,5 dBTP.

## Cara waktu disusun

- Baris narasi diletakkan berurutan di adegannya; bila sebuah baris akan menimpa suara aplikasi yang penting (semua kecuali hitungan repetisi) atau ucapan di video AI, baris itu digeser ke sesudahnya. Hitungan yang tertimpa narasi dikecilkan 7 dB.
- Adegan sesi kamera memakai detik di dalam `layar-02` dan diputar berurutan tanpa mundur: `s10-lima` berakhir tepat sebelum aplikasi mengucapkan "Lima", `s11-koreksi` dijangkarkan pada suara koreksi, `s12-lebar` (video AI lebar) menutupi titik ulang video POV sementara suara aplikasi tetap berjalan pada detiknya, `s13-sepuluh` kembali ke ponsel untuk hitungan 9–10 dan "Hebat! Target tercapai."
- Adegan bicara: video AI `ai-07` ditempatkan agar "sabun" terdengar sesaat sebelum ketukan Sudah Benar yang tercatat; suara "Benar! Bagus sekali." dari aplikasi menyusul.
- Video AI yang lebih pendek dari adegannya diperlambat halus otomatis (min. 0,6x).

## Desain

- Palet #0B4F4A / #EAF2F0 / #C46A1B / #1A2B2E, latar sinematik gelap #0A1A19 di bawah video AI, Plus Jakarta Sans lokal, crossfade lembut 18 frame, easing lembut, gerak kamera pelan.
- Rekaman layar ponsel di ponsel 3D sisi kanan, rasio asli. Dashboard Terapis di bingkai peramban dengan perspektif halus. Label penunjuk di samping ponsel. Subtitle tertanam kiri bawah, tidak menutupi hitungan atau pesan koreksi.
- Musik −22 dB di bawah narasi (−38 LUFS), −31 LUFS di jeda, naik hanya di pergantian bab (−27) dan penutup (−25). Skor Lyria 3:01 disusun menjadi tiga segmen dengan crossfade: bab 1–3, bab 4–5 (mengulang bagian hangat), outro asli di penutup.

## Aturan kejujuran

- Isi layar aplikasi hanya dari aplikasi asli yang berjalan. Tidak ada skor, hitungan, pesan, atau suara aplikasi yang ditempel saat menyunting.
- Label AI setiap kali orang AI terlihat; narasi juga menyebut bahwa adegan Pak Budi dan video kamera di ponsel dibuat dengan AI.
- Angka hanya dari `docs/bahan-paper.md` atau README, dengan label sumber. Tanpa klaim diagnosis, prognosis, atau kesembuhan. Prototype kompetisi, bukan alat kesehatan teregulasi. Data demo, nama samaran.
- Latihan Bicara direkam dalam Mode Latihan Mandiri (pengenal suara Chrome tidak tersedia di peramban otomatis), jadi narasi menyebut penilaian oleh pendamping.
