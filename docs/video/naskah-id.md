# Naskah Narasi Final Video Demo PULIHIN

> DIBUAT OTOMATIS dari `video/src/timeline.ts` oleh `npm run srt` (folder `video/`). Jangan disunting langsung: ubah teks di `timeline.ts`, lalu jalankan `npm run narasi && npm run scan && npm run srt`.

- Durasi: 4:03,3 (batas 5:00), 23 adegan, 30 fps, 1920x1080.
- **Jumlah kata narasi: 351 kata** (batas 650). Baris "Suara aplikasi" tidak dihitung.
- Tempo: 2,19 kata per detik bicara (132 kata per menit), tenang.
- Waktu setiap baris = durasi audio terukur (26/26 baris terukur). Adegan sesi kamera: ditempatkan pada peristiwa aplikasi asli di `video/blender/out/sesi-meta.json`: hitungan 5/10 pada detik 24.242 dan koreksi "Rilekskan bahu, turunkan bahu Anda" pada detik 29.842 di dalam `layar-02-sesi-tekuk-siku.mp4`.

## Aturan

- Video adalah bukti fungsi, bukan iklan (Bab 14). Setiap klaim yang diucapkan terlihat di layar dalam beberapa detik; kolom "Di layar" adalah buktinya.
- Tanpa rekaman manusia dan tanpa dokter. Pemeran pasien = karakter 3D (Blender) yang menggerakkan aplikasi ASLI lewat kamera palsu Chrome. Label **Peragaan dengan karakter 3D, bukan pasien sungguhan** tampil setiap kali karakter terlihat.
- Narasi: suara sintetis (Microsoft Azure neural, id-ID, `id-ID-ArdiNeural`). Suara aplikasi (TTS peramban, tidak terekam headless) disuarakan ulang dengan kata persis pada detik persis ketika aplikasi asli menampilkan pesannya, diberi warna speaker ponsel (`id-ID-GadisNeural`).
- Angka hanya dari `docs/bahan-paper.md`, dengan label sumber di layar. Tanpa klaim diagnosis, prognosis, atau kesembuhan. PULIHIN adalah prototype kompetisi, bukan alat kesehatan teregulasi. "Pak Budi, 58 tahun" adalah nama samaran; semua data adalah data demo.
- Alamat yang disebut dan ditampilkan: **pulihin.vercel.app** (dari `src/config/identitas.ts`: domain final hanya bila `urlPublik` sudah mengarah ke sana).
- Kolom `ucapan` di timeline.ts = teks yang dibacakan TTS (angka dieja, "PULIHIN" ditulis "Pulihin" agar dibaca satu kata, "prototype" dibaca "prototipe").

## Naskah per adegan

### 0:00,0–0:07,1 · Data: stroke dan kematian

`s01-fakta-kematian` · Tahap: Masalah klinis · Tata letak: Tipografi data bersumber

**[N01] Narator (suara sintetis)** (0:00,6–0:06,2)

> Menurut Kementerian Kesehatan, stroke menyebabkan 18,5 persen kematian di Indonesia.

_Ucapan TTS:_ Menurut Kementerian Kesehatan, stroke menyebabkan delapan belas koma lima persen kematian di Indonesia.

_EN:_ According to the Ministry of Health, stroke causes 18.5 percent of deaths in Indonesia.

- **Di layar:** Angka besar 18,5% menghitung naik, "kematian di Indonesia disebabkan stroke", "dan 11,2% dari total kecacatan", label sumber Kemenkes.
- **Data:** kematian di Indonesia disebabkan stroke · Sumber: Kemenkes, rilis 25 Okt 2024
- **Momen screenshot (0:04,0):** Angka 18,5% dengan label sumber Kemenkes

### 0:07,1–0:13,2 · Data: kontrol rutin

`s02-fakta-kontrol` · Tahap: Masalah klinis · Tata letak: Tipografi data bersumber

**[N02] Narator (suara sintetis)** (0:07,7–0:12,3)

> Namun hanya 49,2 persen penyandang stroke yang kontrol rutin.

