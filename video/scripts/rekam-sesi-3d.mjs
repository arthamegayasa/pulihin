// Merekam layar ASLI sesi kamera Tekuk Siku (sisi kanan) dengan karakter 3D sebagai kamera.
//
//   node scripts/rekam-sesi-3d.mjs                       (aplikasi produksi, POV dari Blender)
//   node scripts/rekam-sesi-3d.mjs --y4m=<pov.y4m> --url=http://127.0.0.1:5174 --jam=9
//   node scripts/rekam-sesi-3d.mjs --meta-saja           (hitung ulang sesi-meta.json dari log terakhir)
//
// Chrome memakai render POV Blender (video/blender/out/sesi-pov.y4m) sebagai kamera depan palsu
// (--use-file-for-fake-video-capture). Aplikasi produksi benar-benar memproses gambar itu: status Siap,
// hitungan, dan pesan koreksi muncul karena MediaPipe di aplikasi mendeteksi karakter 3D. Skrip ini hanya
// mengetuk tombol seperti manusia dan mencatat kapan teks di layar berubah.
//
// Keluaran:
//   video/blender/out/layar-02-sesi-tekuk-siku-asli.mp4   rekaman 1080x2400 (CDP screencast, 30 fps)
//   video/blender/out/rekam-sesi-3d.json                  log mentah: perubahan teks, detik kamera mulai
//   video/blender/out/sesi-meta.json                      kontrak untuk Remotion (waktu = detik di layar-02)
//   video/public/footage/layar-02-sesi-tekuk-siku.mp4     720x1600 untuk Remotion
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';
import {
  AKAR_VIDEO,
  PONSEL,
  Perekam,
  bacaArgumen,
  buka,
  cariFfmpeg,
  jeda,
  ketuk,
  ketukDiam,
  siapkanDemo,
  tungguTeks,
  zonaUntukJam,
} from './lib/peramban.mjs';

const opsi = bacaArgumen(process.argv.slice(2));
const BASE = String(opsi.url ?? 'https://pulihin.vercel.app').replace(/\/$/, '');
const JAM = Number(opsi.jam ?? 9);
/** Detik rekaman saat "Mulai dengan Kamera" diketuk (opsi --ketuk). */
const KETUK_DETIK = Number(opsi.ketuk ?? 5.0);
const DIR_OUT = join(AKAR_VIDEO, 'blender', 'out');
const Y4M = resolve(String(opsi.y4m ?? join(DIR_OUT, 'sesi-pov.y4m')));
const ASLI = join(DIR_OUT, 'layar-02-sesi-tekuk-siku-asli.mp4');
const FOOTAGE = join(AKAR_VIDEO, 'public', 'footage', 'layar-02-sesi-tekuk-siku.mp4');
const CHROME = opsi.chrome ?? process.env.CHROME_PATH ?? 'C:/Users/Nyoman/.cache/puppeteer/chrome/win64-147.0.7727.57/chrome-win64/chrome.exe';
const PESAN_BAHU = 'Rilekskan bahu, turunkan bahu Anda';
/** Pesan koreksi lain dari exerciseDefinitions.ts: tidak boleh muncul (koreksi palsu). */
const PESAN_LAIN = [
  'Mundur sedikit agar tubuh terlihat penuh',
  'Tegakkan badan, jangan miring',
  'Sedikit lagi, angkat lebih tinggi bila mampu',
  'Perlambat gerakan Anda',
  'Gerakan tadi belum terhitung',
];

