# Peraga 3D – video contoh gerakan di Detail Latihan (gaya V3 "Klinis/anatomis")

Satu karakter MPFB/MakeHuman CC0 (laki-laki ±53 th), satu kerangka kerja: tiap latihan hanyalah **satu modul data +
fungsi pose** di `latihan/`. Semua dari skrip, tanpa aset manual.

## Satu perintah

```bash
node peraga3d/buat.mjs fleksi-siku --uji   # ±30 dtk: frame strip + close-up pendar, sampel rendah -> out/<id>/uji/
node peraga3d/buat.mjs fleksi-siku         # ±5-8 mnt: render penuh + encode ke public/peraga/ + lembar tinjauan
node peraga3d/buat.mjs fleksi-siku --lewati-render   # encode ulang dari frame yang sudah ada
```

Opsi: `--dasar` (bangun ulang karakter, otomatis bila `out/dasar.blend` belum ada), `--sampel N`.
Env `BLENDER` mengganti jalur Blender (bawaan `D:/Tools/blender/blender.exe`). Render hanya SATU pada satu waktu.

Keluaran (kontrak `src/features/pose/VideoPeraga.tsx`, diverifikasi `ffprobe` oleh `buat.mjs`):

| Berkas | Isi |
|---|---|
| `public/peraga/<id>.mp4` | 720x720, 30 fps, satu siklus (frame 1..N; frame N+1 = frame 1 → loop mulus), H.264 Main yuv420p, faststart, tanpa audio, ≤ 400 KB (crf terkecil yang muat) |
| `public/peraga/<id>-mulai.webp` | frame 1, ≤ 40 KB |
| `public/peraga/<id>-puncak.webp` | tengah fase tahan (`T_PUNCAK`), ≤ 40 KB |
| `out/<id>/lembar.png` | mulai · tengah naik · puncak · close-up pendar otot |
| `out/<id>/strip.png` | 8 frame merata satu siklus (tinjau tembus objek, kaku, siluet) |
| `out/<id>/laporan.json` | ukuran, crf/kualitas, waktu render, pemeriksaan pendar |

Sisi kanan anatomis saja; aplikasi mencerminkan (`scaleX(-1)`) untuk sisi kiri, jadi tanpa teks/logo di video.

Prasyarat: Blender 5.2 portabel dengan MPFB 2.0.18 + paket aset sistem MakeHuman (lihat
`docs/video/produksi-3d.md`), GPU NVIDIA (OptiX), ffmpeg/ffprobe (dengan libwebp) dan Node di PATH.

## Alur & berkas

| Berkas | Isi |
|---|---|
| `dasar.py` | karakter sekali pakai → `out/dasar.blend`: badan + rig `game_engine`, polo (kerah, plaket) + celana + sepatu, rambut gumpal beruban, kunci bentuk kedip |
| `pakaian.py`, `rambut.py` | pembantu `dasar.py` (polo dari kaos MakeHuman, atribut `lengan`; helai rambut) |
| `latihan/__init__.py` | pemuat + validasi modul latihan; **siklus dari `tempoTargetDetik`** (dibaca langsung dari `exerciseDefinitions.ts`) |
| `latihan/<id_>.py` | data & pose satu latihan (lihat di bawah) |
| `gerak.py` | kurva minimum-jerk, napas, kedip, matematika rig, tangan/jari, IK dua tulang, `Animator` |
| `otot.py` | wilayah otot (atribut `otot`) dari bobot tulang, "jendela" tembus di pakaian di atasnya, grup Mask kulit |
| `adegan.py` | per latihan: pose + keyframe, posisi (duduk) & kursi, cincin sendi, kamera dengan bingkai otomatis, kamera close-up otot → `out/<id>/adegan.blend` + `info.json` |
| `tampilan.py` | tampilan V3: bahan, cahaya (kunci, isi, 2 pinggir, atas, latar), latar gradien, AgX, kompositor pendar |
| `render.py` | render frame + close-up otot + **pemeriksaan pendar** (dengan vs tanpa kompositor; gagal keras bila tak terlihat) |
| `buat.mjs` | menjalankan semuanya, encode, lembar tinjauan, laporan |

Siklus = tempo tengah `(min+max)/2` dibatasi 2–6 dtk, dibulatkan 0,5 dtk — rumus yang sama dengan teks
"sekitar N detik tiap gerakan" di `VideoPeraga.tsx`, jadi video dan teks selalu cocok (Tekuk Siku 3,0 dtk, bahu 4,0).

## Menambah latihan

