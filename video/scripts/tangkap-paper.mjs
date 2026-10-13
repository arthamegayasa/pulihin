// Memotret layar ASLI aplikasi PULIHIN untuk paper (Bab 13.2) ke docs/screenshots/:
// Beranda, Ringkasan Sesi, Latihan Kata Afasia, Untuk Keluarga dengan grafik. Semua 1080x2400
// (viewport 360x800 CSS px, DPR 3), data demo berlabel Demo, tanpa bilah notifikasi.
// Layar kelima (Sesi Kamera dengan skeleton) WAJIB dari rekaman tim di ponsel: lihat
// docs/screenshots/README.md.
//
//   npm run paper                                  (aplikasi produksi)
//   npm run paper -- --url=http://127.0.0.1:5173   (aplikasi lokal)
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  AKAR_VIDEO,
  PONSEL,
  bacaArgumen,
  buka,
  gulirKe,
  gulirKeTeks,
  imporSesiDemo,
  jeda,
  ketukDiam,
  luncurkan,
  siapkanDemo,
  tungguTeks,
} from './lib/peramban.mjs';

const opsi = bacaArgumen(process.argv.slice(2));
const BASE = String(opsi.url ?? 'https://pulihin.vercel.app').replace(/\/$/, '');
const KELUAR = join(AKAR_VIDEO, '..', 'docs', 'screenshots');
mkdirSync(KELUAR, { recursive: true });

const { halaman, tutup } = await luncurkan({ base: BASE, jam: opsi.jam ?? 10, perangkat: PONSEL, chrome: opsi.chrome });
try {
  const page = await halaman();
  await siapkanDemo(page, BASE);
  const { sesi } = await imporSesiDemo(page, BASE, join(AKAR_VIDEO, 'out', 'rekam-layar', 'cadangan-demo-sesi-tekuk-siku.json'));

  const potret = async (nama) => {
    await jeda(900);
    await page.screenshot({ path: join(KELUAR, nama), type: 'png' });
    console.log(`  docs/screenshots/${nama}`);
  };

  await buka(page, BASE, '/app/beranda', 'Latihan Hari Ini');
  await potret('01-beranda.png');

  await buka(page, BASE, `/app/ringkasan/${sesi.id}`, 'Skor latihan');
  await potret('03-ringkasan-sesi.png');

  await buka(page, BASE, '/app/afasia', 'Latihan Bicara');
  await ketukDiam(page, 'Pakai Mode Latihan Mandiri', { cocok: 'awal' });
  await ketukDiam(page, 'Benda di Rumah', { cocok: 'muat' });
  await tungguTeks(page, 'Kata 1 dari');
  await gulirKe(page, 0, 10);
  await ketukDiam(page, 'Sudah Benar');
  await tungguTeks(page, 'Benar!');
  await gulirKe(page, 0, 10);
  // Status hari ini tepat di bawah header, lalu grafik Sesi terjadwal 7 hari terakhir utuh
  // (kartu tanda perlu perhatian ada di atasnya dan tampil di video).
  await buka(page, BASE, '/app/keluarga', 'Sesi terjadwal 7 hari terakhir');
  await gulirKeTeks(page, 'Sudah latihan hari ini', { sisa: 72, ms: 10, selektor: 'p, h2, h3' });
  await potret('05-untuk-keluarga.png');
} finally {
  await tutup();
}
