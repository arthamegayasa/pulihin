// Merekam layar ASLI aplikasi PULIHIN untuk semua slot rekaman layar NON-kamera di
// src/timeline.ts, lalu menyimpannya ke public/footage/ dengan nama slot yang sama.
//
//   npm run rekam-layar                                  (semua rekaman, aplikasi produksi)
//   npm run rekam-layar -- --hanya=layar-04-keluarga.mp4 (satu atau beberapa, pisahkan koma)
//   npm run rekam-layar -- --url=http://127.0.0.1:5173   (aplikasi lokal)
//   npm run rekam-layar -- --jam=asli                    (jam komputer; bawaan: jam lokal ~10 pagi)
//   CHROME_PATH=... atau --chrome=...                    (lokasi Chrome bila tidak ditemukan otomatis)
//
// Ponsel: viewport 360x800 CSS px, DPR 3 = 1080x2400 (ponsel Android kelas bawah acuan Bab 17.4).
// Desktop terapis: 1280x720 CSS px, DPR 1,5 = 1920x1080. Petunjuk suara dimatikan, tanpa audio.
// Rekaman kamera (dokter, pemeran, sesi kamera dengan skeleton) TIDAK dibuat di sini: wajib
// direkam manusia (Bab 14.4). Lihat docs/video/README.md bagian "Rekaman layar otomatis".
import { statSync } from 'node:fs';
import { join } from 'node:path';
import {
  AKAR_VIDEO,
  DESKTOP,
  PONSEL,
  Perekam,
  bacaArgumen,
  buka,
  cariFfmpeg,
  gulirKe,
  gulirKeTeks,
  gulirSampaiBawah,
  imporSesiDemo,
  jeda,
  ketuk,
  luncurkan,
  pilihPeran,
  siapkanDemo,
  tungguTeks,
} from './lib/peramban.mjs';

const opsi = bacaArgumen(process.argv.slice(2));
const BASE = String(opsi.url ?? 'https://pulihin.vercel.app').replace(/\/$/, '');
const JAM = opsi.jam ?? 10;
const DIR_FOOTAGE = join(AKAR_VIDEO, 'public', 'footage');
const DIR_KERJA = join(AKAR_VIDEO, 'out', 'rekam-layar');
const CADANGAN = join(DIR_KERJA, 'cadangan-demo-sesi-tekuk-siku.json');

/**
 * Setiap rekaman: perangkat, data awal ('awal' = Setel Ulang Data Demo skenario "Ada tanda perlu
 * perhatian"; 'sesi' = sama + satu sesi Tekuk Siku hari ini yang selesai, lewat Pulihkan dari cadangan),
 * halaman awal, durasi, dan langkah bertempo (detik di dalam berkas = `mulaiDi` di timeline.ts).
 */
