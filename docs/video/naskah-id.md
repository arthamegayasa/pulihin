# Naskah Narasi Final Video Demo PULIHIN

> DIBUAT OTOMATIS dari `video/src/timeline.ts` oleh `npm run srt` (folder `video/`). Jangan disunting langsung: ubah teks di `timeline.ts`, lalu jalankan `npm run narasi && npm run scan && npm run srt`.

- Durasi: 4:22,0 (batas 5:00), 26 adegan, 30 fps, 1920x1080.
- **Jumlah kata narasi: 333 kata** (batas 650). Suara aplikasi dan ucapan di video AI tidak dihitung.
- Tempo: 1,97 kata per detik bicara (118 kata per menit), tenang.
- Waktu setiap baris = durasi audio terukur (26/26 baris terukur). Adegan sesi kamera: dijangkarkan pada peristiwa aplikasi asli di `video/data/sesi-meta.json` dan `video/data/suara-aplikasi.json`: hitungan 5 pada detik 24.103 dan koreksi "Rilekskan bahu, turunkan bahu Anda" pada detik 30.218 di dalam `layar-02-sesi-tekuk-siku.mp4`.

## Aturan

- Video adalah bukti fungsi, bukan iklan (Bab 14). Setiap klaim yang diucapkan terlihat di layar dalam beberapa detik; kolom "Di layar" adalah buktinya.
- Adegan pasien dan keluarga = video AI (HeyGen). Label **Adegan dibuat dengan AI, bukan pasien sungguhan** tampil setiap kali orang AI terlihat, termasuk video kamera AI di layar ponsel. Tanpa dokter atau terapis rekaan, tanpa presenter AI.
- Layar aplikasi = rekaman ASLI aplikasi produksi. Sesi kamera: video POV AI diputar sebagai kamera Chrome; skeleton, hitungan, koreksi, dan skor dihasilkan aplikasi itu sendiri.
- Narasi: ElevenLabs Eleven v4 lewat OpenRouter, suara `daniel` (dipilih lewat audisi banding), tag nada v4 di depan setiap baris. Suara aplikasi = klip ASLI aplikasi (Eleven v4, suara Matilda) yang diputar aplikasi saat direkam, dicampur pada detik yang tercatat, dengan warna speaker ponsel tipis. Narasi tidak pernah menimpa suara aplikasi yang penting (diperiksa `npm run srt`); hitungan repetisi boleh di bawah narasi dan dikecilkan.
- Angka hanya dari `docs/bahan-paper.md`, dengan label sumber di layar. Tanpa klaim diagnosis, prognosis, atau kesembuhan. PULIHIN adalah prototype kompetisi, bukan alat kesehatan teregulasi. "Pak Budi" dan "Rina" adalah nama samaran; semua data adalah data demo.
- Alamat yang disebut dan ditampilkan: **pulihin.vercel.app** (dari `src/config/identitas.ts`: domain final hanya bila `urlPublik` sudah mengarah ke sana).
- Kolom `ucapan` di timeline.ts = teks yang dibacakan TTS (angka dieja, "PULIHIN" ditulis "Pulihin" agar dibaca satu kata, "prototype" dibaca "prototipe").

## Naskah per adegan

### 0:00,0–0:08,4 · Data: stroke dan kematian

`s01-fakta-kematian` · Tahap: Masalah di rumah · Tata letak: Tipografi data bersumber di atas video AI tanpa orang

**[N01] Narator (suara sintetis)** (0:01,2–0:07,4)

> Menurut Kementerian Kesehatan, stroke menyebabkan 18,5 persen kematian di Indonesia.

_Ucapan TTS:_ [calmly] Menurut Kementerian Kesehatan, stroke menyebabkan delapan belas koma lima persen kematian di Indonesia.

_EN:_ According to the Ministry of Health, stroke causes 18.5 percent of deaths in Indonesia.

- **Di layar:** Ruang tamu pagi (video AI tanpa orang); angka besar 18,5% menghitung naik, "kematian di Indonesia disebabkan stroke", "dan 11,2% dari total kecacatan", label sumber Kemenkes.
- **Data:** kematian di Indonesia disebabkan stroke · Sumber: Kemenkes, rilis 25 Okt 2024
- **Rekaman:** `ai-01-pagi.mp4` mulai detik 0, laju 0.9
- **Momen screenshot (0:05,0):** Angka 18,5% dengan label sumber Kemenkes

### 0:08,4–0:15,5 · Data: kontrol rutin

`s02-fakta-kontrol` · Tahap: Masalah di rumah · Tata letak: Tipografi data bersumber di atas video AI tanpa orang

**[N02] Narator (suara sintetis)** (0:09,1–0:14,5)

> Namun hanya 49,2 persen penyandang stroke yang kontrol rutin.

_Ucapan TTS:_ [calmly] Namun, hanya empat puluh sembilan koma dua persen penyandang stroke yang kontrol rutin.