_Ucapan TTS:_ Namun, hanya empat puluh sembilan koma dua persen penyandang stroke yang kontrol rutin.

_EN:_ Yet only 49.2 percent of people with stroke have regular check-ups.

- **Di layar:** Angka besar 49,2% "penyandang stroke yang kontrol rutin", perdesaan 39,6% dan perkotaan 53,7%, label sumber SKI 2023.
- **Data:** penyandang stroke yang kontrol rutin · Sumber: SKI 2023, Kemenkes (Tabel 7.48)

### 0:13,2–0:22,1 · Data: tenaga terapi di puskesmas

`s03-fakta-terapis` · Tahap: Masalah klinis · Tata letak: Tipografi data bersumber

**[N03] Narator (suara sintetis)** (0:13,8–0:21,2)

> Tenaga terapi pun terbatas: hanya 926 tenaga keterapian fisik di lebih dari 10.000 puskesmas.

_Ucapan TTS:_ Tenaga terapi pun terbatas: hanya sembilan ratus dua puluh enam tenaga keterapian fisik, di lebih dari sepuluh ribu puskesmas.

_EN:_ Therapists are scarce too: only 926 physical therapy staff across more than 10,000 community health centres.

- **Di layar:** Angka besar 926 "tenaga keterapian fisik di 10.180 puskesmas", label sumber Profil Kesehatan Indonesia 2023.
- **Data:** tenaga keterapian fisik di 10.180 puskesmas · Sumber: Profil Kesehatan Indonesia 2023, Kemenkes
- **Momen screenshot (0:17,7):** Angka 926 tenaga keterapian fisik di 10.180 puskesmas, dengan label sumber

### 0:22,1–0:26,5 · B-roll 3D: kertas program, judul PULIHIN

`s04-judul` · Tahap: Masalah klinis · Tata letak: B-roll 3D + judul PULIHIN

**[N04] Narator (suara sintetis)** (0:22,7–0:25,6)

> Pasien pulang membawa program latihan di atas kertas.

_EN:_ Patients go home with an exercise programme on paper.

- **Di layar:** Render 3D kertas program diletakkan di meja; judul PULIHIN, Pendamping Rehabilitasi Stroke di Rumah.
- **Label:** Peragaan dengan karakter 3D, bukan pasien sungguhan
- **Rekaman:** `broll-kertas-program.mp4` mulai detik 0

### 0:26,5–0:33,5 · B-roll 3D: karakter ragu, kalimat masalah

`s05-ragu` · Tahap: Masalah klinis · Tata letak: B-roll 3D penuh layar + kalimat kunci

**[N05] Narator (suara sintetis)** (0:27,1–0:32,6)

> Di rumah, mereka ragu apakah gerakannya sudah benar. Di situlah pendampingan terputus.

_EN:_ At home, they are unsure whether they are moving correctly. That is where guidance breaks off.

- **Di layar:** Karakter 3D ragu memegang kertas program; kalimat masalah tampil besar.
- **Teks penyunting:** "Di rumah, pendampingan terputus" / _At home, guidance breaks off_
- **Label:** Peragaan dengan karakter 3D, bukan pasien sungguhan
- **Rekaman:** `broll-pemeran-ragu.mp4` mulai detik 0
- **Momen screenshot (0:30,5):** Kalimat masalah "Di rumah, pendampingan terputus" di atas render 3D

### 0:33,5–0:42,6 · Beranda: Latihan Hari Ini

`s06-beranda` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N06] Narator (suara sintetis)** (0:34,1–0:41,7)

> PULIHIN mengubah ponsel biasa menjadi pendamping latihan. Begitu dibuka, Latihan Hari Ini langsung tampil dalam huruf besar.

_Ucapan TTS:_ Pulihin mengubah ponsel biasa menjadi pendamping latihan. Begitu dibuka, Latihan Hari Ini langsung tampil dalam huruf besar.

_EN:_ PULIHIN turns an ordinary phone into an exercise companion. Once opened, Today's Exercises appear right away, in large type.