const REKAMAN = [
  {
    berkas: 'layar-01-beranda-detail.mp4',
    perangkat: PONSEL,
    data: 'awal',
    awal: ['/app/beranda', 'Latihan Hari Ini'],
    durasi: 21.5,
    // s05 (mulaiDi 0): Beranda sebelum latihan. s06 (mulaiDi 10): Detail Latihan Tekuk Siku.
    async langkah({ page, rek }) {
      await rek.sampai(8.6);
      await ketuk(page, 'Tekuk Siku', { cocok: 'awal' });
      await tungguTeks(page, 'Mulai dengan Kamera');
      await rek.sampai(15);
      await gulirKeTeks(page, 'Utamakan keselamatan', { sisa: 230, ms: 2200, selektor: 'p, h2, h3' });
      await rek.sampai(this.durasi);
    },
  },
  {
    berkas: 'layar-03-ringkasan-beranda.mp4',
    perangkat: PONSEL,
    data: 'sesi',
    awal: ({ sesi }) => [`/app/ringkasan/${sesi.id}`, 'Skor latihan'],
    durasi: 51,
    // s13 (0): skor, repetisi, durasi, rincian, saran. s14 (20): kalimat bukan diagnosis.
    // s15 (32): Kembali ke Beranda, status hari ini berubah.
    async langkah({ page, rek }) {
      await rek.sampai(12.5);
      await gulirKeTeks(page, 'Rincian skor', { sisa: 96, ms: 1800, selektor: 'h2' });
      await rek.sampai(20.4);
      await gulirSampaiBawah(page, 'Kembali ke Beranda', { tombol: true, sisa: 110, ms: 2000 });
      await rek.sampai(33.6);
      await ketuk(page, 'Kembali ke Beranda');
      await tungguTeks(page, 'Latihan Hari Ini');
      // Beranda mewarisi posisi gulir halaman Ringkasan; usap pelan ke atas seperti pengguna.
      await rek.sampai(36.2);
      await gulirKe(page, 0, 900);
      await rek.sampai(this.durasi);
    },
  },
  {
    berkas: 'layar-04-keluarga.mp4',
    perangkat: PONSEL,
    data: 'sesi',
    awal: ['/app/keluarga', 'Sesi terjadwal 7 hari terakhir'],
    durasi: 31,
    // s16 (0): tanda perlu perhatian, status hari ini, grafik sesi terjadwal 7 hari.
    // s17 (15): tren skor 14 hari, lalu Salin Ringkasan Mingguan dan konfirmasinya.
    async langkah({ page, rek }) {
      await rek.sampai(5.5);
      await gulirKeTeks(page, 'Sesi terjadwal 7 hari terakhir', { sisa: 150, ms: 2000, selektor: 'h2, h3, p' });
      await rek.sampai(15.6);
      await gulirKeTeks(page, 'Skor latihan 14 hari', { sisa: 110, ms: 2000, selektor: 'h2, h3, p' });
      await rek.sampai(21.6);
      await gulirSampaiBawah(page, 'Salin Ringkasan Mingguan', { tombol: true, sisa: 300, ms: 1800 });
      await rek.sampai(24.8);
      await ketuk(page, 'Salin Ringkasan Mingguan');
      await rek.sampai(this.durasi);
    },
  },
  {
    berkas: 'layar-05-afasia.mp4',
    perangkat: PONSEL,
    data: 'sesi',
    awal: ['/app/afasia', 'Latihan Bicara'],
    durasi: 31.5,
    // s18 (0): Latihan Bicara, kategori, kata + gambar, Dengar. s19 (12): Dengar lagi, pemeran
    // menyebut kata, hasil Benar. Draf: Mode Latihan Mandiri (pengenal suara Chrome tidak
    // tersedia di peramban otomatis); versi final direkam di ponsel dengan pengenal suara.
    async langkah({ page, rek }) {
      await rek.sampai(1.8);
      await ketuk(page, 'Pakai Mode Latihan Mandiri', { cocok: 'awal' });
      await rek.sampai(4.2);
      await ketuk(page, 'Benda di Rumah', { cocok: 'muat' });
      await tungguTeks(page, 'Kata 1 dari');
      await rek.sampai(7.2);
      await ketuk(page, 'Dengar');
      await rek.sampai(13);
      await ketuk(page, 'Dengar');
      await rek.sampai(19.2);
      await ketuk(page, 'Sudah Benar');
      await rek.sampai(27.6);
      await ketuk(page, 'Kata Berikutnya');
      await rek.sampai(this.durasi);
    },
  },
  {
    berkas: 'layar-06-klinisi.mp4',
    perangkat: DESKTOP,
    data: 'sesi',
    peran: 'Terapis',
    awal: ['/app/klinisi', 'Dashboard Terapis'],
    durasi: 26,
    // s20 (0): Dashboard Terapis, progres Pak Budi (Kepatuhan 7 hari terakhir), tambah latihan.
    // s21 (12): Simpan Resep, Lihat sebagai pasien, Beranda pasien dengan latihan baru.
    async langkah({ page, rek }) {
      await rek.sampai(1.6);
      await ketuk(page, 'Pak Budi', { cocok: 'awal', desktop: true, gerakMs: 800 });
      await tungguTeks(page, 'Resep Program');
      await rek.sampai(3.6);
      await gulirKeTeks(page, 'Kepatuhan 7 hari terakhir', { sisa: 120, ms: 1400, selektor: 'h2, h3' });
      await rek.sampai(7.8);
      await gulirKeTeks(page, 'Pustaka latihan', { sisa: 150, ms: 1600, selektor: 'h2, h3' });
      await rek.sampai(9.8);
      await ketuk(page, 'Tambah', { dalam: 'Luruskan Tungkai', desktop: true });
      await rek.sampai(11);
      // Latihan baru muncul sebagai butir ke-4 di "Latihan dalam program", tepat di atas Pustaka.
      await gulirKeTeks(page, 'Luruskan Tungkai', { sisa: 230, ms: 1300 });
      await rek.sampai(13.2);
      await ketuk(page, 'Simpan Resep', { desktop: true });
      await rek.sampai(16);
      await gulirKe(page, 0, 1400);
      await rek.sampai(17.8);
      await ketuk(page, 'Lihat sebagai pasien', { desktop: true });
      await tungguTeks(page, 'Latihan Hari Ini');
      await rek.sampai(this.durasi);
    },
  },
];