_EN:_ Yet only 49.2 percent of people with stroke have regular check-ups.

- **Di layar:** Angka besar 49,2% "penyandang stroke yang kontrol rutin", perdesaan 39,6% dan perkotaan 53,7%, label sumber SKI 2023.
- **Data:** penyandang stroke yang kontrol rutin · Sumber: SKI 2023, Kemenkes (Tabel 7.48)
- **Rekaman:** `ai-01-pagi.mp4` mulai detik 7.599, laju 0.9

### 0:15,5–0:25,5 · Data: tenaga terapi di puskesmas

`s03-fakta-terapis` · Tahap: Masalah di rumah · Tata letak: Tipografi data bersumber di atas video AI tanpa orang

**[N03] Narator (suara sintetis)** (0:16,2–0:24,5)

> Tenaga terapi pun terbatas: hanya 926 tenaga keterapian fisik di lebih dari 10.000 puskesmas.

_Ucapan TTS:_ [calmly] Tenaga terapi pun terbatas: hanya sembilan ratus dua puluh enam tenaga keterapian fisik, di lebih dari sepuluh ribu puskesmas.

_EN:_ Therapists are scarce too: only 926 physical therapy staff across more than 10,000 community health centres.

- **Di layar:** Angka besar 926 "tenaga keterapian fisik di 10.180 puskesmas", label sumber Profil Kesehatan Indonesia 2023.
- **Data:** tenaga keterapian fisik di 10.180 puskesmas · Sumber: Profil Kesehatan Indonesia 2023, Kemenkes
- **Rekaman:** `ai-01-pagi.mp4` mulai detik 13.972, laju 0.9
- **Momen screenshot (0:20,5):** Angka 926 tenaga keterapian fisik di 10.180 puskesmas, dengan label sumber

### 0:25,5–0:32,5 · Video AI: lembar latihan di meja, judul PULIHIN

`s04-kertas` · Tahap: Masalah di rumah · Tata letak: Video AI + judul PULIHIN

**[N04] Narator (suara sintetis)** (0:26,2–0:31,5)

> Sepulang dari rumah sakit, program latihan sering hanya berupa selembar kertas.

_Ucapan TTS:_ [thoughtfully] Sepulang dari rumah sakit, program latihan sering hanya berupa selembar kertas.

_EN:_ After leaving hospital, the exercise programme is often just a sheet of paper.

- **Di layar:** Video AI: tangan meletakkan lembar latihan di meja jati; judul PULIHIN, Pendamping Rehabilitasi Stroke di Rumah.
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `ai-02-kertas.mp4` mulai detik 0, laju 0.85

### 0:32,5–0:42,9 · Video AI: Pak Budi ragu, kalimat masalah

`s05-ragu` · Tahap: Masalah di rumah · Tata letak: Video AI penuh layar + kalimat kunci

**[N05] Narator (suara sintetis)** (0:33,2–0:41,9)

> Di rumah, pertanyaannya sederhana tetapi berat: apakah gerakannya sudah benar? Di situlah pendampingan sering terputus.

_Ucapan TTS:_ [thoughtfully] Di rumah, pertanyaannya sederhana tetapi berat: apakah gerakannya sudah benar? Di situlah pendampingan sering terputus.

_EN:_ At home, the question is simple but heavy: am I doing this right? That is where guidance often breaks off.

- **Di layar:** Video AI: Pak Budi di sofa memegang lembar latihan, ragu mencoba mengangkat lengan; kalimat masalah tampil besar.
- **Teks penyunting:** "Di rumah, pendampingan terputus" / _At home, guidance breaks off_
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `ai-03-ragu.mp4` mulai detik 0, laju 0.731
- **Momen screenshot (0:37,5):** Kalimat masalah "Di rumah, pendampingan terputus" di atas video AI berlabel

### 0:42,9–0:53,7 · Beranda: Latihan Hari Ini

`s06-beranda` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N06] Narator (suara sintetis)** (0:43,6–0:52,7)

> Dengan PULIHIN, ponsel biasa menjadi pendamping latihan di rumah. Begitu dibuka, Latihan Hari Ini langsung terlihat, berhuruf besar.

_Ucapan TTS:_ [warmly] Dengan Pulihin, ponsel biasa menjadi pendamping latihan di rumah. Begitu dibuka, Latihan Hari Ini langsung terlihat, berhuruf besar.

_EN:_ With PULIHIN, an ordinary phone becomes a home exercise companion. Open it, and Today's Exercises are right there, in large type.

- **Di layar:** Beranda Pak Budi (Demo): "Selamat pagi, Pak Budi", Latihan Hari Ini berhuruf besar (0 dari 4 latihan selesai), tombol Mulai: Tekuk Siku.
- **Teks penyunting:** "Ponsel biasa menjadi pendamping latihan" / _An ordinary phone becomes an exercise companion_
- **Label penunjuk di samping ponsel:** Latihan Hari Ini
- **Rekaman:** `layar-01-beranda-detail.mp4` mulai detik 0
- **Momen screenshot (0:47,9):** Beranda: Latihan Hari Ini berhuruf besar