// Penanda ketukan (setara "Tampilkan ketukan" Android) seperti peramban.mjs, plus catatan di halaman:
// kapan aliran kamera mulai dan setiap perubahan teks layar (diperiksa tiap 50 ms).
const SKRIP_HALAMAN = () => {
  window.__pulihinKetuk = (x, y) => {
    const d = document.createElement('div');
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = `position:fixed;left:${x - 24}px;top:${y - 24}px;width:48px;height:48px;border-radius:50%;background:rgba(26,43,46,.26);box-shadow:0 0 0 2px rgba(255,255,255,.9);pointer-events:none;z-index:2147483647;transition:opacity .18s ease .1s;`;
    document.documentElement.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => (d.style.opacity = '0')));
    setTimeout(() => d.remove(), 400);
  };
  const md = navigator.mediaDevices;
  if (md?.getUserMedia) {
    const asli = md.getUserMedia.bind(md);
    md.getUserMedia = async (c) => {
      const s = await asli(c);
      sessionStorage.setItem('__kameraMulai', String(Date.now()));
      return s;
    };
  }
  const catat = () => {
    const log = JSON.parse(sessionStorage.getItem('__logLayar') ?? '[]');
    const teks = `${location.pathname} | ${document.body?.innerText.replace(/\s+/g, ' ') ?? ''}`;
    if (log.at(-1)?.teks !== teks) {
      log.push({ t: Date.now(), teks });
      sessionStorage.setItem('__logLayar', JSON.stringify(log));
    }
  };
  setInterval(catat, 50);
};

const ffmpeg = cariFfmpeg();
const ketukanDetik = [];
let log;
let kameraMulaiDetik;
let durasi;
if (opsi['meta-saja']) {
  // Hitung ulang sesi-meta.json dari log rekaman terakhir tanpa merekam lagi.
  ({ log, kameraMulaiDetik, durasi } = JSON.parse(readFileSync(join(DIR_OUT, 'rekam-sesi-3d.json'), 'utf8')));
  ketukanDetik.push(...JSON.parse(readFileSync(join(DIR_OUT, 'rekam-sesi-3d.json'), 'utf8')).ketukanDetik);
} else {
const profil = join(tmpdir(), `pulihin-sesi3d-${process.pid}`);
rmSync(profil, { recursive: true, force: true });
console.log(`Aplikasi: ${BASE}\nKamera palsu: ${Y4M}`);
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir: profil,
  args: [
    '--hide-scrollbars',
    '--lang=id-ID',
    '--disable-notifications',
    '--force-color-profile=srgb',
    `--force-device-scale-factor=${PONSEL.deviceScaleFactor}`,
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    `--use-file-for-fake-video-capture=${Y4M}`,
    '--enable-gpu',
    '--ignore-gpu-blocklist',
  ],
  defaultViewport: null,
});
let rek;
let mentah;
try {
  const page = await browser.newPage();
  await page.setViewport(PONSEL);
  await page.emulateTimezone(zonaUntukJam(JAM));
  await page.evaluateOnNewDocument(SKRIP_HALAMAN);
  page.on('pageerror', (e) => console.warn(`  [pageerror] ${e.message}`));
  await siapkanDemo(page, BASE);

  // Persiapan di luar rekaman: Beranda -> Tekuk Siku -> sisi Kanan.
  await buka(page, BASE, '/app/beranda', 'Latihan Hari Ini');
  await ketukDiam(page, 'Tekuk Siku', { cocok: 'awal' });
  await tungguTeks(page, 'Mulai dengan Kamera');
  await ketukDiam(page, 'Kanan');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => sessionStorage.removeItem('__logLayar'));
  await jeda(1200);

  rek = new Perekam(page, { lebar: 1080, tinggi: 2400, kerja: join(DIR_OUT, 'frame-sesi') });
  await rek.mulai();
  // Ketukan cukup lambat agar layar-02 punya ≥ 6 dtk sebelum "Siap" (ruang narasi pembuka adegan).
  await rek.sampai(KETUK_DETIK);
  ketukanDetik.push(Math.round(rek.detik() * 1000) / 1000);
  await ketuk(page, 'Mulai dengan Kamera');
  await page.waitForFunction(() => location.pathname.startsWith('/app/ringkasan'), { timeout: 150000, polling: 100 });
  const tRingkasan = rek.detik();
  await tungguTeks(page, 'Rincian skor', 10000).catch(() => {});
  await rek.sampai(tRingkasan + 4);
  await rek.berhenti();
  mentah = await page.evaluate(() => ({
    kameraMulai: Number(sessionStorage.getItem('__kameraMulai')),
    log: JSON.parse(sessionStorage.getItem('__logLayar') ?? '[]'),
  }));
} finally {
  await browser.close();
  rmSync(profil, { recursive: true, force: true });
}

