// Merekam layar ASLI aplikasi PULIHIN untuk semua slot rekaman layar NON-kamera di src/timeline.ts, lalu
// menyimpannya ke public/footage/ dengan nama slot yang sama. Suara aplikasi menyala: setiap klip suara yang
// diputar aplikasi dicatat (detik di dalam rekaman) ke data/suara-aplikasi.json, dan setiap ketukan ke
// data/ketukan.json, supaya Remotion mencampur klip yang SAMA pada detik yang SAMA.
//
//   npm run rekam-layar                                  (semua rekaman, aplikasi produksi)
//   npm run rekam-layar -- --hanya=layar-04-keluarga.mp4 (satu atau beberapa, pisahkan koma)
//   npm run rekam-layar -- --url=http://127.0.0.1:5173   (aplikasi lokal)
//   npm run rekam-layar -- --jam=asli                    (jam komputer; bawaan: jam lokal ~10 pagi)
//   CHROME_PATH=... atau --chrome=...                    (lokasi Chrome bila tidak ditemukan otomatis)
//
// Ponsel: viewport 360x800 CSS px, DPR 3 = 1080x2400 (ponsel Android kelas bawah acuan Bab 17.4), disimpan
// 720x1600. Desktop terapis: 1280x720 CSS px, DPR 1,5 = 1920x1080. Sesi kamera: scripts/rekam-sesi.mjs.
// Jadwal ketukan di bawah disusun dari durasi adegan di timeline.ts (detik di dalam berkas = `mulaiDi`).
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
  catatanSuara,
  gulirKe,
  gulirKeTeks,
  gulirSampaiBawah,
  imporSesiDemo,
  jeda,
  ketuk,
  ketukDiam,
  luncurkan,
  mulaiCatatanSuara,
  pilihPeran,
  siapkanDemo,
  simpanCatatan,
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
 * persiapan di luar rekaman, halaman awal, durasi, dan langkah bertempo. `tap` = ketukan yang dicatat.
 */
