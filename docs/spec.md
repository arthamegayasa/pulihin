# PULIHIN Build Specification v1.0 (salinan teks)

> Disalin otomatis dari `pulihin-build-spec.pdf` (13 Oktober 2026) agar dapat dibaca agen. Tabel hasil ekstraksi PDF bisa sedikit berantakan; PDF asli tetap acuan tunggal.

<!-- Page 1 -->

**BUILD S P E C I F I C AT I O N-SERAHKAN APA ADANYA K E CODING AGENT**

# PULIHIN

**Spesifikasi Pembangunan Prototype dan Video Demo** Pendamping rehabilitasi stroke di rumah berbasis kecerdasan buatan, dengan penilaian

### gerak lewat kamera dan terapi wicara afasia berbahasa Indonesia.

**Untuk siapa dokumen ini:** AI coding agent (Claude Code Opus atau setara) yang akan membangun aplikasi dan menyiapkan video demo tanpa bertanya balik kepada pemilik produk. **Cara membaca:** Kerjakan P0 sampai selesai dan teruji terlebih dahulu. P1 hanya dikerjakan setelah seluruh P0 lolos acceptance criteria. P2 hanya jika waktu tersisa.

## 2 14 Okt 2026 5 menit pulihinapp.id

Deliverable utama Tenggat submit Maks. durasi video Domain produk

#### Identitas proyek

**Item Isi**

|Nama produk|PULIHIN|
|---|---|
|Kategori lomba|.id Developer Day Indonesia 2026, Inclusions and Community Services, subkategori Health and Wellbeing|
|Pemilik produk / narasumber klinis|[DIISI: nama lengkap, gelar, dan afiliasi pemilik produk]|
|Nama tim (maks. 3 orang)|[DIISI: ketua] / [DIISI: anggota 2] / [DIISI: anggota 3]|
|Email dan WhatsApp tim|[DIISI]|
|Repo yang dituju|[DIISI: URL repo atau instruksi buat repo baru bernama pulihin]|
|Akun deploy Dokumen versi 1.0, disusun 13 Oktober 2026. Seluruh antarmuka pengguna memakai Bahasa Indonesia. Istilah teknis dalam dokumen ini boleh tetap dalam Bahasa Inggris bila itu nama pustaka, API, atau komponen.|[DIISI: platform deploy pilihan, contoh Vercel atau Netlify, dan siapa pemilik akun]|

PULIHIN Build Specification Halaman 1

|data pemilik produk.|1. Ringkasan Eksekutif dan Tujuan Dokumen Dokumen ini adalah satu satunya brief pembangunan untuk prototype PULIHIN. Tujuannya adalah agar coding agent dapat bekerja secara mandiri dari awal sampai selesai, membuat keputusan teknis yang wajar di dalam batas yang tertulis di sini, dan berhenti hanya pada placeholder bertanda [DIISI] yang memang membutuhkan 1.1 Dua deliverable yang wajib dihasilkan||
|---|---|---|
|Deliverable|Bentuk akhir|Kriteria selesai|
|A. Aplikasi prototype / MVP yang berfungsi|Aplikasi web responsif yang ter deploy dan dapat dibuka publik di pulihinapp.id atau subdomainnya|Seluruh fitur P0 berjalan di HP Android kelas bawah, data tersimpan lokal, dan alur utama dapat didemokan tanpa perbaikan manual di tengah jalan|
|B. Video demo lomba 1.2 Konteks tenggat sepuluh fitur yang setengah jadi.|File video final maksimal 5 menit, siap unggah ke YouTube sebagai unlisted, beserta naskah dan subtitle Pendaftaran lomba ditutup 14 Oktober 2026. Artinya prototype harus sudah stabil dan video harus sudah direkam sebelum tanggal tersebut. Urutan kerja yang benar adalah membangun alur demo terlebih dahulu, bukan membangun semua fitur secara merata. Satu alur yang utuh dan stabil bernilai lebih tinggi di mata juri daripada|Mengikuti storyboard Bab 15 dan 16, menampilkan aplikasi yang benar benar berjalan, bukan mockup statis|
|Prinsip penentu keputusan:|demo. Bila ada konflik antara kecanggihan model dan kecepatan di HP kelas bawah, pilih kecepatan. Bila ragu soal cakupan, kembali ke daftar P0 di Bab 3.|bila ada konflik antara kelengkapan fitur dan kestabilan demo, pilih kestabilan|
|PULIHIN Build Specification|1.3 Apa yang bukan tugas coding agent Mengisi nama tim, kontak, dan data pribadi. Bagian itu bertanda [DIISI] dan diisi pemilik produk. Membuat klaim medis, klaim kesembuhan, atau klaim diagnosis apa pun di aplikasi, landing page, atau video. Mengumpulkan, meminta, atau memakai data pasien asli. Mendaftarkan domain atau membayar biaya apa pun tanpa instruksi terpisah dari pemilik produk.|Halaman 2|

<!-- Page 3 -->

## <u>2. Visi Produk dan User Story Utama</u>

#### 2.1 Visi dalam satu kalimat

PULIHIN membantu pasien pasca stroke berlatih dengan benar setiap hari di rumah, dengan panduan yang memahami tubuh mereka dan berbicara dalam bahasa mereka, sementara keluarga dan terapis dapat melihat kemajuannya tanpa harus selalu berada di ruangan yang sama.

#### 2.2 Satu narasi, bukan smoothie fitur

Seluruh produk, paper, dan video hanya menceritakan satu kisah. Jangan menambah persona, segmen, atau alur sampingan yang mengaburkan kisah ini.

**Narasi inti:** Seorang pasien stroke pulang dari rumah sakit dengan program latihan di atas kertas. Di rumah, ia sering lupa, ragu apakah gerakannya benar, dan keluarganya tidak tahu cara membantu. Dengan PULIHIN, ponsel diletakkan di meja, kamera menilai gerakannya, aplikasi menghitung dan mengoreksi dalam Bahasa Indonesia, istrinya atau anaknya melihat ringkasan minggu ini, dan terapisnya tahu latihan di rumah benar benar terjadi.

#### 2.3 User story utama

1. Sebagai pasien, saya membuka aplikasi dan langsung melihat latihan hari ini dalam huruf besar, tanpa harus mencari menu.
2. Saya mengetuk satu latihan, melihat contoh gerakan singkat, lalu menekan tombol Mulai yang besar.
3. Saya meletakkan ponsel, berdiri atau duduk di depan kamera, dan mengikuti hitungan aplikasi.
4. Saat siku saya kurang tertekuk atau bahu saya ikut terangkat, aplikasi memberi tahu dengan suara dan teks besar.
5. Setelah selesai, saya melihat skor sesi dan pesan penyemangat yang sederhana.
6. Sebagai caregiver, saya membuka tampilan pendamping dan melihat apakah latihan hari ini sudah dilakukan, grafik minggu ini, dan apakah ada tanda perlu menghubungi terapis.
7. Sebagai pasien dengan afasia, saya berlatih menyebutkan nama benda di rumah dalam Bahasa Indonesia dan mendapat skor atas usaha saya.
#### 2.4 Prinsip produk

**Satu sudut pandang:** setiap layar melayani kisah di atas. Fitur yang tidak melayaninya masuk P2 atau dibuang. **Kepercayaan dibangun bertahap:** mulai dari satu gerakan kecil yang berhasil, baru sesi penuh, baru dashboard. Prinsip yang sama mengatur video demo. **Rumah, bukan rumah sakit:** bahasa sederhana, nada hangat, tanpa istilah medis yang tidak dijelaskan. **Keluarga adalah bagian dari terapi:** caregiver bukan penonton, melainkan pengguna kedua yang dirancang sejak awal.

<!-- Page 4 -->