### 0:53,7–1:04,7 · Detail Latihan: contoh gerakan 3D

`s07-detail` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N07] Narator (suara sintetis)** (0:54,4–1:03,7)

> Kita mulai dari satu gerakan kecil: Tekuk Siku. Contoh gerakan tiga dimensi memperlihatkan iramanya, lengkap dengan pesan keselamatan.

_Ucapan TTS:_ [warmly] Kita mulai dari satu gerakan kecil: Tekuk Siku. Contoh gerakan tiga dimensi memperlihatkan iramanya, lengkap dengan pesan keselamatan.

_EN:_ We start with one small movement: Elbow Flexion. A 3D demonstration shows its rhythm, together with a safety notice.

- **Di layar:** Ketuk Tekuk Siku; Detail Latihan dengan contoh gerakan 3D yang bergerak, irama "sekitar 3 detik tiap gerakan", pesan "Berhenti bila nyeri, pusing, atau sesak" di atas tombol Mulai dengan Kamera.
- **Teks penyunting:** "Mulai dari satu gerakan kecil" / _Start with one small movement_
- **Label penunjuk di samping ponsel:** Contoh gerakan 3D
- **Rekaman:** `layar-01-beranda-detail.mp4` mulai detik 10.791
- **Momen screenshot (0:59,7):** Detail Latihan: contoh gerakan 3D Tekuk Siku dan pesan keselamatan

### 1:04,7–1:15,7 · Video AI: memasang ponsel; Letak ponsel di aplikasi

`s08-pasang` · Tahap: Satu gerakan kecil · Tata letak: Video AI (kartu 16:9) + rekaman layar di ponsel 3D

**[N08] Narator (suara sintetis)** (1:05,4–1:14,7)

> Aplikasi menunjukkan letak ponsel: tegak di meja, sekitar satu meter di depan kursi. Pak Budi di video ini adalah adegan buatan AI.

_Ucapan TTS:_ [warmly] Aplikasi menunjukkan letak ponsel: tegak di meja, sekitar satu meter di depan kursi. Pak Budi di video ini adalah adegan buatan AI.

_EN:_ The app shows where the phone goes: upright on a table, about one metre from the chair. Pak Budi in this video is an AI-generated scene.

- **Di layar:** Kiri: video AI Pak Budi memasang ponsel di tripod lalu duduk (berlabel AI). Kanan: Detail Latihan digulir ke Letak ponsel (1 m, ponsel tepat di depan).
- **Teks penyunting:** "Ponsel tegak di meja, ± 1 meter" / _Phone upright on a table, about 1 metre away_
- **Label penunjuk di samping ponsel:** Letak ponsel
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `ai-04-pasang-ponsel.mp4` mulai detik 0, laju 0.687
- **Rekaman:** `layar-01-beranda-detail.mp4` mulai detik 21.791
- **Momen screenshot (1:10,7):** Letak ponsel di aplikasi berdampingan dengan video AI berlabel

### 1:15,7–1:35,7 · Sesi kamera: mulai, Siap, skeleton

`s09-mulai` · Tahap: Satu gerakan kecil · Tata letak: Video AI (kartu 16:9) + rekaman layar di ponsel 3D

**[N09a] Narator (suara sintetis)** (1:16,4–1:20,8)

> Video kamera ini pun buatan AI, diputar ke aplikasi yang asli.

_Ucapan TTS:_ [warmly] Video kamera ini pun buatan AI, diputar ke aplikasi yang asli.

_EN:_ This camera video is AI-generated too, played into the real app.

**[N09b] Narator (suara sintetis)** (1:30,2–1:34,6)

> Titik-titik tubuh dibaca langsung di perangkat, tanpa mengunggah video.

_Ucapan TTS:_ [warmly] Titik-titik tubuh dibaca langsung di perangkat, tanpa mengunggah video.

_EN:_ Body landmarks are read right on the device, without uploading video.

- **Suara aplikasi (klip asli)** 1:22,3: "Posisikan tubuh Anda di dalam bingkai."
- **Suara aplikasi (klip asli)** 1:23,0: "Tubuh terdeteksi. Ingat, berhenti bila terasa nyeri atau pusing. Silakan mulai pelan-pelan."
- **Suara aplikasi (klip asli)** 1:31,5: "Tiga." (hitungan, boleh di bawah narasi)
- **Suara aplikasi (klip asli)** 1:35,5: "Empat." (hitungan, boleh di bawah narasi)

