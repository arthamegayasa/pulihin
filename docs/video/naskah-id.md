# Naskah Narasi Final Video Demo PULIHIN

> Berkas ini DIBUAT OTOMATIS dari `video/src/timeline.ts` oleh `npm run srt` (di folder `video/`). Jangan disunting langsung: ubah teks atau timecode di `timeline.ts`, lalu jalankan ulang.

- Durasi: 4:58 (batas 5:00), 23 adegan, 30 fps, 1920x1080.
- **Jumlah kata narasi: 379 kata** (batas 650). Dokter 72 kata, Narator 307 kata. Baris "Suara aplikasi" tidak dihitung karena berasal dari rekaman aplikasi.
- Tempo rata-rata: 1,88 kata per detik bicara (113 kata per menit), sengaja tenang untuk penonton medis dan memberi ruang bagi suara aplikasi.
- Adegan 4:00–4:25 memakai varian **klinisi** (`ADEGAN_TERAPIS` di timeline.ts: `klinisi` bila dashboard klinisi P1 selesai, `streak` bila belum).

## Aturan baca

- Video adalah bukti fungsi, bukan iklan (Bab 14). Setiap klaim yang diucapkan terlihat di layar dalam beberapa detik; kolom "Di layar" adalah buktinya. Bila rekaman tidak menampilkan hal itu, ubah narasinya, jangan menempel teks palsu.
- Tanpa klaim diagnosis, prognosis, atau kesembuhan. PULIHIN adalah prototype kompetisi, bukan alat kesehatan teregulasi.
- Pasien demo "Pak Budi, 58 tahun" adalah nama samaran. Semua orang yang tampil sebagai pasien adalah pemeran: label **Peragaan oleh pemeran** tampil di layar, diucapkan pada 0:50–1:02, dan ditulis di deskripsi YouTube.
- Pembicara: **Dokter (di kamera)** = talking head; **Dokter (suara, di atas b-roll)** = suara dokter direkam terpisah, diputar di atas b-roll; **Narator (voice-over)** = suara narator (boleh dokter yang sama atau anggota tim); **Suara aplikasi** = suara TTS aplikasi dari rekaman layar, tidak dibacakan.
- Baca pelan dan hangat. Timecode bicara adalah target; setelah narasi direkam, isi `mulai`/`selesai` di timeline.ts agar subtitle mengikuti potongan final.

## Naskah per adegan

### 0:00–0:12 · Pembuka dokter dan judul

`s01-pembuka` · Tahap: Masalah klinis · Tata letak: Talking head dokter + judul

**[N01] Dokter (di kamera)** (0:00,5–0:06,9)

> Saya dokter spesialis saraf. Setiap minggu, saya melepas pasien stroke pulang ke rumah.

_EN:_ I am a neurologist. Every week, I discharge stroke patients to go home.

- **Di layar:** Wajah dokter, lower third nama dan gelar, judul PULIHIN: Pendamping Rehabilitasi Stroke di Rumah.
- **Momen screenshot (0:06):** Wajah dokter dengan judul PULIHIN dan nama dokter

### 0:12–0:19 · Dokter: program di atas kertas

`s02-kertas` · Tahap: Masalah klinis · Tata letak: Talking head dokter

**[N02] Dokter (di kamera)** (0:12,5–0:16,4)

> Mereka pulang membawa program latihan di atas kertas.

_EN:_ They go home with an exercise programme on paper.

- **Di layar:** Wajah dokter yang melanjutkan penjelasan.

### 0:19–0:24 · B-roll: kertas program di meja

`s03-ragu` · Tahap: Masalah klinis · Tata letak: B-roll penuh layar + kalimat kunci

**[N03] Dokter (suara, di atas b-roll)** (0:19,5–0:23,5)

> Di rumah, mereka sering lupa dan ragu apakah gerakannya sudah benar.

_EN:_ At home, they often forget, and are unsure whether they move correctly.

- **Di layar:** Kertas program latihan diletakkan di meja rumah, dengan kalimat kunci di sampingnya.
- **Teks penyunting:** "Lupa jadwal, ragu gerakannya benar" / _Missed sessions, unsure about the movement_
- **Label:** Peragaan oleh pemeran

