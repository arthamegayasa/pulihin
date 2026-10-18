# Checklist Produksi Video Demo PULIHIN (video AI + rekaman layar asli)

Acuan: spesifikasi Bab 14, 15, 16 dan keputusan pemilik produk 18 Okt 2026: adegan pasien dan keluarga = **video AI HeyGen** berlabel, layar aplikasi = **rekaman asli** aplikasi produksi, suara aplikasi = **klip asli aplikasi** pada detik yang tercatat, narasi = **ElevenLabs Eleven v4**, musik = **Google Lyria 3 Pro**. Tanpa dokter, tanpa presenter AI. Tabel bertanda OTOMATIS dibuat dari `video/src/timeline.ts` oleh `npm run srt` (folder `video/`); jangan disunting manual.

## 1. Aset

- [ ] **Video AI** dari FootageAI di `video/public/footage/` (`ai-01` sampai `ai-08`, `ai-07-bicara.wav`), 1920x1080 30 fps, tanpa audio kecuali ai-07. Asli, prompt, dan frame kunci di `D:/Temp/pulihin-video/`.
- [ ] **Sesi kamera asli**: `npm run rekam-sesi` merekam aplikasi produksi saat video POV AI (`D:/Temp/pulihin-video/pov/pov-tekuk-siku.y4m`) diputar sebagai kamera Chrome. Hasil: `layar-02-sesi-tekuk-siku.mp4`, `video/data/sesi-meta.json` (detik Siap, hitungan, koreksi dari teks layar aplikasi), `video/data/sesi-asli.json` (sesi yang disimpan aplikasi, dipakai rekaman berikutnya), dan catatan suara serta ketukan. Harus LULUS (10 hitungan, satu koreksi bahu bersuara, tanpa koreksi lain).
- [ ] **Rekaman layar lain**: `npm run rekam-layar` (aplikasi produksi https://pulihin.vercel.app, suara aplikasi menyala) membuat `layar-01`, `layar-03` sampai `layar-06` dan mencatat setiap klip suara aplikasi (`video/data/suara-aplikasi.json`) dan ketukan (`video/data/ketukan.json`). Jalankan setelah `rekam-sesi`.
- [ ] Hanya satu Chrome otomatis pada satu waktu (kunci `D:/Temp/pulihin-video/chrome.lock`).
- [ ] Semua footage hemat memori render: ponsel 720x1600, lainnya ≤ 1920 px, yuv420p rentang terbatas, keyframe tiap 1 dtk.
- [ ] `npm run scan`: semua slot **ADA**, tidak ada peringatan "terlalu pendek", sesi kamera = "data/sesi-meta.json (terukur)".

## 2. Narasi, suara aplikasi, musik

- [ ] `npm run narasi` (penyedia `openrouter`, ElevenLabs Eleven v4, suara `daniel`; tag nada v4 per baris). Periksa setiap MP3 dengan transkripsi (tag tidak terbaca, "Pulihin" tidak terdengar "Fulihin").
- [ ] Ejaan TTS: angka ditulis dengan kata di kolom `ucapan`; "PULIHIN" dieja "Pulihin"; alamat dieja "… titik …".
- [ ] Suara aplikasi = klip `public/suara/` aplikasi yang benar-benar diputar saat merekam, pada detik yang sama; `npm run scan` membuat salinan berwarna speaker ponsel di `video/public/audio/aplikasi/`. Narasi tidak menimpa suara penting (diperiksa `npm run srt`); hitungan repetisi boleh di bawah narasi dan dikecilkan.
- [ ] `npm run musik`: skor Lyria 3 Pro (`video/public/audio/musik/latar-1.mp3`), disusun per bab dengan crossfade dan ducking di `video/src/suara.ts` (−22 dB di bawah narasi, naik hanya di pergantian bab dan penutup).
- [ ] SFX dari `video/public/audio/sfx/`: ketukan pada detik ketukan tercatat, transisi lembut di pergantian bab, suasana rumah pelan di bawah video AI. Tanpa bunyi per repetisi.

## 3. Audit isi (sebelum render final)

- [ ] Tidak ada kartu PLACEHOLDER di render final.
- [ ] Label "Adegan dibuat dengan AI, bukan pasien sungguhan" tampil setiap kali orang AI terlihat (build-srt memeriksa).
- [ ] Hitungan 5 dan pesan koreksi terlihat di layar ponsel tepat saat suara aplikasi mengucapkannya.
- [ ] Setiap angka di tipografi data punya label sumber dan berasal dari `docs/bahan-paper.md`.
- [ ] Layar penutup ≥ 5 dtk dengan PULIHIN, alamat aktif, kategori lomba, dan pengungkapan AI.
- [ ] `npm run still`: periksa setiap still di tabel audit (tidak ada layar kosong atau membingungkan; subtitle tidak menutupi hitungan/koreksi).

## 4. Render

- [ ] Jangan merender bersamaan dengan pekerjaan berat lain.
- [ ] `npm run render:final` → `video/out/pulihin-demo-final.mp4` (tanpa subtitle tertanam) dan `npm run render:final-en` → `video/out/pulihin-demo-final-en.mp4` (subtitle Inggris tertanam).
- [ ] Periksa: 1920x1080, 30 fps, H.264 + AAC, ≤ 5:00 (`ffprobe`), kekerasan sekitar −16 LUFS tanpa clipping.

## Berkas

<!-- OTOMATIS:BERKAS -->
| Status | Berkas di `video/public/footage/` | Sumber | Dipakai di | Durasi minimal | Isi |
|---|---|---|---|---|---|
| [x] | `ai-01-pagi.mp4` | FootageAI (HeyGen) | 0:00,0–0:08,4, 0:08,4–0:15,5, 0:15,5–0:25,5 | 24 dtk | Video AI tanpa orang: ruang tamu Indonesia hangat di cahaya pagi, kursi kayu kosong, monstera, dorongan kamera pelan (latar tipografi data). |
| [x] | `ai-02-kertas.mp4` | FootageAI (HeyGen) | 0:25,5–0:32,5 | 7 dtk | Video AI: tangan Pak Budi meletakkan lembar latihan rumah (diagram sederhana, tanpa teks terbaca) di meja jati. |
| [x] | `ai-03-ragu.mp4` | FootageAI (HeyGen) | 0:32,5–0:42,9 | 9 dtk | Video AI: Pak Budi di sofa memegang lembar latihan, tampak ragu, mencoba mengangkat lengan. |
| [x] | `layar-01-beranda-detail.mp4` | `npm run rekam-layar` | 0:42,9–0:53,7, 0:53,7–1:04,7, 1:04,7–1:15,7 | 34 dtk | Beranda Pak Budi sebelum latihan, ketuk Tekuk Siku, Detail Latihan dengan contoh gerakan 3D, gulir ke Letak ponsel. |
| [x] | `ai-04-pasang-ponsel.mp4` | FootageAI (HeyGen) | 1:04,7–1:15,7 | 9 dtk | Video AI: Pak Budi memasang ponsel di tripod kecil di meja (layar tidak terbaca), lalu duduk di kursi kayu menghadapnya. |
| [x] | `ai-05-latihan-lebar.mp4` | FootageAI (HeyGen) | 1:15,7–1:35,7, 1:48,5–1:54,7 | 17 dtk | Video AI lebar tiga perempat: Pak Budi menekuk siku kanan pelan, ponsel di tripod di latar depan (layar tidak terbaca). |
| [x] | `layar-02-sesi-tekuk-siku.mp4` | `npm run rekam-sesi` | 1:15,7–1:35,7, 1:35,7–1:41,8, 1:41,8–1:48,5, 1:48,5–1:54,7, 1:54,7–2:02,6 | 49 dtk | Rekaman layar aplikasi ASLI saat video POV AI diputar sebagai kamera Chrome: Siap, skeleton, hitungan sampai 10 kali, satu koreksi "Rilekskan bahu, turunkan bahu Anda" dari gerak bahu di video, suara aplikasi tercatat. |
| [x] | `layar-03-ringkasan-beranda.mp4` | `npm run rekam-layar` | 2:02,6–2:13,6, 2:13,6–2:23,2, 2:23,2–2:32,2 | 31 dtk | Ringkasan Sesi Tekuk Siku, Rincian skor, saran dan kalimat bukan diagnosis, Kembali ke Beranda (Tekuk Siku selesai). |
| [x] | `ai-06-rina.mp4` | FootageAI (HeyGen) | 2:32,2–2:40,1 | 8 dtk | Video AI: Rina (putrinya, berhijab) di tempat lain memeriksa ponsel dan tersenyum lega (layar tidak terlihat). |
| [x] | `layar-04-keluarga.mp4` | `npm run rekam-layar` | 2:40,1–2:52,1, 2:52,1–3:03,1 | 24 dtk | Untuk Keluarga: status hari ini, tanda perlu perhatian, sesi terjadwal 7 hari, tren skor 14 hari, Salin Ringkasan Mingguan. |
| [x] | `layar-05-afasia.mp4` | `npm run rekam-layar` | 3:03,1–3:17,6, 3:17,6–3:24,6, 3:24,6–3:34,0 | 32 dtk | Latihan Bicara, Mode Latihan Mandiri, Benda di Rumah, Dengar (suara aplikasi), Sudah Benar, "Benar!", Kata Berikutnya. |
| [!] terlalu pendek | `ai-07-bicara.mp4` | FootageAI (HeyGen) | 3:17,6–3:24,6 | 9 dtk | Video AI: meja makan, ponsel bersandar; Pak Budi mendengarkan lalu menyebut kata latihan dengan jelas, Rina tersenyum (audio di ai-07-bicara.wav). |
| [x] | `layar-06-klinisi.mp4` | `npm run rekam-layar` | 3:34,0–3:44,0, 3:44,0–3:55,0 | 22 dtk | Desktop 1920x1080: Dashboard Terapis, Pak Budi, Tambah Luruskan Tungkai, Simpan Resep, Lihat sebagai pasien. |
| [x] | `ai-08-penutup.mp4` | FootageAI (HeyGen) | 3:55,0–4:14,0 | 18 dtk | Video AI: Pak Budi dan Rina santai di sofa, tersenyum, ponsel di meja, cahaya hangat, kamera mundur pelan. |
<!-- /OTOMATIS:BERKAS -->

## Adegan

<!-- OTOMATIS:SHOT -->
| Waktu | Adegan | Tata letak | Rekaman (mulai detik ke-) | Yang harus terlihat |
|---|---|---|---|---|
| 0:00,0–0:08,4 | Data: stroke dan kematian | Tipografi data bersumber di atas video AI tanpa orang | `ai-01-pagi.mp4` @0 ×0.9 | Ruang tamu pagi (video AI tanpa orang); angka besar 18,5% menghitung naik, "kematian di Indonesia disebabkan stroke", "dan 11,2% dari total kecacatan", label sumber Kemenkes. |
| 0:08,4–0:15,5 | Data: kontrol rutin | Tipografi data bersumber di atas video AI tanpa orang | `ai-01-pagi.mp4` @7.599 ×0.9 | Angka besar 49,2% "penyandang stroke yang kontrol rutin", perdesaan 39,6% dan perkotaan 53,7%, label sumber SKI 2023. |
| 0:15,5–0:25,5 | Data: tenaga terapi di puskesmas | Tipografi data bersumber di atas video AI tanpa orang | `ai-01-pagi.mp4` @13.972 ×0.9 | Angka besar 926 "tenaga keterapian fisik di 10.180 puskesmas", label sumber Profil Kesehatan Indonesia 2023. |
| 0:25,5–0:32,5 | Video AI: lembar latihan di meja, judul PULIHIN | Video AI + judul PULIHIN | `ai-02-kertas.mp4` @0 ×0.85 | Video AI: tangan meletakkan lembar latihan di meja jati; judul PULIHIN, Pendamping Rehabilitasi Stroke di Rumah. |
| 0:32,5–0:42,9 | Video AI: Pak Budi ragu, kalimat masalah | Video AI penuh layar + kalimat kunci | `ai-03-ragu.mp4` @0 ×0.731 | Video AI: Pak Budi di sofa memegang lembar latihan, ragu mencoba mengangkat lengan; kalimat masalah tampil besar. |
| 0:42,9–0:53,7 | Beranda: Latihan Hari Ini | Rekaman layar di ponsel 3D + kalimat kunci | `layar-01-beranda-detail.mp4` @0 | Beranda Pak Budi (Demo): "Selamat pagi, Pak Budi", Latihan Hari Ini berhuruf besar (0 dari 4 latihan selesai), tombol Mulai: Tekuk Siku. |
| 0:53,7–1:04,7 | Detail Latihan: contoh gerakan 3D | Rekaman layar di ponsel 3D + kalimat kunci | `layar-01-beranda-detail.mp4` @10.791 | Ketuk Tekuk Siku; Detail Latihan dengan contoh gerakan 3D yang bergerak, irama "sekitar 3 detik tiap gerakan", pesan "Berhenti bila nyeri, pusing, atau sesak" di atas tombol Mulai dengan Kamera. |
| 1:04,7–1:15,7 | Video AI: memasang ponsel; Letak ponsel di aplikasi | Video AI (kartu 16:9) + rekaman layar di ponsel 3D | `ai-04-pasang-ponsel.mp4` @0 ×0.687 + `layar-01-beranda-detail.mp4` @21.791 | Kiri: video AI Pak Budi memasang ponsel di tripod lalu duduk (berlabel AI). Kanan: Detail Latihan digulir ke Letak ponsel (1 m, ponsel tepat di depan). |
| 1:15,7–1:35,7 | Sesi kamera: mulai, Siap, skeleton | Video AI (kartu 16:9) + rekaman layar di ponsel 3D | `ai-05-latihan-lebar.mp4` @0 ×0.809 + `layar-02-sesi-tekuk-siku.mp4` @0.8 | Kiri: video AI lebar Pak Budi berlatih (berlabel AI). Kanan: Mulai dengan Kamera diketuk, aplikasi asli mendeteksi tubuh dari video POV AI, skeleton tampil, suara aplikasi "Tubuh terdeteksi. Siap." |
| 1:35,7–1:41,8 | Sesi kamera: hitungan lima | Rekaman layar di ponsel 3D + kalimat kunci | `layar-02-sesi-tekuk-siku.mp4` @20.772 | Aplikasi asli menaikkan hitungan menjadi 5 dan mengucapkan "Lima" dengan suaranya sendiri. |
| 1:41,8–1:48,5 | Koreksi form: bahu terangkat | Rekaman layar di ponsel 3D + kalimat kunci | `layar-02-sesi-tekuk-siku.mp4` @26.826 | Pak Budi (video kamera AI) mengangkat bahu; pesan koreksi "Rilekskan bahu, turunkan bahu Anda" muncul di atas skeleton dan aplikasi mengucapkannya dengan klip suaranya sendiri. |
| 1:48,5–1:54,7 | Video AI lebar: latihan berlanjut (melewati titik ulang video kamera) | Video AI penuh layar + kalimat kunci | `ai-05-latihan-lebar.mp4` @2.5 + `layar-02-sesi-tekuk-siku.mp4` @33.625 | Video AI lebar Pak Budi melanjutkan latihan (berlabel AI); suara hitungan aplikasi tetap terdengar pada detik aslinya. |
| 1:54,7–2:02,6 | Sesi berlanjut sampai 10 kali, target tercapai | Rekaman layar di ponsel 3D + kalimat kunci | `layar-02-sesi-tekuk-siku.mp4` @39.74 | Hitungan 9 dan 10 dengan suara aplikasi, "Hebat! Target tercapai.", lalu Ringkasan sesi. Tanpa narasi. |
| 2:02,6–2:13,6 | Ringkasan Sesi: skor | Rekaman layar di ponsel 3D + kalimat kunci | `layar-03-ringkasan-beranda.mp4` @0 | Ringkasan Sesi: cincin skor dengan label, Repetisi 10 / 10, Durasi; lalu Rincian skor. |
| 2:13,6–2:23,2 | Ringkasan Sesi: saran dan kalimat bukan diagnosis | Rekaman layar di ponsel 3D + kalimat kunci | `layar-03-ringkasan-beranda.mp4` @11 | Saran untuk sesi berikutnya dan kalimat "Skor ini adalah skor latihan untuk motivasi dan pemantauan, bukan skor klinis dan bukan alat ukur diagnosis". |
| 2:23,2–2:32,2 | Kembali ke Beranda: latihan selesai | Rekaman layar di ponsel 3D + kalimat kunci | `layar-03-ringkasan-beranda.mp4` @20.615 | Ketuk Kembali ke Beranda; Tekuk Siku bertanda selesai beserta skor, 1 dari 4 latihan selesai. |
| 2:32,2–2:40,1 | Video AI: Rina memeriksa ponsel | Video AI penuh layar + kalimat kunci | `ai-06-rina.mp4` @0 ×0.9 | Video AI: Rina (berhijab) memeriksa ponsel dan tersenyum lega (layar tidak terlihat), berlabel AI. |
| 2:40,1–2:52,1 | Untuk Keluarga: status, tanda, grafik 7 hari | Rekaman layar di ponsel 3D + kalimat kunci | `layar-04-keluarga.mp4` @0 | Untuk Keluarga: status Pak Budi hari ini, kartu tanda perlu perhatian (sempat beberapa hari tanpa latihan), lalu grafik Sesi terjadwal 7 hari. |
| 2:52,1–3:03,1 | Untuk Keluarga: tren skor dan salin ringkasan | Rekaman layar di ponsel 3D + kalimat kunci | `layar-04-keluarga.mp4` @12 | Tren skor 14 hari, lalu ketuk Salin Ringkasan Mingguan; konfirmasi bahwa ringkasan disalin tampil. |
| 3:03,1–3:17,6 | Latihan Bicara: kata, gambar, Dengar | Rekaman layar di ponsel 3D + kalimat kunci | `layar-05-afasia.mp4` @0 | Latihan Bicara: Mode Latihan Mandiri, kategori Benda di Rumah; gambar kata besar; Dengar diketuk dan aplikasi mengucapkan kata serta kalimat contohnya. |
| 3:17,6–3:24,6 | Video AI: Pak Budi menyebut kata, hasil Benar | Video AI (kartu 16:9) + rekaman layar di ponsel 3D | `ai-07-bicara.mp4` @0.92 + `layar-05-afasia.mp4` @14.5 | Kiri: video AI Pak Budi menyebut kata latihan, Rina tersenyum (berlabel AI), suaranya terdengar. Kanan: Sudah Benar diketuk, aplikasi menampilkan dan mengucapkan "Benar!". Tanpa narasi. |
| 3:24,6–3:34,0 | Latihan Bicara: penilaian pendamping | Rekaman layar di ponsel 3D + kalimat kunci | `layar-05-afasia.mp4` @21.5 | Hasil "Benar!" di Latihan Bicara, lalu Kata Berikutnya diketuk dan kata baru tampil. |
| 3:34,0–3:44,0 | Dashboard Terapis: progres pasien | Rekaman layar desktop dalam bingkai peramban (perspektif halus) + kalimat kunci | `layar-06-klinisi.mp4` @0 | Dashboard Terapis (Prototype, Demo), halaman Pak Budi: Kepatuhan 7 hari terakhir dan Resep Program; Tambah Luruskan Tungkai. |
| 3:44,0–3:55,0 | Resep program menjadi Latihan Hari Ini | Rekaman layar desktop dalam bingkai peramban (perspektif halus) + kalimat kunci | `layar-06-klinisi.mp4` @10 | Simpan Resep dan pesan tersimpan; Lihat sebagai pasien membuka Beranda Pak Budi yang kini memuat Luruskan Tungkai. |
| 3:55,0–4:14,0 | Video AI penutup: PULIHIN tidak menggantikan terapis | Video AI penutup + kartu alamat | `ai-08-penutup.mp4` @0 ×0.9 | Video AI Pak Budi dan Rina di sofa (berlabel AI); kalimat "Pendamping latihan di rumah, bukan pengganti terapis", lalu kartu pulihin.vercel.app dan penafian prototype. |
| 4:14,0–4:22,0 | Layar penutup dan pengungkapan | Layar penutup dengan pengungkapan | (dibuat di Remotion) | PULIHIN · pulihin.vercel.app · Health and Wellbeing, .id Developer Day Indonesia 2026 · pengungkapan AI (HeyGen, Eleven v4, Lyria 3) dan rekaman layar asli |
<!-- /OTOMATIS:SHOT -->

## Suara aplikasi dan video AI (detik di video)

<!-- OTOMATIS:SUARA -->
| Waktu | Adegan | Sumber | Teks | Penting |
|---|---|---|---|---|
| 1:22,3 | s09-mulai | klip aplikasi `6a102d29c868-cfcc1e.mp3` | Posisikan tubuh Anda di dalam bingkai. | ya |
| 1:23,0 | s09-mulai | klip aplikasi `b48eba6533e7-5b2b43.mp3` | Tubuh terdeteksi. Ingat, berhenti bila terasa nyeri atau pusing. Silakan mulai pelan-pelan. | ya |
| 1:31,5 | s09-mulai | klip aplikasi `ecb381cfa2df-4918aa.mp3` | Tiga. | hitungan |
| 1:35,5 | s09-mulai | klip aplikasi `c347fc36eb15-2bdb8b.mp3` | Empat. | hitungan |
| 1:39,0 | s10-lima | klip aplikasi `74c143a625fb-82bbf0.mp3` | Lima. | hitungan |
| 1:41,8 | s11-koreksi | klip aplikasi `a8408674c19e-bdae94.mp3` | Enam. | hitungan |
| 1:45,1 | s11-koreksi | klip aplikasi `69234ae90aa5-bea565.mp3` | Rilekskan bahu, turunkan bahu Anda. | ya |
| 1:48,1 | s11-koreksi | klip aplikasi `81cc0f7859fb-d20f36.mp3` | Tujuh. | hitungan |
| 1:51,0 | s12-lebar | klip aplikasi `272b34f0b556-723381.mp3` | Delapan. | hitungan |
| 1:55,7 | s13-sepuluh | klip aplikasi `4a9019e82a4e-712f08.mp3` | Sembilan. | hitungan |
| 1:58,3 | s13-sepuluh | klip aplikasi `f3234ada1ffb-e76933.mp3` | Sepuluh. | hitungan |
| 1:59,3 | s13-sepuluh | klip aplikasi `0e4c9fa5de79-7bea7b.mp3` | Hebat! Target tercapai. | ya |
| 3:14,0 | s20-bicara | klip aplikasi `b2b57c0f660d-4e5677.mp3` | sabun | ya |
| 3:15,7 | s20-bicara | klip aplikasi `40a13c0f62f6-900179.mp3` | Cuci tangan pakai sabun. | ya |
| 3:23,5 | s21-sebut | klip aplikasi `fdd7ff23bbff-2b5132.mp3` | Benar! Bagus sekali. | ya |
| 3:21,7 | s21-sebut | video AI ai-07 | Sabun | ya |
<!-- /OTOMATIS:SUARA -->

## Audit jeda 30 detik (Bab 14.2)

Jalankan `npm run still`, buka setiap still, dan pastikan isinya dapat dipahami bila video dijeda di sana.

<!-- OTOMATIS:AUDIT -->
| Jendela | Jeda di | Adegan | Yang harus terlihat saat dijeda | Still (`video/out/stills/`) |
|---|---|---|---|---|
| 0:00,0–0:30,0 | 0:05,0 | Data: stroke dan kematian | Angka 18,5% dengan label sumber Kemenkes | `t005-s01-fakta-kematian.png` |
| 0:00,0–0:30,0 | 0:20,5 | Data: tenaga terapi di puskesmas | Angka 926 tenaga keterapian fisik di 10.180 puskesmas, dengan label sumber | `t020-s03-fakta-terapis.png` |
| 0:30,0–1:00,0 | 0:37,5 | Video AI: Pak Budi ragu, kalimat masalah | Kalimat masalah "Di rumah, pendampingan terputus" di atas video AI berlabel | `t037-s05-ragu.png` |
| 0:30,0–1:00,0 | 0:47,9 | Beranda: Latihan Hari Ini | Beranda: Latihan Hari Ini berhuruf besar | `t047-s06-beranda.png` |
| 0:30,0–1:00,0 | 0:59,7 | Detail Latihan: contoh gerakan 3D | Detail Latihan: contoh gerakan 3D Tekuk Siku dan pesan keselamatan | `t059-s07-detail.png` |
| 1:00,0–1:30,0 | 1:10,7 | Video AI: memasang ponsel; Letak ponsel di aplikasi | Letak ponsel di aplikasi berdampingan dengan video AI berlabel | `t070-s08-pasang.png` |
| 1:00,0–1:30,0 | 1:23,7 | Sesi kamera: mulai, Siap, skeleton | Skeleton di layar ponsel dengan video kamera AI berlabel | `t083-s09-mulai.png` |
| 1:30,0–2:00,0 | 1:40,0 | Sesi kamera: hitungan lima | Hitungan 5 dengan skeleton, suara aplikasi "Lima" | `t100-s10-lima.png` |
| 1:30,0–2:00,0 | 1:46,3 | Koreksi form: bahu terangkat | Pesan koreksi "Rilekskan bahu, turunkan bahu Anda" di atas skeleton | `t106-s11-koreksi.png` |
| 2:00,0–2:30,0 | 2:07,6 | Ringkasan Sesi: skor | Skor sesi dengan label, repetisi, dan durasi | `t127-s14-ringkasan.png` |
| 2:00,0–2:30,0 | 2:29,7 | Kembali ke Beranda: latihan selesai | Beranda: Tekuk Siku selesai beserta skornya | `t149-s16-tercatat.png` |
| 2:30,0–3:00,0 | 2:36,2 | Video AI: Rina memeriksa ponsel | Video AI Rina berlabel, kalimat "Keluarga tidak lagi menebak" | `t156-s17-rina.png` |
| 2:30,0–3:00,0 | 2:49,1 | Untuk Keluarga: status, tanda, grafik 7 hari | Grafik Sesi terjadwal 7 hari di halaman Untuk Keluarga | `t169-s18-keluarga.png` |
| 3:00,0–3:30,0 | 3:01,6 | Untuk Keluarga: tren skor dan salin ringkasan | Konfirmasi setelah Salin Ringkasan Mingguan diketuk | `t181-s19-salin.png` |
| 3:00,0–3:30,0 | 3:11,1 | Latihan Bicara: kata, gambar, Dengar | Latihan Bicara: gambar kata besar dan tombol Dengar | `t191-s20-bicara.png` |
| 3:00,0–3:30,0 | 3:23,6 | Video AI: Pak Budi menyebut kata, hasil Benar | Hasil "Benar!" di Latihan Bicara di samping video AI berlabel | `t203-s21-sebut.png` |
| 3:30,0–4:00,0 | 3:40,0 | Dashboard Terapis: progres pasien | Kepatuhan 7 hari terakhir pada halaman Pak Budi di Dashboard Terapis | `t220-s22-terapis.png` |
| 3:30,0–4:00,0 | 3:53,0 | Resep program menjadi Latihan Hari Ini | Beranda Pak Budi memuat Luruskan Tungkai setelah terapis menyimpan resep | `t233-s23-program.png` |
| 4:00,0–4:22,0 | 4:09,0 | Video AI penutup: PULIHIN tidak menggantikan terapis | Video AI penutup berlabel dengan kartu pulihin.vercel.app dan penafian prototype | `t249-s24-penutup.png` |
| 4:00,0–4:22,0 | 4:19,0 | Layar penutup dan pengungkapan | Layar penutup: PULIHIN, pulihin.vercel.app, kategori, pengungkapan AI | `t259-s25-layar-penutup.png` |
<!-- /OTOMATIS:AUDIT -->