- **Di layar:** Beranda Pak Budi (Demo): "Selamat pagi, Pak Budi", Latihan Hari Ini berhuruf besar (0 dari 4 latihan selesai), tombol Mulai: Tekuk Siku.
- **Teks penyunting:** "Ponsel biasa menjadi pendamping latihan" / _An ordinary phone as a home exercise companion_
- **Label penunjuk di samping ponsel:** Latihan Hari Ini
- **Rekaman:** `layar-01-beranda-detail.mp4` mulai detik 0
- **Momen screenshot (0:37,5):** Beranda: Latihan Hari Ini berhuruf besar

### 0:42,6–0:53,7 · Detail Latihan: Tekuk Siku

`s07-detail` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N07] Narator (suara sintetis)** (0:43,2–0:52,8)

> Kita mulai dari satu gerakan kecil: Tekuk Siku. Ada contoh gerakan, pesan keselamatan, lalu satu tombol besar: Mulai dengan Kamera.

_EN:_ We start with one small movement: Elbow Flexion. There is a movement demo, a safety notice, then one big button: Start with Camera.

- **Di layar:** Ketuk Tekuk Siku; Detail Latihan dengan contoh gerakan, pesan "Berhenti bila nyeri, pusing, atau sesak" di atas tombol Mulai dengan Kamera, lalu gulir ke Utamakan keselamatan.
- **Teks penyunting:** "Mulai dari satu gerakan kecil" / _Start with one small movement_
- **Label penunjuk di samping ponsel:** Mulai dengan Kamera
- **Rekaman:** `layar-01-beranda-detail.mp4` mulai detik 9.049

### 0:53,7–1:03,6 · Render 3D lebar: ponsel di meja, karakter duduk

`s08-posisi` · Tahap: Satu gerakan kecil · Tata letak: Render 3D lebar + rekaman layar sinkron di ponsel 3D

**[N08] Narator (suara sintetis)** (0:54,3–1:02,7)

> Ponsel cukup diletakkan di meja, sekitar satu meter dari kursi. Ini peragaan dengan karakter 3D, bukan pasien sungguhan.

_Ucapan TTS:_ Ponsel cukup diletakkan di meja, sekitar satu meter dari kursi. Ini peragaan dengan karakter tiga dimensi, bukan pasien sungguhan.

_EN:_ The phone simply sits on a table, about one metre from the chair. This is a demonstration with a 3D character, not a real patient.

- **Di layar:** Karakter 3D duduk di depan ponsel di meja; di bingkai ponsel, Mulai dengan Kamera diketuk, lalu aplikasi asli mendeteksi tubuh dan menampilkan skeleton.
- **Teks penyunting:** "Ponsel di meja, ± 1 meter" / _Phone on a table, about 1 metre away_
- **Label:** Peragaan dengan karakter 3D, bukan pasien sungguhan
- **Rekaman:** `kamera-sesi-lebar.mp4` mulai detik 1.906
- **Rekaman:** `layar-02-sesi-tekuk-siku.mp4` mulai detik 1.906
- **Momen screenshot (0:59,7):** Skeleton di layar ponsel, karakter 3D duduk di depan ponsel

### 1:03,6–1:14,9 · Sesi kamera: sudut siku dan skeleton

`s09-sudut` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N09] Narator (suara sintetis)** (1:04,2–1:14,0)

> Aplikasi asli membaca titik-titik tubuh langsung di perangkat, tanpa mengunggah video. Repetisi dihitung dari sudut siku: tekuk penuh, lalu luruskan lagi.

_EN:_ The real app reads body landmarks right on the device, without uploading any video. Repetitions are counted from the elbow angle: a full bend, then straighten again.

- **Di layar:** Skeleton mengikuti lengan karakter 3D di kamera aplikasi, hitungan bertambah setelah satu siklus tekuk-luruskan.
- **Teks penyunting:** "Repetisi dihitung dari sudut siku" / _Repetitions counted from the elbow angle_ · Diproses di perangkat · video tidak diunggah
- **Label penunjuk di samping ponsel:** Sudut siku
- **Label:** Peragaan dengan karakter 3D, bukan pasien sungguhan
- **Rekaman:** `layar-02-sesi-tekuk-siku.mp4` mulai detik 11.817

