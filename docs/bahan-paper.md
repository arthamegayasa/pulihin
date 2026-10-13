# Bahan Paper PULIHIN

Bahan mentah untuk paper lomba .id Developer Day Indonesia 2026 (Health and Wellbeing). Isinya fakta bersumber dan usulan kalimat yang bisa disalin. Susunannya mengikuti empat kriteria juri di spesifikasi Lampiran A: Uniqueness, Market Potential, Functionalities, dan Quality of Technology.

**Aturan pakai**

- Setiap angka memakai salah satu dari empat label berikut. Jangan memakai angka tanpa labelnya.
  - `[S#]`: sumber primer. Tautannya ada di label dan di [Daftar sumber](#daftar-sumber). Semua sumber diakses pada 13 Oktober 2026.
  - **[Ukur internal]**: hasil uji di repo PULIHIN. Nama berkas buktinya selalu ditulis.
  - **[Estimasi tim]**: hasil hitungan tim dari angka bersumber. Rumusnya ditulis supaya dapat diperiksa.
  - **[Hipotesis]**: asumsi bisnis yang belum divalidasi.
- Tanpa klaim medis, diagnosis, atau kesembuhan (spec Bab 17.2). PULIHIN membantu latihan berjalan. PULIHIN tidak mengobati.
- Klip video Pexels hanya untuk uji internal. Klip ini tidak boleh tampil di tangkapan layar paper. Teks paper boleh menyebutnya sebagai sumber uji.

| Bagian | Kriteria juri yang dikuatkan |
|---|---|
| 1. Masalah | Market Potential (masalah besar, kebutuhan berulang) |
| 2. Solusi dan kekhasan Indonesia | Uniqueness, Functionalities |
| 3. Potensi pasar dan distribusi | Market Potential |
| 4. Lanskap kompetitor | Uniqueness, Market Potential |
| 5. Kualitas teknologi | Quality of Technology, Functionalities |
| 6. Batasan dan etika | Quality of Technology (sadar privasi, jujur) |
| 7. Rencana lanjutan | Market Potential, Quality of Technology |

---

## 1. Masalah

### 1.1 Beban stroke di Indonesia

- Prevalensi stroke berdasarkan diagnosis dokter pada penduduk berumur ≥ 15 tahun adalah **8,3 per mil** (95% CI 8,0–8,7). Sumber: SKI 2023, Tabel 7.46, hlm. 276 ([S1][s1]).
- Prevalensi naik tajam menurut umur: **23,6‰** pada umur 55–64 tahun, **35,4‰** pada umur 65–74 tahun, dan **41,3‰** pada umur 75 tahun ke atas. Angkanya **9,7‰** di perkotaan dan **6,4‰** di perdesaan. Sumber: SKI 2023, Tabel 7.47, hlm. 277 ([S1][s1]).
- Survei sebelumnya mencatat prevalensi stroke **10,9 per mil** (Riskesdas 2018), naik dari 7 per mil pada Riskesdas 2013 ([S2][s2]). *Catatan:* Riskesdas 2018 dan SKI 2023 adalah survei berbeda. Jangan menulis bahwa stroke "turun" tanpa analisis metodologi.
- Menurut Kemenkes, stroke adalah **penyebab utama kecacatan dan kematian** di Indonesia, yaitu **11,2% dari total kecacatan dan 18,5% dari total kematian** ([S3][s3], rilis 25 Okt 2024). Rilis Kemenkes tahun 2023 menyebut angka **19,42% dari total kematian** berdasarkan IHME 2019 ([S4][s4]).
- Stroke adalah penyakit katastropik dengan pembiayaan tertinggi ketiga setelah penyakit jantung dan kanker, yaitu **Rp5,2 triliun pada 2023** ([S3][s3]).
- Di antara penduduk ≥ 1 tahun yang disabilitasnya disebabkan penyakit, **19,8%** menyebut stroke sebagai penyebab. Sumber: SKI 2023, Tabel 8.6, hlm. 293 ([S1][s1]). Jumlah semua kolom tabel ini melebihi 100%. Artinya satu responden tampaknya dapat menyebut lebih dari satu penyakit.
- Banyak penyandang stroke tidak kontrol rutin. Hanya **49,2%** penduduk dengan stroke yang kontrol rutin ke fasilitas kesehatan. Sebanyak **26,8%** kontrol kadang-kadang dan **24,1%** tidak kontrol. Kesenjangannya besar:
  - perdesaan 39,6% rutin, perkotaan 53,7% rutin;
  - kelompok ekonomi terbawah 36,5% rutin, kelompok teratas 62,1% rutin.

  Sumber: SKI 2023, Tabel 7.48, hlm. 278 ([S1][s1]).
- Di tingkat global, WHO memperkirakan **2,4 miliar** orang hidup dengan kondisi yang dapat terbantu oleh rehabilitasi. Di sebagian negara berpendapatan rendah-menengah, **lebih dari 50%** orang yang membutuhkan rehabilitasi tidak menerimanya ([S5][s5]).

> **Kalimat usulan:** "Menurut Survei Kesehatan Indonesia 2023, 8,3 dari setiap 1.000 penduduk berumur 15 tahun ke atas pernah didiagnosis stroke oleh dokter. Kementerian Kesehatan mencatat stroke sebagai penyebab 11,2% kecacatan dan 18,5% kematian di Indonesia. Namun hanya 49,2% penyandang stroke yang kontrol rutin ke fasilitas kesehatan, dan angkanya lebih rendah di perdesaan dan pada kelompok ekonomi terbawah."

### 1.2 Afasia pascastroke

- Tinjauan sistematis dan meta-analisis dari 50 studi menemukan frekuensi afasia median **30%** pada fase akut dan **34%** pada setting rehabilitasi untuk stroke campuran (iskemik dan hemoragik) ([S6][s6]).
- Pasien dengan afasia memiliki disabilitas lebih besar, dengan OR **1,5** pada hari ke-28 dan **1,7** pada 2 tahun. Dalam 2 tahun mereka juga lebih banyak memakai layanan rehabilitasi (OR **1,5**) ([S6][s6]).
- Angka 30–34% diukur pada fase akut dan rehabilitasi. Angka ini **tidak** sama dengan prevalensi afasia di antara semua penyintas di masyarakat. Karena itu tim **tidak** mengalikannya dengan prevalensi SKI. Penelusuran ini juga tidak menemukan angka nasional resmi afasia pascastroke di Indonesia.

> **Kalimat usulan:** "Sekitar sepertiga pasien stroke mengalami afasia pada fase akut dan rehabilitasi. Afasia berkaitan dengan disabilitas yang lebih berat dan kebutuhan rehabilitasi yang lebih panjang. Latihan bicara perlu memakai bahasa yang dipakai pasien setiap hari."

### 1.3 Latihan di rumah sulit dijaga

- Survei di kelompok dukungan stroke menunjukkan **89%** responden menerima program latihan rumah (home exercise program). Dari mereka, hanya **65,3%** yang patuh, dan itu pun **setidaknya sebagian** program. Alasan paling sering tidak patuh adalah mengerjakan latihan yang berbeda dari yang diberikan fisioterapis ([S7][s7]).
- Studi kecil (n = 14) membandingkan peserta yang masih ikut program dengan yang sudah lulus. Kepatuhan latihan aerobik di rumah turun dari 100% menjadi **76%**, dan latihan beban dari 100% menjadi **55%**. Hambatan paling umum adalah kurang motivasi, keluhan otot dan sendi, dan kelelahan ([S8][s8]).
- Scoping review 2025 meninjau 37 laporan. Kurang dari separuh studi mengukur kepatuhan per sesi latihan. Hanya **satu** studi yang mengukur kepatuhan setelah intervensi berakhir ([S9][s9]). Artinya, data kepatuhan latihan di rumah sendiri jarang tercatat.

> **Kalimat usulan:** "Pasien stroke pulang membawa program latihan di atas kertas. Penelitian menunjukkan kepatuhan latihan rumah menurun setelah pasien lepas dari program terawasi. Alasan yang paling sering muncul adalah pasien mengerjakan latihan yang berbeda dari yang diajarkan. Selama ini terapis jarang tahu apakah latihan di rumah benar-benar terjadi."

### 1.4 Tenaga rehabilitasi terbatas dan tidak merata

Data Kemenkes tidak memisahkan fisioterapis dan terapis wicara dalam data tenaga yang bekerja. Yang tersedia adalah kelompok **tenaga keterapian fisik**. Pada tabel STR, kelompok ini berisi fisioterapi, okupasi terapis, terapis wicara, dan akupunktur (Profil Kesehatan Indonesia 2023, Lampiran 12.b) ([S10][s10]).

- Tenaga keterapian fisik di fasilitas kesehatan tahun 2023 berjumlah **13.528 orang**. Sebanyak **11.193** bekerja di rumah sakit dan hanya **926** di puskesmas. Sumber: Lampiran 14.a–14.c, data SISDMK ([S10][s10]).
- Ada **10.180 puskesmas** (hlm. 21) dan **3.155 rumah sakit** (hlm. 42) di Indonesia pada 2023 ([S10][s10]).
- Di 62 kabupaten daerah tertinggal hanya ada **140** tenaga keterapian fisik (hlm. 68) ([S10][s10]).
- STR baru tahun 2023: **2.177** fisioterapi dan **361** terapis wicara. Sumber: Lampiran 12.b, data Konsil Tenaga Kesehatan Indonesia ([S10][s10]). Angka ini adalah registrasi baru, bukan jumlah tenaga yang bekerja.
- **[Estimasi tim]** Rasio tenaga dan fasilitas:
  - ±1 tenaga keterapian fisik per **±20.600 penduduk**: 278.696.193 penduduk (Lampiran 2.a, [S10][s10]) ÷ 13.528.
  - ±1 tenaga keterapian fisik per **±11 puskesmas**: 10.180 ÷ 926.
- Kajian kualitatif di Yogyakarta mendapati perawat keluarga pasien stroke kesulitan karena layanan belum optimal, termasuk **fisioterapi yang terbatas** ([S11][s11]).

> **Kalimat usulan:** "Pada 2023, hanya 926 tenaga keterapian fisik yang bekerja di 10.180 puskesmas di Indonesia. Kelompok ini mencakup fisioterapis, okupasi terapis, terapis wicara, dan akupunktur. Sebagian besar tenaga rehabilitasi berada di rumah sakit, jauh dari rumah pasien."

### 1.5 Keluarga sebagai perawat utama

- Di antara penduduk ≥ 60 tahun dengan stroke, hanya **62,4%** yang mandiri. Sisanya bergantung pada orang lain:
  - ringan 9,7%;
  - sedang 8,9%;
  - berat 8,2%;
  - total 10,8%.

  Sumber: SKI 2023, Tabel 8.20, hlm. 316 ([S1][s1]). Angka ketergantungan pada pasien stroke adalah yang tertinggi di antara enam penyakit kronis di tabel itu.
- **[Estimasi tim]** 100% − 62,4% = **37,6%** penduduk ≥ 60 tahun dengan stroke mengalami ketergantungan dari ringan sampai total.
- Lansia ≥ 60 tahun dengan ketergantungan berat atau total dirawat oleh:
  - **keluarga terdekat (anak, cucu, keponakan): 80,8%**;
  - asisten rumah tangga: 12,9%;
  - tenaga terlatih: 1,3%;
  - perawat: 0,3%;
  - tidak ada yang merawat: 4,7%.

  Sumber: SKI 2023, Tabel 8.19, hlm. 315 ([S1][s1]). Tabel ini mencakup semua penyebab, tidak khusus stroke.
- Kajian kualitatif di klinik homecare RSUP Dr. Sardjito (n = 7 perawat keluarga) mencatat dua hal ([S11][s11]):
  - Peran perawat keluarga: menghubungkan pasien dengan tenaga kesehatan, memenuhi kebutuhan dasar, **membantu rehabilitasi**, dan menjaga semangat pasien.
  - Masalah mereka: kurang pengetahuan tentang stroke dan kurang perhatian dari anggota keluarga lain.

> **Kalimat usulan:** "Di Indonesia, keluarga adalah perawat utama. Menurut SKI 2023, 80,8% lansia dengan ketergantungan berat dirawat oleh keluarga terdekat, bukan oleh tenaga kesehatan. Karena itu PULIHIN merancang keluarga sebagai pengguna kedua sejak awal, bukan sekadar penonton."

---

## 2. Solusi PULIHIN dan kekhasan Indonesia

### 2.1 Apa yang sudah berjalan (bukti di repo)

Status per README.md, bagian "Fitur dan status":

- **F1 Latihan gerak berbasis kamera.** Ponsel diletakkan di meja. MediaPipe Pose Landmarker berjalan di browser. Aplikasi menghitung repetisi dari sudut sendi dan memberi koreksi suara dan teks dalam Bahasa Indonesia.
- **F2 Pustaka 10 latihan sebagai data** (`src/features/pose/exerciseDefinitions.ts`). Semua ambang ada di data, jadi terapis atau pengembang dapat mengubahnya tanpa mengubah logika.
- **F3 Terapi afasia 100 kata Bahasa Indonesia** (`src/features/speech/wordBank.ts`). Kata dibagi ke lima kategori: benda di rumah 30, makanan dan minuman 25, keluarga dan orang 15, anggota tubuh 15, kebutuhan harian 15. Setiap kata punya gambar, pemenggalan suku kata, dan kalimat contoh. Pengenalan suara memakai Web Speech API `id-ID`. Ada juga **Mode Latihan Mandiri**: pendamping menilai dengan tombol Sudah Benar atau Ulangi, tanpa pengenalan suara.
- **F4 Pengingat dan streak**: jadwal, kalender kepatuhan, dan hari beruntun.
- **F5 Tampilan "Untuk Keluarga"**: status hari ini, grafik 7 hari, dan tren skor. Ada juga 4 aturan *red flag non medis* (`src/features/adherence/redFlags.ts`), misalnya "3 hari belum latihan". Ringkasan mingguan dapat disalin ke WhatsApp.
- **F6 Dashboard klinisi dan resep program (P1)**: terapis menyusun latihan, target repetisi, set, hari latihan per minggu, dan **target rentang personal** (100/90/80/70% ambang atas, untuk pasien yang belum bisa bergerak penuh). Resep langsung mengubah daftar "Latihan Hari Ini" pasien. Perilaku ini sudah diverifikasi.
- **F7 Landing page** dengan tangkapan layar asli.

### 2.2 Mengapa khas Indonesia dan sulit ditiru produk global

1. **Bank kata afasia berbahasa Indonesia.**
   - Isinya 100 kata sehari-hari di rumah: nasi, kursi, ibu, kunci, dan lainnya.
   - Penilaiannya memaafkan selisih kecil. Kata panjang masih diterima dengan selisih satu huruf. Suku kata awal yang benar dinilai "Hampir" (`src/features/speech/SpeechScorer.ts`).
   - Produk afasia global yang dibandingkan tidak mencantumkan Bahasa Indonesia di situs resminya (lihat Bagian 4).
2. **Keluarga sebagai pengguna kedua.**
   - Keluarga punya tampilan sendiri dan ringkasan yang siap dikirim lewat WhatsApp.
   - Bahasanya tidak menyalahkan, dan red flag-nya non medis. Contoh pesan red flag: "ajak mulai lagi dari satu latihan ringan … hubungi terapis".
   - Rancangan ini sesuai data bahwa 80,8% lansia bergantung dirawat keluarga terdekat ([S1][s1], Tabel 8.19).
3. **PWA ringan untuk HP Android kelas bawah.**
   - Tidak perlu memasang aplikasi dari toko aplikasi. Cukup buka tautan di Chrome.
   - Pada 2024, **68,65%** penduduk Indonesia memiliki telepon seluler dan **72,78%** mengakses internet ([S12][s12]).
   - Android menguasai **79,16%** pangsa sistem operasi seluler di Indonesia, diukur dari tayangan halaman pada September 2026 ([S13][s13]).
   - **[Ukur internal]** Precache service worker ±1,4 MB. Aset pose ±19 MB baru diunduh saat Beranda pasien atau Detail Latihan dibuka (bukan di landing, layar keluarga, atau layar terapis), sehingga kuota prabayar tidak terkuras. Sesi kamera tetap bisa berjalan luring setelah Beranda pasien dibuka sekali (README.md, tabel keputusan teknis).
4. **Privasi di perangkat.**
   - Video tidak pernah meninggalkan ponsel. Tidak ada analitik pihak ketiga dan tidak ada akun.
   - UU 27/2022 menggolongkan "data dan informasi kesehatan" dan "data biometrik" sebagai data pribadi yang bersifat spesifik (Pasal 4 ayat 2) ([S14][s14]). Pemrosesan di perangkat memperkecil data sensitif yang perlu dikelola sejak awal.

> **Kalimat usulan:** "PULIHIN tidak menerjemahkan produk luar negeri. Aplikasi ini dirancang dari kebiasaan rumah Indonesia: latihan bicara memakai kata di dapur dan ruang keluarga, keluarga menjadi pengguna kedua yang menerima ringkasan lewat WhatsApp, dan aplikasi cukup dibuka lewat tautan di HP Android kelas bawah tanpa video yang meninggalkan ponsel."

---

## 3. Potensi pasar dan distribusi

### 3.1 Ukuran kebutuhan

- **[Estimasi tim]** Penduduk ≥ 15 tahun pada 2023 berjumlah 212.121.068. Angka ini adalah total Lampiran 2.a dikurangi kelompok umur 0–14 ([S10][s10]). Dikalikan prevalensi 8,3‰ ([S1][s1]), hasilnya **±1,76 juta** orang yang pernah didiagnosis stroke. Batas 95% CI memberi rentang ±1,70–1,85 juta.
  - Ini angka "pernah didiagnosis", bukan jumlah orang yang sedang menjalani rehabilitasi.
  - Pakai sebagai gambaran skala, bukan sebagai pasar yang pasti terjangkau.
- **[Estimasi tim]** ±1,76 juta ÷ 13.528 tenaga keterapian fisik ≈ **±130 penyandang stroke per tenaga**. Tenaga ini juga melayani kondisi selain stroke.
- Kebutuhannya **berulang**. Latihan dilakukan harian sampai mingguan, dan kontrol rutin baru dijalani 49,2% penyandang stroke ([S1][s1], Tabel 7.48).

### 3.2 Jalur distribusi B2B2C: klinik dan rumah sakit meresepkan, keluarga memakai

1. Terapis di klinik atau rumah sakit membuat **resep program** di dashboard klinisi (F6).
2. Pasien membuka tautan PULIHIN di ponselnya sendiri. Resep langsung menjadi "Latihan Hari Ini".
3. Keluarga mendampingi dan menerima ringkasan mingguan. Terapis melihat bahwa latihan rumah benar-benar terjadi.

Titik masuknya adalah **3.155 rumah sakit** dan **10.180 puskesmas** ([S10][s10]), mulai dari fasilitas yang sudah punya layanan rehabilitasi medik. Kemenkes menyebut jaringan rumah sakit yang melayani pasien stroke telah dilengkapi sarana dan tenaga, dan *stroke registry* sedang dikembangkan ([S3][s3]). Ini konteks kebijakan, bukan kemitraan.

Pemain global juga menjual lewat institusi, bukan langsung ke pasien:

- Kaia dan Sword bekerja dengan pembayar, pemberi kerja, dan sistem kesehatan nasional ([S15][s15]).
- Hinge Health menyasar *benefit leaders and health plans* dan menulis "Help your workforce move beyond pain" ([S16][s16]).
- Exer menjual platform ke penyedia layanan dan klinik ([S18][s18]).

Pola ini mendukung pilihan jalur institusi untuk PULIHIN.

### 3.3 Model berlangganan institusi: **[Hipotesis]**

Semua butir di bagian ini adalah hipotesis yang belum divalidasi dengan klinik mana pun. Tulis sebagai rencana, bukan fakta.

- **Yang dibayar:** langganan per institusi (klinik atau rumah sakit) untuk dashboard klinisi, resep program, dan pemantauan kepatuhan. Pasien dan keluarga memakai aplikasi tanpa biaya.
- **Mengapa institusi mau membayar** (perlu divalidasi):
  - terapis mendapat bukti latihan rumah di antara kunjungan;
  - pasien yang berhenti kontrol lebih cepat terlihat lewat red flag;
  - sesi edukasi keluarga dapat diulang di rumah.
- **Yang harus diuji sebelum menetapkan harga:**
  - kesediaan membayar per klinik;
  - jumlah pasien aktif per terapis;
  - siapa pengambil keputusan pembelian;
  - apakah resep digital dapat masuk alur kerja terapis tanpa menambah beban.
- **Angka harga sengaja tidak dicantumkan.** Belum ada data untuk mendukungnya.

### 3.4 BPJS: hanya sebagai konteks

- Stroke termasuk penyakit katastropik dengan pembiayaan **Rp5,2 triliun pada 2023** ([S3][s3]).
- PULIHIN **tidak** terintegrasi dengan BPJS Kesehatan, sistem rumah sakit, atau rekam medis elektronik. Integrasi seperti itu adalah *non-goal* tahap ini (spec Bab 17.5). Paper tidak boleh menyiratkan penjaminan atau kerja sama dengan BPJS.

> **Kalimat usulan:** "PULIHIN masuk lewat klinik dan rumah sakit: terapis meresepkan program, pasien dan keluarga berlatih di rumah tanpa biaya, dan institusi membayar langganan untuk dashboard pemantauan. Model berlangganan ini masih hipotesis yang akan kami uji bersama mitra klinis pertama."

---

## 4. Lanskap kompetitor

Penelusuran dilakukan di situs resmi masing-masing produk pada 13 Oktober 2026. Kolom "Celah" hanya membandingkan hal yang tertulis di sumber, bukan penilaian mutu klinis.

| Produk | Yang dilakukan (menurut sumber resmi) | Celah untuk konteks Indonesia |
|---|---|---|
| **Hinge Health**, TrueMotion® ([S16][s16]) | Terapi MSK digital. Menggabungkan sensor wearable dan computer vision, melacak lebih dari 100 titik tubuh untuk umpan balik real time. Menyasar individu serta *benefit leaders and health plans*. | Fokus nyeri MSK, bukan stroke. Tidak ada modul afasia. Saluran lewat pemberi kerja dan asuransi luar negeri. Halaman resmi berbahasa Inggris. |
| **Sword Health**, termasuk **Kaia Health** sejak 28 Jan 2026 ([S15][s15]) | Platform "AI Care" untuk nyeri fisik. Lebih dari 700.000 anggota di tiga benua. Kaia memiliki jalur penggantian biaya digital di Jerman. | Fokus MSK dan paru, bukan stroke atau afasia. Saluran pembayar di AS dan Eropa. |
| **Kaia Motion Coach™** ([S17][s17]) | Kamera depan ponsel atau tablet menganalisis gerak secara real time dan memberi umpan balik audiovisual tanpa sensor. Mendukung iOS (iPhone 6S ke atas) dan Android 5.0 ke atas. | Teknologi kamera serupa, tetapi untuk MSK. Tidak ada peran keluarga dan tidak ada Bahasa Indonesia yang tercantum. |
| **Exer Health** ([S18][s18]) | Pemantauan MSK di rumah dengan kamera ponsel tanpa wearable dan tanpa video pasien yang disimpan di cloud. Ada streak dan koreksi form. Tercantum sebagai FDA Class II (software) dan HIPAA compliant. | Pasar dan regulasi AS (FDA, HIPAA, produk "RTM Codes" untuk penagihan). Bukan stroke-spesifik. Tidak ada afasia. |
| **Neofect Smart Glove** ([S19][s19]) | Sarung tangan rehabilitasi tangan pascastroke dengan sensor akselerometer dan sensor tekuk. | Perangkat keras khusus, bukan ponsel yang sudah dimiliki keluarga. |
| **Constant Therapy** ([S20][s20]) | Terapi bicara, bahasa, dan kognitif di rumah untuk stroke dan afasia. Klinisi dapat membuat program rumah. Tersedia dalam English (US), English (India), dan Spanish (US). | Tidak ada Bahasa Indonesia. Tidak ada latihan gerak berbasis kamera. |
| **Tactus Therapy** ([S21][s21]) | Aplikasi terapi afasia berbayar. Contoh: Language Therapy 4-in-1 seharga USD 89,99. Filter bahasa: English (Amerika Utara dan UK), French, German, Spanish. | Tidak ada Bahasa Indonesia. Harga dalam USD per aplikasi. Hanya modul bicara. |

**Ringkasan celah** (berlaku untuk produk di tabel ini):

- Belum ada yang menggabungkan latihan gerak berbasis kamera dan latihan afasia berbahasa Indonesia dalam satu alur.
- Belum ada yang merancang keluarga Indonesia sebagai pengguna kedua.
- Belum ada yang dapat dipakai lewat tautan web di HP Android kelas bawah tanpa perangkat tambahan.
- Kamera sebagai sensor **bukan** keunggulan unik PULIHIN, karena Kaia, Hinge, dan Exer sudah memakainya. Klaim Uniqueness harus bertumpu pada bahasa, keluarga, konteks perangkat, dan jalur klinik di Indonesia.

> **Kalimat usulan:** "Teknologi kamera untuk latihan sudah dipakai produk global seperti Kaia, Hinge Health, dan Exer, tetapi semuanya berfokus pada nyeri otot dan sendi di pasar Amerika dan Eropa. Aplikasi afasia seperti Constant Therapy dan Tactus belum tersedia dalam Bahasa Indonesia. PULIHIN menggabungkan latihan gerak dan latihan bicara untuk pasien stroke Indonesia, dengan keluarga sebagai pendamping harian."

---

## 5. Kualitas teknologi (hanya fakta dari repo)

Sumber: README.md (bagian Arsitektur dan privasi, Keputusan teknis, Hasil uji) dan docs/algoritma.md. Semua angka di bagian ini **[Ukur internal]**, kecuali bila disebut lain.

**Arsitektur di perangkat**

- Pose memakai MediaPipe Pose Landmarker **Lite** (float16, model 5,8 MB). Model ini menghasilkan 33 landmark tubuh 3D dan dioptimalkan untuk aplikasi kebugaran real time di perangkat ([S22][s22]). Inferensi berjalan di browser dengan WASM dan GPU/CPU.
- Aset model disajikan dari domain sendiri dengan SHA-256 terkunci (`scripts/mediapipe-models.lock.json`).
- Penghitung repetisi adalah state machine sudut sendi BAWAH → NAIK → ATAS → TURUN dengan histeresis dan perataan 4 frame. Ada 5 aturan koreksi form (docs/algoritma.md Bagian 5–7).
- Sudut dihitung **hibrida 2D/3D** per latihan. Pada rekaman nyata dari depan, sudut 3D MediaPipe memampatkan fleksi siku (istirahat 22–29°, puncak hanya 101–115°), sehingga hitungan 3D murni menghasilkan **0 repetisi**; 2D bersih di titik ekstrem (2–20° dan 158–178°). Hibrida memakai 2D saat segmen tubuh sejajar bidang gambar (README.md, docs/algoritma.md Bagian 3 dan 13).
- Pemilih pasien utama dibuat karena anggota keluarga sering berdiri di belakang pasien. Pada video uji dengan manekin di latar, kandidat pertama MediaPipe adalah manekin pada **287/325** frame. Pemilih PULIHIN memilih orang yang benar pada **325/325** frame (docs/algoritma.md Bagian 13).

**Privasi yang dibuktikan, bukan hanya dijanjikan**

- Video tidak pernah meninggalkan perangkat. Hosting hanya berisi file statis, dan data tersimpan di IndexedDB lokal.
- **Telemetri diblokir.** Pustaka MediaPipe Tasks Vision mengirim log pemakaian ke `odml.pa.googleapis.com` setiap 60 detik dan tidak menyediakan opsi untuk mematikannya. PULIHIN memasang dua lapis penahan:
  - penjaga `fetch` lintas-origin sebelum modul lain dimuat (`src/lib/privasiJaringan.ts`, diuji);
  - header `Content-Security-Policy: connect-src 'self'` di produksi (`vercel.json`).
- Selama sesi kamera, tab Network hanya berisi aset PULIHIN sendiri (README.md, AC-F1-5).
- Catatan jujur suara: di Chrome, pengenalan suara Web Speech API memakai layanan berbasis server, dan audio dikirim ke layanan web ([S23][s23]). Karena itu tersedia Mode Latihan Mandiri tanpa pengenalan suara.

**Akurasi hitung repetisi**

- **Rekaman manusia nyata** (4 video stok berlisensi Pexels, hanya untuk uji internal; bukan HP target), latihan Tekuk Siku, mode hibrida (README.md, docs/algoritma.md Bagian 13, `src/features/pose/realVideo.test.ts`):
  - Hasilnya **14/14 repetisi**: 7/7 berdiri serong dan 7/7 duduk menghadap kamera.
  - Yang dihitung hanya repetisi yang dimulai setelah status Siap. Dua repetisi yang sudah berjalan sebelum Siap memang tidak dihitung, sesuai desain.
  - Tidak ada hitungan ganda dan tidak ada koreksi palsu.
- **Simulasi**: 50 repetisi × 3 latihan inti × 6 kondisi, termasuk derau, frame hilang, yaw 0–35°, dan 15/30 fps. Hasilnya **50/50 di semua 18 baris** (`src/features/pose/akurasi.test.ts`). Ini membuktikan logika hitung dan **bukan** pengganti uji perangkat.
- **Uji 50 repetisi di HP target** (AC-F1-2) **belum dilakukan**. Protokolnya ada di docs/algoritma.md Bagian 10.

**Kinerja: semua angka dari desktop atau emulasi desktop, bukan HP target**

- Desktop, Chrome 147, delegasi GPU, kamera palsu 24 fps: **24–25 fps** pemrosesan, inferensi **10–18 ms** (1–2 orang, tanpa pelambatan CPU; docs/algoritma.md Bagian 14.2).
- Emulasi dengan CPU diperlambat (docs/algoritma.md Bagian 14.2):
  - Dengan delegasi GPU, mode 1 orang bertahan **≥ 21 fps** sampai pelambatan CPU 6×. Pelambatan CPU tidak memperlambat GPU, jadi angka ini terlalu optimistis dibanding GPU ponsel murah.
  - Dengan delegasi CPU saja, pada pelambatan 4× ke atas hasilnya hanya **3–7 fps**. Ponsel tanpa delegasi GPU yang berfungsi kemungkinan tidak memenuhi target ≥ 15 fps.
- Waktu sampai kerangka pertama tampil (AC-F1-1, target < 500 ms, model sudah dihangatkan): **159–399 ms** dengan GPU pada CPU 1×–6× (lulus); dengan delegasi CPU paksa **446–592 ms** pada CPU 4× dan **564–982 ms** pada CPU 6× (**gagal**). Tanpa pemanasan model: **4.222 ms** (**gagal**; karena itu model dihangatkan di Detail Latihan) (docs/algoritma.md Bagian 14.3).
- Latensi koreksi (AC-F1-3, target < 700 ms setelah kondisi salah bertahan 0,5 s):
  - putar ulang tracker: median **141–296 ms** pada 12–30 fps;
  - live emulasi: maksimum **72 ms** (CPU 1×, GPU) sampai **1.135 ms** (CPU 6×, delegasi CPU). Kondisi terakhir **gagal** memenuhi target.

  Sumber: docs/algoritma.md Bagian 14.3.
- Halaman awal termuat dalam **1,7 s** pada emulasi Slow 4G dengan CPU 4× (README.md, checklist Bab 11).
- Mode jumlah orang adaptif: deteksi 2 orang otomatis turun ke 1 orang bila perangkat lambat (docs/algoritma.md Bagian 14.1).

**Siap dipindah ke Flutter**

- Definisi latihan (`exerciseDefinitions.ts`) dan bank kata (`wordBank.ts`) adalah objek TypeScript murni tanpa ketergantungan UI (README.md, spec Bab 4.2).

> **Kalimat usulan:** "Seluruh penilaian gerak berjalan di ponsel. Kami juga memblokir telemetri bawaan pustaka pose sehingga tidak ada data yang keluar selama sesi kamera. Pada rekaman manusia nyata, PULIHIN menghitung 14 dari 14 repetisi tekuk siku yang dimulai setelah status Siap, tanpa hitungan ganda. Angka kinerja yang kami laporkan masih berasal dari emulasi desktop. Uji di HP Android kelas bawah adalah langkah berikutnya, dan kami tidak menyebutnya selesai sebelum dilakukan."

---

## 6. Batasan dan etika

- **Prototype, bukan alat kesehatan teregulasi.** PULIHIN tidak memberi diagnosis, prognosis, atau klaim kesembuhan. Semua skor diberi label "bukan alat diagnosis" (README.md, spec Bab 17.2). Kemenkes telah menetapkan *Pedoman Izin Edar Alat Kesehatan Berbasis Perangkat Lunak* (KMK HK.01.07/MENKES/951/2026, ditetapkan 7 Sep 2026) ([S24][s24]). Sebelum dipakai di layanan klinis, status regulasi PULIHIN harus dikaji terhadap pedoman ini. Tim belum menentukan klasifikasinya.
- **Uji perangkat belum dilakukan.** Ada tiga uji yang masih tertunda:
  - akurasi 50 repetisi (AC-F1-2);
  - frame rate di HP Android kelas bawah (AC-F1-4);
  - pengenalan suara nyata (AC-F3-2).

  Semua angka kinerja di Bagian 5 berasal dari desktop atau emulasi (README.md, laporan serah terima).
- **Data demo saja.** Tidak ada data pasien asli. Semua profil bernama samaran dan berlabel Demo (README.md).
- **Privasi.**
  - Video diproses di perangkat. Data disimpan lokal dan dapat dihapus total lewat "Hapus Semua Data Lokal".
  - Audio afasia pada Chrome diproses layanan cloud penyedia browser ([S23][s23]), sehingga tersedia mode tanpa pengenalan suara.
  - Data kesehatan dan biometrik termasuk data pribadi spesifik menurut UU 27/2022 ([S14][s14]). Versi dengan akun dan sinkronisasi harus memenuhi kewajiban pengendali data.
- **Keselamatan.** Peringatan keselamatan tampil sebelum setiap sesi gerak. Latihan berdiri mensyaratkan pasien berpegangan. Gait dan keseimbangan bebas berada di luar cakupan (spec Bab 17.2 dan 17.5).
- **Belum ada bukti klinis.** Literatur kepatuhan di Bagian 1.3 menjelaskan masalahnya, tetapi tidak membuktikan bahwa PULIHIN menaikkan kepatuhan. Bukti itu baru bisa diperoleh lewat uji bersama klinisi.

---

## 7. Rencana lanjutan

1. **Uji perangkat bersama klinisi.**
   - Jalankan protokol 50 repetisi dan ukur fps di HP Android kelas bawah acuan (docs/algoritma.md Bagian 10).
   - Uji pengenalan suara `id-ID` pada penutur nyata.
   - Lanjutkan dengan uji kegunaan kecil bersama terapis dan keluarga di satu klinik mitra. Ini menjadi dasar validasi hipotesis langganan di Bagian 3.3.
2. **Autentikasi dan sinkronisasi.** Saat ini peran disimpan lokal tanpa login (spec Bab 9.2). Pekerjaan berikutnya:
   - akun pasien, keluarga, dan terapis;
   - persetujuan (consent) eksplisit;
   - sinkronisasi resep antara terapis dan pasien yang sesuai UU 27/2022 ([S14][s14]).
3. **Port ke Flutter.** Pindahkan logika pose dan bank kata yang sudah berupa data ke aplikasi native Android. Tujuannya akses kamera, notifikasi pengingat, dan kinerja yang lebih stabil di HP kelas bawah (spec Bab 4.2).
4. **Pengenalan suara lokal.** MDN mendokumentasikan properti `SpeechRecognition.processLocally` untuk pengenalan di perangkat ([S23][s23]). Dukungan untuk `id-ID` belum diperiksa dan harus diuji sebelum dijanjikan.
5. **Kajian regulasi.** Petakan fitur PULIHIN terhadap pedoman izin edar alat kesehatan berbasis perangkat lunak ([S24][s24]) sebelum pemakaian klinis.

---

## Daftar sumber

Semua diakses 13 Oktober 2026.

| Kode | Sumber |
|---|---|
| S1 | Badan Kebijakan Pembangunan Kesehatan, Kemenkes RI. *Survei Kesehatan Indonesia (SKI) 2023 dalam Angka.* Tabel 7.46–7.48 (hlm. 276–278), 8.6 (hlm. 293), 8.19 (hlm. 315), 8.20 (hlm. 316). [PDF][s1] |
| S2 | Kemenkes RI. *Potret Kesehatan Indonesia dari Riskesdas 2018*, rilis 2 Nov 2018. [Tautan][s2] |
| S3 | Kemenkes RI. *Cegah Stroke dengan Aktivitas Fisik*, rilis 25 Okt 2024. [Tautan][s3] |
| S4 | Kemenkes RI. *SeGeRa Ke RS Untuk Cegah Faktor Risiko Stroke*, rilis 27 Okt 2023. [Tautan][s4] |
| S5 | WHO. *Rehabilitation* (fact sheet), 22 Apr 2024. [Tautan][s5] |
| S6 | Flowers HL dkk. Poststroke Aphasia Frequency, Recovery, and Outcomes: A Systematic Review and Meta-Analysis. *Arch Phys Med Rehabil.* 2016;97(12):2188–2201. PMID 27063364. [PubMed][s6] |
| S7 | Miller KK dkk. Exercise after Stroke: Patient Adherence and Beliefs after Discharge from Rehabilitation. *Top Stroke Rehabil.* 2017;24(2):142–148. PMID 27334684. [PubMed][s7] |
| S8 | Jurkiewicz MT, Marzolini S, Oh P. Adherence to a home-based exercise program for individuals after stroke. *Top Stroke Rehabil.* 2011;18(3):277–284. PMID 21642065. [PubMed][s8] |
| S9 | Gwynne-Mayer N dkk. Adherence to exercise rehabilitation programmes in stroke survivors: a scoping review. *BMJ Open Sport Exerc Med.* 2025;11(3):e002102. PMID 41098374. [PubMed][s9] |
| S10 | Kemenkes RI. *Profil Kesehatan Indonesia 2023*. Hlm. 21 (puskesmas), 42 (rumah sakit), 68 (daerah tertinggal); Lampiran 2.a (penduduk), 12.b (STR baru), 14.a–14.c (tenaga keterapian fisik, sumber SISDMK). [PDF][s10] |
| S11 | Muhrodji P dkk. Roles and Problems of Stroke Caregivers: A Qualitative Study in Yogyakarta, Indonesia. *F1000Research* 2021;10:380. doi:10.12688/f1000research.52135.2, PMID 35186263. [PMC][s11] |
| S12 | BPS. *Statistik Telekomunikasi Indonesia 2024* (abstraksi), rilis 29 Agu 2025. [Tautan][s12] |
| S13 | StatCounter Global Stats. *Mobile Operating System Market Share Indonesia*, September 2026. [Tautan][s13] |
| S14 | UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, Pasal 4. JDIH BPK. [PDF][s14] |
| S15 | Kaia Health. *Kaia Health Joins Sword Health*, siaran pers 28 Jan 2026. [Tautan][s15] |
| S16 | Hinge Health. *TrueMotion technology* (halaman produk). [Tautan][s16] |
| S17 | Kaia Health. *Motion Coach™*. [Tautan][s17] |
| S18 | Exer Labs. *Exer Health: AI-Assisted Remote MSK Care in the Home*. [Tautan][s18] |
| S19 | Neofect. *Smart Glove*. [Tautan][s19] |
| S20 | Constant Therapy Health. *Constant Therapy: How it Works*. [Tautan][s20] |
| S21 | Tactus Therapy. *Speech Therapy Apps for Adults*. [Tautan][s21] |
| S22 | Google AI Edge. *MediaPipe Pose landmarker guide*. [Tautan][s22] |
| S23 | MDN Web Docs. *SpeechRecognition*. [Tautan][s23] |
| S24 | JDIH Kemenkes. KMK No. HK.01.07/MENKES/951/2026 tentang Pedoman Izin Edar Alat Kesehatan Berbasis Perangkat Lunak. [Tautan][s24] |

Sumber internal (repo): `README.md`, `docs/algoritma.md`, `docs/spec.md`, `src/features/speech/wordBank.ts`, `src/features/speech/SpeechScorer.ts`, `src/features/adherence/redFlags.ts`.

[s1]: https://kemkes.go.id/app_asset/file_content_download/17169067256655eae5553985.98376730.pdf
[s2]: https://kemkes.go.id/id/potret-sehat-indonesia-riskesdas-2018
[s3]: https://kemkes.go.id/id/cegah-stroke-dengan-aktivitas-fisik
[s4]: https://kemkes.go.id/id/segera-ke-rs-untuk-cegah-faktor-risiko-stroke
[s5]: https://www.who.int/news-room/fact-sheets/detail/rehabilitation
[s6]: https://pubmed.ncbi.nlm.nih.gov/27063364/
[s7]: https://pubmed.ncbi.nlm.nih.gov/27334684/
[s8]: https://pubmed.ncbi.nlm.nih.gov/21642065/
[s9]: https://pubmed.ncbi.nlm.nih.gov/41098374/
[s10]: https://kemkes.go.id/app_asset/file_content_download/172231123666a86244b83fd8.51637104.pdf
[s11]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8822138/
[s12]: https://www.bps.go.id/id/publication/2025/08/29/beaa2be400eda6ce6c636ef8/statistik-telekomunikasi-indonesia-2024.html
[s13]: https://gs.statcounter.com/os-market-share/mobile/indonesia
[s14]: https://peraturan.bpk.go.id/Home/Download/224884/UU%20Nomor%2027%20Tahun%202022.pdf
[s15]: https://kaiahealth.com/newsroom/press-releases/kaia-health-joins-sword-health/
[s16]: https://www.hingehealth.com/product/precision-motion-technology/
[s17]: https://kaiahealth.com/motion-coach/
[s18]: https://www.exer.ai/product/health
[s19]: https://www.neofect.com/us/smart-glove
[s20]: https://constanttherapyhealth.com/constant-therapy/
[s21]: https://tactustherapy.com/apps
[s22]: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
[s23]: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
[s24]: https://jdih.kemkes.go.id/documents/keputusan-menteri-kesehatan-republik-indonesia-nomor-hk0107menkes9512026
