// Tekstur lembar "Program Latihan di Rumah" (properti adegan 3D, bukan layar aplikasi):
// HTML sederhana dengan gambar orang-lidi, dipotret Chrome menjadi video/blender/out/kertas-program.png.
//   node video/blender/buat-kertas.mjs
// Isi latihan mengikuti resep demo Pak Budi (src/data/seed.ts): Tekuk Siku 10x, Angkat Lengan ke Depan 10x,
// Angkat Lengan ke Samping 8x. Tanpa nama klinik/terapis sungguhan.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const DIR = dirname(fileURLToPath(import.meta.url));
const KELUAR = join(DIR, 'out', 'kertas-program.png');
const CHROME = process.env.CHROME_PATH ?? 'C:/Users/Nyoman/.cache/puppeteer/chrome/win64-147.0.7727.57/chrome-win64/chrome.exe';

// Orang-lidi duduk di kursi (viewBox 120x120). `lengan` = path lengan yang bergerak (garis putus = posisi awal).
const orang = (awal, akhir, panah) => `
<svg viewBox="0 0 120 120" width="230" height="230" fill="none" stroke="#222" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="52" cy="22" r="9"/>
  <path d="M52 31 L52 66"/>
  <path d="M52 66 L80 66 L80 98"/>
  <path d="M40 68 L40 100 M40 76 L74 76 M74 76 L74 100" stroke="#999" stroke-width="2"/>
  <path d="M52 38 ${awal}" stroke="#999" stroke-dasharray="4 4"/>
  <path d="M52 38 ${akhir}"/>
  <path d="${panah}" stroke-width="2.2"/>
</svg>`;

const LATIHAN = [
  ['Tekuk Siku', '10 kali x 1 set', 'Tekuk siku pelan, bawa tangan ke bahu. Bahu tetap rileks.',
    orang('L54 56 L56 72', 'L56 54 L50 40', 'M66 66 Q74 52 62 40 M62 40 L62 47 M62 40 L69 42')],
  ['Angkat Lengan ke Depan', '10 kali x 1 set', 'Angkat lengan lurus ke depan setinggi nyaman.',
    orang('L54 56 L56 72', 'L74 30 L92 22', 'M64 66 Q90 54 92 32 M92 32 L86 37 M92 32 L94 39')],
  ['Angkat Lengan ke Samping', '8 kali x 1 set', 'Angkat lengan ke samping, turunkan perlahan.',
    orang('L54 56 L56 72', 'L30 34 L14 30', 'M40 66 Q16 58 14 38 M14 38 L12 45 M14 38 L20 42')],
];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin:0; width:1240px; height:1754px; background:#fbfaf6; font-family: 'Segoe UI', Arial, sans-serif; color:#1d1d1d; }
  .hal { padding: 90px 100px; }
  h1 { font-size: 54px; margin: 0 0 8px; letter-spacing: .5px; }
  .sub { font-size: 28px; color:#444; margin-bottom: 36px; }
  .isian { display:flex; gap:40px; font-size:28px; margin-bottom: 40px; }
  .isian span { border-bottom: 2px solid #555; padding: 0 16px 4px 4px; }
  .lat { display:flex; gap:40px; align-items:center; border-top: 2px solid #ccc; padding: 26px 0; }
  .lat h2 { font-size: 38px; margin: 0 0 6px; }
  .lat .jml { font-size: 30px; font-weight: 700; margin-bottom: 8px; }
  .lat p { font-size: 27px; margin: 0 0 16px; color:#333; }
  .kotak { display:flex; gap:12px; }
  .kotak i { width:44px; height:44px; border:2px solid #555; display:inline-block; }
  .catatan { border-top: 2px solid #ccc; padding-top: 26px; font-size: 27px; color:#333; }
  .catatan b { display:block; font-size: 30px; margin-bottom: 8px; color:#1d1d1d; }
</style></head><body><div class="hal">
  <h1>Program Latihan di Rumah</h1>
  <div class="sub">Lakukan pelan pelan. Berhenti bila nyeri atau pusing.</div>
  <div class="isian"><div>Nama: <span>Pak Budi</span></div><div>Frekuensi: <span>5 hari / minggu</span></div></div>
  ${LATIHAN.map(([nama, jml, cara, svg]) => `<div class="lat">${svg}<div><h2>${nama}</h2><div class="jml">${jml}</div><p>${cara}</p>
    <div class="kotak">${'<i></i>'.repeat(7)}</div></div></div>`).join('')}
  <div class="catatan"><b>Catatan</b>Duduk di kursi kokoh bersandaran. Centang kotak setiap hari selesai latihan.</div>
</div></body></html>`;

mkdirSync(dirname(KELUAR), { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.screenshot({ path: KELUAR });
await browser.close();
console.log('Tersimpan:', KELUAR);
