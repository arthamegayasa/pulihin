# Produksi 3D video PULIHIN (tanpa rekaman manusia)

Pemeran pasien di video adalah **karakter 3D bergaya patung tanah liat**, "Pak Budi" (nama samaran,
bukan orang sungguhan), dibuat di Blender. Label wajib setiap kali karakter tampil:
**"Peragaan dengan karakter 3D, bukan pasien sungguhan"**.

Isi layar ponsel di semua shot berasal dari aplikasi produksi https://pulihin.vercel.app yang benar-benar
berjalan. Pada sesi Tekuk Siku, aplikasi memproses render 3D dari kamera palsu Chrome: status Siap,
hitungan, dan pesan koreksi muncul karena MediaPipe di aplikasi mendeteksi karakter 3D itu, tidak ditempel
saat menyunting.

## Alat

| Alat | Versi | Lokasi |
|---|---|---|
| Blender (portable, tanpa admin) | 5.2.2 LTS | `D:/Tools/blender/blender.exe`, konfigurasi di `D:/Tools/blender/portable/` |
| MPFB (MakeHuman for Blender) | 2.0.18 dari extensions.blender.org | `blender --command extension install-file --repo user_default --enable add-on-mpfb-v2.0.18.zip` |
| MakeHuman system assets | `makehuman_system_assets_cc0.zip` | diekstrak ke `D:/Tools/blender/portable/extensions/.user/user_default/mpfb/data/` |
| Chrome for Testing + puppeteer-core | 147 / 25 | sama dengan `scripts/rekam-layar.mjs` |
| ffmpeg | PATH | |

Unduh paket aset dari `https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip`
(cermin `files2` sangat lambat; unduhan paralel per rentang byte bekerja baik).

## Lisensi aset

- Mesh dasar, target bentuk/ekspresi, rig `game_engine`, bobot: MakeHuman/MPFB, **CC0**
  (aset yang dihasilkan MPFB bebas dipakai; kode add-on GPL-3.0 tidak ikut ke video).
- Pakaian `male_casualsuit01` (lengan dipotong pendek oleh skrip), `shoes04`, mata `low-poly`, alis
  `eyebrow001`, bulu mata `eyelashes01`: paket *MakeHuman system assets*, **CC0**. Tekstur aslinya
  diganti bahan tanah liat buatan sendiri (mata memakai luminans tekstur mata asli).
- Rambut, ruangan, perabot, tanaman, dudukan ponsel, lembar program: dibuat dari primitif oleh skrip di
  `video/blender/` (milik proyek).
- Layar ponsel: rekaman/frame aplikasi PULIHIN asli.

## Skrip (semua adegan dapat dibangun ulang)

| Berkas | Isi |
|---|---|
| `video/blender/karakter.py` | membangun Pak Budi dengan MPFB (laki-laki ~58 th, perut sedikit, wajah tenang: kelopak sedikit turun, sudut bibir sedikit naik), rig, pakaian, bahan tanah liat, rambut pahat -> `video/blender/karakter.blend` |
| `video/blender/bahan.py` | bahan tanah liat, pemetaan bahan pakaian per pulau UV, lengan pendek, kulit tersembunyi di bawah celana, rambut pendek beruban (salt-and-pepper): kulit kepala dipotong tiga bidang, tebal maks ±8 mm, tepi memudar lewat alfa bernoise (atribut `garis`) dengan pelipis sedikit mundur, warna helai gelap/abu/terang dari noise memanjang, pelipis lebih abu, guratan sisir (bump) |
| `video/blender/pose.py` | pose duduk (rotasi delta ruang armature -> `matrix_basis`), `JadwalSesi` (diam 5 dtk, 10 repetisi x 3,3 dtk: naik 1,4 / tahan 0,35 / turun 1,25 / istirahat 0,3; repetisi 7 bahu kanan terangkat 24° + kepala miring 5°), tangan menggenggam longgar (`jari` 1,1) |
| `video/blender/adegan.py` | ruang (lantai papan kontras rendah, karpet anyam, dinding bergradasi, jendela bertirai di kiri karakter, bufet + bingkai + tanaman tinggi di dinding depan, rak di dinding belakang/kanan, buku bertepi halaman, ponsel dengan modul kamera di punggung), cahaya (kunci jendela kiri depan, matahari tipis, isi sejuk, dua pinggir, sapuan dinding, fast-GI/AO; 48 sampel untuk shot lebar), kamera POV ponsel, bahan layar video |
| `video/blender/render_sesi.py` | render POV kamera depan ponsel 480x480 -> `out/sesi-pov.y4m` (+ `sesi-pov.jadwal.json`) |
| `video/blender/render_lebar.py` | shot sinematik: `sesi` (dua sudut A/B dengan potongan dari `sesi-meta.json`), `afasia`, `kertas`, `ragu`, `penutup` |
| `video/blender/buat-kertas.mjs` | tekstur lembar "Program Latihan di Rumah" -> `out/kertas-program.png` |
| `video/scripts/rekam-sesi-3d.mjs` | rekaman layar aplikasi asli dengan POV sebagai kamera palsu -> layar-02 + `sesi-meta.json` (`--ketuk=5` detik ketukan "Mulai dengan Kamera", `--meta-saja`) |

Render dan rekaman ada di `video/blender/out/` (di-gitignore).

### Urutan membangun ulang (dari `D:/Orca/Pulihin`)