- **Di layar:** Kiri: video AI lebar Pak Budi berlatih (berlabel AI). Kanan: Mulai dengan Kamera diketuk, aplikasi asli mendeteksi tubuh dari video POV AI, skeleton tampil, suara aplikasi "Tubuh terdeteksi. Siap."
- **Teks penyunting:** "Diproses di perangkat" / _Processed on the device · camera video is not uploaded_
- **Label penunjuk di samping ponsel:** Titik tubuh
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `ai-05-latihan-lebar.mp4` mulai detik 0, laju 0.809
- **Rekaman:** `layar-02-sesi-tekuk-siku.mp4` mulai detik 0.8
- **Momen screenshot (1:23,7):** Skeleton di layar ponsel dengan video kamera AI berlabel
- **Catatan:** Narasi menunggu suara aplikasi "Tubuh terdeteksi..." selesai (tidak menimpa).

### 1:35,7–1:41,8 · Sesi kamera: hitungan lima

`s10-lima` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N10] Narator (suara sintetis)** (1:36,4–1:38,9)

> Dengarkan, aplikasinya menghitung.

_Ucapan TTS:_ [warmly] Dengarkan, aplikasinya menghitung.

_EN:_ Listen: the app is counting.

- **Suara aplikasi (klip asli)** 1:39,0: "Lima." (hitungan, boleh di bawah narasi)

- **Di layar:** Aplikasi asli menaikkan hitungan menjadi 5 dan mengucapkan "Lima" dengan suaranya sendiri.
- **Teks penyunting:** "Setiap repetisi lengkap dihitung" / _Every complete repetition is counted_
- **Label penunjuk di samping ponsel:** Hitungan repetisi
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `layar-02-sesi-tekuk-siku.mp4` mulai detik 20.772
- **Momen screenshot (1:40,0):** Hitungan 5 dengan skeleton, suara aplikasi "Lima"

### 1:41,8–1:48,5 · Koreksi form: bahu terangkat

`s11-koreksi` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N11a] Narator (suara sintetis)** (1:42,5–1:44,7)

> Sekarang bahunya ikut terangkat.

_Ucapan TTS:_ [calmly] Sekarang bahunya ikut terangkat.

_EN:_ Now the shoulder hikes up.

- **Suara aplikasi (klip asli)** 1:41,8: "Enam." (hitungan, boleh di bawah narasi)
- **Suara aplikasi (klip asli)** 1:45,1: "Rilekskan bahu, turunkan bahu Anda."
- **Suara aplikasi (klip asli)** 1:48,1: "Tujuh." (hitungan, boleh di bawah narasi)

- **Di layar:** Pak Budi (video kamera AI) mengangkat bahu; pesan koreksi "Rilekskan bahu, turunkan bahu Anda" muncul di atas skeleton dan aplikasi mengucapkannya dengan klip suaranya sendiri.
- **Teks penyunting:** "Koreksi saat bahu terangkat" / _A correction when the shoulder rises_
- **Label penunjuk di samping ponsel:** Koreksi form
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `layar-02-sesi-tekuk-siku.mp4` mulai detik 26.826
- **Momen screenshot (1:46,3):** Pesan koreksi "Rilekskan bahu, turunkan bahu Anda" di atas skeleton
- **Catatan:** Adegan terpenting. Koreksi muncul karena aplikasi asli memproses video POV AI (kamera palsu Chrome); tidak ada teks atau suara yang ditempel saat menyunting. Suara = klip aplikasi pada detik yang tercatat.

### 1:48,5–1:54,7 · Video AI lebar: latihan berlanjut (melewati titik ulang video kamera)

`s12-lebar` · Tahap: Satu sesi utuh · Tata letak: Video AI penuh layar + kalimat kunci

**[N11b] Narator (suara sintetis)** (1:49,2–1:53,7)

> Aplikasi langsung mengingatkan, dengan suara dan teks besar.

_Ucapan TTS:_ [warmly] Aplikasi langsung mengingatkan, dengan suara dan teks besar.

_EN:_ The app reminds him right away, by voice and in large text.

- **Suara aplikasi (klip asli)** 1:51,0: "Delapan." (hitungan, boleh di bawah narasi)

- **Di layar:** Video AI lebar Pak Budi melanjutkan latihan (berlabel AI); suara hitungan aplikasi tetap terdengar pada detik aslinya.
- **Teks penyunting:** "Diingatkan langsung, dalam Bahasa Indonesia" / _Reminded right away, in Indonesian_
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `ai-05-latihan-lebar.mp4` mulai detik 2.5
- **Rekaman:** `layar-02-sesi-tekuk-siku.mp4` mulai detik 33.625

### 1:54,7–2:02,6 · Sesi berlanjut sampai 10 kali, target tercapai

`s13-sepuluh` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

_(Tanpa narasi.)_

- **Suara aplikasi (klip asli)** 1:55,7: "Sembilan." (hitungan, boleh di bawah narasi)
- **Suara aplikasi (klip asli)** 1:58,3: "Sepuluh." (hitungan, boleh di bawah narasi)
- **Suara aplikasi (klip asli)** 1:59,3: "Hebat! Target tercapai."