### 0:24–0:30 · B-roll: pemeran kebingungan, kalimat masalah

`s04-masalah` · Tahap: Masalah klinis · Tata letak: B-roll penuh layar + kalimat kunci

**[N04] Dokter (suara, di atas b-roll)** (0:24,5–0:29,5)

> Padahal pemulihan ditentukan oleh latihan harian di rumah, dan di situlah pendampingan terputus.

_EN:_ Yet recovery depends on daily exercise at home, and that is exactly where guidance breaks off.

- **Di layar:** Pemeran tampak ragu memegang kertas program; kalimat masalah tampil besar.
- **Teks penyunting:** "Di rumah, pendampingan terputus" / _At home, guidance breaks off_
- **Label:** Peragaan oleh pemeran
- **Momen screenshot (0:28):** Kalimat masalah "Di rumah, pendampingan terputus" di layar

### 0:30–0:40 · Beranda: Latihan Hari Ini

`s05-beranda` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N05] Narator (voice-over)** (0:30,5–0:39,5)

> PULIHIN mengubah ponsel biasa menjadi pendamping latihan. Begitu dibuka, Latihan Hari Ini langsung tampil dalam huruf besar.

_EN:_ PULIHIN turns an ordinary phone into an exercise companion. Once opened, Today's Exercises appear right away, in large type.

- **Di layar:** Beranda Pak Budi (Demo): "Selamat pagi, Pak Budi", pengingat jadwal latihan gerak, Latihan Hari Ini berhuruf besar (0 dari 4 latihan selesai), tombol Mulai: Tekuk Siku.
- **Teks penyunting:** "Ponsel biasa menjadi pendamping latihan" / _An ordinary phone as a home exercise companion_
- **Label penunjuk di samping ponsel:** Latihan Hari Ini

### 0:40–0:50 · Detail Latihan: Tekuk Siku

`s06-detail` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N06] Narator (voice-over)** (0:40,5–0:49,5)

> Kita mulai dari satu gerakan kecil: Tekuk Siku. Ada contoh gerakan, pesan keselamatan, lalu satu tombol besar: Mulai dengan Kamera.

_EN:_ We start with one small movement: Elbow Flexion. There is a movement demo, a safety notice, then one big button: Start with Camera.

- **Di layar:** Ketuk Tekuk Siku; Detail Latihan dengan contoh gerakan bergerak, Posisi dan Target, pesan "Berhenti bila nyeri, pusing, atau sesak" tepat di atas tombol Mulai dengan Kamera, lalu gulir ke kartu Utamakan keselamatan.
- **Teks penyunting:** "Mulai dari satu gerakan kecil" / _Start with one small movement_
- **Label penunjuk di samping ponsel:** Mulai dengan Kamera

### 0:50–1:02 · Shot lebar: ponsel di meja, pemeran duduk

`s07-posisi` · Tahap: Satu gerakan kecil · Tata letak: Shot lebar pemeran + rekaman layar dalam bingkai ponsel

**[N07] Narator (voice-over)** (0:50,5–1:00,6)

> Ponsel cukup diletakkan di meja, sekitar satu meter dari kursi. Yang tampil di sini adalah peragaan oleh pemeran, bukan pasien sungguhan.

_EN:_ The phone simply sits on a table, about one metre from the chair. What you see here is a demonstration by a performer, not a real patient.

- **Di layar:** Pemeran duduk di depan ponsel bertripod; di bingkai ponsel tampil skeleton dan hitungan awal sesi.
- **Teks penyunting:** "Ponsel di meja, ± 1 meter" / _Phone on a table, about 1 metre away_
- **Label:** Peragaan oleh pemeran
- **Momen screenshot (0:57):** Skeleton dan hitungan awal di layar ponsel, pemeran duduk di depan ponsel

### 1:02–1:16 · Sesi kamera: sudut siku dan skeleton

`s08-sudut` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N08] Narator (voice-over)** (1:02,5–1:14,6)