```bash
B=D:/Tools/blender/blender.exe
$B -b -P video/blender/karakter.py
$B -b video/blender/karakter.blend -P video/blender/render_sesi.py -- --kamera pov --jumlah 10 --rep-bahu 7 --diam 5 --ekor 8 --keluar video/blender/out/sesi-pov
cd video && node scripts/rekam-sesi-3d.mjs && cd ..          # keluar kode 0 = Siap, 10/10, koreksi bahu, tanpa koreksi lain
$B -b video/blender/karakter.blend -P video/blender/render_lebar.py -- --shot sesi   # 48 sampel EEVEE (default render_lebar)
ffmpeg -sseof -0.5 -i video/out/footage-asli/layar-03-ringkasan-beranda.mp4 -frames:v 1 video/blender/out/beranda-asli-setelah.png
node video/blender/buat-kertas.mjs
for s in afasia kertas ragu penutup; do $B -b video/blender/karakter.blend -P video/blender/render_lebar.py -- --shot $s; done
```

Lalu enkode untuk Remotion (yuv420p rentang terbatas, keyframe tiap 1 dtk, faststart):
`ffmpeg -i video/blender/out/<slot>.mp4 -c:v libx264 -crf 18 -pix_fmt yuv420p -color_range tv -g 30 -keyint_min 30 -sc_threshold 0 -movflags +faststart -an video/public/footage/<slot>.mp4`
(sesi/afasia 1280x720, kertas/ragu/penutup 1920x1080 sesuai render; rekaman ponsel 720x1600 dibuat langsung
oleh `rekam-sesi-3d.mjs`). Waktu render di laptop ini: POV 1380 frame ±11 mnt, `sesi` 1464 frame ±51 mnt.

## Catatan teknis

- Chrome memotong kamera palsu ke persegi untuk batasan aplikasi (ideal 640x480; sumber 480x640 menjadi
  480x480, `resizeMode: crop-and-scale`). Karena itu POV dirender persegi 480x480, FOV 62°, kamera di atas
  layar ponsel ±1 m di depan dada: ada ruang di atas kepala, pinggul dan lutut terlihat.
- File y4m mulai diputar dari frame 0 saat aplikasi membuka kamera. `rekam-sesi-3d.mjs` mencatat waktu
  `getUserMedia` selesai (`kameraMulaiDetik`); shot `sesi` menggeser animasi sebesar itu sehingga
  `kamera-sesi-lebar` dan `layar-02` sinkron frame-ke-frame, dan layar ponsel di 3D menampilkan rekaman
  layar-02 asli.
- Semua waktu di `sesi-meta.json` dibaca dari perubahan teks layar aplikasi selama perekaman (dicatat tiap
  50 ms), bukan dari rencana animasi.
- `kamera-sesi-lebar` berganti sudut lewat penanda kamera (`timeline_markers`), hanya di batas repetisi
  (saat hitungan aplikasi berganti) dan saat pesan koreksi asli muncul, dibaca dari `sesi-meta.json`:
  sudut A (3/4 depan, kepala sampai lutut, punggung ponsel + dudukan di latar depan, f/2) sampai hitungan 4;
  sudut B (di belakang-kanan karakter ke layar ponsel, lensa 100 mm, rekaman layar-02 asli terbaca) dari
  hitungan 4 sampai 6 ("5 / 10"); A dari hitungan 6 (bahu terangkat di repetisi 7); B saat pesan koreksi
  muncul sampai hitungan 8; A dari hitungan 8 sampai Ringkasan. Kedua kamera bergeser sangat pelan.
- Ketukan "Mulai dengan Kamera" di detik 5 rekaman (`--ketuk`), sehingga "Siap" baru muncul setelah ±7 dtk.

## Hasil yang benar-benar dihitung aplikasi

Log mentah: `video/blender/out/rekam-sesi-3d.json` (perubahan teks layar tiap 50 ms); ringkasan:
`video/blender/out/sesi-meta.json`.

Perekaman 15 Okt 2026, tampilan premium (aplikasi produksi, `sesi-meta.json`, detik di dalam `layar-02`,
durasi 48,81 dtk):

| Peristiwa di layar aplikasi | Detik |
|---|---|
| Ketuk "Mulai dengan Kamera" | 5,003 |
| Kamera (render POV) mulai | 5,830 |
| "Siap! Silakan mulai pelan pelan." | 7,036 |
| Hitungan 1 … 10 | 13,233 · 16,531 · 19,831 · 23,131 · 26,434 · 29,733 · 33,090 · 36,331 · 39,633 · 42,936 |
| "Rilekskan bahu, turunkan bahu Anda" (repetisi 7, satu-satunya koreksi) | 32,333 – 33,831 |
| "Hebat! Target 10 kali tercapai." | 42,936 |
| Halaman Ringkasan (skor 100, 10/10, 37 dtk) | 44,789 |

Tidak ada koreksi lain ("Perlambat gerakan", "Tegakkan badan", "Mundur sedikit", "Sedikit lagi") selama
sesi. `node scripts/rekam-sesi-3d.mjs` keluar dengan kode 0 hanya bila semua syarat ini terpenuhi.

Uji kelayakan awal (karakter tanpa pakaian, 3 repetisi) juga lulus: Siap 1,8 dtk setelah kamera menyala,
repetisi terhitung; pakaian teal kemudian menambah kontras lengan terhadap badan.

## Label kejujuran

- Di layar setiap kali karakter tampil: "Peragaan dengan karakter 3D, bukan pasien sungguhan".
- Deskripsi YouTube: karakter 3D (MakeHuman CC0, dirender di Blender) menggantikan pemeran; layar ponsel
  adalah rekaman aplikasi asli yang memproses render 3D sebagai kamera; narasi suara sintetis.