- **Di layar:** Hitungan 9 dan 10 dengan suara aplikasi, "Hebat! Target tercapai.", lalu Ringkasan sesi. Tanpa narasi.
- **Teks penyunting:** "Sampai repetisi kesepuluh" / _All the way to the tenth repetition_
- **Label penunjuk di samping ponsel:** Hitungan repetisi
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `layar-02-sesi-tekuk-siku.mp4` mulai detik 39.74

### 2:02,6–2:13,6 · Ringkasan Sesi: skor

`s14-ringkasan` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N14] Narator (suara sintetis)** (2:03,3–2:11,0)

> Di akhir sesi ada skor dan ringkasan sederhana: jumlah repetisi dan durasi, dengan label yang mudah dipahami.

_Ucapan TTS:_ [warmly] Di akhir sesi ada skor dan ringkasan sederhana: jumlah repetisi dan durasi, dengan label yang mudah dipahami.

_EN:_ At the end of the session there is a score and a simple summary: repetitions and duration, with labels that are easy to understand.

- **Di layar:** Ringkasan Sesi: cincin skor dengan label, Repetisi 10 / 10, Durasi; lalu Rincian skor.
- **Teks penyunting:** "Skor dan ringkasan sederhana" / _A score and a simple summary_ · Perlu Pendampingan · Berkembang · Baik · Sangat Baik
- **Label penunjuk di samping ponsel:** Skor sesi
- **Rekaman:** `layar-03-ringkasan-beranda.mp4` mulai detik 0
- **Momen screenshot (2:07,6):** Skor sesi dengan label, repetisi, dan durasi

### 2:13,6–2:23,2 · Ringkasan Sesi: saran dan kalimat bukan diagnosis

`s15-batasan` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N15] Narator (suara sintetis)** (2:14,3–2:22,2)

> Ada satu saran untuk sesi berikutnya, dan kalimat batasan yang selalu tampil: ini skor latihan, bukan diagnosis.

_Ucapan TTS:_ [warmly] Ada satu saran untuk sesi berikutnya, dan kalimat batasan yang selalu tampil: ini skor latihan, bukan diagnosis.

_EN:_ There is one tip for the next session, and a disclaimer that always appears: this is an exercise score, not a diagnosis.

- **Di layar:** Saran untuk sesi berikutnya dan kalimat "Skor ini adalah skor latihan untuk motivasi dan pemantauan, bukan skor klinis dan bukan alat ukur diagnosis".
- **Teks penyunting:** "Satu saran, bukan diagnosis" / _One tip, not a diagnosis_
- **Label penunjuk di samping ponsel:** Bukan skor klinis
- **Rekaman:** `layar-03-ringkasan-beranda.mp4` mulai detik 11

### 2:23,2–2:32,2 · Kembali ke Beranda: latihan selesai

`s16-tercatat` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N16] Narator (suara sintetis)** (2:23,9–2:31,2)

> Kembali ke Beranda, Tekuk Siku sudah bertanda selesai. Latihannya tercatat, dan keluarga bisa ikut melihat.

_Ucapan TTS:_ [warmly] Kembali ke Beranda, Tekuk Siku sudah bertanda selesai. Latihannya tercatat, dan keluarga bisa ikut melihat.

_EN:_ Back on the home screen, Elbow Flexion is marked done. The exercise is recorded, and the family can see it too.

- **Di layar:** Ketuk Kembali ke Beranda; Tekuk Siku bertanda selesai beserta skor, 1 dari 4 latihan selesai.
- **Teks penyunting:** "Latihan hari ini tercatat" / _Today's exercise is recorded_
- **Label penunjuk di samping ponsel:** Tekuk Siku selesai
- **Rekaman:** `layar-03-ringkasan-beranda.mp4` mulai detik 20.615
- **Momen screenshot (2:29,7):** Beranda: Tekuk Siku selesai beserta skornya

### 2:32,2–2:40,1 · Video AI: Rina memeriksa ponsel

`s17-rina` · Tahap: Keluarga dan bicara · Tata letak: Video AI penuh layar + kalimat kunci

**[N17] Narator (suara sintetis)** (2:32,9–2:39,1)

> Di tempat lain, Rina, putrinya, tidak perlu lagi menebak apakah ayahnya sudah berlatih.

_Ucapan TTS:_ [warmly] Di tempat lain, Rina, putrinya, tidak perlu lagi menebak apakah ayahnya sudah berlatih.

_EN:_ Elsewhere, Rina, his daughter, no longer has to guess whether her father has exercised.

- **Di layar:** Video AI: Rina (berhijab) memeriksa ponsel dan tersenyum lega (layar tidak terlihat), berlabel AI.
- **Teks penyunting:** "Keluarga tidak lagi menebak" / _The family no longer has to guess_
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `ai-06-rina.mp4` mulai detik 0, laju 0.9
- **Momen screenshot (2:36,2):** Video AI Rina berlabel, kalimat "Keluarga tidak lagi menebak"

### 2:40,1–2:52,1 · Untuk Keluarga: status, tanda, grafik 7 hari