## <u>3. Ruang Lingkup MVP: Prioritas P0, P1, P2</u>

Prioritas bersifat mengikat. Jangan mengerjakan level berikutnya sebelum level sebelumnya lolos uji di Bab 5.

#### 3.1 P0 - Wajib jadi dan wajib stabil

|Kode|Modul|Isi minimum|
|---|---|---|
|F1|Latihan gerak berbasis kamera|Pose estimation on device, overlay skeleton, hitung repetisi berbasis sudut sendi, koreksi form real time, skor sesi|

|F2|Pustaka latihan|8 sampai 10 latihan pasca stroke umum dengan panduan visual,|
|---|---|---|
|||sendi target, dan ambang sudut per latihan|
|F3|Terapi afasia Bahasa Indonesia|100 kata awal, gambar atau emoji, rekam jawaban suara, penilaian Web Speech API id-ID, skor per sesi|
|F4|Pengingat dan streak|Jadwal harian, pengingat di dalam aplikasi, hitungan hari beruntun, ringkasan kepatuhan|
|F5|Dashboard caregiver|Grafik kepatuhan mingguan, tren skor, penanda stagnasi sebagai red|

flag non medis

#### 3.2 P1 - Kerjakan setelah P0 stabil

|Kode|Modul|Isi minimum|
|---|---|---|
|F6|Dashboard klinisi web|Daftar pasien demo, resep program latihan (pilih latihan, target repetisi, frekuensi), lihat progres per pasien|

F7 Landing page produk Satu halaman di domain utama yang menjelaskan PULIHIN, menampilkan tautan masuk aplikasi, dan cocok dicantumkan di paper lomba

#### 3.3 P2 - Hanya jika waktu tersisa

Riwayat sesi detail per latihan dengan grafik per sendi. Mode offline penuh termasuk antrean sinkronisasi. Ekspor ringkasan sesi sebagai PDF untuk dibawa saat kontrol. Pengaturan ukuran huruf dan mode suara saja.

**Dilarang di semua level:** login dengan data kesehatan asli, integrasi rekam medis, fitur chat klinis, diagnosis otomatis, rekomendasi obat, dan klaim tingkat kesembuhan.

<!-- Page 5 -->

## <u>4. Tech Stack yang Direkomendasikan</u>

|Lapisan|Pilihan|Alasan|
|---|---|---|
|Aplikasi|React + Vite + TypeScript|Tercepat dibangun, mudah dirawat, mudah direkam layarnya untuk video|

|Styling|Tailwind CSS|Konsistensi design system Bab 12|
|---|---|---|
|||tanpa CSS manual yang panjang|
|Pose estimation|MediaPipe Tasks Vision Pose Landmarker, paket @mediapipe/tasks-vision|Berjalan on device di browser, tanpa server GPU, latensi rendah, video tidak perlu diunggah|
|Pengenalan suara|Web Speech API, lang id-ID|Tersedia di Chrome Android tanpa biaya API untuk prototype|
|Penyimpanan|IndexedDB, dibantu localStorage untuk preferensi kecil|Offline first, data sesi tetap ada tanpa koneksi|
|Grafik|Recharts atau chart SVG buatan sendiri yang ringan|Grafik caregiver harus terbaca cepat di HP kelas bawah|
|PWA|Manifest + service worker dasar|Dapat di install di layar utama, terasa seperti aplikasi asli|
|Deploy|Static hosting (Vercel, Netlify, atau setara) dengan custom domain pulihinapp.id|HTTPS wajib agar kamera dan mikrofon dapat diakses browser|

#### 4.1 Aturan adaptasi stack

Coding agent boleh mengganti satu komponen bila ada alasan teknis yang nyata, dengan syarat alasan itu ditulis di README pada bagian Keputusan Teknis, penggantinya memenuhi acceptance criteria yang sama, dan penggantian tidak menunda P0. Mengganti bahasa pemrograman utama, framework utama, atau memindahkan pose estimation ke server tidak diperbolehkan tanpa alasan yang dicatat dan tanpa persetujuan pemilik produk.

#### 4.2 Arsitektur ringkas

```
src/
pages/ Beranda, Latihan, SesiKamera, Afasia,
Pendamping, Klinisi, Riwayat
features/
pose/ PoseEngine, AngleCalculator, RepCounter,
FormChecker, exerciseDefinitions.ts
speech/ SpeechScorer, wordBank.ts
adherence/ Schedule, Streak, weeklyStats
data/ db.ts (IndexedDB), seed.ts (data demo)
components/ BigButton, ScoreCard, WeeklyChart, dsb.
```
Prinsip arsitektur: pemrosesan kamera dan suara terjadi di perangkat pengguna. Server, bila ada, hanya melayani file statis. Siapkan struktur folder agar logika pose dan bank kata dapat dipindahkan ke Flutter di masa depan tanpa menulis ulang definisi latihannya. Karena itu definisi latihan dan bank kata harus berupa data terstruktur (TypeScript object atau JSON), bukan tertanam di dalam komponen tampilan.

#### 4.3 Kebutuhan lingkungan

Node.js versi LTS yang umum dipakai saat pembangunan. Cantumkan versi di README. Seluruh dependensi dari registry npm resmi. Kunci versi model MediaPipe yang dipakai. File model pose diunduh dari sumber resmi MediaPipe dan, bila lisensi memungkinkan, disajikan dari domain sendiri agar demo tidak bergantung pada CDN pihak ketiga saat perekaman video.

<!-- Page 6 -->

## 5. Spesifikasi Fitur F1: Latihan Gerak Berbasis Kamera

**P0** Fitur ini adalah momen inti produk dan momen inti video. Semua keputusan teknis di fitur lain tunduk pada kestabilan fitur ini.

#### 5.1 Alur pengguna

1. Pasien memilih latihan dari daftar hari ini (maksimal 3 ketuk dari Beranda).
2. Layar persiapan menampilkan contoh gerakan, posisi duduk atau berdiri, peringatan keselamatan, dan ilustrasi posisi ponsel.
3. Pasien menekan Mulai. Aplikasi meminta izin kamera. Penolakan izin menampilkan penjelasan sederhana dan tombol coba lagi, bukan halaman error teknis.
4. Kamera aktif, skeleton tampil di atas tubuh pasien, dan aplikasi menunggu sampai tubuh terdeteksi stabil selama 1 detik.
5. Sesi berjalan: hitungan repetisi besar di tengah layar, target di sampingnya, petunjuk suara dan teks.
6. Koreksi form muncul sebagai teks besar dan suara Bahasa Indonesia, contoh: "Luruskan punggung" atau "Angkat lengan sedikit lebih tinggi".
7. Sesi selesai atau dihentikan. Layar ringkasan menampilkan repetisi tercapai, skor form, durasi, dan satu saran sederhana untuk sesi berikutnya.
#### 5.2 Acceptance criteria F1

**ID Kriteria yang dapat diuji** AC-F1-1 Skeleton tampil di layar kurang dari 500 ms setelah frame kamera pertama yang memuat tubuh terdeteksi. AC-F1-2 Akurasi hitung repetisi di atas 90 persen pada pengujian 50 repetisi terkontrol per latihan inti, dilakukan oleh orang sehat yang menirukan gerakan lambat pasien. AC-F1-3 Koreksi form muncul kurang dari 700 ms setelah kondisi salah terdeteksi selama 0,5 detik berturut turut. AC-F1-4 Frame rate pemrosesan minimal 15 fps di HP Android kelas bawah acuan [DIISI: model HP uji, contoh kelas Redmi atau Galaxy A seri rendah]. AC-F1-5 Tidak ada frame video yang dikirim ke server. Dapat dibuktikan dari tab Network saat sesi berjalan. AC-F1-6 Sesi yang terputus di tengah (tab ditutup) tidak merusak data sesi sebelumnya. AC-F1-7 Tombol Berhenti selalu terlihat dan menghentikan kamera dalam 1 detik.

