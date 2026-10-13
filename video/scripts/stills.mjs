// Merender still PNG ke video/out/stills/ untuk audit jeda 30 detik (Bab 14.2).
// Bawaan: setiap 30 detik (0:30, 1:00, ...), semua momen screenshot di timeline.ts, dan detik 5 & 297.
// Pakai: npm run still                 (bawaan)
//        npm run still -- 12 96.5      (detik tertentu)
//        npm run still -- --tanpa-subtitle
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { ADEGAN, FPS, TOTAL_DETIK, TOTAL_FRAME, namaStill } from '../src/timeline.ts';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const keluar = join(akar, 'out', 'stills');
mkdirSync(keluar, { recursive: true });

const argumen = process.argv.slice(2);
const inputProps = { subtitle: !argumen.includes('--tanpa-subtitle') };
const diminta = argumen.filter((a) => !a.startsWith('--')).map(Number);
if (diminta.some((d) => !Number.isFinite(d))) {
  console.error('Argumen harus berupa detik, contoh: npm run still -- 12 96.5');
  process.exit(1);
}
const tiap30 = Array.from({ length: Math.floor((TOTAL_DETIK - 1) / 30) }, (_, i) => (i + 1) * 30);
const detik = diminta.length
  ? diminta
  : [...new Set([...tiap30, ...ADEGAN.filter((a) => a.momen).map((a) => a.momen.detik), 5, 297])].sort((a, b) => a - b);

console.log('Membundel komposisi...');
const serveUrl = await bundle({ entryPoint: join(akar, 'src', 'index.ts'), publicDir: join(akar, 'public') });
const composition = await selectComposition({ serveUrl, id: 'PulihinDemo', inputProps });

for (const d of detik) {
  const frame = Math.min(Math.round(d * FPS), TOTAL_FRAME - 1);
  const output = join(keluar, namaStill(d));
  await renderStill({ composition, serveUrl, output, frame, inputProps, imageFormat: 'png' });
  console.log(`  ${String(d).padStart(5)} dtk (frame ${frame}) -> out/stills/${namaStill(d)}`);
}
console.log(`Selesai: ${detik.length} still.`);
