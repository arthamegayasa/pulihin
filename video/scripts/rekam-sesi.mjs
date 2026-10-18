// Merekam layar ASLI sesi kamera Tekuk Siku (sisi kanan) dengan video POV AI sebagai kamera.
//
//   npm run rekam-sesi                                   (aplikasi produksi, POV FootageAI)
//   npm run rekam-sesi -- --y4m=<pov.y4m> --url=http://127.0.0.1:5174 --jam=9
//   npm run rekam-sesi -- --meta-saja                    (hitung ulang sesi-meta.json dari log terakhir)
//
// Chrome memakai video POV (480x480 30 fps y4m, dibuat AI dari foto acuan, lihat docs/video/README.md) sebagai
// kamera depan palsu (--use-file-for-fake-video-capture; berkas diulang bila habis). Aplikasi produksi benar-benar
// memproses gambar itu: Siap, hitungan, koreksi, dan suaranya muncul karena MediaPipe di aplikasi mendeteksi orang
// di video. Skrip ini hanya mengetuk tombol seperti manusia, mencatat kapan teks layar berubah, dan mencatat klip
// suara aplikasi yang berbunyi.
//
// Keluaran:
//   out/rekam-sesi/layar-02-sesi-tekuk-siku-asli.mp4   rekaman 1080x2400 (CDP screencast, 30 fps)
//   out/rekam-sesi/log.json                            log mentah: perubahan teks, detik kamera mulai, suara
//   data/sesi-meta.json                                kontrak untuk Remotion (waktu = detik di layar-02)
//   data/suara-aplikasi.json, data/ketukan.json        kunci layar-02-sesi-tekuk-siku.mp4
//   public/footage/layar-02-sesi-tekuk-siku.mp4        720x1600 untuk Remotion
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  AKAR_VIDEO,
  JALUR_SESI_ASLI,
  PONSEL,
  Perekam,
  bacaArgumen,
  buka,
  cariFfmpeg,
  catatanSuara,
  jeda,
  ketuk,
  ketukDiam,
  luncurkan,
  mulaiCatatanSuara,
  siapkanDemo,
  simpanCatatan,
  tungguTeks,
  unduhCadangan,
} from './lib/peramban.mjs';

const opsi = bacaArgumen(process.argv.slice(2));
const BASE = String(opsi.url ?? 'https://pulihin.vercel.app').replace(/\/$/, '');
const JAM = Number(opsi.jam ?? 9);
/** Detik rekaman saat "Mulai dengan Kamera" diketuk (opsi --ketuk). */
const KETUK_DETIK = Number(opsi.ketuk ?? 5.0);
const BERKAS = 'layar-02-sesi-tekuk-siku.mp4';
const DIR_OUT = join(AKAR_VIDEO, 'out', 'rekam-sesi');
const Y4M = resolve(String(opsi.y4m ?? 'D:/Temp/pulihin-video/pov/pov-tekuk-siku.y4m'));
const ASLI = join(DIR_OUT, 'layar-02-sesi-tekuk-siku-asli.mp4');
const LOG = join(DIR_OUT, 'log.json');
const PESAN_BAHU = 'Rilekskan bahu, turunkan bahu Anda';
/** Pesan koreksi lain dari exerciseDefinitions.ts: tidak boleh muncul (koreksi yang tidak direncanakan). */
const PESAN_LAIN = [
  'Mundur sedikit agar tubuh terlihat penuh',
  'Tegakkan badan, jangan miring',
  'Sedikit lagi, angkat lebih tinggi bila mampu',
  'Perlambat gerakan Anda',
  'Gerakan tadi belum terhitung',
];