`s18-keluarga` · Tahap: Keluarga dan bicara · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N18] Narator (suara sintetis)** (2:40,8–2:48,5)

> Halaman Untuk Keluarga menunjukkan status hari ini, tanda bila latihan sempat terhenti, dan grafik tujuh hari terakhir.

_Ucapan TTS:_ [warmly] Halaman Untuk Keluarga menunjukkan status hari ini, tanda bila latihan sempat terhenti, dan grafik tujuh hari terakhir.

_EN:_ The For Family page shows today's status, a flag when exercise has stopped, and a chart of the last seven days.

- **Di layar:** Untuk Keluarga: status Pak Budi hari ini, kartu tanda perlu perhatian (sempat beberapa hari tanpa latihan), lalu grafik Sesi terjadwal 7 hari.
- **Teks penyunting:** "Status hari ini dan tanda perlu perhatian" / _Today's status and attention flags_
- **Label penunjuk di samping ponsel:** Sesi terjadwal 7 hari
- **Rekaman:** `layar-04-keluarga.mp4` mulai detik 0
- **Momen screenshot (2:49,1):** Grafik Sesi terjadwal 7 hari di halaman Untuk Keluarga

### 2:52,1–3:03,1 · Untuk Keluarga: tren skor dan salin ringkasan

`s19-salin` · Tahap: Keluarga dan bicara · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N19] Narator (suara sintetis)** (2:52,8–2:59,7)

> Tren skor empat belas hari juga terlihat, dan ringkasan mingguan bisa disalin dengan satu ketukan untuk terapis.

_Ucapan TTS:_ [warmly] Tren skor empat belas hari juga terlihat, dan ringkasan mingguan bisa disalin dengan satu ketukan untuk terapis.

_EN:_ The 14-day score trend is there too, and the weekly summary can be copied with one tap for the therapist.

- **Di layar:** Tren skor 14 hari, lalu ketuk Salin Ringkasan Mingguan; konfirmasi bahwa ringkasan disalin tampil.
- **Teks penyunting:** "Ringkasan mingguan untuk terapis" / _A weekly summary for the therapist_
- **Label penunjuk di samping ponsel:** Salin Ringkasan Mingguan
- **Rekaman:** `layar-04-keluarga.mp4` mulai detik 12
- **Momen screenshot (3:01,6):** Konfirmasi setelah Salin Ringkasan Mingguan diketuk

### 3:03,1–3:17,6 · Latihan Bicara: kata, gambar, Dengar

`s20-bicara` · Tahap: Keluarga dan bicara · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N20a] Narator (suara sintetis)** (3:03,8–3:10,5)

> Untuk gangguan bicara atau afasia, ada Latihan Bicara berbahasa Indonesia, dengan kata-kata sehari-hari.

_Ucapan TTS:_ [warmly] Untuk gangguan bicara atau afasia, ada Latihan Bicara berbahasa Indonesia, dengan kata-kata sehari-hari.

_EN:_ For speech difficulties, or aphasia, there is Speech Practice in Indonesian, with everyday words.

**[N20b] Narator (suara sintetis)** (3:11,0–3:13,4)

> Tombol Dengar memutar contohnya.

_Ucapan TTS:_ [warmly] Tombol Dengar memutar contohnya.

_EN:_ The Listen button plays an example.

- **Suara aplikasi (klip asli)** 3:14,0: "sabun"
- **Suara aplikasi (klip asli)** 3:15,7: "Cuci tangan pakai sabun."

- **Di layar:** Latihan Bicara: Mode Latihan Mandiri, kategori Benda di Rumah; gambar kata besar; Dengar diketuk dan aplikasi mengucapkan kata serta kalimat contohnya.
- **Teks penyunting:** "Latihan bicara berbahasa Indonesia" / _Speech practice in Indonesian_
- **Label penunjuk di samping ponsel:** Dengar
- **Rekaman:** `layar-05-afasia.mp4` mulai detik 0
- **Momen screenshot (3:11,1):** Latihan Bicara: gambar kata besar dan tombol Dengar

### 3:17,6–3:24,6 · Video AI: Pak Budi menyebut kata, hasil Benar

`s21-sebut` · Tahap: Keluarga dan bicara · Tata letak: Video AI (kartu 16:9) + rekaman layar di ponsel 3D

_(Tanpa narasi.)_

- **Suara aplikasi (klip asli)** 3:23,5: "Benar! Bagus sekali."
- **Ucapan di video AI** 3:21,7: "Sabun"

- **Di layar:** Kiri: video AI Pak Budi menyebut kata latihan, Rina tersenyum (berlabel AI), suaranya terdengar. Kanan: Sudah Benar diketuk, aplikasi menampilkan dan mengucapkan "Benar!". Tanpa narasi.
- **Teks penyunting:** "Diucapkan, lalu dinilai" / _Spoken, then scored_
- **Label penunjuk di samping ponsel:** Benar!
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `ai-07-bicara.mp4` mulai detik 0.92
- **Rekaman:** `layar-05-afasia.mp4` mulai detik 14.5
- **Momen screenshot (3:23,6):** Hasil "Benar!" di Latihan Bicara di samping video AI berlabel

