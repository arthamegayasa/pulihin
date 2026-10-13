# Daftar Shot dan Checklist Hari Perekaman

Acuan: Bab 11.1, 14, 15, 16 spesifikasi. Tabel bertanda OTOMATIS dibuat dari `video/src/timeline.ts` oleh `npm run srt` (di folder `video/`); jangan disunting manual, ubah `timeline.ts`.

## Siapa dan di mana

| Peran | Isi |
|---|---|
| Dokter / narasumber klinis (di kamera) | [DIISI: nama dan gelar yang tampil di layar] |
| Narator voice-over | [DIISI: dokter yang sama atau anggota tim] |
| Pemeran pasien demo ("Pak Budi, 58 tahun", nama samaran) | [DIISI: relawan sehat atau anggota tim] |
| Pemeran caregiver (bila tampil) | [DIISI: pemeran atau anggota tim] |
| Lokasi | [DIISI: ruangan dengan cahaya dari depan dan latar bersih] |
| Ponsel uji (sama dengan perangkat uji Bab 11) | [DIISI: model] · Chrome [DIISI: versi] |

## Checklist hari perekaman (Bab 16.2)

- [ ] Talking head pembuka dokter, 3 kali pengambilan (`dokter-pembuka.mp4`).
- [ ] Talking head penutup dokter dengan ponsel di tangan, 3 kali pengambilan (`dokter-penutup.mp4`).
- [ ] Shot lebar pemeran dan ponsel di tripod, latihan duduk (`kamera-sesi-lebar.mp4`) dan, sebagai cadangan, satu latihan berdiri.
- [ ] Rekaman layar penuh: Beranda, satu sesi gerak utuh, ringkasan, afasia 3 kata, halaman keluarga (berkas `layar-01` sampai `layar-05`, plus `layar-06`).
- [ ] Rekaman layar cadangan tanpa suara untuk menutup potongan yang gagal (simpan dengan akhiran `-cadangan.mp4`, tidak dipakai otomatis).
- [ ] Foto tangkapan layar bersih lima layar untuk paper (Bab 13.2): Beranda, Sesi Kamera dengan skeleton, Ringkasan Sesi, Latihan Kata Afasia, Untuk Keluarga dengan grafik.
- [ ] B-roll kertas program di meja dan pemeran yang ragu (`broll-kertas-program.mp4`, `broll-pemeran-ragu.mp4`).
- [ ] Narasi voice-over direkam (per adegan `public/audio/<id-adegan>.mp3` atau satu berkas `narasi-lengkap.mp3`), dibaca dari `naskah-id.md`.
- [ ] Formulir persetujuan semua pemeran sudah ditandatangani (lihat bagian Persetujuan pemeran).

### Sebelum kamera menyala

- [ ] Ponsel uji: baterai di atas 80%, penyimpanan kosong minimal 5 GB.
- [ ] Mode **Jangan Ganggu** aktif di semua ponsel yang merekam atau terekam (Bab 14.3). Hapus semua notifikasi di bilah status.
- [ ] Tidak ada nomor telepon, email pribadi, kontak, atau foto pribadi yang mungkin muncul di layar.
- [ ] Buka aplikasi di `pulihinapp.id/app` (disarankan dari ikon PWA yang terpasang agar tampil layar penuh tanpa bilah alamat).
- [ ] Pengaturan → **Ekspor JSON** data lokal sebagai cadangan, lalu **Reset Data Demo** ke skenario bawaan (ada red flag "Minggu ini sempat 3 hari berturut-turut tanpa latihan"). Ulangi reset sebelum setiap pengambilan ulang alur penuh.
- [ ] Peran aktif: pasien Pak Budi; Beranda menampilkan **Latihan Hari Ini** dengan Tekuk Siku sebagai latihan pertama yang belum selesai.
- [ ] Suara aplikasi aktif dan volume media ponsel cukup keras (pesan koreksi diucapkan aplikasi).
- [ ] Jangan memakai mode pesawat saat merekam Latihan Bicara: pada sebagian browser pengenalan suara memakai layanan cloud penyedia browser (Bab 17.3).

