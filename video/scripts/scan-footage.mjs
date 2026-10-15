// Memindai video/public/footage/, video/public/audio/ (rekursif) dan video/blender/out/sesi-meta.json, lalu menulis:
//   src/footage-manifest.json  (berkas yang ada: ukuran, durasi, resolusi; dipakai komposisi)
//   src/terukur.ts             (durasi audio terukur + sesi-meta; dipakai timeline.ts)
// Slot yang kosong dirender sebagai kartu PLACEHOLDER oleh komposisi. Jalankan: npm run scan
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirPublik = join(akar, 'public');
const dirFootage = join(dirPublik, 'footage');
const dirAudio = join(dirPublik, 'audio');
const jalurMeta = join(akar, 'blender', 'out', 'sesi-meta.json');

const EKSTENSI_VIDEO = /\.(mp4|mov|webm|mkv)$/i;
const EKSTENSI_AUDIO = /\.(mp3|wav|m4a|aac)$/i;

/** ffprobe di PATH, atau bawaan Remotion (paket compositor). */
const cariFfprobe = () => {
  const dirRemotion = join(akar, 'node_modules', '@remotion');
  if (existsSync(dirRemotion)) {
    for (const d of readdirSync(dirRemotion)) {
      if (!d.startsWith('compositor-')) continue;
      for (const nama of ['ffprobe.exe', 'ffprobe']) {
        const p = join(dirRemotion, d, nama);
        if (existsSync(p)) return p;
      }
    }
  }
  return 'ffprobe';
};
const ffprobe = cariFfprobe();

const probe = (berkas) => {
  try {
    const keluar = execFileSync(
      ffprobe,
      ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'json', berkas],
      { encoding: 'utf8', env: { ...process.env, LD_LIBRARY_PATH: dirname(ffprobe), DYLD_LIBRARY_PATH: dirname(ffprobe) } },
    );
    const data = JSON.parse(keluar);
    const video = (data.streams ?? []).find((s) => s.width && s.height);
    const durasi = Number.parseFloat(data.format?.duration);
    return {
      durasi: Number.isFinite(durasi) ? Math.round(durasi * 1000) / 1000 : null,
      lebar: video?.width ?? null,
      tinggi: video?.height ?? null,
    };
  } catch {
    return { durasi: null, lebar: null, tinggi: null };
  }
};

/** Berkas yang cocok `pola` di `dir` (rekursif bila diminta); kunci = jalur relatif dengan '/'. */
const pindai = (dir, pola, rekursif = false) => {
  const hasil = {};
  const jalan = (d) => {
    if (!existsSync(d)) return;
    for (const nama of readdirSync(d).sort()) {
      const jalur = join(d, nama);
      if (statSync(jalur).isDirectory()) {
        if (rekursif) jalan(jalur);
        continue;
      }
      if (!pola.test(nama)) continue;
      hasil[relative(dir, jalur).replaceAll('\\', '/')] = { bytes: statSync(jalur).size, ...probe(jalur) };
    }
  };
  jalan(dir);
  return hasil;
};

// ---------- sesi-meta.json (kontrak Blender3D) ----------
const peringatan = [];
let sesiMeta = null;
if (existsSync(jalurMeta)) {
  const m = JSON.parse(readFileSync(jalurMeta, 'utf8'));
  const angka = (v) => typeof v === 'number' && Number.isFinite(v);
  const salah = [];
  if (!angka(m.fps) || !angka(m.durasiDetik)) salah.push('fps/durasiDetik');
  if (!angka(m.siapDetik) || !angka(m.selesaiDetik) || !angka(m.ringkasanDetik)) salah.push('siapDetik/selesaiDetik/ringkasanDetik');
  if (!Array.isArray(m.repetisiDetik) || m.repetisiDetik.length < 5 || !m.repetisiDetik.every(angka)) salah.push('repetisiDetik (>= 5 angka)');
  if (!Array.isArray(m.koreksi) || !m.koreksi.length || !m.koreksi.every((k) => typeof k.teks === 'string' && angka(k.mulaiDetik) && angka(k.selesaiDetik)))
    salah.push('koreksi[] {teks, mulaiDetik, selesaiDetik}');
  if (salah.length) {
    console.error(`sesi-meta.json tidak sesuai kontrak: ${salah.join(', ')}`);
    process.exit(1);
  }
  sesiMeta = {
    fps: m.fps,
    durasiDetik: m.durasiDetik,
    berkas: { layar: m.berkas?.layar ?? 'layar-02-sesi-tekuk-siku.mp4', lebar: m.berkas?.lebar ?? 'kamera-sesi-lebar.mp4' },
    siapDetik: m.siapDetik,
    repetisiDetik: m.repetisiDetik,
    koreksi: m.koreksi.map((k) => ({ teks: k.teks, mulaiDetik: k.mulaiDetik, selesaiDetik: k.selesaiDetik })),
    selesaiDetik: m.selesaiDetik,
    ringkasanDetik: m.ringkasanDetik,
    ...(Array.isArray(m.ketukanDetik) && m.ketukanDetik.every(angka) ? { ketukanDetik: m.ketukanDetik } : {}),
  };
} else {
  peringatan.push('blender/out/sesi-meta.json belum ada: adegan sesi kamera memakai PERKIRAAN (hanya untuk draf)');
}