// Catatan di halaman: kapan aliran kamera mulai dan setiap perubahan teks layar (diperiksa tiap 50 ms).
const SKRIP_LOG = () => {
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
let rekaman;
if (opsi['meta-saja']) {
  rekaman = JSON.parse(readFileSync(LOG, 'utf8'));
} else {
  mkdirSync(DIR_OUT, { recursive: true });
  console.log(`Aplikasi: ${BASE}\nKamera palsu: ${Y4M}`);
  const { halaman, tutup } = await luncurkan({
    base: BASE,
    jam: JAM,
    perangkat: PONSEL,
    chrome: opsi.chrome,
    argTambahan: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${Y4M}`, '--enable-gpu', '--ignore-gpu-blocklist'],
  });
  let rek;
  let mentah;
  let klip;
  const ketukanDetik = [];
  try {
    const page = await halaman();
    await page.evaluateOnNewDocument(SKRIP_LOG);
    await siapkanDemo(page, BASE);

    // Persiapan di luar rekaman: Beranda -> Tekuk Siku -> sisi Kanan.
    await buka(page, BASE, '/app/beranda', 'Latihan Hari Ini');
    await ketukDiam(page, 'Tekuk Siku', { cocok: 'awal' });
    await tungguTeks(page, 'Mulai dengan Kamera');
    await ketukDiam(page, 'Kanan');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => sessionStorage.removeItem('__logLayar'));
    await jeda(1500);

    rek = new Perekam(page, { lebar: 1080, tinggi: 2400, kerja: join(DIR_OUT, 'frame') });
    await mulaiCatatanSuara(page);
    await rek.mulai();
    // Detail Latihan tampil beberapa detik sebelum ketukan (ruang narasi pembuka adegan).
    await rek.sampai(KETUK_DETIK);
    ketukanDetik.push(Math.round(rek.detik() * 1000) / 1000);
    await ketuk(page, 'Mulai dengan Kamera');
    await page.waitForFunction(() => location.pathname.startsWith('/app/ringkasan'), { timeout: 150000, polling: 100 });
    const tRingkasan = rek.detik();
    await tungguTeks(page, 'Rincian skor', 10000).catch(() => {});
    await rek.sampai(tRingkasan + 4);
    await rek.berhenti();
    klip = await catatanSuara(page, rek);
    mentah = await page.evaluate(() => ({
      kameraMulai: Number(sessionStorage.getItem('__kameraMulai')),
      log: JSON.parse(sessionStorage.getItem('__logLayar') ?? '[]'),
    }));
    // Sesi yang baru direkam, persis seperti disimpan aplikasi (lewat Simpan cadangan): dipakai rekaman Ringkasan,
    // Beranda, dan Untuk Keluarga (imporSesiDemo) agar skor dan rinciannya sama dengan sesi ini.
    const cadangan = await unduhCadangan(page, BASE);
    const sesi = cadangan.sessions
      .filter((s) => s.latihanId === 'fleksi-siku' && !s.isDemo && s.selesai)
      .sort((a, b) => b.mulaiAt - a.mulaiAt)[0];
    if (!sesi) throw new Error('Sesi kamera yang baru direkam tidak ada di cadangan aplikasi');
    const repLogs = cadangan.repLogs.filter((l) => l.sessionId === sesi.id);
    mkdirSync(join(AKAR_VIDEO, 'data'), { recursive: true });
    writeFileSync(JALUR_SESI_ASLI, `${JSON.stringify({ sesi, repLogs }, null, 2)}\n`);
    console.log(`Sesi asli: skor ${sesi.skor}, ${sesi.repetisiTercapai}/${sesi.repetisiTarget}, ${sesi.durasiDetik} dtk, ${repLogs.length} catatan repetisi`);
  } finally {
    await tutup();
  }
  const info = await rek.susun(ASLI, ffmpeg);
  const detik = (t) => Math.round(((t - rek.t0) / 1000) * 1000) / 1000;
  rekaman = {
    kameraMulaiDetik: detik(mentah.kameraMulai),
    durasi: info.durasi,
    ketukanDetik,
    klip,
    log: mentah.log.map((e) => ({ detik: detik(e.t), teks: e.teks })),
  };
  writeFileSync(LOG, JSON.stringify(rekaman, null, 1));

  // ---------- versi Remotion: 720x1600, yuv420p rentang terbatas, keyframe tiap 1 dtk, faststart ----------
  const { execFileSync } = await import('node:child_process');
  execFileSync(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', ASLI,
    '-vf', 'scale=720:1600:flags=lanczos,format=yuv420p', '-color_range', 'tv',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-g', '30', '-keyint_min', '30', '-sc_threshold', '0',
    '-r', '30', '-movflags', '+faststart', '-an', join(AKAR_VIDEO, 'public', 'footage', BERKAS),
  ]);
}

// ---------- sesi-meta.json dari perubahan teks layar aplikasi ----------
const { log, kameraMulaiDetik, durasi, ketukanDetik, klip } = rekaman;
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
const lain = PESAN_LAIN.flatMap(interval);
const selesaiDetik = pertama((t) => t.includes('Hebat!'));
const ringkasanDetik = pertama((t) => t.startsWith('/app/ringkasan'));

// Ringkasan aplikasi di akhir rekaman: durasi sesi dan sudut puncak tiap repetisi (laporan dan syarat lulus).
const teksRingkasan = log.filter((e) => e.teks.startsWith('/app/ringkasan')).at(-1)?.teks ?? '';
const durasiSesi = Number(teksRingkasan.match(/Durasi (\d+) detik/)?.[1] ?? NaN);
const sudut = [...teksRingkasan.matchAll(/(\d{2,3})° (\d{1,2})(?= )/g)].map((m) => ({ sudut: Number(m[1]), nomor: Number(m[2]) }));
const sudutUrut = Array.from({ length: 10 }, (_, i) => sudut.find((s) => s.nomor === i + 1)?.sudut ?? null);
const repKoreksi = koreksi.length ? repetisiDetik.findIndex((t) => t > koreksi[0].mulaiDetik) + 1 : null;

const meta = {
  fps: 30,
  durasiDetik: Math.round(durasi * 1000) / 1000,
  berkas: { layar: BERKAS },
  kameraMulaiDetik,
  siapDetik,
  repetisiDetik,
  koreksi,
  selesaiDetik,
  ringkasanDetik,
};
mkdirSync(join(AKAR_VIDEO, 'data'), { recursive: true });
writeFileSync(join(AKAR_VIDEO, 'data', 'sesi-meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
simpanCatatan('suara-aplikasi.json', BERKAS, klip);
simpanCatatan('ketukan.json', BERKAS, ketukanDetik);

console.log(`\nKamera mulai di detik ${kameraMulaiDetik} rekaman; durasi ${durasi.toFixed(2)} dtk`);
console.log(`Siap ${siapDetik}; repetisi ${repetisiDetik.join(', ')}`);
console.log(`Koreksi bahu: ${JSON.stringify(koreksi)} (repetisi ke-${repKoreksi})`);
console.log(`Koreksi lain (harus kosong): ${JSON.stringify(lain)}`);
console.log(`Hebat ${selesaiDetik}; Ringkasan ${ringkasanDetik}; durasi sesi ${durasiSesi} dtk; sudut ${sudutUrut.join(', ')}`);
for (const k of klip) console.log(`  suara ${k.detik.toFixed(2).padStart(6)} dtk  ${k.lama.toFixed(2)} dtk  ${k.teks}`);
const lulus =
  siapDetik !== null &&
  repetisiDetik.length === 10 &&
  koreksi.length === 1 &&
  lain.length === 0 &&
  Number.isFinite(durasiSesi) &&
  sudutUrut.every((s) => s !== null) &&
  klip.some((k) => k.teks?.startsWith('Rilekskan bahu'));
console.log(lulus ? 'LULUS: Siap, 10/10 berurutan, satu koreksi bahu bersuara, tanpa koreksi lain.' : 'BELUM LULUS: periksa log.');
process.exit(lulus ? 0 : 2);