## Penataan ponsel dan tripod (Bab 11.1)

- **Latihan duduk (Tekuk Siku, latihan utama video):** jarak pemeran ke ponsel **0,8 sampai 1,2 meter**. Ponsel tegak di tripod atau tumpukan buku yang stabil di meja, kamera depan kira-kira setinggi dada pemeran, seluruh tubuh bagian atas dan kedua lengan masuk bingkai.
- **Latihan berdiri (cadangan):** jarak **1,5 sampai 2,5 meter**, pemeran berpegangan pada kursi atau meja yang stabil sesuai peringatan di aplikasi.
- **Cahaya dari depan:** jendela atau lampu di depan pemeran (di belakang ponsel), jangan membelakangi jendela. Tambah lampu LED/ring light dari depan bila ruangan redup.
- **Latar bersih:** dinding polos, tanpa dokumen, foto keluarga, atau benda yang mengganggu. Pakaian pemeran kontras dengan latar; lengan tidak tertutup lengan baju yang longgar.
- **Kamera shot lebar (perangkat kedua):** mendatar 16:9, 1920x1080, 30 fps, di tripod, kunci fokus dan eksposur. Bingkai memuat pemeran dan ponsel di meja. Sisakan ruang kosong di atas kepala karena kartu teks pendek tampil di kiri atas. Tepuk tangan sekali di depan kedua kamera saat mulai, untuk sinkron dengan rekaman layar.
- **Talking head dokter:** mendatar 1920x1080, 30 fps, lensa setinggi mata. Dokter duduk sedikit ke kanan dari tengah; sepertiga kiri bingkai dibiarkan lapang karena judul, lower third, dan subtitle tampil di kiri. Pakai mikrofon lav (klip) bila ada; ruangan tenang, kipas dan AC dimatikan saat bicara.
- Kamera disarankan merekam H.264 MP4 (setelan "kompatibilitas tinggi" atau sejenis) agar mudah diproses.

## Setelan rekaman layar (perekam bawaan Android)

- Pakai perekam layar bawaan Android dari Setelan Cepat (nama menu berbeda per merek, misalnya "Perekam layar" atau "Screen recorder").
- Resolusi **1080x2400** (pilih resolusi tertinggi/1080p), 30 fps, orientasi tegak. Rasio lain tetap aman: komposisi menampilkan rekaman di bingkai ponsel tanpa ditarik (letterbox).
- Audio: **suara media/internal saja** agar suara koreksi aplikasi terekam; mikrofon dimatikan.
- Opsi "tampilkan sentuhan di layar" boleh diaktifkan untuk adegan navigasi (Beranda, ketuk Tekuk Siku, Salin Ringkasan Mingguan).
- Tanpa notifikasi: Jangan Ganggu aktif, bilah status bersih.
- Rekam setiap berkas dalam satu pengambilan utuh sesuai tabel; potong awal/akhir cukup lewat `mulaiDi` di `timeline.ts`, tidak perlu menyunting berkas.

## Berkas rekaman yang diharapkan di `video/public/footage/`

Nama berkas harus persis. Slot yang belum ada tampil sebagai kartu PLACEHOLDER pada draf. Setelah menyalin berkas, jalankan `npm run scan`.

