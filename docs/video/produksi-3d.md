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
| `video/blender/bahan.py` | bahan tanah liat, pemetaan bahan pakaian per pulau UV, lengan pendek, kulit tersembunyi di bawah celana, rambut |
| `video/blender/pose.py` | pose duduk (rotasi delta ruang armature -> `matrix_basis`), `JadwalSesi` (diam 5 dtk, 10 repetisi x 3,3 dtk: naik 1,4 / tahan 0,35 / turun 1,25 / istirahat 0,3; repetisi 7 bahu kanan terangkat 26° + kepala miring 5°) |
| `video/blender/adegan.py` | ruang, cahaya jendela kiri depan, kamera POV ponsel, bahan layar video |
| `video/blender/render_sesi.py` | render POV kamera depan ponsel 480x480 -> `out/sesi-pov.y4m` |
| `video/blender/render_lebar.py` | shot sinematik: `sesi`, `afasia`, `kertas`, `ragu`, `penutup` |
| `video/blender/buat-kertas.mjs` | tekstur lembar "Program Latihan di Rumah" -> `out/kertas-program.png` |
| `video/scripts/rekam-sesi-3d.mjs` | rekaman layar aplikasi asli dengan POV sebagai kamera palsu -> layar-02 + `sesi-meta.json` |

Render dan rekaman ada di `video/blender/out/` (di-gitignore).

### Urutan membangun ulang (dari `D:/Orca/Pulihin`)

```bash
B=D:/Tools/blender/blender.exe
$B -b -P video/blender/karakter.py
$B -b video/blender/karakter.blend -P video/blender/render_sesi.py -- --kamera pov --jumlah 10 --rep-bahu 7 --diam 5 --ekor 8 --keluar video/blender/out/sesi-pov
cd video && node scripts/rekam-sesi-3d.mjs && cd ..          # keluar kode 0 = Siap, 10/10, koreksi bahu, tanpa koreksi lain
$B -b video/blender/karakter.blend -P video/blender/render_lebar.py -- --shot sesi
ffmpeg -sseof -0.5 -i video/out/footage-asli/layar-03-ringkasan-beranda.mp4 -frames:v 1 video/blender/out/beranda-asli-setelah.png
node video/blender/buat-kertas.mjs
for s in afasia kertas ragu penutup; do $B -b video/blender/karakter.blend -P video/blender/render_lebar.py -- --shot $s; done
```

Lalu enkode untuk Remotion (yuv420p rentang terbatas, keyframe tiap 1 dtk, faststart), contoh:
`ffmpeg -i video/blender/out/<slot>.mp4 -vf scale=1280:720 -c:v libx264 -crf 18 -pix_fmt yuv420p -color_range tv -g 30 -keyint_min 30 -sc_threshold 0 -movflags +faststart -an video/public/footage/<slot>.mp4`
(rekaman ponsel 720x1600 dibuat langsung oleh `rekam-sesi-3d.mjs`).

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

## Hasil yang benar-benar dihitung aplikasi

Log mentah: `video/blender/out/rekam-sesi-3d.json` (perubahan teks layar tiap 50 ms); ringkasan:
`video/blender/out/sesi-meta.json`.

Perekaman 15 Okt 2026 (aplikasi produksi, `sesi-meta.json`, detik di dalam `layar-02`):

| Peristiwa di layar aplikasi | Detik |
|---|---|
| Ketuk "Mulai dengan Kamera" | 3,408 |
| Kamera (render POV) mulai | 3,643 |
| "Siap! Silakan mulai pelan pelan." | 4,906 |
| Hitungan 1 … 10 | 11,040 · 14,339 · 17,641 · 20,939 · 24,242 · 27,541 · 30,904 · 34,145 · 37,444 · 40,742 |
| "Rilekskan bahu, turunkan bahu Anda" (repetisi 7, satu-satunya koreksi) | 29,842 – 31,339 |
| "Hebat! Target 10 kali tercapai." | 40,742 |
| Halaman Ringkasan (skor 100, 10/10, 37 dtk) | 42,591 |

Tidak ada koreksi lain ("Perlambat gerakan", "Tegakkan badan", "Mundur sedikit", "Sedikit lagi") selama
sesi. `node scripts/rekam-sesi-3d.mjs` keluar dengan kode 0 hanya bila semua syarat ini terpenuhi.

Uji kelayakan awal (karakter tanpa pakaian, 3 repetisi) juga lulus: Siap 1,8 dtk setelah kamera menyala,
repetisi terhitung; pakaian teal kemudian menambah kontras lengan terhadap badan.

## Label kejujuran

- Di layar setiap kali karakter tampil: "Peragaan dengan karakter 3D, bukan pasien sungguhan".
- Deskripsi YouTube: karakter 3D (MakeHuman CC0, dirender di Blender) menggantikan pemeran; layar ponsel
  adalah rekaman aplikasi asli yang memproses render 3D sebagai kamera; narasi suara sintetis.