### 1:14,9–1:19,1 · Sesi kamera: 5 / 10

`s10-lima` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N10] Narator (suara sintetis)** (1:15,5–1:18,1)

> Lihat angkanya: lima dari sepuluh.

_EN:_ Look at the count: five out of ten.

- **Di layar:** Aplikasi asli menaikkan hitungan menjadi 5 / 10 (detik sesi-meta repetisiDetik[4]) dengan skeleton di atas video kamera.
- **Teks penyunting:** "Hitungan naik setiap repetisi lengkap" / _The count rises with every complete repetition_
- **Label penunjuk di samping ponsel:** Hitungan repetisi
- **Label:** Peragaan dengan karakter 3D, bukan pasien sungguhan
- **Rekaman:** `layar-02-sesi-tekuk-siku.mp4` mulai detik 23.113
- **Momen screenshot (1:17,6):** Hitungan "5 / 10" dengan skeleton

### 1:19,1–1:31,2 · Koreksi form: bahu terangkat

`s11-koreksi` · Tahap: Satu sesi utuh · Tata letak: Render 3D lebar + rekaman layar sinkron di ponsel 3D

**[N11a] Narator (suara sintetis)** (1:19,7–1:21,3)

> Sekarang bahunya ikut terangkat.

_EN:_ Now the shoulder hikes up.

**[N11-app] Suara aplikasi (disuarakan ulang)** (1:21,7–1:25,0)

> Rilekskan bahu, turunkan bahu Anda.

_EN:_ [App voice] Relax your shoulder, lower your shoulder.

**[N11b] Narator (suara sintetis)** (1:25,5–1:30,3)

> Aplikasi langsung mengoreksi, dengan suara dan teks besar dalam Bahasa Indonesia.

_EN:_ The app corrects right away, by voice and in large text, in Indonesian.

- **Di layar:** Karakter 3D mengangkat bahu; pesan koreksi "Rilekskan bahu, turunkan bahu Anda" muncul di atas skeleton pada frame sesi-meta koreksi[0].mulaiDetik, bersama suara aplikasi yang disuarakan ulang (kata dan frame persis).
- **Teks penyunting:** "Koreksi form saat bahu terangkat" / _Form correction when the shoulder rises_
- **Label penunjuk di samping ponsel:** Koreksi form
- **Label:** Peragaan dengan karakter 3D, bukan pasien sungguhan
- **Rekaman:** `kamera-sesi-lebar.mp4` mulai detik 27.246
- **Rekaman:** `layar-02-sesi-tekuk-siku.mp4` mulai detik 27.246
- **Momen screenshot (1:22,9):** Pesan koreksi "Rilekskan bahu, turunkan bahu Anda" di atas skeleton
- **Catatan:** Adegan terpenting. Koreksi muncul karena aplikasi asli memproses render 3D (kamera palsu Chrome); tidak ada teks koreksi yang ditempel saat menyunting. Suara aplikasi disuarakan ulang dengan kata persis dan pada detik persis dari sesi-meta.json, diberi warna speaker ponsel.

### 1:31,2–1:38,3 · Sesi berlanjut sampai 10 / 10, Ringkasan aplikasi

`s13-sepuluh` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N13] Narator (suara sintetis)** (1:31,8–1:37,4)

> Jadi bukan sekadar menghitung, melainkan menjaga cara geraknya, sampai repetisi kesepuluh.

_EN:_ So it is not just counting: it guards how each movement is done, all the way to the tenth repetition.

- **Di layar:** Hitungan naik sampai 10 / 10 (sesi-meta selesaiDetik), lalu aplikasi asli menampilkan Ringkasan sesi ini (ringkasanDetik).
- **Teks penyunting:** "Bukan sekadar menghitung" / _Not just counting: form correction_
- **Label penunjuk di samping ponsel:** Hitungan repetisi
- **Label:** Peragaan dengan karakter 3D, bukan pasien sungguhan
- **Rekaman:** `layar-02-sesi-tekuk-siku.mp4` mulai detik 39.392

