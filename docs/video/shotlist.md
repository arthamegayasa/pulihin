# Checklist Produksi Video Demo PULIHIN (tanpa rekaman manusia)

Acuan: spesifikasi Bab 14, 15, 16 dan keputusan pemilik produk 15 Okt 2026: **tanpa rekaman manusia, tanpa dokter**. Pemeran pasien = karakter 3D (Blender) yang menggerakkan aplikasi ASLI lewat kamera palsu Chrome. Narasi = suara sintetis. Tabel bertanda OTOMATIS dibuat dari `video/src/timeline.ts` oleh `npm run srt` (folder `video/`); jangan disunting manual.

## 1. Aset

- [ ] **Render 3D** dari agen Blender3D di `video/public/footage/`: `broll-kertas-program.mp4`, `broll-pemeran-ragu.mp4`, `kamera-sesi-lebar.mp4`, `kamera-afasia-lebar.mp4`, `penutup-3d.mp4` (cara pembuatan: `docs/video/produksi-3d.md`).
- [ ] **Sesi kamera asli**: `layar-02-sesi-tekuk-siku.mp4` direkam dari aplikasi produksi saat render 3D diputar sebagai kamera Chrome (`--use-file-for-fake-video-capture`), sinkron frame-ke-frame dengan `kamera-sesi-lebar.mp4`, plus `video/blender/out/sesi-meta.json` (detik hitungan dan koreksi yang dibaca dari aplikasi asli).
- [ ] **Rekaman layar lain**: `npm run rekam-layar` (aplikasi produksi https://pulihin.vercel.app) membuat `layar-01`, `layar-03` sampai `layar-06`.
- [ ] Semua footage hemat memori render: ponsel ≤ 720 px lebar, lainnya ≤ 1920 px, yuv420p rentang terbatas, keyframe tiap 1 dtk.
- [ ] `npm run scan`: semua slot **ADA**, tidak ada peringatan "terlalu pendek", sesi kamera = "sesi-meta.json (terukur)".

## 2. Narasi dan suara

- [ ] `npm run narasi` (penyedia bawaan `azure-edge`: narator `id-ID-ArdiNeural` rate -10%, pitch -2 Hz; suara aplikasi `id-ID-GadisNeural` dengan EQ speaker ponsel). Ganti penyedia: `npm run narasi -- --penyedia=elevenlabs` (butuh izin `text_to_speech`).
- [ ] Ejaan TTS: angka ditulis dengan kata di kolom `ucapan`; "PULIHIN" dieja "Pulihin" agar dibaca satu kata; alamat dieja "… titik …".
- [ ] `npm run scan` lalu `npm run srt`: waktu adegan mengikuti durasi audio terukur; SRT EN/ID dibuat dari waktu itu.
- [ ] Suara aplikasi disuarakan ulang **hanya** untuk pesan koreksi, dengan kata persis dari `sesi-meta.json` pada detik persis kemunculannya. Tidak ada bunyi yang menyiratkan fitur yang tidak ada (tanpa "ding" per repetisi).
- [ ] SFX dari `video/public/audio/sfx/`: ketukan pada waktu ketukan di `rekam-layar.mjs`, transisi lembut antar tahap, suasana rumah pelan (7%) di bawah adegan 3D. `repetisi.mp3` hanya untuk tipografi data. Tanpa musik.

## 3. Audit isi (sebelum render final)

- [ ] Tidak ada kartu PLACEHOLDER di render final.
- [ ] Label "Peragaan dengan karakter 3D, bukan pasien sungguhan" tampil setiap kali karakter terlihat (build-srt memeriksa).
- [ ] Hitungan 5 / 10 dan pesan koreksi terlihat di layar ponsel tepat ketika narator menyebutnya (lihat still momen di tabel audit).
- [ ] Setiap angka di tipografi data punya label sumber dan berasal dari `docs/bahan-paper.md`.
- [ ] Layar penutup ≥ 5 dtk dengan PULIHIN, alamat aktif, kategori lomba.
- [ ] `npm run still`: periksa setiap still di tabel audit di bawah (tidak ada layar kosong, layar memuat, atau menu membingungkan; subtitle tidak menutupi skor/koreksi).

## 4. Render

- [ ] Beri tahu agen Blender3D; jangan merender Blender dan Remotion bersamaan.
- [ ] `npm run render:final` → `video/out/pulihin-demo-final.mp4` (tanpa subtitle tertanam; unggah SRT sebagai CC) dan `npm run render:final-en` → `video/out/pulihin-demo-final-en.mp4` (subtitle Inggris tertanam).
- [ ] Periksa: 1920x1080, 30 fps, H.264 + AAC, ≤ 5:00 (`ffprobe`).

## Berkas

<!-- OTOMATIS:BERKAS -->
| Status | Berkas di `video/public/footage/` | Sumber | Dipakai di | Durasi minimal | Isi |
|---|---|---|---|---|---|
| [ ] | `broll-kertas-program.mp4` | Blender3D | 0:22,1–0:26,5 | 5 dtk | Render 3D: tangan karakter meletakkan kertas program latihan di meja rumah (tanpa nama/data asli). |
| [ ] | `broll-pemeran-ragu.mp4` | Blender3D | 0:26,5–0:33,5 | 8 dtk | Render 3D: karakter duduk memegang kertas program, tampak ragu mencoba gerakan. |
| [x] | `layar-01-beranda-detail.mp4` | `npm run rekam-layar` | 0:33,5–0:42,6, 0:42,6–0:53,7 | 21 dtk | Beranda Pak Budi sebelum latihan, ketuk Tekuk Siku, Detail Latihan, gulir ke Utamakan keselamatan. |
| [x] | `kamera-sesi-lebar.mp4` | Blender3D | 0:53,7–1:03,6, 1:19,1–1:31,2 | 40 dtk | Render 3D lebar 16:9: karakter duduk di kursi, ponsel di meja ±1 m. Sinkron frame-ke-frame dengan layar-02. |
| [!] terlalu pendek | `layar-02-sesi-tekuk-siku.mp4` | Blender3D | 0:53,7–1:03,6, 1:03,6–1:14,9, 1:14,9–1:19,1, 1:19,1–1:31,2, 1:31,2–1:38,3 | 47 dtk | Rekaman layar aplikasi ASLI saat render 3D diputar sebagai kamera Chrome: skeleton, hitungan sampai 10/10, satu koreksi "Rilekskan bahu, turunkan bahu Anda" yang muncul dari gerak karakter. |
| [x] | `layar-03-ringkasan-beranda.mp4` | `npm run rekam-layar` | 1:38,3–1:51,8, 1:51,8–2:00,8, 2:00,8–2:10,8 | 43 dtk | Ringkasan Sesi Tekuk Siku, Rincian skor, saran dan kalimat bukan diagnosis, Kembali ke Beranda (Tekuk Siku selesai). |
| [x] | `layar-04-keluarga.mp4` | `npm run rekam-layar` | 2:10,8–2:25,3, 2:25,3–2:38,3 | 28 dtk | Untuk Keluarga: tanda perlu perhatian, grafik 7 hari, skor 14 hari, Salin Ringkasan Mingguan. |
| [x] | `layar-05-afasia.mp4` | `npm run rekam-layar` | 2:38,3–2:50,3, 2:50,3–3:07,8 | 30 dtk | Latihan Bicara, Mode Latihan Mandiri, Benda di Rumah, Dengar, Sudah Benar, "Benar!", Kata Berikutnya. |
| [ ] | `kamera-afasia-lebar.mp4` | Blender3D | 2:50,3–3:07,8 | 18 dtk | Render 3D lebar: karakter mendengarkan contoh lalu menyebut kata ke arah ponsel (dipasangkan dengan layar-05 mulai detik 12). |
| [x] | `layar-06-klinisi.mp4` | `npm run rekam-layar` | 3:07,8–3:18,8, 3:18,8–3:33,3 | 26 dtk | Desktop 1920x1080: Dashboard Terapis, Pak Budi, Tambah Luruskan Tungkai, Simpan Resep, Lihat sebagai pasien. |
| [ ] | `penutup-3d.mp4` | Blender3D | 3:33,3–3:56,3 | 24 dtk | Render 3D penutup: ponsel PULIHIN di meja rumah yang tenang, karakter beristirahat; layar ponsel hanya berisi frame aplikasi asli atau mati. |
<!-- /OTOMATIS:BERKAS -->

## Adegan

<!-- OTOMATIS:SHOT -->
| Waktu | Adegan | Tata letak | Rekaman (mulai detik ke-) | Yang harus terlihat |
|---|---|---|---|---|
| 0:00,0–0:07,1 | Data: stroke dan kematian | Tipografi data bersumber | (dibuat di Remotion) | Angka besar 18,5% menghitung naik, "kematian di Indonesia disebabkan stroke", "dan 11,2% dari total kecacatan", label sumber Kemenkes. |
| 0:07,1–0:13,2 | Data: kontrol rutin | Tipografi data bersumber | (dibuat di Remotion) | Angka besar 49,2% "penyandang stroke yang kontrol rutin", perdesaan 39,6% dan perkotaan 53,7%, label sumber SKI 2023. |
| 0:13,2–0:22,1 | Data: tenaga terapi di puskesmas | Tipografi data bersumber | (dibuat di Remotion) | Angka besar 926 "tenaga keterapian fisik di 10.180 puskesmas", label sumber Profil Kesehatan Indonesia 2023. |
| 0:22,1–0:26,5 | B-roll 3D: kertas program, judul PULIHIN | B-roll 3D + judul PULIHIN | `broll-kertas-program.mp4` @0 | Render 3D kertas program diletakkan di meja; judul PULIHIN, Pendamping Rehabilitasi Stroke di Rumah. |
| 0:26,5–0:33,5 | B-roll 3D: karakter ragu, kalimat masalah | B-roll 3D penuh layar + kalimat kunci | `broll-pemeran-ragu.mp4` @0 | Karakter 3D ragu memegang kertas program; kalimat masalah tampil besar. |
| 0:33,5–0:42,6 | Beranda: Latihan Hari Ini | Rekaman layar di ponsel 3D + kalimat kunci | `layar-01-beranda-detail.mp4` @0 | Beranda Pak Budi (Demo): "Selamat pagi, Pak Budi", Latihan Hari Ini berhuruf besar (0 dari 4 latihan selesai), tombol Mulai: Tekuk Siku. |
| 0:42,6–0:53,7 | Detail Latihan: Tekuk Siku | Rekaman layar di ponsel 3D + kalimat kunci | `layar-01-beranda-detail.mp4` @9.049 | Ketuk Tekuk Siku; Detail Latihan dengan contoh gerakan, pesan "Berhenti bila nyeri, pusing, atau sesak" di atas tombol Mulai dengan Kamera, lalu gulir ke Utamakan keselamatan. |
| 0:53,7–1:03,6 | Render 3D lebar: ponsel di meja, karakter duduk | Render 3D lebar + rekaman layar sinkron di ponsel 3D | `kamera-sesi-lebar.mp4` @1.906 + `layar-02-sesi-tekuk-siku.mp4` @1.906 | Karakter 3D duduk di depan ponsel di meja; di bingkai ponsel, Mulai dengan Kamera diketuk, lalu aplikasi asli mendeteksi tubuh dan menampilkan skeleton. |
| 1:03,6–1:14,9 | Sesi kamera: sudut siku dan skeleton | Rekaman layar di ponsel 3D + kalimat kunci | `layar-02-sesi-tekuk-siku.mp4` @11.817 | Skeleton mengikuti lengan karakter 3D di kamera aplikasi, hitungan bertambah setelah satu siklus tekuk-luruskan. |
| 1:14,9–1:19,1 | Sesi kamera: 5 / 10 | Rekaman layar di ponsel 3D + kalimat kunci | `layar-02-sesi-tekuk-siku.mp4` @23.113 | Aplikasi asli menaikkan hitungan menjadi 5 / 10 (detik sesi-meta repetisiDetik[4]) dengan skeleton di atas video kamera. |
| 1:19,1–1:31,2 | Koreksi form: bahu terangkat | Render 3D lebar + rekaman layar sinkron di ponsel 3D | `kamera-sesi-lebar.mp4` @27.246 + `layar-02-sesi-tekuk-siku.mp4` @27.246 | Karakter 3D mengangkat bahu; pesan koreksi "Rilekskan bahu, turunkan bahu Anda" muncul di atas skeleton pada frame sesi-meta koreksi[0].mulaiDetik, bersama suara aplikasi yang disuarakan ulang (kata dan frame persis). |
| 1:31,2–1:38,3 | Sesi berlanjut sampai 10 / 10, Ringkasan aplikasi | Rekaman layar di ponsel 3D + kalimat kunci | `layar-02-sesi-tekuk-siku.mp4` @39.392 | Hitungan naik sampai 10 / 10 (sesi-meta selesaiDetik), lalu aplikasi asli menampilkan Ringkasan sesi ini (ringkasanDetik). |
| 1:38,3–1:51,8 | Ringkasan Sesi: skor | Rekaman layar di ponsel 3D + kalimat kunci | `layar-03-ringkasan-beranda.mp4` @0 | Ringkasan Sesi "Hebat, target latihan tercapai!": skor dengan label, Repetisi 10 / 10, Durasi; lalu Rincian skor. |
| 1:51,8–2:00,8 | Ringkasan Sesi: saran dan kalimat bukan diagnosis | Rekaman layar di ponsel 3D + kalimat kunci | `layar-03-ringkasan-beranda.mp4` @20 | Kartu Saran untuk sesi berikutnya dan kalimat "Skor ini adalah skor latihan untuk motivasi dan pemantauan, bukan skor klinis dan bukan alat ukur diagnosis". |
| 2:00,8–2:10,8 | Kembali ke Beranda: latihan selesai | Rekaman layar di ponsel 3D + kalimat kunci | `layar-03-ringkasan-beranda.mp4` @32 | Ketuk Kembali ke Beranda; Tekuk Siku bertanda "Selesai" beserta skor, 1 dari 4 latihan selesai. |
| 2:10,8–2:25,3 | Untuk Keluarga: tanda, status, grafik 7 hari | Rekaman layar di ponsel 3D + kalimat kunci | `layar-04-keluarga.mp4` @0 | Kartu "Perlu perhatian: Minggu ini sempat 3 hari berturut-turut tanpa latihan", status "Sudah latihan hari ini", lalu grafik Sesi terjadwal 7 hari terakhir. |
| 2:25,3–2:38,3 | Untuk Keluarga: tren skor dan salin ringkasan | Rekaman layar di ponsel 3D + kalimat kunci | `layar-04-keluarga.mp4` @14.5 | Grafik Skor latihan 14 hari, lalu ketuk Salin Ringkasan Mingguan; pesan "Ringkasan disalin. Tempel di WhatsApp untuk terapis." tampil. |
| 2:38,3–2:50,3 | Latihan Bicara: kata dan gambar | Rekaman layar di ponsel 3D + kalimat kunci | `layar-05-afasia.mp4` @0 | Latihan Bicara: pilih Mode Latihan Mandiri dan kategori Benda di Rumah; satu kata dengan gambar besar dan tombol Dengar. |
| 2:50,3–3:07,8 | Karakter menyebut kata, hasil Benar | Render 3D lebar + rekaman layar sinkron di ponsel 3D | `kamera-afasia-lebar.mp4` @0 + `layar-05-afasia.mp4` @12 | Karakter 3D menyebut kata ke arah ponsel; di layar, Sudah Benar diketuk dan "Benar! Hebat, langsung tepat." tampil, lalu Kata Berikutnya. |
| 3:07,8–3:18,8 | Dashboard Terapis: progres pasien | Rekaman layar desktop dalam bingkai peramban (perspektif halus) + kalimat kunci | `layar-06-klinisi.mp4` @0 | Dashboard Terapis (Prototype, Demo), halaman Pak Budi: grafik Kepatuhan 7 hari terakhir dan Resep Program; Tambah Luruskan Tungkai. |
| 3:18,8–3:33,3 | Resep program menjadi Latihan Hari Ini | Rekaman layar desktop dalam bingkai peramban (perspektif halus) + kalimat kunci | `layar-06-klinisi.mp4` @11 | Simpan Resep dan pesan "Resep Pak Budi tersimpan"; Lihat sebagai pasien membuka Beranda Pak Budi yang kini memuat Luruskan Tungkai. |
| 3:33,3–3:56,3 | Render 3D penutup: PULIHIN tidak menggantikan terapis | Render 3D penutup + kartu alamat | `penutup-3d.mp4` @0 | Render 3D penutup; kalimat "Pendamping latihan di rumah, bukan pengganti terapis", lalu kartu pulihin.vercel.app dan penafian prototype. |
| 3:56,3–4:03,3 | Layar penutup | Layar penutup statis | (dibuat di Remotion) | PULIHIN · pulihin.vercel.app · Health and Wellbeing, .id Developer Day Indonesia 2026 |
<!-- /OTOMATIS:SHOT -->

## Audit jeda 30 detik (Bab 14.2)

Jalankan `npm run still`, buka setiap still, dan pastikan isinya dapat dipahami bila video dijeda di sana.

<!-- OTOMATIS:AUDIT -->
| Jendela | Jeda di | Adegan | Yang harus terlihat saat dijeda | Still (`video/out/stills/`) |
|---|---|---|---|---|
| 0:00,0–0:30,0 | 0:04,0 | Data: stroke dan kematian | Angka 18,5% dengan label sumber Kemenkes | `t004-s01-fakta-kematian.png` |
| 0:00,0–0:30,0 | 0:17,7 | Data: tenaga terapi di puskesmas | Angka 926 tenaga keterapian fisik di 10.180 puskesmas, dengan label sumber | `t017-s03-fakta-terapis.png` |
| 0:30,0–1:00,0 | 0:30,5 | B-roll 3D: karakter ragu, kalimat masalah | Kalimat masalah "Di rumah, pendampingan terputus" di atas render 3D | `t030-s05-ragu.png` |
| 0:30,0–1:00,0 | 0:37,5 | Beranda: Latihan Hari Ini | Beranda: Latihan Hari Ini berhuruf besar | `t037-s06-beranda.png` |
| 0:30,0–1:00,0 | 0:59,7 | Render 3D lebar: ponsel di meja, karakter duduk | Skeleton di layar ponsel, karakter 3D duduk di depan ponsel | `t059-s08-posisi.png` |
| 1:00,0–1:30,0 | 1:17,6 | Sesi kamera: 5 / 10 | Hitungan "5 / 10" dengan skeleton | `t077-s10-lima.png` |
| 1:00,0–1:30,0 | 1:22,9 | Koreksi form: bahu terangkat | Pesan koreksi "Rilekskan bahu, turunkan bahu Anda" di atas skeleton | `t082-s11-koreksi.png` |
| 1:30,0–2:00,0 | 1:44,3 | Ringkasan Sesi: skor | Skor sesi dengan label, repetisi, dan durasi | `t104-s14-ringkasan.png` |
| 2:00,0–2:30,0 | 2:08,3 | Kembali ke Beranda: latihan selesai | Beranda: Tekuk Siku "Selesai" beserta angka skornya | `t128-s16-tercatat.png` |
| 2:00,0–2:30,0 | 2:20,8 | Untuk Keluarga: tanda, status, grafik 7 hari | Grafik Sesi terjadwal 7 hari terakhir di halaman Untuk Keluarga | `t140-s17-keluarga.png` |
| 2:30,0–3:00,0 | 2:36,3 | Untuk Keluarga: tren skor dan salin ringkasan | Pesan "Ringkasan disalin" setelah Salin Ringkasan Mingguan diketuk | `t156-s18-salin.png` |
| 3:00,0–3:30,0 | 3:00,3 | Karakter menyebut kata, hasil Benar | Kata yang dinilai "Benar!" di Latihan Bicara | `t180-s20-sebut.png` |
| 3:00,0–3:30,0 | 3:13,8 | Dashboard Terapis: progres pasien | Grafik Kepatuhan 7 hari terakhir pada halaman Pak Budi di Dashboard Terapis | `t193-s21-terapis.png` |
| 3:00,0–3:30,0 | 3:28,8 | Resep program menjadi Latihan Hari Ini | Beranda Pak Budi memuat Luruskan Tungkai setelah terapis menyimpan resep | `t208-s22-program.png` |
| 3:30,0–4:00,0 | 3:47,3 | Render 3D penutup: PULIHIN tidak menggantikan terapis | Render 3D penutup dengan kartu pulihin.vercel.app dan penafian prototype | `t227-s23-penutup.png` |
| 4:00,0–4:03,3 | 4:00,8 | Layar penutup | Layar penutup: PULIHIN, pulihin.vercel.app, Health and Wellbeing, .id Developer Day Indonesia 2026 | `t240-s24-layar-penutup.png` |
<!-- /OTOMATIS:AUDIT -->