### 3:24,6–3:34,0 · Latihan Bicara: penilaian pendamping

`s21b-nilai` · Tahap: Keluarga dan bicara · Tata letak: Rekaman layar di ponsel 3D + kalimat kunci

**[N21] Narator (suara sintetis)** (3:26,3–3:33,0)

> Dalam Mode Latihan Mandiri, pendamping menilai dengan satu ketukan: Sudah Benar, atau Ulangi.

_Ucapan TTS:_ [warmly] Dalam Mode Latihan Mandiri, pendamping menilai dengan satu ketukan: Sudah Benar, atau Ulangi.

_EN:_ In Self-Practice Mode, the companion scores with one tap: Correct, or Repeat.

- **Di layar:** Hasil "Benar!" di Latihan Bicara, lalu Kata Berikutnya diketuk dan kata baru tampil.
- **Teks penyunting:** "Pendamping menilai dengan satu ketukan" / _The companion scores with one tap_
- **Label penunjuk di samping ponsel:** Hasil: Benar!
- **Rekaman:** `layar-05-afasia.mp4` mulai detik 21.5
- **Catatan:** Rekaman layar memakai Mode Latihan Mandiri (pengenal suara Chrome tidak tersedia di peramban otomatis), maka narasi menyebut penilaian oleh pendamping, bukan pengenalan suara.

### 3:34,0–3:44,0 · Dashboard Terapis: progres pasien

`s22-terapis` · Tahap: Terapis dan penutup · Tata letak: Rekaman layar desktop dalam bingkai peramban (perspektif halus) + kalimat kunci

**[N22] Narator (suara sintetis)** (3:34,7–3:41,9)

> Di Dashboard Terapis, terapis menyusun program dan mengikuti kemajuan, tanpa menunggu kunjungan berikutnya.

_Ucapan TTS:_ [warmly] Di Dashboard Terapis, terapis menyusun program dan mengikuti kemajuan, tanpa menunggu kunjungan berikutnya.

_EN:_ On the Therapist Dashboard, the therapist sets the programme and follows progress, without waiting for the next visit.

- **Di layar:** Dashboard Terapis (Prototype, Demo), halaman Pak Budi: Kepatuhan 7 hari terakhir dan Resep Program; Tambah Luruskan Tungkai.
- **Teks penyunting:** "Terapis menyusun program" / _The therapist sets the home programme_
- **Rekaman:** `layar-06-klinisi.mp4` mulai detik 0
- **Momen screenshot (3:40,0):** Kepatuhan 7 hari terakhir pada halaman Pak Budi di Dashboard Terapis

### 3:44,0–3:55,0 · Resep program menjadi Latihan Hari Ini

`s23-program` · Tahap: Terapis dan penutup · Tata letak: Rekaman layar desktop dalam bingkai peramban (perspektif halus) + kalimat kunci

**[N23] Narator (suara sintetis)** (3:44,7–3:50,7)

> Di prototype ini, program yang disimpan terapis langsung menjadi Latihan Hari Ini di profil pasien.

_Ucapan TTS:_ [warmly] Di prototipe ini, program yang disimpan terapis langsung menjadi Latihan Hari Ini di profil pasien.

_EN:_ In this prototype, the programme the therapist saves becomes Today's Exercises on the patient's profile right away.

- **Di layar:** Simpan Resep dan pesan tersimpan; Lihat sebagai pasien membuka Beranda Pak Budi yang kini memuat Luruskan Tungkai.
- **Teks penyunting:** "Program terapis menjadi Latihan Hari Ini" / _The therapist's programme becomes today's exercises_
- **Rekaman:** `layar-06-klinisi.mp4` mulai detik 10
- **Momen screenshot (3:53,0):** Beranda Pak Budi memuat Luruskan Tungkai setelah terapis menyimpan resep

### 3:55,0–4:14,0 · Video AI penutup: PULIHIN tidak menggantikan terapis

`s24-penutup` · Tahap: Terapis dan penutup · Tata letak: Video AI penutup + kartu alamat

**[N24a] Narator (suara sintetis)** (3:55,7–4:04,9)

> PULIHIN tidak menggantikan terapis. PULIHIN membantu agar yang diajarkan terapis benar-benar dilatih di rumah, bersama keluarga.

_Ucapan TTS:_ [warmly] Pulihin tidak menggantikan terapis. Pulihin membantu, agar yang diajarkan terapis benar-benar dilatih di rumah, bersama keluarga.

_EN:_ PULIHIN does not replace the therapist. It helps make sure that what the therapist teaches is truly practised at home, with the family.

**[N24b] Narator (suara sintetis)** (4:05,5–4:13,0)