### 1:38,3–1:51,8 · Ringkasan Sesi: skor

`s14-ringkasan` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N14] Narator (suara sintetis)** (1:38,9–1:48,0)

> Di akhir sesi ada skor dan ringkasan sederhana: jumlah repetisi dan durasi. Labelnya mudah dipahami, dari Perlu Pendampingan sampai Sangat Baik.

_EN:_ At the end of the session there is a score and a simple summary: repetitions and duration. The labels are easy to read, from Needs Support to Very Good.

- **Di layar:** Ringkasan Sesi "Hebat, target latihan tercapai!": skor dengan label, Repetisi 10 / 10, Durasi; lalu Rincian skor.
- **Teks penyunting:** "Skor dan ringkasan sederhana" / _A score and a simple summary_ · Perlu Pendampingan · Berkembang · Baik · Sangat Baik
- **Label penunjuk di samping ponsel:** Skor sesi
- **Rekaman:** `layar-03-ringkasan-beranda.mp4` mulai detik 0
- **Momen screenshot (1:44,3):** Skor sesi dengan label, repetisi, dan durasi

### 1:51,8–2:00,8 · Ringkasan Sesi: saran dan kalimat bukan diagnosis

`s15-batasan` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N15] Narator (suara sintetis)** (1:52,4–1:59,2)

> Ada satu saran untuk sesi berikutnya. Ringkasan ini bukan diagnosis, dan kalimat batasan itu selalu tampil.

_EN:_ There is one tip for the next session. This summary is not a diagnosis, and that disclaimer always appears.

- **Di layar:** Kartu Saran untuk sesi berikutnya dan kalimat "Skor ini adalah skor latihan untuk motivasi dan pemantauan, bukan skor klinis dan bukan alat ukur diagnosis".
- **Teks penyunting:** "Satu saran, bukan diagnosis" / _One tip, not a diagnosis_
- **Label penunjuk di samping ponsel:** Kalimat bukan diagnosis
- **Rekaman:** `layar-03-ringkasan-beranda.mp4` mulai detik 20

### 2:00,8–2:10,8 · Kembali ke Beranda: latihan selesai

`s16-tercatat` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N16] Narator (suara sintetis)** (2:01,4–2:09,1)

> Kembali ke Beranda, Tekuk Siku sudah bertanda selesai beserta skornya. Latihannya tercatat, dan keluarga bisa melihatnya.

_EN:_ Back on the home screen, Elbow Flexion is marked done, with its score. The exercise is recorded, and the family can see it.

- **Di layar:** Ketuk Kembali ke Beranda; Tekuk Siku bertanda "Selesai" beserta skor, 1 dari 4 latihan selesai.
- **Teks penyunting:** "Latihan hari ini tercatat" / _Today's exercise is recorded_
- **Label penunjuk di samping ponsel:** Tekuk Siku selesai
- **Rekaman:** `layar-03-ringkasan-beranda.mp4` mulai detik 32
- **Momen screenshot (2:08,3):** Beranda: Tekuk Siku "Selesai" beserta angka skornya

### 2:10,8–2:25,3 · Untuk Keluarga: tanda, status, grafik 7 hari

`s17-keluarga` · Tahap: Keluarga dan afasia · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N17] Narator (suara sintetis)** (2:11,4–2:20,0)

> Keluarga tidak lagi menebak. Halaman Untuk Keluarga menunjukkan tanda bila latihan sempat terhenti, status hari ini, dan grafik tujuh hari terakhir.

_EN:_ The family no longer has to guess. The For Family page shows a flag when exercise has stopped, today's status, and a chart of the last seven days.

- **Di layar:** Kartu "Perlu perhatian: Minggu ini sempat 3 hari berturut-turut tanpa latihan", status "Sudah latihan hari ini", lalu grafik Sesi terjadwal 7 hari terakhir.
- **Teks penyunting:** "Keluarga tidak lagi menebak" / _Caregivers no longer have to guess_
- **Label penunjuk di samping ponsel:** Sesi terjadwal 7 hari
- **Rekaman:** `layar-04-keluarga.mp4` mulai detik 0
- **Momen screenshot (2:20,8):** Grafik Sesi terjadwal 7 hari terakhir di halaman Untuk Keluarga