> Kamera membaca titik-titik tubuh langsung di ponsel ini, tanpa mengunggah video. Repetisi dihitung dari sudut siku: tekuk penuh, luruskan lagi, baru terhitung satu.

_EN:_ The camera reads body landmarks right on this phone, without uploading any video. Each repetition is counted from the elbow angle: a full bend, straighten again, and only then does it count.

- **Di layar:** Skeleton mengikuti lengan pemeran, sudut siku tampil, hitungan bertambah setelah satu siklus tekuk-luruskan.
- **Teks penyunting:** "Repetisi dihitung dari sudut siku" / _Repetitions counted from the elbow angle_ · Diproses di ponsel · video tidak diunggah
- **Label penunjuk di samping ponsel:** Sudut siku

### 1:16–1:30 · Sesi kamera: 5 / 10

`s09-lima` · Tahap: Satu gerakan kecil · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N09] Narator (voice-over)** (1:16,5–1:26,4)

> Lihat angkanya: lima dari sepuluh. Hitungan hanya naik bila gerakannya lengkap, dan aplikasi memberi tahu bila gerakannya belum tepat.

_EN:_ Look at the count: five out of ten. It only rises when a movement is complete, and the app speaks up when the movement is not quite right.

- **Di layar:** Hitungan besar 5 / 10 dengan skeleton di atas video kamera.
- **Teks penyunting:** "Hitungan naik setiap repetisi lengkap" / _The count rises with every complete repetition_
- **Label penunjuk di samping ponsel:** Hitungan repetisi
- **Momen screenshot (1:20):** Hitungan "5 / 10" dengan skeleton

### 1:30–1:44 · Koreksi form: bahu terangkat

`s10-koreksi` · Tahap: Satu sesi utuh · Tata letak: Shot lebar pemeran + rekaman layar dalam bingkai ponsel

**[N10a] Narator (voice-over)** (1:30,5–1:32,8)

> Sekarang bahunya ikut terangkat.

_EN:_ Now the shoulder hikes up.

**[N10-app] Suara aplikasi (dari rekaman layar), tidak dibacakan** (1:33,2–1:37,4)

> Rilekskan bahu, turunkan bahu Anda.

_EN:_ [App voice] Relax your shoulder, lower your shoulder.

**[N10b] Narator (voice-over)** (1:38–1:43,4)

> Aplikasi mengoreksi dengan suara dan teks besar, dalam Bahasa Indonesia.

_EN:_ The app gives a form correction, by voice and in large text, in Indonesian.

- **Di layar:** Pemeran mengangkat bahu secara alami; pesan koreksi "Rilekskan bahu, turunkan bahu Anda" muncul di atas skeleton dan terdengar suara aplikasi.
- **Teks penyunting:** "Koreksi form saat bahu terangkat" / _Form correction when the shoulder rises_
- **Label penunjuk di samping ponsel:** Koreksi form
- **Label:** Peragaan oleh pemeran
- **Momen screenshot (1:36):** Pesan koreksi "Rilekskan bahu, turunkan bahu Anda" di atas skeleton
- **Catatan:** Adegan terpenting. Koreksi harus muncul alami dari gerakan pemeran (Bab 15), JANGAN menempel teks koreksi saat menyunting. Sesuaikan mulaiDi dan waktu N10-app dengan detik koreksi pada rekaman.

### 1:44–1:58 · Pemeran memperbaiki, hitungan berlanjut

`s11-perbaiki` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N11] Narator (voice-over)** (1:44,5–1:54,2)

> Pemeran menurunkan bahunya, pesan menghilang, dan hitungan berlanjut. Hanya satu pesan pada satu waktu, supaya tidak membingungkan.

_EN:_ The performer lowers the shoulder, the message clears, and counting continues. Only one message at a time, so it never gets confusing.

- **Di layar:** Pesan koreksi hilang setelah bahu turun; hitungan repetisi bertambah lagi.
- **Teks penyunting:** "Satu pesan pada satu waktu" / _One form correction at a time_
- **Label penunjuk di samping ponsel:** Pesan koreksi