<!-- OTOMATIS:BERKAS -->
| Berkas di `video/public/footage/` | Jenis | Dipakai di | Durasi minimal | Isi rekaman |
|---|---|---|---|---|
| `dokter-pembuka.mp4` | Kamera 1920x1080, mendatar, direkam manusia | 0:00–0:12, 0:12–0:19 | 20 dtk | Talking head dokter, ruang terang, cahaya dari depan. Dokter duduk sedikit kanan dari tengah, sepertiga kiri bingkai kosong untuk judul. Ucapkan baris N01 lalu N02 dalam satu pengambilan. |
| `broll-kertas-program.mp4` | Kamera 1920x1080, mendatar, direkam manusia | 0:19–0:24 | 6 dtk | Close-up tangan pemeran meletakkan kertas program latihan di meja rumah. Tanpa nama atau data asli di kertas. |
| `broll-pemeran-ragu.mp4` | Kamera 1920x1080, mendatar, direkam manusia | 0:24–0:30 | 7 dtk | Pemeran duduk di kursi memegang kertas program, tampak ragu mencoba gerakan. Wajah boleh tampak, tanpa dialog. |
| `layar-01-beranda-detail.mp4` | Rekaman layar ponsel 1080x2400, tegak · draf: `npm run rekam-layar` | 0:30–0:40, 0:40–0:50 | 21 dtk | Beranda Pak Budi sebelum latihan (Latihan Hari Ini, 0 dari 4 latihan selesai) ±8,5 dtk, ketuk Tekuk Siku, Detail Latihan (contoh gerakan, Posisi dan Target, "Berhenti bila nyeri, pusing, atau sesak", tombol Mulai dengan Kamera), lalu gulir pelan ke kartu Utamakan keselamatan. |
| `kamera-sesi-lebar.mp4` | Kamera 1920x1080, mendatar, direkam manusia | 0:50–1:02, 1:30–1:44 | 55 dtk | Shot lebar 16:9: pemeran duduk di kursi, ponsel di tripod di meja 0,8-1,2 m. Rekam bersamaan dengan layar-02, awali dengan tepukan tangan untuk sinkron. |
| `layar-02-sesi-tekuk-siku.mp4` | Rekaman layar ponsel 1080x2400, tegak | 0:50–1:02, 1:02–1:16, 1:16–1:30, 1:30–1:44, 1:44–1:58, 1:58–2:10 | 81 dtk | Sesi Tekuk Siku utuh dengan kamera: gerakan mengikuti irama di Detail Latihan (±3 dtk per gerakan) plus jeda singkat, ±5 dtk per repetisi (5/10 sekitar detik ke-30): skeleton, hitungan naik sampai 10/10, satu koreksi "Rilekskan bahu, turunkan bahu Anda" yang muncul alami sekitar repetisi ke-7. Suara internal aplikasi ikut direkam. |
| `layar-03-ringkasan-beranda.mp4` | Rekaman layar ponsel 1080x2400, tegak · draf: `npm run rekam-layar` | 2:10–2:30, 2:30–2:42, 2:42–3:00 | 51 dtk | Ringkasan Sesi Tekuk Siku hari ini ("Hebat, target latihan tercapai!", skor dan label, Repetisi 10/10, Durasi) ±12 dtk, gulir ke Rincian skor dan Saran untuk sesi berikutnya, lalu ke kalimat bukan diagnosis dan tombol Kembali ke Beranda; ketuk, Beranda menampilkan Tekuk Siku sudah selesai. |
| `layar-04-keluarga.mp4` | Rekaman layar ponsel 1080x2400, tegak · draf: `npm run rekam-layar` | 3:00–3:15, 3:15–3:30 | 31 dtk | Untuk Keluarga setelah sesi hari ini: kartu "Minggu ini sempat 3 hari berturut-turut tanpa latihan", status "Sudah latihan hari ini", gulir ke grafik Sesi terjadwal 7 hari terakhir, lalu Skor latihan 14 hari, ketuk Salin Ringkasan Mingguan sampai pesan "Ringkasan disalin" tampil. |
| `layar-05-afasia.mp4` | Rekaman layar ponsel 1080x2400, tegak · draf: `npm run rekam-layar` | 3:30–3:42, 3:42–4:00 | 31 dtk | Latihan Bicara: pilih kategori Benda di Rumah, kata dan gambar besar, ketuk Dengar, pemeran menyebut kata, hasil "Benar!" tampil, lalu Kata Berikutnya. Final: Mode Suara dengan pengenal suara di ponsel (tampil "Terdengar: ..."). Draf otomatis memakai Mode Latihan Mandiri (Sudah Benar). |
| `kamera-afasia-lebar.mp4` | Kamera 1920x1080, mendatar, direkam manusia | 3:42–4:00 | 19 dtk | Shot lebar 16:9: pemeran menyebutkan kata ke arah ponsel. Rekam bersamaan dengan layar-05, awali tepukan tangan. |
| `layar-06-klinisi.mp4` | Rekaman layar desktop 1920x1080 · draf: `npm run rekam-layar` | 4:00–4:12, 4:12–4:25 | 26 dtk | Desktop 1920x1080: Dashboard Terapis, buka Pak Budi (Progres latihan: Kepatuhan 7 hari terakhir), Pustaka latihan > Tambah Luruskan Tungkai, Simpan Resep sampai pesan tersimpan, lalu Lihat sebagai pasien: Beranda Pak Budi memuat Luruskan Tungkai. |
| `dokter-penutup.mp4` | Kamera 1920x1080, mendatar, direkam manusia | 4:25–4:50 | 26 dtk | Talking head dokter memegang ponsel dengan aplikasi PULIHIN terbuka di Beranda. Ucapkan N22a dan N22b. Tiga kali pengambilan. |
<!-- /OTOMATIS:BERKAS -->

