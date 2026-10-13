# Fixture landmark rekaman manusia nyata

Data numerik turunan (landmark pose), **bukan video**. Dipakai `../realVideo.test.ts` untuk uji
regresi penghitung repetisi dan koreksi form terhadap gerak manusia nyata. Video sumber tidak
disimpan di repo dan tidak ditampilkan di aplikasi, landing, atau video demo.

| Berkas | Video sumber (lisensi Pexels) | Isi | Kebenaran dasar |
|---|---|---|---|
| `curl2.json` | Pexels 4159059, 432x768, 24 fps, loop 64 frame (2,667 s), 8 loop | pria berdiri serong ~45-60°, curl dua lengan bersamaan | 1 repetisi per loop untuk lengan dekat kamera (kiri pasien); lengan kanan tertutup badan |
| `seated.json` | Pexels 9644943 (potongan mulai 6,3 s), 600x528, 24 fps, loop 166 frame (6,92 s), 4 loop | pria duduk menghadap kamera, curl bergantian, dumbel istirahat di paha | 1 repetisi per lengan per loop (diperiksa dengan lembar kontak ffmpeg tiap 8 frame) |
| `elder.json` | Pexels 9058017 (potongan mulai 4,5 s), 640x360, 24 fps, loop 132 frame (5,5 s), 4 loop | lansia berdiri menghadap kamera: 1x abduksi bahu hampir horizontal, lalu memutar badan dengan siku tertekuk | badan tegak sepanjang video (tidak ada miring ke samping) |
| `curl.json` | Pexels 6455077, 432x768, 24 fps, loop 240 frame (10 s), 2 loop | gym, pria serong curl bergantian setengah rentang | tidak tegas, hanya dicatat |
| `curl-dua-orang.json` | Pexels 6455077 lewat kamera palsu Chrome (432x480), numPoses 2, tiap frame ke-3 | kandidat orang per frame (pria + manekin di latar) | pria berlatih di x 0,5-0,95; manekin di x < 0,45 |

## Cara direkam

1. Video y4m didekode frame demi frame dengan ffmpeg (`-f rawvideo -pix_fmt rgba`) dan setiap frame
   diberikan ke MediaPipe Pose Landmarker (`@mediapipe/tasks-vision` 1.1.0, `pose_landmarker_lite.task`
   yang sama dengan aplikasi, delegasi GPU, mode VIDEO, `numPoses: 2`, ambang keyakinan 0,5) di
   Chrome for Testing 147 headless, dengan stempel waktu `k * 1000 / 24` ms. Video diputar ulang
   sebanyak `loop` kali tanpa mengatur ulang pelacak (sama seperti kamera palsu Chrome yang memutar
   file secara berulang).
2. Bila ada lebih dari satu orang, orang utama dipilih dengan `pilihPoseUtama` (`../PoseEngine.ts`),
   persis seperti aplikasi.
3. Hanya titik yang dipakai latihan lengan disimpan: indeks MediaPipe `indeks` (telinga, bahu, siku,
   pergelangan, pinggul kiri/kanan). Tiap titik 6 angka sesuai `kolom`: x, y (ternormalisasi gambar,
   4 desimal), visibility (2 desimal), x, y, z dunia (meter, 4 desimal). `null` = tidak ada tubuh.
   Titik lain dimuat sebagai tidak terlihat (visibility 0) oleh pemuat di `realVideo.test.ts`.
4. `curl-dua-orang.json` direkam dari kamera palsu Chrome (`--use-file-for-fake-video-capture`,
   batasan 640x480 menghasilkan 432x480) dengan `requestAnimationFrame`, sehingga memuat kondisi
   live (frame terlewat). Hanya bahu dan pinggul (x, y) tiap kandidat yang disimpan, dalam urutan
   keluaran MediaPipe.

Angka pada fixture berasal dari Chrome desktop, bukan HP target; lihat docs/algoritma.md Bagian 13.