1. Buat `peraga3d/latihan/<id dengan _>.py` (contoh: `fleksi_bahu.py`). Atribut wajib (divalidasi pemuat):

| Nama | Arti |
|---|---|
| `ID` | id persis seperti di `exerciseDefinitions.ts` |
| `POSISI` | kunci `adegan.POSISI` (saat ini `"duduk"`; lihat "Posisi baru") |
| `KUNCI` | `[(fraksi siklus 0..1, nilai derajat)]` gerak utama. Mulai di 0, akhir di 1 dengan nilai sama. Tiap kunci = titik berhenti/balik (kecepatan nol, minimum-jerk) → taruh antisipasi kecil, lewati puncak sedikit lalu mengendap, tahan, turun pelan, lewati sedikit lalu mengendap |
| `T_PUNCAK` | fraksi tengah fase tahan → poster "puncak" |
| `T_KEDIP` | fraksi awal kedipan (saat istirahat) |
| `KAMERA` | `{"azimut", "elevasi", "lensa", "isi"}`: azimut 0 = depan karakter, + = ke sisi kanan karakter (90 = samping kanan). Jarak & geser dihitung otomatis sehingga figur (semua frame) mengisi `isi` (0,83) tinggi bingkai |
| `OTOT` | daftar wilayah otot (spesifikasi di `otot.py`): tulang, grup bobot, pita `s` sepanjang tulang, `arah` pusat sektor, `lebar`, `jari` |
| `CINCIN` | `{"tulang", "jari", "geser"}`: cincin tipis di kepala tulang ini, digeser `geser` m sepanjang `anim.sumbu_cincin` |
| `BADAN` | gerak ikutan pada puncak (derajat): `ekstensi` (condong belakang), `rotasi` (ke sisi kerja), `miring` (lateral menjauhi sisi kerja), `klavikula` (elevasi kecil bahu kerja; ≤ 3° agar "bahu tidak terangkat") |
| `KEPALA` | `yaw` (− = menoleh ke kanan karakter), `pitch` (+ = menunduk), `lirik_*` tambahan mengikuti gerak |
| `TANGAN_ISTIRAHAT` | sisi yang tangannya bertumpu di paha (IK terkunci, gerak mikro), mis. `("l",)` |
| `pose(anim, t, ops)` | isi `ops[nama tulang] = [operasi...]` untuk anggota tubuh yang bekerja dan **wajib** set `anim.sumbu_cincin` (vektor sumbu gerak sendi target, menghadap kamera) |

Alat untuk `pose()` (ruang armature: karakter menghadap −Y, kanan anatomis = −X, atas = +Z):
`anim.nilai(t)` (derajat dari `KUNCI`), `anim.progres(t, tunda)` (0..1, `tunda` detik untuk gerak ikutan yang
terlambat), `anim.percepatan(t)` (untuk pergelangan yang tertinggal), `anim.lengan(ops, t, sisi, atas, depan, siku,
palmar, lag=, lag_palmar=, jari=, ibu=)` (FK lengan lengkap: arah lengan atas, arah lipat siku, sudut siku, arah
telapak, tekuk jari), `gerak.rotasi(v, sumbu, derajat)`, `gerak.putar/arahkan/orientasi_tulang/puntir_ke`,
`gerak.ik_dua_tulang` (siku/lutut dari pangkal–ujung–kutub). Pola lengan lurus: tentukan `ATAS_0`, `DEPAN_0`,
`PALMAR_0` saat menggantung lalu putar ketiganya dengan sumbu gerak yang sama (lihat `fleksi_bahu.py`,
`abduksi_bahu.py`); pola engsel: lihat `fleksi_siku.py`.

Animator sudah menambahkan: duduk tegak + kaki menapak (tinggi panggul dari kontak sepatu–lantai), napas satu kali
per siklus (buang napas habis di `T_PUNCAK`), goyang mikro tulang belakang, kepala, kedip, jari dengan gerak mikro,
kekuatan pendar (`kuat_otot`, sedikit mendahului sudut), loop mulus (keyframe tiap frame + modifier Cycles).

