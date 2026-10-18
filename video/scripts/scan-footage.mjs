// Memindai video/public/footage/, video/public/audio/ (rekursif), video/data/sesi-meta.json dan
// video/data/suara-aplikasi.json, lalu menulis:
//   src/footage-manifest.json  (berkas yang ada: ukuran, durasi, resolusi; dipakai komposisi)
//   src/terukur.ts             (durasi audio, kekerasan musik/suara video AI, sesi-meta, suara aplikasi; dipakai timeline.ts)
// dan menyiapkan public/audio/aplikasi/<klip>: salinan klip suara ASLI aplikasi (../public/suara/<klip>) yang
// benar-benar berbunyi saat merekam, dengan warna speaker ponsel tipis (pita 240 Hz-7 kHz, sedikit presence).
// Slot yang kosong dirender sebagai kartu PLACEHOLDER oleh komposisi. Jalankan: npm run scan
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cariFfmpeg } from './lib/peramban.mjs';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirPublik = join(akar, 'public');
const dirFootage = join(dirPublik, 'footage');
const dirAudio = join(dirPublik, 'audio');
const dirAplikasi = join(dirAudio, 'aplikasi');
const dirSuaraAsli = join(akar, '..', 'public', 'suara');
const jalurMeta = join(akar, 'data', 'sesi-meta.json');
const jalurSuara = join(akar, 'data', 'suara-aplikasi.json');
const ffmpeg = cariFfmpeg();

const EKSTENSI_VIDEO = /\.(mp4|mov|webm|mkv|wav)$/i;
const EKSTENSI_AUDIO = /\.(mp3|wav|m4a|aac)$/i;
/** Warna speaker ponsel tipis untuk suara aplikasi (klip asli -17..-19 LUFS; tanpa normalisasi ulang). */
const FILTER_PONSEL = 'highpass=f=240,lowpass=f=7000,equalizer=f=2600:t=q:w=1.2:g=3,acompressor=threshold=-22dB:ratio=2.5:attack=5:release=120';

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

// ---------- sesi-meta.json (scripts/rekam-sesi.mjs) ----------
const peringatan = [];
let sesiMeta = null;
if (existsSync(jalurMeta)) {
  const m = JSON.parse(readFileSync(jalurMeta, 'utf8'));
  const angka = (v) => typeof v === 'number' && Number.isFinite(v);
  const salah = [];
  if (!angka(m.fps) || !angka(m.durasiDetik) || !angka(m.kameraMulaiDetik)) salah.push('fps/durasiDetik/kameraMulaiDetik');
  if (!angka(m.siapDetik) || !angka(m.selesaiDetik) || !angka(m.ringkasanDetik)) salah.push('siapDetik/selesaiDetik/ringkasanDetik');
  if (!Array.isArray(m.repetisiDetik) || m.repetisiDetik.length < 10 || !m.repetisiDetik.every(angka)) salah.push('repetisiDetik (10 angka)');
  if (!Array.isArray(m.koreksi) || !m.koreksi.length || !m.koreksi.every((k) => typeof k.teks === 'string' && angka(k.mulaiDetik) && angka(k.selesaiDetik)))
    salah.push('koreksi[] {teks, mulaiDetik, selesaiDetik}');
  if (salah.length) {
    console.error(`data/sesi-meta.json tidak sesuai kontrak: ${salah.join(', ')}`);
    process.exit(1);
  }
  sesiMeta = {
    fps: m.fps,
    durasiDetik: m.durasiDetik,
    berkas: { layar: m.berkas?.layar ?? 'layar-02-sesi-tekuk-siku.mp4' },
    kameraMulaiDetik: m.kameraMulaiDetik,
    siapDetik: m.siapDetik,
    repetisiDetik: m.repetisiDetik,
    koreksi: m.koreksi.map((k) => ({ teks: k.teks, mulaiDetik: k.mulaiDetik, selesaiDetik: k.selesaiDetik })),
    selesaiDetik: m.selesaiDetik,
    ringkasanDetik: m.ringkasanDetik,
  };
} else {
  peringatan.push('data/sesi-meta.json belum ada: adegan sesi kamera memakai PERKIRAAN (hanya untuk draf; npm run rekam-sesi)');
}