const info = await rek.susun(ASLI, ffmpeg);
const detik = (t) => Math.round(((t - rek.t0) / 1000) * 1000) / 1000;
log = mentah.log.map((e) => ({ detik: detik(e.t), teks: e.teks }));
kameraMulaiDetik = detik(mentah.kameraMulai);
durasi = info.durasi;
writeFileSync(join(DIR_OUT, 'rekam-sesi-3d.json'), JSON.stringify({ kameraMulaiDetik, durasi, ketukanDetik, log }, null, 1));

// ---------- versi Remotion: 720x1600, yuv420p rentang terbatas, keyframe tiap 1 dtk, faststart ----------
mkdirSync(join(AKAR_VIDEO, 'public', 'footage'), { recursive: true });
execFileSync(ffmpeg, [
  '-hide_banner', '-loglevel', 'error', '-y', '-i', ASLI,
  '-vf', 'scale=720:1600:flags=lanczos,format=yuv420p', '-color_range', 'tv',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-g', '30', '-keyint_min', '30', '-sc_threshold', '0',
  '-r', '30', '-movflags', '+faststart', '-an', FOOTAGE,
]);
}

// ---------- sesi-meta.json dari perubahan teks layar aplikasi ----------
const pertama = (f) => log.find((e) => f(e.teks))?.detik ?? null;
const siapDetik = pertama((t) => t.includes('Siap! Silakan mulai'));
const repetisiDetik = [];
for (const e of log) {
  // Panel hitung: "9/ 10 repetisi"; repetisi ke-10 tampil bersama "Hebat!" sebagai "10 / 10".
  const m = e.teks.startsWith('/app/sesi') && e.teks.match(/(\d+)\s*\/\s*10(?!\d)/);
  if (m && Number(m[1]) === repetisiDetik.length + 1) repetisiDetik.push(e.detik);
}
const interval = (pesan) => {
  const hasil = [];
  let mulai = null;
  for (const e of log) {
    const ada = e.teks.includes(pesan);
    if (ada && mulai === null) mulai = e.detik;
    if (!ada && mulai !== null) {
      hasil.push({ teks: pesan, mulaiDetik: mulai, selesaiDetik: e.detik });
      mulai = null;
    }
  }
  return hasil;
};
const koreksi = interval(PESAN_BAHU);
const palsu = PESAN_LAIN.flatMap(interval);
const selesaiDetik = pertama((t) => t.includes('Hebat!'));
const ringkasanDetik = pertama((t) => t.startsWith('/app/ringkasan'));
const meta = {
  fps: 30,
  durasiDetik: Math.round(durasi * 1000) / 1000,
  berkas: { layar: 'layar-02-sesi-tekuk-siku.mp4', lebar: 'kamera-sesi-lebar.mp4' },
  siapDetik,
  repetisiDetik,
  koreksi,
  selesaiDetik,
  ringkasanDetik,
  ketukanDetik,
};
writeFileSync(join(DIR_OUT, 'sesi-meta.json'), JSON.stringify(meta, null, 2));

console.log(`\nKamera mulai di detik ${kameraMulaiDetik} rekaman; durasi ${durasi.toFixed(2)} dtk`);
console.log(`Siap ${siapDetik}; repetisi ${repetisiDetik.join(', ')}`);
console.log(`Koreksi bahu: ${JSON.stringify(koreksi)}`);
console.log(`Koreksi lain (harus kosong): ${JSON.stringify(palsu)}`);
console.log(`Hebat ${selesaiDetik}; Ringkasan ${ringkasanDetik}`);
// Koreksi bahu hanya sekali, saat repetisi 7 berlangsung (setelah hitungan 6, sebelum/selama hitungan 7).
const bahuDiRep7 = koreksi.length === 1 && koreksi[0].mulaiDetik > repetisiDetik[5] && koreksi[0].mulaiDetik < repetisiDetik[6];
const lulus = siapDetik !== null && repetisiDetik.length === 10 && bahuDiRep7 && palsu.length === 0;
console.log(lulus ? 'LULUS: Siap, 10/10 berurutan, koreksi bahu di repetisi 7, tanpa koreksi lain.' : 'BELUM LULUS: periksa log dan animasi.');
process.exit(lulus ? 0 : 2);