> Ini prototype kompetisi, bukan alat kesehatan teregulasi. Coba sekarang di pulihin.vercel.app.

_Ucapan TTS:_ [warmly] Ini prototipe kompetisi, bukan alat kesehatan teregulasi. Coba sekarang di pulihin titik vercel titik app.

_EN:_ This is a competition prototype, not a regulated medical device. Try it now at pulihin.vercel.app.

- **Di layar:** Video AI Pak Budi dan Rina di sofa (berlabel AI); kalimat "Pendamping latihan di rumah, bukan pengganti terapis", lalu kartu pulihin.vercel.app dan penafian prototype.
- **Teks penyunting:** "Pendamping latihan di rumah, bukan pengganti terapis" / _A home exercise companion, not a replacement for the therapist_
- **Label:** Adegan dibuat dengan AI, bukan pasien sungguhan
- **Rekaman:** `ai-08-penutup.mp4` mulai detik 0, laju 0.9
- **Momen screenshot (4:09,0):** Video AI penutup berlabel dengan kartu pulihin.vercel.app dan penafian prototype

### 4:14,0–4:22,0 · Layar penutup dan pengungkapan

`s25-layar-penutup` · Tahap: Terapis dan penutup · Tata letak: Layar penutup dengan pengungkapan

_(Tanpa narasi.)_

- **Di layar:** PULIHIN · pulihin.vercel.app · Health and Wellbeing, .id Developer Day Indonesia 2026 · pengungkapan AI (HeyGen, Eleven v4, Lyria 3) dan rekaman layar asli
- **Momen screenshot (4:19,0):** Layar penutup: PULIHIN, pulihin.vercel.app, kategori, pengungkapan AI

## Naskah utuh

N01: Menurut Kementerian Kesehatan, stroke menyebabkan 18,5 persen kematian di Indonesia.

N02: Namun hanya 49,2 persen penyandang stroke yang kontrol rutin.

N03: Tenaga terapi pun terbatas: hanya 926 tenaga keterapian fisik di lebih dari 10.000 puskesmas.

N04: Sepulang dari rumah sakit, program latihan sering hanya berupa selembar kertas.

N05: Di rumah, pertanyaannya sederhana tetapi berat: apakah gerakannya sudah benar? Di situlah pendampingan sering terputus.

N06: Dengan PULIHIN, ponsel biasa menjadi pendamping latihan di rumah. Begitu dibuka, Latihan Hari Ini langsung terlihat, berhuruf besar.

N07: Kita mulai dari satu gerakan kecil: Tekuk Siku. Contoh gerakan tiga dimensi memperlihatkan iramanya, lengkap dengan pesan keselamatan.

N08: Aplikasi menunjukkan letak ponsel: tegak di meja, sekitar satu meter di depan kursi. Pak Budi di video ini adalah adegan buatan AI.

N09a: Video kamera ini pun buatan AI, diputar ke aplikasi yang asli.

N09b: Titik-titik tubuh dibaca langsung di perangkat, tanpa mengunggah video.

N10: Dengarkan, aplikasinya menghitung.

N11a: Sekarang bahunya ikut terangkat.

N11b: Aplikasi langsung mengingatkan, dengan suara dan teks besar.

N14: Di akhir sesi ada skor dan ringkasan sederhana: jumlah repetisi dan durasi, dengan label yang mudah dipahami.

N15: Ada satu saran untuk sesi berikutnya, dan kalimat batasan yang selalu tampil: ini skor latihan, bukan diagnosis.

N16: Kembali ke Beranda, Tekuk Siku sudah bertanda selesai. Latihannya tercatat, dan keluarga bisa ikut melihat.

N17: Di tempat lain, Rina, putrinya, tidak perlu lagi menebak apakah ayahnya sudah berlatih.

N18: Halaman Untuk Keluarga menunjukkan status hari ini, tanda bila latihan sempat terhenti, dan grafik tujuh hari terakhir.

N19: Tren skor empat belas hari juga terlihat, dan ringkasan mingguan bisa disalin dengan satu ketukan untuk terapis.

N20a: Untuk gangguan bicara atau afasia, ada Latihan Bicara berbahasa Indonesia, dengan kata-kata sehari-hari.

N20b: Tombol Dengar memutar contohnya.

N21: Dalam Mode Latihan Mandiri, pendamping menilai dengan satu ketukan: Sudah Benar, atau Ulangi.

N22: Di Dashboard Terapis, terapis menyusun program dan mengikuti kemajuan, tanpa menunggu kunjungan berikutnya.

N23: Di prototype ini, program yang disimpan terapis langsung menjadi Latihan Hari Ini di profil pasien.

N24a: PULIHIN tidak menggantikan terapis. PULIHIN membantu agar yang diajarkan terapis benar-benar dilatih di rumah, bersama keluarga.

N24b: Ini prototype kompetisi, bukan alat kesehatan teregulasi. Coba sekarang di pulihin.vercel.app.