#### 5.3 Skor sesi

Skor sesi adalah angka 0 sampai 100 yang mudah dijelaskan: gabungan ketercapaian target repetisi (50 persen), ketepatan rentang sudut (30 persen), dan tempo stabil (20 persen). Tampilkan juga label kata di samping angka: Perlu Pendampingan, Berkembang, Baik, atau Sangat Baik. Skor ini adalah skor latihan untuk motivasi dan pemantauan, bukan skor klinis dan bukan alat ukur diagnosis. Kalimat penjelas itu wajib tampil di layar ringkasan dengan huruf yang terbaca.

<!-- Page 7 -->

## <u>6. Spesifikasi Fitur F2: Pustaka Latihan Pasca Stroke</u>

**P0** Sediakan 10 latihan berikut. Seluruhnya adalah latihan umum yang lazim diajarkan untuk latihan di rumah. Setiap latihan wajib punya definisi data lengkap sebelum tampil di aplikasi.

|No|Latihan|Posisi|Sendi target|Ambang fase atas / bawah|
|---|---|---|---|---|
|1|Fleksi bahu (angkat lengan ke depan)|Duduk|Bahu|Di atas 100 / di bawah 30 derajat|
|2|Fleksi siku (tekuk siku)|Duduk|Siku|Di atas 120 / di bawah 30 derajat|
|3|Abduksi bahu (angkat lengan ke samping)|Duduk|Bahu|Di atas 90 / di bawah 25 derajat|
|4|Ekstensi lutut duduk (luruskan tungkai)|Duduk|Lutut|Di atas 150 / di bawah 100 derajat|
|5|Abduksi pinggul berdiri|Berdiri berpegangan|Pinggul|Di atas 25 / di bawah 8 derajat|
|6|Sit to stand (duduk ke berdiri)|Duduk ke berdiri|Lutut dan pinggul|Lutut di atas 160 = berdiri, di bawah 100 = duduk|
|7|Heel raise (jinjit berpegangan)|Berdiri berpegangan|Pergelangan kaki, via posisi tumit|Kenaikan tumit melewati ambang piksel relatif terhadap bahu|
|8|Menggapai ke depan (reaching)|Duduk|Bahu dan siku|Jarak pergelangan tangan ke bahu melewati ambang progresif|
|9|Putaran batang tubuh duduk|Duduk|Trunk, via garis bahu|Rotasi garis bahu di atas 20 / di bawah 8 derajat|
|10|Langkah di tempat (marching duduk)|Duduk|Pinggul dan lutut|Kenaikan lutut bergantian melewati ambang tiap sisi|

Catatan: ambang di atas adalah titik awal prototype. Simpan ambang sebagai konfigurasi per latihan, bukan angka yang tertanam di logika.

#### 6.1 Skema data satu latihan

```
{
id: "fleksi-siku",
nama: "Tekuk Siku",
posisi: "duduk",
sendiTarget: ["siku"],
titikLandmark: { a: "bahu", b: "siku", c: "pergelangan"},
ambangAtasDerajat: 120,
ambangBawahDerajat: 30,
targetRepetisiDefault: 10,
tempoTargetDetik: { min: 1.5, max: 4},
panduanLangkah: ["Duduk tegak...", "..."],
peringatan: "Berhenti bila nyeri atau pusing.",
koreksiUmum: [{ kondisi: "...", pesan: "..."}],
animasiAtauVideo: "[DIISI atau aset bawaan]",
}
```
#### 6.2 Acceptance criteria F2

Setiap latihan dapat dibuka, dibaca panduannya, menampilkan posisi, target, dan peringatan sebelum kamera menyala, lalu dimulai tanpa error. Mengganti ambang di file definisi mengubah perilaku hitungan tanpa mengubah kode logika.

<!-- Page 8 -->

## <u>7. Algoritma Inti: State Machine Repetisi dan Koreksi Form</u>

#### 7.1 Menghitung sudut sendi

Untuk sendi dengan tiga titik A, B, dan C, dengan B sebagai titik sudut, hitung sudut di B dari vektor BA dan BC memakai dot product. Ratakan sudut dengan moving average 3 sampai 5 frame agar hitungan tidak bergetar. Abaikan frame dengan visibility landmark di bawah 0,5 dan jangan mengubah state pada frame yang diabaikan.

#### 7.2 State machine repetisi

```
State: BAWAH-> NAIK-> ATAS-> TURUN-> BAWAH
BAWAH : sudut <= ambangBawah. Siap menghitung.
NAIK : sudut melewati ambangBawah + histeresis (5 derajat).
ATAS : sudut >= ambangAtas. Catat sudut puncak.
TURUN : sudut turun melewati ambangAtas-histeresis.
Kembali ke BAWAH dan melewati ambangBawah:
repetisi + 1, simpan sudut puncak dan durasi siklus.
Contoh fleksi siku:
fleksi di atas 120 derajat = fase atas
ekstensi di bawah 30 derajat = fase bawah
satu repetisi = satu siklus penuh bawah ke atas ke bawah
```
Histeresis wajib ada. Tanpa histeresis, tubuh yang berhenti tepat di ambang akan menghasilkan hitungan ganda. Satu repetisi minimum berdurasi 1 detik. Siklus yang lebih cepat dari itu dianggap gerakan tidak disengaja dan tidak dihitung, tetapi dicatat sebagai percobaan.

#### 7.3 Aturan koreksi form

|Kondisi|Cara deteksi ringkas|Pesan ke pasien|
|---|---|---|
|Bahu ikut terangkat saat|Jarak vertikal bahu ke telinga menyusut melewati|Rilekskan bahu, turunkan bahu|
|fleksi siku|ambang selama fase NAIK|Anda|

|Badan miring ke sisi sehat|Garis kedua bahu miring lebih dari 12 derajat dari|Tegakkan badan, jangan miring|
|---|---|---|
||horizontal||
|Rentang belum penuh|Sudut puncak berulang di bawah ambang atas minus 15 derajat|Sedikit lagi, angkat lebih tinggi bila mampu|
|Tempo terlalu cepat|Durasi siklus di bawah tempo minimum dua kali berturut|Perlambat gerakan Anda|
||turut||
|Tubuh keluar frame|Landmark kunci hilang lebih dari 1 detik|Mundur sedikit agar tubuh|

terlihat penuh

Aturan penayangan koreksi: maksimal satu pesan pada satu waktu, tampil minimal 1,5 detik, dan pesan yang sama tidak diulang dalam 4 detik. Koreksi memakai suara (speech synthesis id-ID bila tersedia) dan teks besar sekaligus. Jangan pernah memakai kata yang menyalahkan pasien.

#### 7.4 Uji algoritma

Buat halaman atau mode uji internal yang menampilkan sudut live per sendi dan state saat ini. Halaman ini untuk pengujian, tidak perlu tampil di menu pasien. Catat hasil uji 50 repetisi latihan inti di README: jumlah benar, hitungan ganda, dan hitungan yang hilang.

<!-- Page 9 -->

## 8. Spesifikasi Fitur F3: Terapi Afasia Bahasa Indonesia

**P0** Pembeda terkuat PULIHIN: modul ini seluruhnya berbahasa Indonesia, dengan kata yang benar benar dipakai di rumah.

#### 8.1 Bank kata: 100 kata awal

|Kategori|Jumlah|Contoh kata|
|---|---|---|
|Benda di rumah|30|kursi, meja, pintu, kunci, gelas, piring, sendok, handuk, bantal, lampu, kipas, sapu, ember, sabun, sikat gigi|