## Shot per adegan

Kolom "@N" = detik di dalam berkas tempat adegan mulai diambil (`mulaiDi`). Sesuaikan di `timeline.ts` setelah melihat rekaman.

<!-- OTOMATIS:SHOT -->
| Waktu | Adegan | Tata letak | Rekaman (diambil mulai detik ke-) | Yang harus terlihat |
|---|---|---|---|---|
| 0:00–0:12 | Pembuka dokter dan judul | Talking head dokter + judul | `dokter-pembuka.mp4` @0 | Wajah dokter, lower third nama dan gelar, judul PULIHIN: Pendamping Rehabilitasi Stroke di Rumah. |
| 0:12–0:19 | Dokter: program di atas kertas | Talking head dokter | `dokter-pembuka.mp4` @12 | Wajah dokter yang melanjutkan penjelasan. |
| 0:19–0:24 | B-roll: kertas program di meja | B-roll penuh layar + kalimat kunci | `broll-kertas-program.mp4` @0 | Kertas program latihan diletakkan di meja rumah, dengan kalimat kunci di sampingnya. |
| 0:24–0:30 | B-roll: pemeran kebingungan, kalimat masalah | B-roll penuh layar + kalimat kunci | `broll-pemeran-ragu.mp4` @0 | Pemeran tampak ragu memegang kertas program; kalimat masalah tampil besar. |
| 0:30–0:40 | Beranda: Latihan Hari Ini | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-01-beranda-detail.mp4` @0 | Beranda Pak Budi (Demo): "Selamat pagi, Pak Budi", pengingat jadwal latihan gerak, Latihan Hari Ini berhuruf besar (0 dari 4 latihan selesai), tombol Mulai: Tekuk Siku. |
| 0:40–0:50 | Detail Latihan: Tekuk Siku | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-01-beranda-detail.mp4` @10 | Ketuk Tekuk Siku; Detail Latihan dengan contoh gerakan bergerak, Posisi dan Target, pesan "Berhenti bila nyeri, pusing, atau sesak" tepat di atas tombol Mulai dengan Kamera, lalu gulir ke kartu Utamakan keselamatan. |
| 0:50–1:02 | Shot lebar: ponsel di meja, pemeran duduk | Shot lebar pemeran + rekaman layar dalam bingkai ponsel | `kamera-sesi-lebar.mp4` @0 + `layar-02-sesi-tekuk-siku.mp4` @0 | Pemeran duduk di depan ponsel bertripod; di bingkai ponsel tampil skeleton dan hitungan awal sesi. |
| 1:02–1:16 | Sesi kamera: sudut siku dan skeleton | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-02-sesi-tekuk-siku.mp4` @12 | Skeleton mengikuti lengan pemeran, sudut siku tampil, hitungan bertambah setelah satu siklus tekuk-luruskan. |
| 1:16–1:30 | Sesi kamera: 5 / 10 | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-02-sesi-tekuk-siku.mp4` @26 | Hitungan besar 5 / 10 dengan skeleton di atas video kamera. |
| 1:30–1:44 | Koreksi form: bahu terangkat | Shot lebar pemeran + rekaman layar dalam bingkai ponsel | `kamera-sesi-lebar.mp4` @40 + `layar-02-sesi-tekuk-siku.mp4` @40 | Pemeran mengangkat bahu secara alami; pesan koreksi "Rilekskan bahu, turunkan bahu Anda" muncul di atas skeleton dan terdengar suara aplikasi. |
| 1:44–1:58 | Pemeran memperbaiki, hitungan berlanjut | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-02-sesi-tekuk-siku.mp4` @54 | Pesan koreksi hilang setelah bahu turun; hitungan repetisi bertambah lagi. |
| 1:58–2:10 | Sesi berlanjut sampai 10 / 10 | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-02-sesi-tekuk-siku.mp4` @68 | Hitungan naik sampai 10 / 10 dan sesi berakhir. |
| 2:10–2:30 | Ringkasan Sesi: skor | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-03-ringkasan-beranda.mp4` @0 | Ringkasan Sesi "Hebat, target latihan tercapai!": angka skor dengan label, Repetisi 10 / 10, Durasi; lalu gulir ke Rincian skor (Jumlah gerakan, Rentang gerak, Irama gerakan, masing-masing dengan label). |
| 2:30–2:42 | Ringkasan Sesi: saran dan kalimat bukan diagnosis | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-03-ringkasan-beranda.mp4` @20 | Gulir ke kartu Saran untuk sesi berikutnya dan kalimat "Skor ini adalah skor latihan untuk motivasi dan pemantauan, bukan skor klinis dan bukan alat ukur diagnosis", di atas tombol Kembali ke Beranda. |
| 2:42–3:00 | Kembali ke Beranda: latihan selesai | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-03-ringkasan-beranda.mp4` @32 | Ketuk Kembali ke Beranda; Tekuk Siku bertanda "Selesai, skor 94", 1 dari 4 latihan selesai, 1 hari beruntun; tombol Untuk Keluarga terlihat. |
| 3:00–3:15 | Untuk Keluarga: tanda, status, grafik 7 hari | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-04-keluarga.mp4` @0 | Kartu "Perlu perhatian: Minggu ini sempat 3 hari berturut-turut tanpa latihan", status "Sudah latihan hari ini", lalu gulir ke grafik Sesi terjadwal 7 hari terakhir (7 dari 14, 50%). |
| 3:15–3:30 | Untuk Keluarga: tren skor dan salin ringkasan | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-04-keluarga.mp4` @15 | Grafik Skor latihan 14 hari (gerak dan bicara), lalu ketuk Salin Ringkasan Mingguan; pesan "Ringkasan disalin. Tempel di WhatsApp untuk terapis." tampil. |
| 3:30–3:42 | Latihan Bicara: kata dan gambar | Rekaman layar dalam bingkai ponsel + kalimat kunci | `layar-05-afasia.mp4` @0 | Latihan Bicara dengan pilihan kategori; pilih Benda di Rumah; satu kata dengan gambar besar dan tombol Dengar. |
| 3:42–4:00 | Pemeran menyebut kata, hasil Benar | Shot lebar pemeran + rekaman layar dalam bingkai ponsel | `kamera-afasia-lebar.mp4` @0 + `layar-05-afasia.mp4` @12 | Pemeran menyebut kata; layar menampilkan "Benar! Hebat, langsung tepat." lalu Kata Berikutnya. |
| 4:00–4:12 | Dashboard Terapis: progres pasien | Rekaman layar desktop dalam bingkai peramban + kalimat kunci | `layar-06-klinisi.mp4` @0 | Dashboard Terapis (label Prototype, Demo) dengan Pak Budi paling atas, lalu halaman Pak Budi: grafik Kepatuhan 7 hari terakhir dan Resep Program; di Pustaka latihan, Tambah Luruskan Tungkai. |
| 4:12–4:25 | Resep program menjadi Latihan Hari Ini | Rekaman layar desktop dalam bingkai peramban + kalimat kunci | `layar-06-klinisi.mp4` @12 | Simpan Resep diketuk dan pesan "Resep Pak Budi tersimpan" tampil; Lihat sebagai pasien membuka Beranda Pak Budi yang kini memuat Luruskan Tungkai (1 dari 5 latihan selesai). |
| 4:25–4:50 | Penutup dokter dengan ponsel di tangan | Talking head dokter | `dokter-penutup.mp4` @0 | Wajah dokter memegang ponsel berisi aplikasi; kartu pulihinapp.id dan penafian prototype. |
| 4:50–4:58 | Layar penutup | Layar penutup statis | (dibuat di Remotion) | PULIHIN · pulihinapp.id · Health and Wellbeing, .id Developer Day Indonesia 2026 (baris Tim tampil setelah namaTim diisi di src/config/identitas.ts) |
<!-- /OTOMATIS:SHOT -->

Catatan adegan koreksi (1:30–2:10): adegan terpenting sesudah pembuka. Rekam beberapa kali sampai pesan "Rilekskan bahu, turunkan bahu Anda" muncul secara alami dari gerakan pemeran yang mengangkat bahu. **Jangan menempelkan teks koreksi palsu saat menyunting** (Bab 15). Label penunjuk di video hanya berada di samping ponsel, tidak pernah di atas layar aplikasi.

## Rencana cadangan (Bab 16.2)

- **Pose estimation gagal karena cahaya:** pindahkan ponsel lebih dekat (tetap 0,8–1,2 m untuk duduk), tambah lampu dari depan, dan gunakan latihan duduk nomor 2, **Tekuk Siku**, sebagai latihan utama (paling toleran terhadap cahaya dan ruang sempit).
- **Koreksi tidak muncul:** ulangi pengambilan; pemeran mengangkat bahu lebih jelas dan pelan. Jangan mengganti dengan teks tempelan.
- **Data demo berubah atau rusak:** Pengaturan → Reset Data Demo, atau impor JSON yang diekspor sebelum merekam.
- **Pengenalan kata gagal (bising/jaringan):** pindah ke ruangan lebih tenang, pastikan ada koneksi, ulangi. Mode cadangan boleh direkam sebagai bukti tambahan, tetapi momen "Benar" di 3:30–4:00 harus berasal dari hasil penilaian asli.
- **Potongan gagal di tengah:** tutup dengan rekaman layar cadangan tanpa suara.
- **Dashboard Terapis (P1) tidak dipakai:** ubah `ADEGAN_TERAPIS` di `video/src/timeline.ts` menjadi `'streak'`, rekam `layar-06-streak.mp4`, lalu jalankan `npm run srt`.
- **Tidak sempat merekam layar ponsel:** `npm run rekam-layar` (di `video/`) membuat rekaman layar asli aplikasi untuk Beranda/Detail, Ringkasan, Untuk Keluarga, Latihan Bicara (Mode Latihan Mandiri), dan Dashboard Terapis. Sesi kamera (`layar-02`) dan semua rekaman kamera tetap wajib direkam manusia.

## Persetujuan pemeran

Setiap orang yang tampil (dokter, pemeran pasien, pemeran caregiver) menandatangani persetujuan tertulis sebelum direkam. Isi minimal:

> Saya, [nama], bersedia direkam sebagai [peran] untuk video demo prototype PULIHIN. Saya memahami bahwa video akan diunggah ke YouTube sebagai unlisted, dikirim ke panitia .id Developer Day Indonesia 2026, dan dapat dipakai di paper lomba. Bila saya memerankan pasien, saya bukan pasien sungguhan dan video akan memberi label "Peragaan oleh pemeran". Tidak ada data kesehatan saya yang dikumpulkan. Saya dapat menarik persetujuan sebelum video dikirim dengan menghubungi [DIISI: kontak tim]. Tanda tangan, tanggal.

- Pemeran pasien adalah relawan sehat atau anggota tim; jangan menyebut pemeran sebagai pasien asli.
- Jangan merekam anak-anak atau orang yang tidak menandatangani persetujuan.
- Simpan formulir di luar repo (berisi data pribadi).

## Audit jeda 30 detik (Bab 14.2)

Setiap rentang 30 detik wajib memiliki minimal satu momen yang tetap dapat dipahami bila video dijeda. Cara audit: setelah rekaman dimasukkan, jalankan `npm run still` (merender still di setiap momen ke `video/out/stills/`), buka setiap PNG, lalu ulangi dengan menjeda MP4 final di pemutar pada detik yang sama. Bila jeda menghasilkan layar kosong, layar memuat, atau menu yang membingungkan, geser `mulaiDi` atau ganti potongan.

<!-- OTOMATIS:AUDIT -->
| Jendela | Jeda di | Adegan | Yang harus terlihat saat dijeda | Still (`video/out/stills/`) | Lolos |
|---|---|---|---|---|---|
| 0:00–0:30 | 0:06 | Pembuka dokter dan judul | Wajah dokter dengan judul PULIHIN dan nama dokter | `t006-s01-pembuka.png` | [ ] |
| 0:00–0:30 | 0:28 | B-roll: pemeran kebingungan, kalimat masalah | Kalimat masalah "Di rumah, pendampingan terputus" di layar | `t028-s04-masalah.png` | [ ] |
| 0:30–1:00 | 0:57 | Shot lebar: ponsel di meja, pemeran duduk | Skeleton dan hitungan awal di layar ponsel, pemeran duduk di depan ponsel | `t057-s07-posisi.png` | [ ] |
| 1:00–1:30 | 1:20 | Sesi kamera: 5 / 10 | Hitungan "5 / 10" dengan skeleton | `t080-s09-lima.png` | [ ] |
| 1:30–2:00 | 1:36 | Koreksi form: bahu terangkat | Pesan koreksi "Rilekskan bahu, turunkan bahu Anda" di atas skeleton | `t096-s10-koreksi.png` | [ ] |
| 2:00–2:30 | 2:20 | Ringkasan Sesi: skor | Skor sesi dengan label, repetisi, dan durasi | `t140-s13-ringkasan.png` | [ ] |
| 2:30–3:00 | 2:50 | Kembali ke Beranda: latihan selesai | Beranda: Tekuk Siku "Selesai" beserta angka skornya | `t170-s15-tercatat.png` | [ ] |
| 3:00–3:30 | 3:10 | Untuk Keluarga: tanda, status, grafik 7 hari | Grafik Sesi terjadwal 7 hari terakhir di halaman Untuk Keluarga | `t190-s16-keluarga.png` | [ ] |
| 3:30–4:00 | 3:55 | Pemeran menyebut kata, hasil Benar | Kata yang dinilai "Benar!" di Latihan Bicara | `t235-s19-sebut.png` | [ ] |
| 4:00–4:30 | 4:06 | Dashboard Terapis: progres pasien | Grafik Kepatuhan 7 hari terakhir pada halaman Pak Budi di Dashboard Terapis | `t246-s20-terapis.png` | [ ] |
| 4:30–4:58 | 4:40 | Penutup dokter dengan ponsel di tangan | Wajah dokter dengan ponsel di tangan dan kartu pulihinapp.id | `t280-s22-penutup-dokter.png` | [ ] |
| 4:30–4:58 | 4:54 | Layar penutup | Layar penutup: PULIHIN, pulihinapp.id, Health and Wellbeing, nama tim (bila diisi) | `t294-s23-layar-penutup.png` | [ ] |
<!-- /OTOMATIS:AUDIT -->