### 1:58–2:10 · Sesi berlanjut sampai 10 / 10

`s12-cara-gerak` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N12] Narator (voice-over)** (1:58,5–2:05,2)

> Jadi bukan sekadar menghitung, melainkan menjaga cara geraknya, sampai repetisi kesepuluh.

_EN:_ So it is not just counting: it guards how each movement is done, all the way to the tenth repetition.

- **Di layar:** Hitungan naik sampai 10 / 10 dan sesi berakhir.
- **Teks penyunting:** "Bukan sekadar menghitung" / _Not just counting: form correction_
- **Label penunjuk di samping ponsel:** Hitungan repetisi

### 2:10–2:30 · Ringkasan Sesi: skor

`s13-ringkasan` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N13] Narator (voice-over)** (2:10,5–2:23,0)

> Di akhir sesi ada skor dan ringkasan sederhana: jumlah repetisi dan durasi. Labelnya mudah dipahami, mulai dari Perlu Pendampingan, Berkembang, Baik, sampai Sangat Baik.

_EN:_ At the end of the session there is a score and a simple summary: repetitions and duration. The labels are easy to read, from Needs Support and Improving to Good and Very Good.

- **Di layar:** Ringkasan Sesi "Hebat, target latihan tercapai!": angka skor dengan label, Repetisi 10 / 10, Durasi; lalu gulir ke Rincian skor (Jumlah gerakan, Rentang gerak, Irama gerakan, masing-masing dengan label).
- **Teks penyunting:** "Skor dan ringkasan sederhana" / _A score and a simple summary_ · Perlu Pendampingan · Berkembang · Baik · Sangat Baik
- **Label penunjuk di samping ponsel:** Skor sesi
- **Momen screenshot (2:20):** Skor sesi dengan label, repetisi, dan durasi

### 2:30–2:42 · Ringkasan Sesi: saran dan kalimat bukan diagnosis

`s14-batasan` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N14] Narator (voice-over)** (2:30,5–2:38,4)

> Ada satu saran untuk sesi berikutnya. Ringkasan ini bukan diagnosis, dan kalimat batasan itu selalu tampil.

_EN:_ There is one tip for the next session. This summary is not a diagnosis, and that disclaimer always appears.

- **Di layar:** Gulir ke kartu Saran untuk sesi berikutnya dan kalimat "Skor ini adalah skor latihan untuk motivasi dan pemantauan, bukan skor klinis dan bukan alat ukur diagnosis", di atas tombol Kembali ke Beranda.
- **Teks penyunting:** "Satu saran, bukan diagnosis" / _One tip, not a diagnosis_
- **Label penunjuk di samping ponsel:** Kalimat bukan diagnosis

### 2:42–3:00 · Kembali ke Beranda: latihan selesai

`s15-tercatat` · Tahap: Satu sesi utuh · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N15] Narator (voice-over)** (2:42,5–2:52,2)

> Kembali ke Beranda, Tekuk Siku sudah bertanda selesai beserta skornya. Latihannya tercatat di ponsel, dan keluarga bisa melihatnya.

_EN:_ Back on the home screen, Elbow Flexion is marked done, with its score. The exercise is recorded on the phone, and the family can see it.

- **Di layar:** Ketuk Kembali ke Beranda; Tekuk Siku bertanda "Selesai, skor 94", 1 dari 4 latihan selesai, 1 hari beruntun; tombol Untuk Keluarga terlihat.
- **Teks penyunting:** "Latihan hari ini tercatat" / _Today's exercise is recorded_
- **Label penunjuk di samping ponsel:** Tekuk Siku selesai
- **Momen screenshot (2:50):** Beranda: Tekuk Siku "Selesai" beserta angka skornya

### 3:00–3:15 · Untuk Keluarga: tanda, status, grafik 7 hari

`s16-keluarga` · Tahap: Keluarga dan afasia · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N16] Narator (voice-over)** (3:00,5–3:11,1)

> Keluarga tidak lagi menebak. Di halaman Untuk Keluarga ada tanda bila latihan sempat terhenti, status hari ini, dan grafik tujuh hari terakhir.