|Makanan dan minuman|25|nasi, roti, telur, ayam, ikan, sayur, buah, pisang, air, teh, kopi, susu, gula, garam|
|---|---|---|
|Anggota keluarga dan orang|15|ibu, bapak, anak, istri, suami, kakak, adik, nenek, dokter, perawat|
|Anggota tubuh|15|tangan, kaki, kepala, mata, mulut, bahu, siku, lutut, jari|
|Kata kebutuhan harian|15|makan, minum, tidur, bangun, duduk, berdiri, tolong, sakit, lelah, pulang|

Daftar lengkap wajib ditulis eksplisit di file wordBank.ts. Setiap kata memiliki bidang: kata, kategori, emoji atau gambar, tingkat kesulitan 1 sampai 3, dan kalimat contoh sederhana.

#### 8.2 Alur latihan

1. Pasien memilih kategori atau menekan Latihan Hari Ini.
2. Satu kata tampil besar dengan gambar atau emoji besar dan tombol Dengar untuk memutar contoh pengucapan.
3. Pasien menekan tombol mikrofon besar dan menyebutkan kata itu. Web Speech API id-ID mengubah suara menjadi teks untuk dibandingkan dengan target.
4. Umpan balik langsung: Benar, Hampir dengan petunjuk suku kata, atau Coba Lagi. Maksimal 3 percobaan per kata.
5. Satu sesi berisi 10 kata. Ringkasan menampilkan jumlah benar, hampir, dan kata untuk diulang besok.
#### 8.3 Aturan penilaian suara

Normalisasi: huruf kecil, buang tanda baca, rapikan spasi. Benar: hasil persis sama dengan target, atau jarak edit sangat kecil untuk kata panjang. Hampir: kemiripan di atas ambang menengah yang dikonfigurasi, atau suku kata awal benar. Simpan skor per kata: 100 untuk benar pada percobaan pertama, 70 untuk benar pada percobaan berikutnya, 40 untuk hampir, 0 untuk belum. Rata rata sesi menjadi skor afasia hari itu. Bila browser tidak mendukung Web Speech API, tampilkan mode latihan mandiri: pasien menyebutkan dengan keras, lalu caregiver atau pasien sendiri menekan tombol Sudah Benar atau Ulangi. Mode cadangan ini wajib ada agar demo tidak gagal total di perangkat yang berbeda.

#### 8.4 Acceptance criteria F3

|ID|Kriteria|
|---|---|
|AC-F3- 1|Bank kata berisi tepat 100 kata unik, terdistribusi sesuai tabel kategori di atas.|
|AC-F3-|Pada ruangan tenang dan pengucapan jelas oleh orang sehat, minimal 8 dari 10 kata uji dikenali sebagai Benar|
|2|atau Hampir.|
|AC-F3- 3|Hasil penilaian tampil kurang dari 1,5 detik setelah pasien berhenti bicara.|
|AC-F3-|Mode cadangan tanpa Web Speech API berfungsi penuh untuk menyelesaikan satu sesi 10 kata.|

<!-- Page 10 -->

## <u>9. Spesifikasi Fitur F4 dan F5: Kepatuhan dan Caregiver</u>

#### 9.1 F4 - Pengingat jadwal dan streak P0

Jadwal default: satu sesi gerak dan satu sesi afasia per hari, pada jam yang dapat diubah caregiver. Nilai awal [DIISI: jam pengingat default yang diinginkan pemilik produk, saran awal pukul 08.00 dan 16.00]. Pengingat tampil di dalam aplikasi saat dibuka (banner hari ini) dan, bila izin notifikasi diberikan, sebagai notifikasi PWA. Kegagalan izin notifikasi tidak boleh menghalangi pemakaian aplikasi. Streak dihitung dari hari dengan minimal satu sesi selesai. Tampilkan streak saat ini, streak terpanjang, dan kalender 7 hari terakhir dengan tanda selesai atau terlewat. Pesan streak memakai bahasa penyemangat, bukan hukuman. Hari terlewat tidak menghapus riwayat. **Acceptance criteria F4:** sesi yang selesai tercatat dan mengubah status hari yang sama dalam waktu kurang dari 2 detik; streak bertambah tepat satu setelah sesi pertama di hari baru; mengganti jam jadwal tersimpan dan tetap ada setelah aplikasi ditutup dan dibuka lagi.

#### 9.2 F5 - Dashboard caregiver P0

Tampilan pendamping dapat dibuka dari Beranda dengan satu tombol besar bertuliskan Untuk Keluarga. Isinya: **Status hari ini:** sudah latihan atau belum, jam berapa, dan skor terakhir. **Grafik kepatuhan mingguan:** batang 7 hari, jumlah sesi selesai dibanding target. **Tren skor:** garis skor gerak dan skor afasia 14 hari terakhir. **Red flag non medis:** penanda kuning atau merah bila (a) tidak ada sesi selama 3 hari berturut turut, (b) rata rata skor 7 hari turun lebih dari 20 persen dibanding 7 hari sebelumnya, atau (c) kepatuhan mingguan di bawah 40 persen. Teks penanda selalu menyarankan menghubungi terapis atau dokter yang merawat, dan tidak pernah memberi tafsir diagnosis. **Tombol bagikan ringkasan:** menghasilkan teks ringkasan mingguan yang dapat disalin ke WhatsApp untuk dikirim keluarga ke terapis. **Acceptance criteria F5:** grafik dihitung dari data sesi yang sebenarnya tersimpan, bukan angka contoh yang tertanam; dengan data demo awal (Bab 10), red flag muncul pada skenario stagnasi yang memang ditanam di data demo dan tidak muncul pada skenario pasien yang rajin; seluruh teks di halaman ini dapat dipahami tanpa istilah teknis.

**Soal peran dan login:** untuk prototype lomba, jangan membangun sistem akun penuh. Gunakan pemilih peran sederhana di awal (Saya Pasien / Saya Keluarga / Saya Terapis) yang disimpan lokal. Jelaskan di README bahwa autentikasi sungguhan adalah pekerjaan pasca lomba.

<!-- Page 11 -->

## 10. Data Demo, F6 Klinisi, dan Penyimpanan

#### 10.1 Data demo yang wajib ditanam (seed)

Aplikasi harus terlihat hidup pada pembukaan pertama, karena juri dan perekaman video tidak punya waktu menunggu data terkumpul selama berminggu minggu. Satu pasien demo bernama samaran, contoh "Pak Budi, 58 tahun, stroke 3 bulan lalu". Jangan memakai nama, foto, atau data orang asli. Riwayat 14 hari ke belakang: kepatuhan bervariasi, skor gerak naik perlahan, skor afasia naik perlahan, dan 3 hari terakhir tanpa sesi agar red flag caregiver dapat didemonstrasikan secara terkontrol. Sediakan tombol di pengaturan demo untuk beralih ke skenario Rajin tanpa red flag. Tombol Reset Data Demo di halaman pengaturan, agar perekaman video dapat diulang dari kondisi awal yang sama. Semua data demo diberi label Demo di tempat yang wajar, agar tidak disalahartikan sebagai data klinis.

#### 10.2 F6 - Dashboard klinisi web P1

Daftar pasien demo (minimal 3 profil samaran dengan tingkat kepatuhan berbeda). Resep program: untuk tiap pasien, klinisi memilih latihan dari pustaka F2, menetapkan target repetisi, set, dan frekuensi per minggu, lalu menyimpan. Program tersimpan itu yang tampil sebagai Latihan Hari Ini di sisi pasien demo yang sama. Halaman progres pasien: grafik kepatuhan, tren skor, sesi terakhir, dan red flag yang sama dengan tampilan caregiver. Tidak ada fitur diagnosis, tidak ada catatan medis bebas yang menyerupai rekam medis resmi. Beri label Prototype di header dashboard. **Acceptance criteria F6:** mengubah resep program pada satu pasien mengubah daftar latihan hari ini pada profil pasien tersebut setelah aplikasi dimuat ulang; dashboard tetap terbaca di layar ponsel, walau target utamanya adalah layar desktop untuk perekaman video.