const REKAMAN = [
  {
    berkas: 'layar-01-beranda-detail.mp4',
    perangkat: PONSEL,
    data: 'awal',
    awal: ['/app/beranda', 'Latihan Hari Ini'],
    durasi: 34.5,
    // s06 (0): Beranda. s07 (±10,8): Detail Latihan, contoh gerakan 3D. s08 (±21,8): Letak ponsel.
    async langkah({ page, rek, tap }) {
      await rek.sampai(10.3);
      await tap('Tekuk Siku', { cocok: 'awal' });
      await tungguTeks(page, 'Mulai dengan Kamera');
      await rek.sampai(22.6);
      await gulirKeTeks(page, 'Letak ponsel', { sisa: 96, ms: 2000, selektor: 'h2, h3, p' });
      await rek.sampai(this.durasi);
    },
  },
  {
    berkas: 'layar-03-ringkasan-beranda.mp4',
    perangkat: PONSEL,
    data: 'sesi',
    awal: ({ sesi }) => [`/app/ringkasan/${sesi.id}`, 'Skor latihan'],
    durasi: 31,
    // s14 (0): skor, repetisi, durasi, lalu rincian. s15 (±11): saran dan kalimat bukan diagnosis.
    // s16 (±20,6): Kembali ke Beranda, Tekuk Siku selesai.
    async langkah({ page, rek, tap }) {
      await rek.sampai(8.8);
      await gulirKeTeks(page, 'Rincian skor', { sisa: 96, ms: 1800, selektor: 'h2' });
      await rek.sampai(11.6);
      await gulirSampaiBawah(page, 'Kembali ke Beranda', { tombol: true, sisa: 110, ms: 2200 });
      await rek.sampai(21.4);
      await tap('Kembali ke Beranda');
      await tungguTeks(page, 'Latihan Hari Ini');
      // Beranda mewarisi posisi gulir halaman Ringkasan; usap pelan ke atas seperti pengguna.
      await rek.sampai(23.4);
      await gulirKe(page, 0, 900);
      await rek.sampai(this.durasi);
    },
  },
  {
    berkas: 'layar-04-keluarga.mp4',
    perangkat: PONSEL,
    data: 'sesi',
    awal: ['/app/keluarga', 'Sesi terjadwal 7 hari'],
    durasi: 25.5,
    // s18 (0): tanda perlu perhatian, status hari ini, lalu grafik sesi terjadwal 7 hari.
    // s19 (±12): tren skor 14 hari, lalu Salin Ringkasan Mingguan dan konfirmasinya.
    async langkah({ page, rek, tap }) {
      await rek.sampai(4.2);
      await gulirKeTeks(page, 'Sesi terjadwal 7 hari', { sisa: 150, ms: 2200, selektor: 'h2' });
      await rek.sampai(12.4);
      await gulirKeTeks(page, 'Tren skor 14 hari', { sisa: 110, ms: 2000, selektor: 'h2' });
      await rek.sampai(17.8);
      await gulirSampaiBawah(page, 'Salin Ringkasan Mingguan', { tombol: true, sisa: 300, ms: 1800 });
      await rek.sampai(20.4);
      await tap('Salin Ringkasan Mingguan');
      await rek.sampai(this.durasi);
    },
  },
  {
    berkas: 'layar-05-afasia.mp4',
    perangkat: PONSEL,
    data: 'sesi',
    awal: ['/app/afasia', 'Latihan Bicara'],
    // Kata yang diucapkan Pak Budi di video AI ai-07-bicara. Daftar kata sesi diacak stabil per tanggal; di luar
    // rekaman, kata sebelumnya dilewati sampai kata ini tampil (ketukan Lewati biasa, tercatat sebagai dilewati).
    kata: 'sabun',
    async persiapan({ page }) {
      await ketukDiam(page, 'Pakai Mode Latihan Mandiri', { cocok: 'awal' });
      await jeda(700);
      await ketukDiam(page, 'Benda di Rumah', { cocok: 'awal' });
      await tungguTeks(page, 'Kata 1 dari');
      for (let i = 0; i < 10; i++) {
        const kini = await page.evaluate(() => document.body.innerText);
        if (new RegExp(`\\n${this.kata}\\n`).test(kini)) return;
        await ketukDiam(page, 'Lewati', { cocok: 'awal' });
        await jeda(1200);
      }
      throw new Error(`Kata "${this.kata}" tidak ada di sesi Benda di Rumah hari ini`);
    },
    durasi: 32,
    // s20 (0): kata + gambar, Dengar (suara aplikasi). s21 (±14,6): video AI menyebut kata, Sudah Benar,
    // "Benar!" (suara aplikasi). s21b (±22,6): penilaian pendamping, Kata Berikutnya.
    async langkah({ rek, tap }) {
      await rek.sampai(10.6);
      await tap('Dengar');
      await rek.sampai(20.2);
      await tap('Sudah Benar');
      await rek.sampai(29.2);
      await tap('Kata Berikutnya');
      await rek.sampai(this.durasi);
    },
  },
  {
    berkas: 'layar-06-klinisi.mp4',
    perangkat: DESKTOP,
    data: 'sesi',
    peran: 'Terapis',
    awal: ['/app/klinisi', 'Dashboard Terapis'],
    durasi: 23,
    // s22 (0): Dashboard Terapis, progres Pak Budi (Kepatuhan 7 hari terakhir), tambah latihan.
    // s23 (±10): Simpan Resep, Lihat sebagai pasien, Beranda pasien dengan latihan baru.
    async langkah({ page, rek, tap }) {
      await rek.sampai(0.8);
      await tap('Pak Budi', { cocok: 'muat', desktop: true, gerakMs: 800 });
      await tungguTeks(page, 'Resep Program');
      await rek.sampai(3.2);
      await gulirKeTeks(page, 'Kepatuhan 7 hari terakhir', { sisa: 140, ms: 1400, selektor: 'h2, h3' });
      await rek.sampai(6.8);
      await gulirKeTeks(page, 'Pustaka latihan', { sisa: 160, ms: 1600, selektor: 'h2, h3' });
      await rek.sampai(8.8);
      await tap('Tambah', { dalam: 'Luruskan Tungkai', desktop: true });
      await rek.sampai(10.2);
      // Latihan baru muncul sebagai butir ke-4 di "Latihan dalam program", di atas Pustaka.
      await gulirKeTeks(page, 'Luruskan Tungkai', { sisa: 230, ms: 1300 });
      await rek.sampai(12.2);
      await tap('Simpan Resep', { desktop: true });
      await rek.sampai(15);
      await gulirKe(page, 0, 1400);
      await rek.sampai(16.8);
      await tap('Lihat sebagai pasien', { desktop: true });
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
  let klip = [];
  const ketukan = [];
  try {
    const page = await halaman();
    await siapkanDemo(page, BASE);
    const konteks = { page };
    if (r.data === 'sesi') {
      const { sesi } = await imporSesiDemo(page, BASE, CADANGAN);
      konteks.sesi = sesi;
      console.log(`  data: sesi kamera asli sebagai ${sesi.id}, skor ${sesi.skor}, ${sesi.repetisiTercapai}/${sesi.repetisiTarget}`);
    }
    if (r.peran) await pilihPeran(page, BASE, r.peran);
    const [jalur, teks] = typeof r.awal === 'function' ? r.awal(konteks) : r.awal;
    await buka(page, BASE, jalur, teks);
    if (r.persiapan) await r.persiapan(konteks);
    await jeda(800);
    rek = new Perekam(page, {
      lebar: Math.round(r.perangkat.width * r.perangkat.deviceScaleFactor),
      tinggi: Math.round(r.perangkat.height * r.perangkat.deviceScaleFactor),
      kerja: join(DIR_KERJA, 'frame'),
    });
    await mulaiCatatanSuara(page);
    await rek.mulai();
    // Ketukan ponsel berbunyi saat jari menyentuh (sebelum `ketuk`); desktop saat klik (sesudah kursor tiba).
    const tap = async (teksTombol, o = {}) => {
      const sebelum = rek.detik();
      await ketuk(page, teksTombol, o);
      ketukan.push(Math.round((o.desktop ? rek.detik() - 0.09 : sebelum) * 1000) / 1000);
    };
    await r.langkah({ ...konteks, rek, tap });
    await rek.berhenti();
    klip = await catatanSuara(page, rek);
  } finally {
    await tutup();
  }
  // Enkode setelah Chrome ditutup supaya ffmpeg mendapat memori cukup.
  const keluar = join(DIR_FOOTAGE, r.berkas);
  const info = await rek.susun(keluar, ffmpeg, r.perangkat === PONSEL ? { lebar: 720, tinggi: 1600 } : undefined);
  simpanCatatan('suara-aplikasi.json', r.berkas, klip);
  simpanCatatan('ketukan.json', r.berkas, ketukan);
  const mb = statSync(keluar).size / 1e6;
  hasil.push({ berkas: r.berkas, ...info, mb, klip: klip.length });
  console.log(`  -> public/footage/${r.berkas}: ${info.durasi.toFixed(1)} dtk, ${info.frameSumber} frame sumber, ${mb.toFixed(1)} MB${zona ? `, zona ${zona}` : ''}`);
  for (const k of klip) console.log(`     suara ${k.detik.toFixed(2).padStart(6)} dtk  ${k.lama.toFixed(2)} dtk  ${k.teks}`);
  console.log(`     ketukan ${ketukan.join(', ')}\n`);
}
console.log('Selesai:');
for (const h of hasil) console.log(`  ${h.berkas.padEnd(32)} ${h.durasi.toFixed(1).padStart(5)} dtk  ${h.mb.toFixed(1).padStart(5)} MB  ${h.klip} klip suara`);
console.log('\nLanjutkan dengan: npm run scan');