### 2:25,3–2:38,3 · Untuk Keluarga: tren skor dan salin ringkasan

`s18-salin` · Tahap: Keluarga dan afasia · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N18] Narator (suara sintetis)** (2:25,9–2:32,8)

> Tren skor empat belas hari juga terlihat. Ringkasan mingguan bisa disalin dengan satu ketukan, siap dikirim ke terapis.

_EN:_ The 14-day score trend is there too. The weekly summary can be copied with one tap, ready to send to the therapist.

- **Di layar:** Grafik Skor latihan 14 hari, lalu ketuk Salin Ringkasan Mingguan; pesan "Ringkasan disalin. Tempel di WhatsApp untuk terapis." tampil.
- **Teks penyunting:** "Ringkasan mingguan untuk terapis" / _A weekly summary for the therapist_
- **Label penunjuk di samping ponsel:** Salin Ringkasan Mingguan
- **Rekaman:** `layar-04-keluarga.mp4` mulai detik 14.5
- **Momen screenshot (2:36,3):** Pesan "Ringkasan disalin" setelah Salin Ringkasan Mingguan diketuk

### 2:38,3–2:50,3 · Latihan Bicara: kata dan gambar

`s19-afasia` · Tahap: Keluarga dan afasia · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N19] Narator (suara sintetis)** (2:38,9–2:46,5)

> Untuk pasien dengan gangguan bicara atau afasia, ada Latihan Bicara berbahasa Indonesia, dengan kata yang dipakai di rumah setiap hari.

_EN:_ For patients with speech difficulties, or aphasia, there is Speech Practice in Indonesian, with words used at home every day.

- **Di layar:** Latihan Bicara: pilih Mode Latihan Mandiri dan kategori Benda di Rumah; satu kata dengan gambar besar dan tombol Dengar.
- **Teks penyunting:** "Latihan bicara berbahasa Indonesia" / _Aphasia practice in Indonesian_
- **Label penunjuk di samping ponsel:** Gambar dan kata
- **Rekaman:** `layar-05-afasia.mp4` mulai detik 0

### 2:50,3–3:07,8 · Karakter menyebut kata, hasil Benar

`s20-sebut` · Tahap: Keluarga dan afasia · Tata letak: Render 3D lebar + rekaman layar sinkron di ponsel 3D

**[N20a] Narator (suara sintetis)** (2:50,9–2:54,5)

> Contoh kata bisa didengar lebih dulu, lalu katanya diucapkan.

_EN:_ The example word can be heard first, then the word is spoken.

**[N20b] Narator (suara sintetis)** (2:55,0–3:02,9)

> Di Mode Latihan Mandiri, pendamping menilai dengan satu ketukan: Sudah Benar, atau Ulangi. Hasilnya tercatat.

_EN:_ In Self-Practice Mode, the companion scores with one tap: Correct, or Repeat. The result is saved.

- **Di layar:** Karakter 3D menyebut kata ke arah ponsel; di layar, Sudah Benar diketuk dan "Benar! Hebat, langsung tepat." tampil, lalu Kata Berikutnya.
- **Teks penyunting:** "Setiap kata dinilai" / _Every word attempt is scored_
- **Label penunjuk di samping ponsel:** Hasil penilaian kata
- **Label:** Peragaan dengan karakter 3D, bukan pasien sungguhan
- **Rekaman:** `kamera-afasia-lebar.mp4` mulai detik 0
- **Rekaman:** `layar-05-afasia.mp4` mulai detik 12
- **Momen screenshot (3:00,3):** Kata yang dinilai "Benar!" di Latihan Bicara
- **Catatan:** Rekaman layar memakai Mode Latihan Mandiri (pengenal suara Chrome tidak tersedia di peramban otomatis), maka narasi menyebut penilaian oleh pendamping, bukan pengenalan suara.