_EN:_ The family no longer has to guess. The For Family page shows a flag when exercise has stopped, today's status, and a chart of the last seven days.

- **Di layar:** Kartu "Perlu perhatian: Minggu ini sempat 3 hari berturut-turut tanpa latihan", status "Sudah latihan hari ini", lalu gulir ke grafik Sesi terjadwal 7 hari terakhir (7 dari 14, 50%).
- **Teks penyunting:** "Keluarga tidak lagi menebak" / _Caregivers no longer have to guess_
- **Label penunjuk di samping ponsel:** Sesi terjadwal 7 hari
- **Momen screenshot (3:10):** Grafik Sesi terjadwal 7 hari terakhir di halaman Untuk Keluarga

### 3:15–3:30 · Untuk Keluarga: tren skor dan salin ringkasan

`s17-tanda` · Tahap: Keluarga dan afasia · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N17] Narator (voice-over)** (3:15,5–3:24,3)

> Tren skor empat belas hari juga terlihat. Ringkasan mingguan bisa disalin dengan satu ketukan, siap dikirim ke terapis.

_EN:_ The 14-day score trend is there too. The weekly summary can be copied with one tap, ready to send to the therapist.

- **Di layar:** Grafik Skor latihan 14 hari (gerak dan bicara), lalu ketuk Salin Ringkasan Mingguan; pesan "Ringkasan disalin. Tempel di WhatsApp untuk terapis." tampil.
- **Teks penyunting:** "Ringkasan mingguan untuk terapis" / _A weekly summary for the therapist_
- **Label penunjuk di samping ponsel:** Salin Ringkasan Mingguan

### 3:30–3:42 · Latihan Bicara: kata dan gambar

`s18-afasia` · Tahap: Keluarga dan afasia · Tata letak: Rekaman layar dalam bingkai ponsel + kalimat kunci

**[N18] Narator (voice-over)** (3:30,5–3:40,5)

> Untuk pasien dengan gangguan bicara atau afasia, ada Latihan Bicara berbahasa Indonesia, dengan kata yang dipakai di rumah setiap hari.

_EN:_ For patients with speech difficulties, or aphasia, there is Speech Practice in Indonesian, with words used at home every day.

- **Di layar:** Latihan Bicara dengan pilihan kategori; pilih Benda di Rumah; satu kata dengan gambar besar dan tombol Dengar.
- **Teks penyunting:** "Latihan bicara berbahasa Indonesia" / _Aphasia practice in Indonesian_
- **Label penunjuk di samping ponsel:** Gambar dan kata

### 3:42–4:00 · Pemeran menyebut kata, hasil Benar

`s19-sebut` · Tahap: Keluarga dan afasia · Tata letak: Shot lebar pemeran + rekaman layar dalam bingkai ponsel

**[N19a] Narator (voice-over)** (3:42,5–3:46,5)

> Pemeran mendengarkan contoh, lalu menyebutkan katanya.

_EN:_ The performer listens to the example, then says the word.

**[N19b] Narator (voice-over)** (3:51–3:59,4)

> Aplikasi mendengarkan dan menilai. Kata yang tepat dinilai Benar, dan skornya tercatat.

_EN:_ The app listens and scores the attempt. A correct word is marked Correct, and the score is saved.

- **Di layar:** Pemeran menyebut kata; layar menampilkan "Benar! Hebat, langsung tepat." lalu Kata Berikutnya.
- **Teks penyunting:** "Setiap kata dinilai" / _Every word attempt is scored_
- **Label penunjuk di samping ponsel:** Hasil penilaian kata
- **Label:** Peragaan oleh pemeran
- **Momen screenshot (3:55):** Kata yang dinilai "Benar!" di Latihan Bicara
- **Catatan:** Jeda 226,5-231 dibiarkan tanpa narasi agar suara pemeran menyebut kata terdengar jelas. Draf memakai rekaman otomatis Mode Latihan Mandiri ("Sudah Benar" diketuk), karena pengenal suara Chrome tidak tersedia di peramban otomatis. Versi final WAJIB memakai rekaman layar ponsel dengan pengenal suara asli (tampil "Terdengar: ...") agar kalimat N19b terbukti di layar.