const dipilih = opsi.hanya ? new Set(String(opsi.hanya).split(',')) : null;
const daftar = REKAMAN.filter((r) => !dipilih || dipilih.has(r.berkas));
if (daftar.length === 0) {
  console.error(`Tidak ada rekaman yang cocok. Pilihan: ${REKAMAN.map((r) => r.berkas).join(', ')}`);
  process.exit(1);
}

const ffmpeg = cariFfmpeg();
console.log(`Aplikasi: ${BASE}\nffmpeg: ${ffmpeg}\n`);
const hasil = [];
for (const r of daftar) {
  console.log(`Merekam ${r.berkas} (${r.perangkat.width}x${r.perangkat.height} CSS px, DPR ${r.perangkat.deviceScaleFactor})`);
  // Profil peramban baru per rekaman: setiap rekaman menyiapkan datanya sendiri.
  const { halaman, tutup, zona } = await luncurkan({ base: BASE, jam: JAM, perangkat: r.perangkat, chrome: opsi.chrome });
  let rek;
  try {
    const page = await halaman();
    await siapkanDemo(page, BASE);
    const konteks = { page };
    if (r.data === 'sesi') {
      const { sesi, label } = await imporSesiDemo(page, BASE, CADANGAN);
      konteks.sesi = sesi;
      console.log(`  data: sesi demo ${sesi.id}, skor ${sesi.skor} (${label}), ${sesi.repetisiTercapai}/${sesi.repetisiTarget}`);
    }
    if (r.peran) await pilihPeran(page, BASE, r.peran);
    const [jalur, teks] = typeof r.awal === 'function' ? r.awal(konteks) : r.awal;
    await buka(page, BASE, jalur, teks);
    await jeda(800);
    rek = new Perekam(page, {
      lebar: Math.round(r.perangkat.width * r.perangkat.deviceScaleFactor),
      tinggi: Math.round(r.perangkat.height * r.perangkat.deviceScaleFactor),
      kerja: join(DIR_KERJA, 'frame'),
    });
    await rek.mulai();
    await r.langkah({ ...konteks, rek });
    await rek.berhenti();
  } finally {
    await tutup();
  }
  // Enkode setelah Chrome ditutup supaya ffmpeg mendapat memori cukup.
  const keluar = join(DIR_FOOTAGE, r.berkas);
  const info = await rek.susun(keluar, ffmpeg);
  const mb = statSync(keluar).size / 1e6;
  hasil.push({ berkas: r.berkas, ...info, mb });
  console.log(`  -> public/footage/${r.berkas}: ${info.durasi.toFixed(1)} dtk, ${info.frameSumber} frame sumber, ${mb.toFixed(1)} MB${zona ? `, zona ${zona}` : ''}\n`);
}
console.log('Selesai:');
for (const h of hasil) console.log(`  ${h.berkas.padEnd(32)} ${h.durasi.toFixed(1).padStart(5)} dtk  ${h.mb.toFixed(1).padStart(5)} MB`);
console.log('\nLanjutkan dengan: npm run scan');