#### 10.3 Skema penyimpanan lokal

**Entitas Bidang utama** Profile id, nama samaran, peran aktif, tanggal mulai program Session id, tanggal, jenis (gerak / afasia), latihanId, repetisi target, repetisi tercapai, skor, durasi detik, selesai (ya / tidak) RepLog sessionId, nomor repetisi, sudut puncak, durasi siklus, koreksi yang muncul SpeechAttempt sessionId, kataId, teks hasil, kategori hasil, skor, nomor percobaan Program patientId, daftar latihan dan target, frekuensi, dibuat oleh, tanggal ubah Schedule jam sesi gerak, jam sesi afasia, notifikasi aktif

Gunakan IndexedDB untuk Session, RepLog, dan SpeechAttempt. Gunakan localStorage hanya untuk preferensi kecil seperti peran aktif dan ukuran huruf. Sertakan fungsi ekspor dan impor JSON data lokal untuk keperluan cadangan saat perekaman video.

<!-- Page 12 -->

## 11. Definisi Selesai per Fitur: Lembar Uji 100 Perilaku

Ikuti semangat lembar definisi siap yang dipakai tim produk konsumen modern: sebelum menyebut aplikasi selesai, setiap baris di bawah ini harus lolos pada perangkat uji. Coding agent wajib menyalin tabel ini ke README sebagai checklist hasil uji dan mencentang hanya yang benar benar lolos.

|Area|Perilaku yang harus lolos|
|---|---|
|Beranda|Latihan hari ini terlihat tanpa scroll di HP 6 inci; status hari ini benar; tombol Untuk Keluarga terlihat|
|Navigasi|Dari Beranda ke sesi kamera maksimal 3 ketuk; dari mana pun kembali ke Beranda maksimal 2 ketuk|
|Kamera|Izin ditolak tertangani dengan bahasa sederhana; skeleton tampil di bawah 500 ms; tombol berhenti bekerja|
|Repetisi|10 repetisi lambat terhitung 10; gerakan setengah tidak terhitung penuh; gerakan cepat tidak menggandakan hitungan|
|Koreksi|Bahu terangkat memicu pesan bahu; badan miring memicu pesan tegak; satu pesan pada satu waktu|
|Ringkasan|Angka ringkasan sama dengan yang tercatat di penyimpanan; label skor tampil; kalimat bukan alat diagnosis tampil|
|Afasia|100 kata termuat; Dengar memutar contoh; 10 kata uji dikenali sesuai ambang; mode cadangan menyelesaikan sesi|
|Kepatuhan|Sesi selesai mengubah kalender hari ini; streak bertambah benar; jadwal tersimpan antar sesi aplikasi|
|Caregiver|Grafik 7 hari sesuai data; red flag muncul dan hilang sesuai skenario; ringkasan dapat disalin|
|Klinisi (P1)|Resep tersimpan; resep mengubah latihan pasien; label Prototype tampil|
|Ketahanan|Mode pesawat setelah aplikasi termuat: sesi tetap dapat dimulai dari data lokal; memuat ulang halaman tidak menghapus riwayat|
|Performa|Halaman awal termuat di bawah 3 detik pada koneksi 4G biasa; aplikasi tetap responsif selama pose berjalan|

**Aturan rilis internal:** aplikasi disebut siap rekam hanya bila seluruh baris P0 pada tabel ini lolos pada perangkat uji yang sama dengan yang akan dipakai merekam video. Catat model perangkat, versi Chrome, dan tanggal uji di README.

#### 11.1 Perangkat dan kondisi uji minimum

HP Android kelas bawah atau menengah bawah dengan RAM 4 GB. Model persis: [DIISI]. Chrome versi terbaru yang tersedia di perangkat itu. Catat versinya. Pencahayaan ruangan rumah biasa, bukan studio. Jarak pasien ke ponsel 1,5 sampai 2,5 meter untuk latihan berdiri, dan 0,8 sampai 1,2 meter untuk latihan duduk. Ponsel diletakkan di tripod atau tumpukan buku yang stabil. Kondisi ini juga yang dipakai pada video.

<!-- Page 13 -->

## 12. Design System dan Aksesibilitas

#### 12.1 Palet warna

|Peran|Warna|Pemakaian|
|---|---|---|
|Primer|Teal tua #0B4F4A|Header, tombol utama, angka skor|

|Primer terang|#EAF2F0|Latar panel dan kartu|
|---|---|---|
|Aksen hangat|Oranye lembut #C46A1B|Streak, penanda perhatian, elemen penyemangat|
|Sukses|Hijau #1F7A3D|Benar, selesai, target tercapai|
|Peringatan|Kuning tua #9A6B00 di atas #FFF4CC|Red flag tingkat perhatian|
|Bahaya|Merah #B42318|Hanya untuk berhenti darurat dan red flag tinggi, tidak untuk dekorasi|
|Teks utama|#1A2B2E di atas putih|Kontras minimal 7 banding 1 untuk teks utama|

Jangan mengandalkan warna saja untuk menyampaikan benar atau salah. Selalu pasangkan warna dengan kata dan, bila relevan, ikon sederhana.

#### 12.2 Tipografi dan tata letak

Font sistem atau font sans yang bersih dan terbaca. Ukuran dasar 17 sampai 18 px di ponsel, judul sesi 24 px ke atas, angka repetisi minimal 64 px. Jarak antar elemen dapat diketuk minimal 8 px. Tinggi tombol utama minimal 56 px, tombol Mulai Sesi minimal 72 px. Satu tindakan utama per layar. Tindakan sekunder tampil sebagai teks atau tombol bergaris, bukan tombol penuh kedua. Kartu memakai sudut membulat 12 sampai 16 px dan bayangan sangat tipis. Hindari gradasi ramai dan ilustrasi dekoratif yang menutupi konten.

#### 12.3 Aksesibilitas untuk pasien stroke dan lansia

Target sentuh besar di semua kontrol, karena banyak pengguna memiliki kelemahan dan tremor satu sisi. Navigasi ke latihan maksimal 3 ketuk dari Beranda. Tidak ada menu bersarang lebih dari satu tingkat. Setiap petunjuk visual disertai suara berbahasa Indonesia bila perangkat mengizinkan. Teks memakai kalimat pendek Bahasa Indonesia sehari hari. Hindari singkatan dan istilah Inggris yang tidak perlu. Dukungan penggunaan satu tangan: tindakan utama berada di separuh bawah layar. Gerakan di aplikasi tidak bergantung pada gestur rumit seperti cubit, geser dua jari, atau tekan lama. Sediakan pengaturan huruf Lebih Besar yang memperbesar teks 20 persen dan tersimpan. Animasi skeleton dan transisi tidak berkedip cepat. Hormati pengaturan gerak yang dikurangi dari sistem bila tersedia.

#### 12.4 Nada bahasa antarmuka

**Hindari Pakai** Gagal. Repetisi tidak valid. Gerakan tadi belum terhitung. Coba sekali lagi, pelan pelan. Anda melewatkan 3 hari. Sudah 3 hari belum latihan. Mulai dari satu latihan ringan hari ini. Skor buruk. Hari ini skor 45. Besok kita coba naik sedikit.

<!-- Page 14 -->

## <u>13. Alur Layar dan Peta Navigasi</u>