// ---------- Tulis manifest dan terukur.ts ----------
const footage = pindai(dirFootage, EKSTENSI_VIDEO);
const audio = pindai(dirAudio, EKSTENSI_AUDIO, true);
writeFileSync(join(akar, 'src', 'footage-manifest.json'), `${JSON.stringify({ dipindai: new Date().toISOString(), footage, audio }, null, 2)}\n`);

const durasiAudio = Object.fromEntries(
  Object.entries(audio)
    .filter(([, v]) => v.durasi != null)
    .map(([k, v]) => [`audio/${k}`, v.durasi]),
);
writeFileSync(
  join(akar, 'src', 'terukur.ts'),
  [
    '// DIBUAT OTOMATIS oleh `npm run scan` (scripts/scan-footage.mjs). Jangan disunting.',
    '// Durasi audio terukur (ffprobe) dan isi video/blender/out/sesi-meta.json.',
    "import type { SesiMeta } from './sesi-meta-tipe.ts';",
    '',
    `export const DURASI_AUDIO: Record<string, number> = ${JSON.stringify(durasiAudio, null, 2)};`,
    '',
    `export const SESI_META: SesiMeta | null = ${JSON.stringify(sesiMeta, null, 2)};`,
    '',
  ].join('\n'),
);

// ---------- Laporan (timeline dimuat SETELAH terukur.ts ditulis) ----------
const { ADEGAN, FADE_FRAME, FPS, TOTAL_DETIK, audioBaris, daftarSlot } = await import(
  `${pathToFileURL(join(akar, 'src', 'timeline.ts')).href}?t=${Date.now()}`
);
const slot = daftarSlot();
console.log('Slot rekaman (public/footage/):');
for (const s of slot) {
  const info = footage[s.berkas];
  const butuh = Math.max(
    ...s.adegan.map((a) => {
      const sl = a.kamera?.berkas === s.berkas ? a.kamera : a.layar;
      return sl.mulaiDi + (a.selesai - a.mulai) + FADE_FRAME / FPS;
    }),
  );
  const status = info ? 'ADA     ' : 'KOSONG  ';
  const durasi = info?.durasi != null ? `${info.durasi.toFixed(1)} dtk` : info ? 'durasi ?' : '';
  console.log(`  ${status}${s.berkas.padEnd(34)} butuh >= ${butuh.toFixed(1)} dtk ${durasi}`);
  if (info?.durasi != null && info.durasi < butuh) {
    peringatan.push(`${s.berkas}: durasi ${info.durasi.toFixed(1)} dtk < ${butuh.toFixed(1)} dtk (frame terakhir akan dibekukan)`);
  }
  if (info && s.slot.jenis === 'layar' && info.lebar && info.tinggi && info.tinggi < info.lebar) {
    peringatan.push(`${s.berkas}: rekaman layar mendatar (${info.lebar}x${info.tinggi}); harus tegak`);
  }
  if (info && s.slot.jenis !== 'layar' && info.lebar && info.tinggi && info.tinggi > info.lebar) {
    peringatan.push(`${s.berkas}: rekaman ${s.slot.jenis} tegak (${info.lebar}x${info.tinggi}); harus mendatar 16:9`);
  }
  if (info?.lebar && info.lebar > (s.slot.jenis === 'layar' ? 720 : 1920)) {
    peringatan.push(`${s.berkas}: lebar ${info.lebar} px; perkecil (ponsel <= 720, lainnya <= 1920) agar render hemat memori`);
  }
}
const dikenal = new Set(slot.map((s) => s.berkas));
for (const nama of Object.keys(footage)) {
  if (!dikenal.has(nama)) peringatan.push(`public/footage/${nama} tidak dipakai timeline.ts`);
}

const baris = ADEGAN.flatMap((a) => a.narasi);
const adaAudio = baris.filter((b) => audio[audioBaris(b).replace(/^audio\//, '')]);
console.log(`\nNarasi: ${adaAudio.length}/${baris.length} baris punya audio terukur.`);
for (const b of baris) if (!adaAudio.includes(b)) peringatan.push(`audio ${audioBaris(b)} belum ada (durasi diperkirakan; jalankan npm run narasi)`);
console.log(`Sesi kamera: ${sesiMeta ? 'sesi-meta.json (terukur)' : 'PERKIRAAN'}`);
const ada = slot.filter((s) => footage[s.berkas]).length;
console.log(`Ringkasan: ${ada}/${slot.length} slot rekaman terisi. Durasi video ${TOTAL_DETIK.toFixed(1)} dtk.`);
if (peringatan.length) {
  console.log('\nPeringatan:');
  for (const p of peringatan) console.log(`  - ${p}`);
}
