# Tangkapan Layar untuk Paper (Bab 13.2)

Lima layar, resolusi ponsel yang sama (1080x2400), data demo berlabel **Demo**, tanpa bilah notifikasi atau data pribadi.

| Berkas | Layar | Sumber |
|---|---|---|
| `01-beranda.png` | Beranda Pak Budi: Latihan Hari Ini, Tekuk Siku sudah selesai | Otomatis, `npm run paper` |
| `02-sesi-kamera-skeleton.png` | Sesi Kamera dengan skeleton | **Wajib dari ponsel tim** (lihat di bawah) |
| `03-ringkasan-sesi.png` | Ringkasan Sesi: skor, label, repetisi, durasi | Otomatis, `npm run paper` |
| `04-latihan-kata-afasia.png` | Latihan Kata Afasia: kata, gambar, hasil "Benar!" | Otomatis, `npm run paper` |
| `05-untuk-keluarga.png` | Untuk Keluarga: status hari ini dan grafik Sesi terjadwal 7 hari terakhir (kartu tanda perlu perhatian ada tepat di atasnya) | Otomatis, `npm run paper` |

## Cara membuat ulang empat tangkapan otomatis

Di folder `video/` (sekali saja: `npm install`):

```bash
npm run paper                                  # aplikasi produksi https://pulihin.vercel.app
npm run paper -- --url=http://127.0.0.1:5173   # aplikasi lokal
```

Skrip `video/scripts/tangkap-paper.mjs` membuka aplikasi asli di Chrome tanpa jendela dengan layar ponsel 360x800 CSS px dan DPR 3 (tepat 1080x2400, ukuran ponsel Android kelas bawah acuan Bab 17.4), lalu memakai tombol aplikasi sendiri:

1. Pilih Peran > Saya Pasien; Pengaturan > Petunjuk suara: Mati; Pengaturan > Data Demo > "Ada tanda perlu perhatian" > Reset Data Demo.
2. Pengaturan > Ekspor Data (JSON), lalu menambahkan **satu** sesi Tekuk Siku hari ini yang selesai (berlabel demo, `isDemo: true`, 10 dari 10 repetisi, satu koreksi bahu). Skor, rincian, dan saran dihitung dengan fungsi skor aplikasi sendiri (`src/features/pose/scoring.ts`) dari catatan repetisinya; berkas dipulihkan lewat Pengaturan > Impor Data (JSON). Salinan berkas yang diimpor: `video/out/rekam-layar/cadangan-demo-sesi-tekuk-siku.json`.
3. Memotret Beranda, Ringkasan Sesi sesi itu, Latihan Bicara (kategori Benda di Rumah, Mode Latihan Mandiri, "Sudah Benar"), dan Untuk Keluarga.

Semua nama adalah nama samaran data demo (Pak Budi, 58 tahun). Tidak ada data pasien asli.

Catatan `04-latihan-kata-afasia.png`: hasil "Benar!" dinilai lewat **Mode Latihan Mandiri** (tombol Sudah Benar, label "Mandiri" di kanan atas), karena pengenal suara Chrome tidak tersedia di peramban otomatis. Bila tim memotret di ponsel saat merekam video dengan Mode Suara (tampil "Terdengar: ..."), versi ponsel itu lebih baik untuk paper; simpan dengan nama yang sama.

## Layar kelima: Sesi Kamera dengan skeleton (wajib direkam tim)

Layar ini **harus** berasal dari sesi kamera nyata dengan anggota tim atau relawan sebagai pemeran. **Dilarang** memakai rekaman stok, video unduhan, avatar, atau gambar buatan AI sebagai sumber kamera, termasuk klip uji internal yang dipakai pengembang.

Cara memotret di ponsel uji (Android, Chrome):

1. Aktifkan **Jangan Ganggu** dan matikan notifikasi agar bilah status bersih. Baterai cukup, jam wajar.
2. Buka aplikasi, Pengaturan > Data Demo > Reset Data Demo (skenario "Ada tanda perlu perhatian"), lalu Beranda > Tekuk Siku.
3. Letakkan ponsel tegak di tripod atau tumpukan buku di meja setinggi dada, 0,8-1,2 m di depan kursi (Bab 11.1). Cahaya dari depan, latar polos, kepala sampai pinggul terlihat.
4. Ketuk **Mulai dengan Kamera**. Pemeran duduk, mengikuti irama di layar (sekitar 3 detik per gerakan).
5. Saat skeleton terlihat jelas di lengan dan hitungan sudah berjalan (misalnya **5 / 10**), atau saat pesan koreksi "Rilekskan bahu, turunkan bahu Anda" tampil, tangkap layar dengan tombol **Daya + Volume Turun**. Bila merekam layar untuk video (`layar-02-sesi-tekuk-siku.mp4`), frame dari rekaman itu juga boleh diambil.
6. Pastikan resolusi 1080x2400 (ponsel lain: potong atau skala ke 1080x2400 tanpa mengubah rasio isi), tidak ada notifikasi, nama, atau wajah orang lain di latar.
7. Simpan sebagai `docs/screenshots/02-sesi-kamera-skeleton.png`.

Wajah pemeran boleh terlihat bila pemeran setuju (formulir persetujuan di `docs/video/shotlist.md`); keterangan "Peragaan oleh pemeran" dicantumkan di paper.