|Layar|Isi inti|Tindakan utama|
|---|---|---|
|Selamat Datang / Pilih Peran|Penjelasan satu kalimat, tiga pilihan peran besar|Pilih peran|
|Beranda Pasien|Salam, status hari ini, latihan hari ini, streak, pintu ke afasia|Mulai latihan pertama yang belum selesai|
|Detail Latihan|Contoh gerakan, langkah, peringatan, posisi ponsel|Mulai dengan Kamera|
|Sesi Kamera|Video dan skeleton, hitungan besar, target, pesan koreksi, tombol berhenti|Berhenti dan Selesaikan|
|Ringkasan Sesi|Skor, repetisi, durasi, satu saran, kalimat batasan non diagnosis|Kembali ke Beranda|
|Afasia: Pilih Kategori|Lima kategori dengan jumlah kata dan progres|Mulai 10 kata|
|Afasia: Latihan Kata|Gambar besar, kata, tombol Dengar, tombol mikrofon, hasil penilaian|Sebutkan Kata|
|Untuk Keluarga|Status hari ini, grafik mingguan, tren skor, red flag, salin ringkasan|Salin Ringkasan Mingguan|
|Dashboard Klinisi (P1)|Daftar pasien, resep program, progres per pasien|Simpan Program|
|Pengaturan dan Demo|Jadwal, ukuran huruf, reset data demo, ekspor JSON|Simpan|

#### 13.1 Landing page di domain utama

Halaman di akar pulihinapp.id berfungsi sebagai wajah publik untuk juri: nama PULIHIN, satu kalimat nilai produk, tiga keunggulan (penilaian gerak lewat kamera HP biasa, terapi afasia Bahasa Indonesia, dashboard keluarga dan terapis), tangkapan layar aplikasi, tombol Buka Aplikasi, dan catatan kaki bahwa produk ini adalah prototype lomba dan bukan alat kesehatan teregulasi. Tautan aplikasi dapat berada di pulihinapp.id/app atau langsung di akar, dengan syarat konsisten di paper dan video. Keputusan akhir penempatan tautan: [DIISI bila pemilik produk punya preferensi sub domain khusus].

#### 13.2 Tangkapan layar untuk paper

Selama pembangunan, simpan tangkapan layar bersih dari lima layar berikut pada resolusi ponsel yang sama, tanpa data pribadi di bilah notifikasi: Beranda, Sesi Kamera dengan skeleton, Ringkasan Sesi, Latihan Kata Afasia, dan Untuk Keluarga dengan grafik. File ini diserahkan bersama deliverable karena paper lomba membutuhkannya.

<!-- Page 15 -->

## <u>14. Spesifikasi Video Demo: Prinsip dan Persiapan</u>

**Deliverable B** Video maksimal 5 menit, diunggah ke YouTube sebagai unlisted. Video adalah bukti fungsi, bukan iklan. Setiap klaim yang diucapkan narator harus terlihat di layar dalam beberapa detik setelahnya.

#### 14.1 Struktur kepercayaan bertahap (trust fall)

|Waktu|Tahap|Yang harus dirasakan penonton|
|---|---|---|
|0:00 - 0:30|Masalah klinis|Ini masalah nyata dan pembicaranya kredibel|

|0:30 - 1:30|Tugas kecil|Satu gerakan saja ternyata benar benar dinilai oleh AI|
|---|---|---|
|1:30 - 3:00|Sesi penuh|Produk ini sanggup mendampingi satu sesi utuh dengan koreksi|
|3:00 - 4:00|Keluarga dan afasia|Dampaknya meluas ke keluarga dan ke bicara, bukan hanya gerak|
|4:00 - 5:00|Penutup dan ajakan|Produk bernama jelas, domain jelas, langkah berikut jelas|

#### 14.2 Aturan momen screenshot

Setiap rentang 30 detik wajib memiliki minimal satu momen visual yang tetap dapat dipahami bila video dijeda dan ditangkap layarnya. Momen itu adalah: angka skor, pesan koreksi form di atas skeleton, grafik kepatuhan, hasil penilaian kata, atau wajah dokter yang menyampaikan masalah. Saat menyunting, periksa video dengan cara menjeda tiap 30 detik. Bila jeda menghasilkan layar kosong, layar memuat, atau menu yang membingungkan, potong atau ganti bagian itu.

#### 14.3 Format teknis

Resolusi minimal 1080p, rasio 16 banding 9. Rekaman layar ponsel disajikan di dalam bingkai bersih di sisi layar, bukan memenuhi seluruh lebar dengan distorsi. Audio narasi Bahasa Indonesia jernih, tanpa musik yang menutupi suara. Musik latar, bila ada, maksimal 15 persen volume narasi. Subtitle Bahasa Inggris tertanam atau sebagai file teks terpisah yang diunggah bersama video. Subtitle tidak menutupi angka skor atau pesan koreksi. Tidak menampilkan notifikasi pribadi, nomor telepon asli, alamat email pribadi, atau data pasien asli di frame mana pun. Aktifkan mode Jangan Ganggu selama perekaman. Nama produk, domain pulihinapp.id, dan kategori lomba tampil di layar penutup minimal 5 detik.

#### 14.4 Peran coding agent pada video

Coding agent menyiapkan segala yang dapat disiapkan dari kode dan teks: mode demo yang stabil, data seed yang konsisten dengan naskah, naskah narasi final, file subtitle Inggris, daftar shot, dan bila lingkungannya mendukung penyuntingan video terprogram, draf rakitan dari rekaman yang disediakan pemilik produk. Rekaman wajah dokter dan gerakan pasien dilakukan manusia. Coding agent tidak boleh mengganti rekaman manusia dengan avatar buatan atau rekaman stok yang berpura pura menjadi pasien asli.

<!-- Page 16 -->

## <u>15. Storyboard Video Scene demi Scene (Bagian 1)</u>

|Waktu|Visual / shot|Narasi dan teks layar|
|---|---|---|
|0:00 - 0:12|Talking head dokter di ruang praktik atau ruang terang di rumah. Judul tampil.|"Saya dokter spesialis saraf. Setiap minggu saya melepas pasien stroke pulang ke rumah." Teks: PULIHIN, Pendamping Rehabilitasi Stroke di Rumah.|
|0:12 - 0:30|Dokter melanjutkan, diselingi shot kertas program latihan yang diletakkan di meja dan pasien samaran yang kebingungan.|"Masalahnya, pemulihan ditentukan oleh latihan harian di rumah, dan di situlah pendampingan terputus." Momen screenshot: kalimat masalah di layar.|
|0:30 - 0:50|Rekaman layar: Beranda, ketuk Tekuk Siku, layar persiapan.|"PULIHIN mengubah ponsel biasa menjadi pendamping latihan. Kita mulai dari satu gerakan kecil."|
|0:50 - 1:30|Shot lebar pasien demo duduk di depan ponsel, diselingi rekaman layar sesi kamera: skeleton, sudut, hitungan naik.|"Kamera membaca gerakan, menghitung repetisi dari sudut siku, dan memberi tahu bila gerakannya belum tepat." Momen screenshot: hitungan 5 dari 10 dengan skeleton.|
|1:30 - 2:10|Sesi berlanjut. Sengaja tampilkan satu koreksi: bahu terangkat, pesan muncul, pasien memperbaiki.|"Saat bahu ikut terangkat, aplikasi mengoreksi dengan suara Bahasa Indonesia. Bukan sekadar menghitung, melainkan menjaga cara geraknya."|
|2:10 - 3:00|Sesi selesai, layar ringkasan: skor, repetisi, durasi. Lalu Beranda yang statusnya berubah selesai.|"Di akhir sesi ada skor dan ringkasan sederhana. Latihan hari ini tercatat, dan keluarga bisa melihatnya." Momen screenshot: skor sesi.|

Catatan perekaman: adegan koreksi pada 1:30 sampai 2:10 adalah adegan terpenting sesudah pembuka. Rekam beberapa kali sampai koreksi muncul secara alami dari gerakan aktor demo. Jangan menempelkan teks koreksi palsu pada tahap penyuntingan.