### 4:00–4:12 · Dashboard Terapis: progres pasien

`s20-terapis` · Tahap: Penutup · Tata letak: Rekaman layar desktop dalam bingkai peramban + kalimat kunci

**[N20] Narator (voice-over)** (4:00,5–4:08,8)

> Di Dashboard Terapis, terapis dapat menyusun program dan mengikuti kemajuan tanpa menunggu kunjungan berikutnya.

_EN:_ On the Therapist Dashboard, the therapist can set the programme and follow progress without waiting for the next visit.

- **Di layar:** Dashboard Terapis (label Prototype, Demo) dengan Pak Budi paling atas, lalu halaman Pak Budi: grafik Kepatuhan 7 hari terakhir dan Resep Program; di Pustaka latihan, Tambah Luruskan Tungkai.
- **Teks penyunting:** "Terapis menyusun program" / _Therapists set the home programme_
- **Momen screenshot (4:06):** Grafik Kepatuhan 7 hari terakhir pada halaman Pak Budi di Dashboard Terapis

### 4:12–4:25 · Resep program menjadi Latihan Hari Ini

`s21-program` · Tahap: Penutup · Tata letak: Rekaman layar desktop dalam bingkai peramban + kalimat kunci

**[N21] Narator (voice-over)** (4:12,5–4:20,0)

> Di prototype ini, program yang disimpan terapis menjadi Latihan Hari Ini pada profil pasien tersebut.

_EN:_ In this prototype, the programme the therapist saves becomes Today's Exercises on that patient's profile.

- **Di layar:** Simpan Resep diketuk dan pesan "Resep Pak Budi tersimpan" tampil; Lihat sebagai pasien membuka Beranda Pak Budi yang kini memuat Luruskan Tungkai (1 dari 5 latihan selesai).
- **Teks penyunting:** "Program terapis menjadi Latihan Hari Ini" / _The therapist's programme becomes today's exercises_

### 4:25–4:50 · Penutup dokter dengan ponsel di tangan

`s22-penutup-dokter` · Tahap: Penutup · Tata letak: Talking head dokter

**[N22a] Dokter (di kamera)** (4:25,6–4:35,5)

> PULIHIN tidak menggantikan terapis. PULIHIN membantu memastikan yang diajarkan terapis benar-benar dilatih di rumah.

_EN:_ PULIHIN does not replace the therapist. It helps make sure that what the therapist teaches is truly practised at home.

**[N22b] Dokter (di kamera)** (4:36,8–4:47,5)

> Ini masih prototype untuk kompetisi, bukan alat kesehatan teregulasi. Silakan mencobanya di pulihinapp.id.

_EN:_ This is still a competition prototype, not a regulated medical device. You can try it at pulihinapp.id.

- **Di layar:** Wajah dokter memegang ponsel berisi aplikasi; kartu pulihinapp.id dan penafian prototype.
- **Teks penyunting:** "pulihinapp.id" / _Competition prototype · not a regulated medical device_ · Prototype kompetisi · bukan alat kesehatan teregulasi
- **Momen screenshot (4:40):** Wajah dokter dengan ponsel di tangan dan kartu pulihinapp.id

### 4:50–4:58 · Layar penutup

`s23-layar-penutup` · Tahap: Penutup · Tata letak: Layar penutup statis

_(Tanpa narasi.)_
- **Di layar:** PULIHIN · pulihinapp.id · Health and Wellbeing, .id Developer Day Indonesia 2026 (baris Tim tampil setelah namaTim diisi di src/config/identitas.ts)
- **Momen screenshot (4:54):** Layar penutup: PULIHIN, pulihinapp.id, Health and Wellbeing, nama tim (bila diisi)

## Naskah utuh (untuk dibaca saat rekam suara)

N01 · Dokter (di kamera): Saya dokter spesialis saraf. Setiap minggu, saya melepas pasien stroke pulang ke rumah.

N02 · Dokter (di kamera): Mereka pulang membawa program latihan di atas kertas.