### 3:07,8–3:18,8 · Dashboard Terapis: progres pasien

`s21-terapis` · Tahap: Terapis dan penutup · Tata letak: Rekaman layar desktop dalam bingkai peramban (perspektif halus) + kalimat kunci

**[N21] Narator (suara sintetis)** (3:08,4–3:14,6)

> Di Dashboard Terapis, terapis dapat menyusun program dan mengikuti kemajuan tanpa menunggu kunjungan berikutnya.

_EN:_ On the Therapist Dashboard, the therapist can set the programme and follow progress without waiting for the next visit.

- **Di layar:** Dashboard Terapis (Prototype, Demo), halaman Pak Budi: grafik Kepatuhan 7 hari terakhir dan Resep Program; Tambah Luruskan Tungkai.
- **Teks penyunting:** "Terapis menyusun program" / _Therapists set the home programme_
- **Rekaman:** `layar-06-klinisi.mp4` mulai detik 0
- **Momen screenshot (3:13,8):** Grafik Kepatuhan 7 hari terakhir pada halaman Pak Budi di Dashboard Terapis

### 3:18,8–3:33,3 · Resep program menjadi Latihan Hari Ini

`s22-program` · Tahap: Terapis dan penutup · Tata letak: Rekaman layar desktop dalam bingkai peramban (perspektif halus) + kalimat kunci

**[N22] Narator (suara sintetis)** (3:19,4–3:25,0)

> Di prototype ini, program yang disimpan terapis menjadi Latihan Hari Ini pada profil pasien tersebut.

_Ucapan TTS:_ Di prototipe ini, program yang disimpan terapis menjadi Latihan Hari Ini pada profil pasien tersebut.

_EN:_ In this prototype, the programme the therapist saves becomes Today's Exercises on that patient's profile.

- **Di layar:** Simpan Resep dan pesan "Resep Pak Budi tersimpan"; Lihat sebagai pasien membuka Beranda Pak Budi yang kini memuat Luruskan Tungkai.
- **Teks penyunting:** "Program terapis menjadi Latihan Hari Ini" / _The therapist's programme becomes today's exercises_
- **Rekaman:** `layar-06-klinisi.mp4` mulai detik 11
- **Momen screenshot (3:28,8):** Beranda Pak Budi memuat Luruskan Tungkai setelah terapis menyimpan resep

### 3:33,3–3:56,3 · Render 3D penutup: PULIHIN tidak menggantikan terapis

`s23-penutup` · Tahap: Terapis dan penutup · Tata letak: Render 3D penutup + kartu alamat

**[N23a] Narator (suara sintetis)** (3:33,9–3:40,8)

> PULIHIN tidak menggantikan terapis. PULIHIN membantu memastikan yang diajarkan terapis benar-benar dilatih di rumah.

_Ucapan TTS:_ Pulihin tidak menggantikan terapis. Pulihin membantu memastikan, yang diajarkan terapis benar-benar dilatih di rumah.

_EN:_ PULIHIN does not replace the therapist. It helps make sure that what the therapist teaches is truly practised at home.

**[N23b] Narator (suara sintetis)** (3:41,3–3:48,1)

> Ini masih prototype kompetisi, bukan alat kesehatan teregulasi. Coba sekarang di pulihin.vercel.app.

_Ucapan TTS:_ Ini masih prototipe kompetisi, bukan alat kesehatan teregulasi. Coba sekarang di pulihin titik vercel titik app.

_EN:_ This is still a competition prototype, not a regulated medical device. Try it now at pulihin.vercel.app.

- **Di layar:** Render 3D penutup; kalimat "Pendamping latihan di rumah, bukan pengganti terapis", lalu kartu pulihin.vercel.app dan penafian prototype.
- **Teks penyunting:** "Pendamping latihan di rumah, bukan pengganti terapis" / _A home exercise companion, not a replacement for the therapist_
- **Label:** Peragaan dengan karakter 3D, bukan pasien sungguhan
- **Rekaman:** `penutup-3d.mp4` mulai detik 0
- **Momen screenshot (3:47,3):** Render 3D penutup dengan kartu pulihin.vercel.app dan penafian prototype