#### 15.1 Siapa yang tampil

Dokter / pemilik produk: [DIISI: nama dan gelar yang tampil di layar]. Pasien demo: relawan sehat atau anggota tim yang berperan sebagai pasien, diberi keterangan Peragaan oleh pemeran di deskripsi video bila bukan pasien sungguhan. Jangan menyebut pemeran sebagai pasien asli. Caregiver demo: [DIISI: pemeran atau anggota tim]. Lokasi: [DIISI: ruangan yang akan dipakai, dengan cahaya dari depan dan latar bersih].

<!-- Page 17 -->

## <u>16. Storyboard Video Scene demi Scene (Bagian 2)</u>

|Waktu|Visual / shot|Narasi dan teks layar|
|---|---|---|
|3:00 - 3:30|Rekaman layar halaman Untuk Keluarga: grafik 7 hari, tren skor, red flag 3 hari tanpa sesi.|"Keluarga tidak lagi menebak. Mereka melihat kepatuhan minggu ini, tren skor, dan tanda bila latihan terhenti beberapa hari." Momen screenshot: grafik dan red flag.|
|3:30 - 4:00|Modul afasia: kata dan emoji besar tampil, pemeran menyebutkan kata, hasil Benar dan skor muncul.|"Untuk pasien dengan gangguan bicara, latihannya berbahasa Indonesia, dengan kata yang dipakai di rumah setiap hari." Momen screenshot: kata yang dinilai Benar.|
|4:00 - 4:25|Bila P1 selesai: dashboard klinisi, resep program diubah, lalu potong ke latihan pasien yang berubah. Bila P1 belum selesai, ganti dengan streak dan kalender kepatuhan.|"Terapis dapat menyusun program dan mengikuti kemajuan tanpa menunggu kunjungan berikutnya."|
|4:25 - 4:50|Kembali ke talking head dokter, aplikasi terlihat di ponsel di tangannya.|"PULIHIN tidak menggantikan terapis. PULIHIN memastikan yang diajarkan terapis benar benar dilatih di rumah."|
|4:50 - 5:00|Layar penutup statis: logo atau nama produk, domain, kategori, nama tim.|Teks: PULIHIN-pulihinapp.id-Health and Wellbeing, .id Developer Day Indonesia 2026. Tim: [DIISI].|

#### 16.1 Naskah dan subtitle

Coding agent menulis naskah narasi final dalam Bahasa Indonesia berdasarkan kolom narasi storyboard ini, maksimal 650 kata, agar kecepatan bicara wajar dalam 5 menit. Setiap baris narasi diterjemahkan ke Bahasa Inggris untuk subtitle, dengan istilah klinis yang umum: stroke rehabilitation, caregiver, aphasia, repetition, form correction. File subtitle diserahkan dalam format SRT dengan timecode yang mengikuti potongan final, bukan perkiraan kasar. Deskripsi YouTube disiapkan oleh coding agent: dua kalimat tentang produk, kategori lomba, domain, penafian prototype, dan keterangan pemeran demo.

#### 16.2 Daftar shot untuk hari perekaman

**[]** Talking head pembuka dan penutup dokter, masing masing 3 kali pengambilan. **[]** Shot lebar pasien demo dan ponsel di tripod, untuk latihan duduk dan berdiri. **[]** Rekaman layar penuh: Beranda, satu sesi gerak utuh, ringkasan, afasia 3 kata, halaman keluarga. **[]** Rekaman layar cadangan tanpa suara, untuk menutup potongan yang gagal. **[]** Foto tangkapan layar bersih lima layar untuk paper (Bab 13.2).

**Rencana cadangan perekaman:** bila pose estimation gagal di lokasi rekam karena cahaya, pindahkan ponsel lebih dekat, tambah lampu dari depan, dan gunakan latihan duduk nomor 2 (Tekuk Siku) sebagai latihan utama. Latihan ini paling toleran terhadap cahaya dan ruang sempit, dan karena itu juga menjadi latihan yang wajib paling stabil di aplikasi.

<!-- Page 18 -->

## <u>17. Batasan, Non Goal, dan Keamanan</u>

#### 17.1 Status produk

PULIHIN pada tahap ini adalah prototype untuk kompetisi. Produk ini bukan alat kesehatan teregulasi, tidak memiliki izin sebagai perangkat medis, dan tidak boleh dipasarkan atau diuji sebagai alat diagnosis atau penentu terapi. Seluruh layar, landing page, paper, dan video harus konsisten dengan status ini.

#### 17.2 Batasan isi

Tanpa klaim diagnosis, prognosis, atau kesembuhan. Tanpa rekomendasi obat, dosis, atau perubahan terapi. Tanpa data pasien asli dalam pembangunan, pengujian, tangkapan layar, dan video. Latihan yang ditampilkan adalah latihan umum. Program untuk pasien sungguhan di masa depan harus ditetapkan atau disetujui klinisi yang merawat. Peringatan keselamatan tampil sebelum setiap sesi gerak: berhenti bila nyeri, pusing, sesak, atau tidak enak badan, dan hubungi tenaga kesehatan. Latihan berdiri selalu menampilkan syarat berpegangan pada kursi atau meja yang stabil.

#### 17.3 Privasi secara desain

Video kamera diproses di perangkat dan tidak diunggah. Jangan menambahkan analitik pihak ketiga pada halaman sesi kamera. Audio afasia diproses oleh Web Speech API bawaan browser. Beri catatan jujur di README dan di halaman Tentang bahwa pada sebagian browser, pengenalan suara memakai layanan cloud dari penyedia browser, sehingga mode cadangan lokal disediakan. Data demo dan data lokal tidak dikirim ke server mana pun pada prototype ini. Tombol Hapus Semua Data Lokal tersedia di Pengaturan dan bekerja tanpa sisa sesi yang tertinggal.

#### 17.4 Target perangkat

Dahulukan HP Android kelas bawah: layar 6 inci, RAM 4 GB, Chrome terkini. Bila harus memilih antara efek visual dan frame rate pose, hapus efek visual. Bila model pose versi penuh terlalu berat, gunakan varian lite dari Pose Landmarker dan catat keputusan itu di README beserta hasil uji frame rate dan akurasinya.

#### 17.5 Non goal yang tegas

Aplikasi native Android atau iOS terpisah pada tahap ini. Integrasi rumah sakit, BPJS, atau rekam medis elektronik. Pelacakan gait berjalan penuh dan penilaian keseimbangan berdiri bebas. Keduanya berisiko keselamatan bila dipandu tanpa pendamping dan berada di luar MVP. Model AI yang dilatih sendiri. Prototype memakai model pose siap pakai yang terdokumentasi.

<!-- Page 19 -->

## 18. Urutan Kerja dan Manajemen Waktu

Karena tenggat adalah 14 Oktober 2026, coding agent wajib bekerja dalam urutan berikut dan tidak melompat ke P1 karena terlihat lebih mudah. **Tahap Hasil yang harus ada di akhir tahap**

1. Kerangka Repo, Vite dan Tailwind berjalan, routing semua layar P0 tersedia sebagai halaman kosong
berjudul, deploy awal ke domain atau subdomain sementara berhasil di HTTPS

2. Pose PoseEngine menampilkan skeleton, sudut siku tampil live, mode uji internal berjalan
3. Repetisi State machine menghitung Tekuk Siku dan Fleksi Bahu, koreksi bahu terangkat tampil, ringkasan
sesi tersimpan

4. Pustaka 10 latihan terdefinisi sebagai data, 3 latihan inti teruji penuh, sisanya teruji dasar
5. Afasia 100 kata, alur 10 kata per sesi, penilaian suara dan mode cadangan, skor tersimpan
6. Kepatuhan Jadwal, streak, kalender, data seed 14 hari, dashboard caregiver dengan red flag
7. Uji penuh Seluruh baris Bab 11 diuji di perangkat target, hasil dicatat di README, bug P0 diperbaiki
8. Rekam Mode demo direset ke kondisi naskah, rekaman layar dan talking head diambil, naskah dan SRT
selesai