2. `node peraga3d/buat.mjs <id> --uji` → periksa `out/<id>/lembar-uji.png` dan `strip-uji.png`: bentuk benar sesuai
   `panduanLangkah`, tanpa tembus kursi/badan, tangan rileks, wilayah otot tepat (close-up), cincin di sendi.
   Pelajaran bentuk dari tiga latihan pertama:
   - Gunakan sumbu anatomis MURNI untuk gerak lengan lurus (fleksi: −X, abduksi: +Y). Sumbu `ATAS_0 × arah` ikut
     miring karena lengan menggantung sudah ±11° menjauh dari badan, sehingga lengan menyilang ke tengah di atas
     horizontal (fleksi) atau melewati setinggi bahu (abduksi; puncak 79° + 11° awal = 90°).
   - Sudut 3/4 membuat lengan bawah yang bergerak sagital tampak menyilang dada; untuk gerak sagital pakai
     azimut 78–80°, untuk gerak frontal ±10°.
   - Cincin harus berada di luar permukaan (geser ≥ jari-jari sendi + 5 cm), bila tidak sebagian terbenam.
   - Pemeriksaan pendar < 1 % berarti wilayah otot menghadap menjauhi kamera atau terlalu sempit: arahkan `arah`
     ke sisi yang terlihat kamera / perlebar `lebar`.
3. `node peraga3d/buat.mjs <id>` → aset final + `laporan.json`. Lalu master mengubah `animasiAtauVideo` latihan.

Titik awal `OTOT` untuk latihan lain (ilustratif, setel dengan `--uji`; nama tulang rig `game_engine`):

| Otot | tulang | grup | s | arah |
|---|---|---|---|---|
| kuadriseps | `thigh_r` | `thigh_r` | (0.08, 0.3, 0.85, 1.0) | (0, −1, 0) |
| gluteus medius | `thigh_r` | `thigh_r`, `pelvis` | (−0.35, −0.15, 0.05, 0.2) | (−1, 0.3, 0.3) |
| betis | `calf_r` | `calf_r` | (0.05, 0.2, 0.55, 0.75) | (0, 1, 0) |
| triseps | `upperarm_r` | `upperarm_r` | (0.15, 0.35, 0.85, 1.0) | (0, 1, 0) |
| oblik perut | `spine_02` | `spine_01`, `spine_02`, `pelvis` | (−0.6, −0.3, 1.0, 1.4) | (−1, −0.6, 0) |
| fleksor pinggul | `thigh_r` | `thigh_r`, `pelvis` | (−0.15, 0.0, 0.25, 0.4) | (0, −1, 0.2) |

Pakaian di atas wilayah otot otomatis mendapat jendela tembus (polo maupun celana), dan kulit di bawahnya tidak
dihapus. Untuk dua wilayah (mis. kuadriseps + gluteus) cukup dua entri di `OTOT`.

### Posisi baru (berdiri berpegangan, duduk ke berdiri)

Saat ini hanya `"duduk"` (`adegan.siapkan_duduk` + `Animator.ops_duduk`). Untuk abduksi-pinggul, jinjit, dan
duduk-berdiri tambahkan:
- `adegan.siapkan_<posisi>(anim, L, rig, baju, sepatu)` dan daftarkan di `adegan.POSISI`: tinggi panggul dari kontak
  sepatu–lantai (seperti duduk), letak kursi/meja pegangan (`buat_kursi` atau perabot baru dari `kotak()`), dan
  `anim.tangan_istirahat[sisi] = (target pergelangan, normal telapak, arah jari)` di sandaran/meja untuk KEDUA tangan
  — IK `ops_tangan_istirahat` menjaga tangan terkunci di sana walau badan bergerak.
- `Animator.ops_<posisi>` (setara `ops_duduk`) dipilih di `Animator.operasi` menurut `L.POSISI`; tungkai yang menapak
  diselesaikan dengan `gerak.ik_dua_tulang` ke titik pergelangan kaki tetap agar kaki tidak tergelincir saat panggul
  bergerak (duduk-berdiri, jinjit).

## Tampilan V3 (ringkas)

Latar cyclorama gradien radial teal muda (koordinat layar; sebagian nada dipancarkan sendiri agar stabil), figur resin
abu-biru semi-tembus dengan tepi fresnel + dua cahaya pinggir, bayangan kontak dari cahaya atas, wajah netral (mata
satu warna, tanpa bulu mata), polo putih / celana abu kebiruan, lengan baju & jendela otot tembus seperti kaca buram,
otot kerja oranye `#C46A1B` × kontraksi, cincin sendi tipis, pendar = kompositor (blur dua skala dari pass Emission;
hanya otot & cincin yang memancar). AgX Medium High Contrast, eksposur −0,5, Cycles 96 sampel + denoise OptiX,
blur gerak 0,35.

`render.py` selalu me-render close-up otot (kamera `KameraOtot`, frame puncak) dengan dan tanpa kompositor; bila
pendar menambah cahaya oranye di < 1 % bingkai, render gagal (`out/<id>/frames/pendar.json`).