### 3:56,3–4:03,3 · Layar penutup

`s24-layar-penutup` · Tahap: Terapis dan penutup · Tata letak: Layar penutup statis

_(Tanpa narasi.)_

- **Di layar:** PULIHIN · pulihin.vercel.app · Health and Wellbeing, .id Developer Day Indonesia 2026
- **Momen screenshot (4:00,8):** Layar penutup: PULIHIN, pulihin.vercel.app, Health and Wellbeing, .id Developer Day Indonesia 2026

## Naskah utuh

N01: Menurut Kementerian Kesehatan, stroke menyebabkan 18,5 persen kematian di Indonesia.

N02: Namun hanya 49,2 persen penyandang stroke yang kontrol rutin.

N03: Tenaga terapi pun terbatas: hanya 926 tenaga keterapian fisik di lebih dari 10.000 puskesmas.

N04: Pasien pulang membawa program latihan di atas kertas.

N05: Di rumah, mereka ragu apakah gerakannya sudah benar. Di situlah pendampingan terputus.

N06: PULIHIN mengubah ponsel biasa menjadi pendamping latihan. Begitu dibuka, Latihan Hari Ini langsung tampil dalam huruf besar.

N07: Kita mulai dari satu gerakan kecil: Tekuk Siku. Ada contoh gerakan, pesan keselamatan, lalu satu tombol besar: Mulai dengan Kamera.

N08: Ponsel cukup diletakkan di meja, sekitar satu meter dari kursi. Ini peragaan dengan karakter 3D, bukan pasien sungguhan.

N09: Aplikasi asli membaca titik-titik tubuh langsung di perangkat, tanpa mengunggah video. Repetisi dihitung dari sudut siku: tekuk penuh, lalu luruskan lagi.

N10: Lihat angkanya: lima dari sepuluh.

N11a: Sekarang bahunya ikut terangkat.

N11b: Aplikasi langsung mengoreksi, dengan suara dan teks besar dalam Bahasa Indonesia.

N13: Jadi bukan sekadar menghitung, melainkan menjaga cara geraknya, sampai repetisi kesepuluh.

N14: Di akhir sesi ada skor dan ringkasan sederhana: jumlah repetisi dan durasi. Labelnya mudah dipahami, dari Perlu Pendampingan sampai Sangat Baik.

N15: Ada satu saran untuk sesi berikutnya. Ringkasan ini bukan diagnosis, dan kalimat batasan itu selalu tampil.

N16: Kembali ke Beranda, Tekuk Siku sudah bertanda selesai beserta skornya. Latihannya tercatat, dan keluarga bisa melihatnya.

N17: Keluarga tidak lagi menebak. Halaman Untuk Keluarga menunjukkan tanda bila latihan sempat terhenti, status hari ini, dan grafik tujuh hari terakhir.

N18: Tren skor empat belas hari juga terlihat. Ringkasan mingguan bisa disalin dengan satu ketukan, siap dikirim ke terapis.

N19: Untuk pasien dengan gangguan bicara atau afasia, ada Latihan Bicara berbahasa Indonesia, dengan kata yang dipakai di rumah setiap hari.

N20a: Contoh kata bisa didengar lebih dulu, lalu katanya diucapkan.

N20b: Di Mode Latihan Mandiri, pendamping menilai dengan satu ketukan: Sudah Benar, atau Ulangi. Hasilnya tercatat.

N21: Di Dashboard Terapis, terapis dapat menyusun program dan mengikuti kemajuan tanpa menunggu kunjungan berikutnya.

N22: Di prototype ini, program yang disimpan terapis menjadi Latihan Hari Ini pada profil pasien tersebut.

N23a: PULIHIN tidak menggantikan terapis. PULIHIN membantu memastikan yang diajarkan terapis benar-benar dilatih di rumah.

N23b: Ini masih prototype kompetisi, bukan alat kesehatan teregulasi. Coba sekarang di pulihin.vercel.app.