9. P1 bila sempat Dashboard klinisi dan landing page final, lalu uji ulang alur P0 setelah perubahan apa pun
#### 18.1 Aturan pembekuan fitur

Setelah tahap 7 selesai, tidak ada fitur baru. Waktu yang tersisa hanya untuk perbaikan bug yang menghalangi demo, perbaikan teks, dan perekaman ulang. Setiap perubahan kode sesudah pembekuan wajib diikuti uji ulang alur demo lengkap dari Beranda sampai ringkasan caregiver.

#### 18.2 Risiko utama dan mitigasinya

**Risiko Mitigasi yang sudah diputuskan di dokumen ini** Pose berat di HP kelas bawah Model lite, resolusi kamera 640 kali 480 sebagai bawaan, matikan efek visual Web Speech API tidak tersedia Mode cadangan penilaian manual oleh caregiver, lihat AC-F3-4 Izin kamera ditolak browser Wajib HTTPS, halaman penjelasan izin, uji di domain final sejak tahap 1 Domain belum aktif Deploy sejak tahap 1 di URL sementara penyedia hosting, pindah domain hanya mengganti DNS, bukan membangun ulang Video gagal karena aplikasi Pembekuan fitur, tombol reset data demo, rekaman cadangan berubah di hari rekam

<!-- Page 20 -->

## <u>19. Deliverable Checklist untuk Coding Agent</u>

Coding agent menyerahkan hasil dalam satu paket dan melaporkan status tiap baris dengan bukti berupa tautan atau nama file. Laporan "selesai" tanpa tautan yang dapat dibuka tidak diterima.

#### 19.1 Repo dan dokumentasi

**[]** Repo sumber dengan riwayat commit yang terbaca per tahap Bab 18. **[]** README berisi: cara menjalankan lokal (perintah persis), cara build, cara deploy, versi Node, struktur folder, keputusan teknis dan adaptasi stack bila ada, hasil uji Bab 11, hasil uji akurasi 50 repetisi, dan daftar [DIISI] yang masih kosong. **[]** File .env.example bila ada variabel lingkungan, tanpa nilai rahasia apa pun di dalam repo. **[]** Definisi latihan dan bank 100 kata sebagai file data terpisah yang terdokumentasi.

#### 19.2 Aplikasi

**[]** URL deploy publik yang berjalan di pulihinapp.id atau subdomainnya, memakai HTTPS. URL final: [DIISI setelah deploy oleh coding agent dalam laporan serah terima]. **[]** Seluruh P0 tercentang pada checklist Bab 11 di README. **[]** Manifest PWA valid dan aplikasi dapat di install di Chrome Android. **[]** Lima tangkapan layar bersih untuk paper, sesuai Bab 13.2.

#### 19.3 Video

**[]** File video final maksimal 5 menit dalam format MP4 1080p. **[]** Naskah narasi Bahasa Indonesia final sebagai file teks. **[]** File subtitle Inggris dalam format SRT. **[]** Draf judul dan deskripsi YouTube, termasuk penafian prototype dan keterangan pemeran. **[]** Tautan YouTube unlisted setelah diunggah oleh pemilik produk atau atas instruksinya: [DIISI].

#### 19.4 Format laporan serah terima dari coding agent

|LAPORAN|SERAH TERIMA|PULIHIN|||||
|---|---|---|---|---|---|---|
|URL aplikasi||: ...|||||
|URL repo||: ...|||||
|Perangkat|uji|: ... /|Chrome ...||||
|P0 selesai||: F1 [|] F2 []|F3 [] F4|[] F5|[]|
|P1 selesai||: F6 [|] F7 []||||
|Akurasi|repetisi|: ... dari|50 pada|latihan|...||
|Frame|rate pose|: ... fps|di perangkat|uji|||
|Video||: nama|file, durasi,|tautan|bila|ada|
|Yang belum|selesai:|...|||||
|[DIISI]|yang masih|kosong:|...||||

<!-- Page 21 -->

## Lampiran A. Pemetaan Fitur ke Kriteria Juri

Penilaian lomba memakai empat kriteria dengan bobot sama. Tabel ini adalah kompas prioritas coding agent: pekerjaan yang tidak menguatkan satu pun baris di bawah ini tidak dikerjakan sebelum submit.

|Kriteria (25%)|Bukti yang dicari juri|Fitur dan adegan yang menyediakannya|
|---|---|---|
|Uniqueness|Sesuatu yang spesifik Indonesia dan sulit ditiru produk global|F3 afasia 100 kata Bahasa Indonesia dengan pengenalan suara id-ID; adegan video 3:30 - 4:00; desain untuk keluarga Indonesia sebagai pendamping harian|
|Market Potential|Masalah besar, kebutuhan berulang, jalur distribusi yang masuk akal|Narasi video 0:00 - 0:30; F6 resep program dari klinisi sebagai jalur masuk lewat klinik dan rumah sakit; model berlangganan institusi yang dijelaskan di paper, bukan di aplikasi|
|Functionalities|Fitur benar benar berjalan dalam demo, bukan janji|F1 sampai F5 seluruhnya; satu sesi utuh di video 0:30 - 3:00; tangkapan layar asli; tautan prototype yang dapat dibuka juri|
|Quality of Technology|Pilihan teknologi tepat, terukur, dan sadar privasi|Pose on device MediaPipe tanpa unggah video; state machine sudut dengan histeresis; angka akurasi dan frame rate hasil uji di README; arsitektur data terstruktur yang siap dipindah ke Flutter|

#### Konsekuensi praktis untuk prioritas

Bila waktu menipis, korbankan keluasan pustaka visual sebelum mengorbankan kestabilan F1 dan kelengkapan F3, karena keduanya memikul Uniqueness dan Functionalities sekaligus. Angka hasil uji yang jujur menaikkan Quality of Technology lebih tinggi daripada klaim tanpa angka. Selalu sertakan angka uji apa adanya. Setiap fitur P1 hanya bernilai bila memperkuat Market Potential tanpa merusak bukti Functionalities dari P0.

## Lampiran B. Daftar Seluruh Placeholder [DIISI]

Identitas pemilik produk, nama tim 3 orang, email, dan WhatsApp (halaman 1). URL repo atau instruksi pembuatan repo baru (halaman 1). Platform dan pemilik akun deploy (halaman 1). Model HP uji kelas bawah dan versi Chrome (Bab 5 dan Bab 11). Jam pengingat default sesi gerak dan afasia (Bab 9.1). Aset animasi atau video contoh gerakan bila pemilik produk menyediakannya sendiri (Bab 6.1). Preferensi penempatan tautan aplikasi di domain (Bab 13.1). Nama dan gelar yang tampil di video, pemeran caregiver, dan lokasi perekaman (Bab 15.1). URL final aplikasi dan tautan YouTube, diisi pada laporan serah terima (Bab 19).

**Instruksi terakhir untuk coding agent:** mulai dari Tahap 1 di Bab 18 sekarang. Bangun alur demo yang utuh terlebih dahulu, uji di perangkat kelas bawah, dan laporkan dengan format Bab 19.4. Dokumen ini adalah acuan tunggal. Bila menemukan isi dokumen yang bertentangan, dahulukan acceptance criteria di Bab 5, 8, dan 11, lalu catat pertentangan itu di README.

Akhir dokumen. PULIHIN Build Specification versi 1.0, 13 Oktober 2026. Produk wajib memakai domain pulihinapp.id. Tenggat pendaftaran .id Developer Day Indonesia 2026 adalah 14 Oktober 2026.
