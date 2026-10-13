// Memindai video/public/footage/ dan video/public/audio/, lalu menulis
// video/src/footage-manifest.json. Slot yang kosong dirender sebagai kartu
// PLACEHOLDER oleh komposisi. Jalankan: npm run scan
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADEGAN,
  AUDIO_MUSIK,
  AUDIO_NARASI_LENGKAP,
  FADE_FRAME,
  FPS,
  audioAdegan,
  daftarSlot,
} from '../src/timeline.ts';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirFootage = join(akar, 'public', 'footage');
const dirAudio = join(akar, 'public', 'audio');
const keluaran = join(akar, 'src', 'footage-manifest.json');

const EKSTENSI_VIDEO = /\.(mp4|mov|webm|mkv)$/i;
const EKSTENSI_AUDIO = /\.(mp3|wav|m4a|aac)$/i;

/** ffprobe bawaan Remotion (paket compositor) atau ffprobe di PATH. */
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
      // Pustaka bersama ffprobe bawaan Remotion berada di folder yang sama (Linux/macOS).
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

const pindai = (dir, pola) => {
  if (!existsSync(dir)) return {};
  const hasil = {};
  for (const nama of readdirSync(dir).sort()) {
    if (!pola.test(nama)) continue;
    const jalur = join(dir, nama);
    hasil[nama] = { bytes: statSync(jalur).size, ...probe(jalur) };
  }
  return hasil;
};

const footage = pindai(dirFootage, EKSTENSI_VIDEO);
const audio = pindai(dirAudio, EKSTENSI_AUDIO);
writeFileSync(keluaran, `${JSON.stringify({ dipindai: new Date().toISOString(), footage, audio }, null, 2)}\n`);

// Laporan
const peringatan = [];
const slot = daftarSlot();
console.log(`Manifest ditulis: ${keluaran}\n`);
console.log('Slot rekaman (public/footage/):');
for (const s of slot) {
  const info = footage[s.berkas];
  const butuh = Math.max(...s.adegan.map((a) => {
    const sl = a.kamera?.berkas === s.berkas ? a.kamera : a.layar;
    return sl.mulaiDi + (a.selesai - a.mulai) + FADE_FRAME / FPS;
  }));
  const status = info ? 'ADA     ' : 'KOSONG  ';
  const durasi = info?.durasi != null ? `${info.durasi.toFixed(1)} dtk` : info ? 'durasi ?' : '';
  console.log(`  ${status}${s.berkas.padEnd(34)} butuh >= ${butuh.toFixed(1)} dtk ${durasi}`);
  if (info?.durasi != null && info.durasi < butuh) {
    peringatan.push(`${s.berkas}: durasi ${info.durasi.toFixed(1)} dtk < ${butuh.toFixed(1)} dtk (frame terakhir akan dibekukan)`);
  }
  if (info && s.slot.jenis === 'layar' && info.lebar && info.tinggi && info.tinggi < info.lebar) {
    peringatan.push(`${s.berkas}: rekaman layar mendatar (${info.lebar}x${info.tinggi}); rekam dalam posisi tegak 1080x2400`);
  }
  if (info && s.slot.jenis === 'kamera' && info.lebar && info.tinggi && info.tinggi > info.lebar) {
    peringatan.push(`${s.berkas}: rekaman kamera tegak (${info.lebar}x${info.tinggi}); rekam mendatar 16:9`);
  }
}
const dikenal = new Set(slot.map((s) => s.berkas));
for (const nama of Object.keys(footage)) {
  if (!dikenal.has(nama)) peringatan.push(`public/footage/${nama} tidak dipakai timeline.ts`);
}

console.log('\nNarasi (public/audio/):');
const master = AUDIO_NARASI_LENGKAP.replace('audio/', '');
console.log(`  ${audio[master] ? 'ADA     ' : 'kosong  '}${master} (berkas tunggal, opsional)`);
for (const a of ADEGAN) {
  if (a.narasi.length === 0) continue;
  const nama = audioAdegan(a.id).replace('audio/', '');
  console.log(`  ${audio[nama] ? 'ADA     ' : 'kosong  '}${nama}`);
}
const musik = AUDIO_MUSIK.replace('audio/', '');
console.log(`  ${audio[musik] ? 'ADA     ' : 'kosong  '}${musik} (musik latar opsional)`);

const ada = slot.filter((s) => footage[s.berkas]).length;
console.log(`\nRingkasan: ${ada}/${slot.length} slot rekaman terisi.`);
if (peringatan.length) {
  console.log('\nPeringatan:');
  for (const p of peringatan) console.log(`  - ${p}`);
}