N03 · Dokter (suara, di atas b-roll): Di rumah, mereka sering lupa dan ragu apakah gerakannya sudah benar.

N04 · Dokter (suara, di atas b-roll): Padahal pemulihan ditentukan oleh latihan harian di rumah, dan di situlah pendampingan terputus.

N05 · Narator (voice-over): PULIHIN mengubah ponsel biasa menjadi pendamping latihan. Begitu dibuka, Latihan Hari Ini langsung tampil dalam huruf besar.

N06 · Narator (voice-over): Kita mulai dari satu gerakan kecil: Tekuk Siku. Ada contoh gerakan, pesan keselamatan, lalu satu tombol besar: Mulai dengan Kamera.

N07 · Narator (voice-over): Ponsel cukup diletakkan di meja, sekitar satu meter dari kursi. Yang tampil di sini adalah peragaan oleh pemeran, bukan pasien sungguhan.

N08 · Narator (voice-over): Kamera membaca titik-titik tubuh langsung di ponsel ini, tanpa mengunggah video. Repetisi dihitung dari sudut siku: tekuk penuh, luruskan lagi, baru terhitung satu.

N09 · Narator (voice-over): Lihat angkanya: lima dari sepuluh. Hitungan hanya naik bila gerakannya lengkap, dan aplikasi memberi tahu bila gerakannya belum tepat.

N10a · Narator (voice-over): Sekarang bahunya ikut terangkat.

N10b · Narator (voice-over): Aplikasi mengoreksi dengan suara dan teks besar, dalam Bahasa Indonesia.

N11 · Narator (voice-over): Pemeran menurunkan bahunya, pesan menghilang, dan hitungan berlanjut. Hanya satu pesan pada satu waktu, supaya tidak membingungkan.

N12 · Narator (voice-over): Jadi bukan sekadar menghitung, melainkan menjaga cara geraknya, sampai repetisi kesepuluh.

N13 · Narator (voice-over): Di akhir sesi ada skor dan ringkasan sederhana: jumlah repetisi dan durasi. Labelnya mudah dipahami, mulai dari Perlu Pendampingan, Berkembang, Baik, sampai Sangat Baik.

N14 · Narator (voice-over): Ada satu saran untuk sesi berikutnya. Ringkasan ini bukan diagnosis, dan kalimat batasan itu selalu tampil.

N15 · Narator (voice-over): Kembali ke Beranda, Tekuk Siku sudah bertanda selesai beserta skornya. Latihannya tercatat di ponsel, dan keluarga bisa melihatnya.

N16 · Narator (voice-over): Keluarga tidak lagi menebak. Di halaman Untuk Keluarga ada tanda bila latihan sempat terhenti, status hari ini, dan grafik tujuh hari terakhir.

N17 · Narator (voice-over): Tren skor empat belas hari juga terlihat. Ringkasan mingguan bisa disalin dengan satu ketukan, siap dikirim ke terapis.

N18 · Narator (voice-over): Untuk pasien dengan gangguan bicara atau afasia, ada Latihan Bicara berbahasa Indonesia, dengan kata yang dipakai di rumah setiap hari.

N19a · Narator (voice-over): Pemeran mendengarkan contoh, lalu menyebutkan katanya.

N19b · Narator (voice-over): Aplikasi mendengarkan dan menilai. Kata yang tepat dinilai Benar, dan skornya tercatat.

N20 · Narator (voice-over): Di Dashboard Terapis, terapis dapat menyusun program dan mengikuti kemajuan tanpa menunggu kunjungan berikutnya.

N21 · Narator (voice-over): Di prototype ini, program yang disimpan terapis menjadi Latihan Hari Ini pada profil pasien tersebut.

N22a · Dokter (di kamera): PULIHIN tidak menggantikan terapis. PULIHIN membantu memastikan yang diajarkan terapis benar-benar dilatih di rumah.

N22b · Dokter (di kamera): Ini masih prototype untuk kompetisi, bukan alat kesehatan teregulasi. Silakan mencobanya di pulihinapp.id.