// ---------- Suara aplikasi: catatan rekaman + salinan berwarna speaker ponsel ----------
const suaraAplikasi = existsSync(jalurSuara) ? JSON.parse(readFileSync(jalurSuara, 'utf8')) : {};
const jalurKetukan = join(akar, 'data', 'ketukan.json');
const ketukan = existsSync(jalurKetukan) ? JSON.parse(readFileSync(jalurKetukan, 'utf8')) : {};
mkdirSync(dirAplikasi, { recursive: true });
const klipDipakai = new Set(Object.values(suaraAplikasi).flatMap((daftar) => daftar.map((k) => k.klip)));
for (const klip of klipDipakai) {
  const sumber = join(dirSuaraAsli, klip);
  const tujuan = join(dirAplikasi, klip);
  if (!existsSync(sumber)) {
    peringatan.push(`suara aplikasi ${klip} tidak ada di public/suara/ aplikasi (klip lama?): rekam ulang`);
    continue;
  }
  if (existsSync(tujuan)) continue;
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', sumber, '-af', FILTER_PONSEL, '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '160k', tujuan]);
}
for (const f of readdirSync(dirAplikasi)) {
  if (!klipDipakai.has(f)) rmSync(join(dirAplikasi, f));
}
for (const [berkas, daftar] of Object.entries(suaraAplikasi)) {
  for (const k of daftar) if (!k.teks) peringatan.push(`${berkas}: klip ${k.klip} tanpa teks katalog (katalog aplikasi berubah?)`);
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

/** Kekerasan (LUFS, ebur128) musik dan suara video AI: komposisi menghitung penguatan dari angka ini. */
const keras = {};
const diukur = [
  ...Object.keys(audio).filter((k) => k.startsWith('musik/')).map((k) => [`audio/${k}`, join(dirAudio, k)]),
  ...Object.keys(footage).filter((k) => k.endsWith('.wav')).map((k) => [`footage/${k}`, join(dirFootage, k)]),
];
for (const [kunci, jalur] of diukur) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-nostats', '-i', jalur, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = r.stderr.split('Summary:').pop().match(/I:\s+(-?[\d.]+) LUFS/);
  if (m) keras[kunci] = Number(m[1]);
  else peringatan.push(`kekerasan ${kunci} tidak terukur`);
}

writeFileSync(
  join(akar, 'src', 'terukur.ts'),
  [
    '// DIBUAT OTOMATIS oleh `npm run scan` (scripts/scan-footage.mjs). Jangan disunting.',
    '// Durasi audio terukur (ffprobe), kekerasan musik/suara video AI (LUFS), data/sesi-meta.json, data/suara-aplikasi.json.',
    "import type { KlipTercatat, SesiMeta } from './sesi-meta-tipe.ts';",
    '',
    `export const DURASI_AUDIO: Record<string, number> = ${JSON.stringify(durasiAudio, null, 2)};`,
    '',
    `export const KERAS_AUDIO: Record<string, number> = ${JSON.stringify(keras, null, 2)};`,
    '',
    `export const SESI_META: SesiMeta | null = ${JSON.stringify(sesiMeta, null, 2)};`,
    '',
    `export const SUARA_APLIKASI: Record<string, KlipTercatat[]> = ${JSON.stringify(suaraAplikasi, null, 1)};`,
    '',
    `export const KETUKAN: Record<string, number[]> = ${JSON.stringify(ketukan)};`,
    '',
    `export const DURASI_FOOTAGE: Record<string, number> = ${JSON.stringify(Object.fromEntries(Object.entries(footage).filter(([, v]) => v.durasi != null).map(([k, v]) => [k, v.durasi])))};`,
    '',
  ].join('\n'),
);

// ---------- Laporan (timeline dimuat SETELAH terukur.ts ditulis) ----------
const { ADEGAN, TOTAL_DETIK, audioBaris, butuhSampai, daftarSlot } = await import(
  `${pathToFileURL(join(akar, 'src', 'timeline.ts')).href}?t=${Date.now()}`
);
const slot = daftarSlot();
console.log('Slot rekaman (public/footage/):');
for (const s of slot) {
  const info = footage[s.berkas];
  const butuh = Math.max(...s.adegan.map((a) => butuhSampai(a, a.kamera?.berkas === s.berkas ? a.kamera : a.layar)));
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
// ai-07-bicara.wav = suara adegan bicara; pov-tekuk-siku.mp4 = pratinjau POV milik FootageAI (kamera palsu memakai y4m).
const dikenal = new Set([...slot.map((s) => s.berkas), 'ai-07-bicara.wav', 'pov-tekuk-siku.mp4']);
for (const nama of Object.keys(footage)) {
  if (!dikenal.has(nama)) peringatan.push(`public/footage/${nama} tidak dipakai timeline.ts`);
}

const baris = ADEGAN.flatMap((a) => a.narasi);
const adaAudio = baris.filter((b) => audio[audioBaris(b).replace(/^audio\//, '')]);
console.log(`\nNarasi: ${adaAudio.length}/${baris.length} baris punya audio terukur.`);
for (const b of baris) if (!adaAudio.includes(b)) peringatan.push(`audio ${audioBaris(b)} belum ada (durasi diperkirakan; jalankan npm run narasi)`);
const jumlahKlip = ADEGAN.reduce((s, a) => s + a.suara.filter((x) => x.sumber === 'aplikasi').length, 0);
console.log(`Suara aplikasi: ${klipDipakai.size} klip asli tercatat, ${jumlahKlip} pemutaran di timeline.`);
console.log(`Sesi kamera: ${sesiMeta ? 'data/sesi-meta.json (terukur)' : 'PERKIRAAN'}`);
console.log(`Kekerasan: ${Object.entries(keras).map(([k, v]) => `${k} ${v} LUFS`).join(', ') || '-'}`);
const ada = slot.filter((s) => footage[s.berkas]).length;
console.log(`Ringkasan: ${ada}/${slot.length} slot rekaman terisi. Durasi video ${TOTAL_DETIK.toFixed(1)} dtk.`);
if (peringatan.length) {
  console.log('\nPeringatan:');
  for (const p of peringatan) console.log(`  - ${p}`);
}
