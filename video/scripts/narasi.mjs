// Membuat narasi sintetis satu MP3 per baris narator dari src/timeline.ts -> public/audio/narasi/<id>.mp3.
// Suara aplikasi TIDAK dibuat di sini: video memakai klip asli aplikasi (public/suara/ di repo aplikasi) pada
// detik yang tercatat saat merekam (data/suara-aplikasi.json, lihat scripts/rekam-layar.mjs dan rekam-sesi.mjs).
// Setelah itu jalankan `npm run scan` (mengukur durasi, timeline mengikuti audio) lalu `npm run srt`.
//
//   npm run narasi                               (penyedia bawaan: openrouter, ElevenLabs Eleven v4)
//   npm run narasi -- --suara=george             (suara Eleven v4 lain; bawaan NARATOR_SUARA)
//   npm run narasi -- --penyedia=azure-edge      (Microsoft neural id-ID lewat modul Python edge-tts)
//   npm run narasi -- --paksa                    (abaikan cache)
//   npm run narasi -- --hanya=N01,N11a
//
// openrouter: POST https://openrouter.ai/api/v1/audio/speech, model elevenlabs/eleven-v4, kunci OPENROUTER_API_KEY.
// Satu permintaan per baris (intonasi utuh), diawali tag nada v4 (`nada` di timeline.ts, bawaan [warmly]).
// azure-edge: per kalimat, disambung dengan jeda tenang. Semua penyedia: ujung hening dipotong, keras disamakan
// (-16 LUFS). Cache: public/audio/narasi/indeks.json (hash teks + suara + setelan); biaya OpenRouter dicatat di sana.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { NARATOR_SUARA, audioBaris, semuaBaris } from '../src/timeline.ts';
import { bacaArgumen, cariFfmpeg } from './lib/peramban.mjs';
import { ttsOpenRouter } from './lib/openrouter.mjs';

const jalankan = promisify(execFile);
const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const publik = join(akar, 'public');
const opsi = bacaArgumen(process.argv.slice(2));
const PENYEDIA = String(opsi.penyedia ?? process.env.NARASI_PENYEDIA ?? 'openrouter');
const ffmpeg = cariFfmpeg();
const PARALEL = 2;

/** Jeda antar kalimat dalam satu baris (detik) bila disintesis per kalimat (azure-edge). */
const JEDA_KALIMAT = 0.42;

const SETELAN = {
  openrouter: { suara: String(opsi.suara ?? NARATOR_SUARA), model: 'elevenlabs/eleven-v4' },
  'azure-edge': { suara: 'id-ID-ArdiNeural', rate: '-10%', pitch: '-2Hz' },
}[PENYEDIA];
if (!SETELAN) {
  console.error(`Penyedia tidak dikenal: ${PENYEDIA} (pilih openrouter atau azure-edge)`);
  process.exit(1);
}

/** Pasca-proses: narator jernih, -16 LUFS, puncak -1,5 dBTP. */
const FILTER = 'highpass=f=70,acompressor=threshold=-20dB:ratio=2:attack=15:release=200,loudnorm=I=-16:TP=-1.5:LRA=7';
const POTONG = 'silenceremove=start_periods=1:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_threshold=-48dB,areverse';

const sintesisEdge = async (teks, keluar) => {
  await jalankan(
    process.env.PYTHON ?? 'python',
    ['-m', 'edge_tts', '--voice', SETELAN.suara, `--rate=${SETELAN.rate}`, `--pitch=${SETELAN.pitch}`, '--text', teks, '--write-media', keluar],
    { env: process.env, maxBuffer: 1 << 24 },
  );
};

const kalimat = (teks) => teks.split(/(?<=[.!?:])\s+/).map((k) => k.trim()).filter(Boolean);

/** Teks yang dikirim: tag nada v4 di awal (tag tidak diucapkan), sisanya teks ucapan. */
const teksV4 = (b) => `[${b.nada ?? 'warmly'}] ${b.ucapan}`;
/**
 * Tarif Eleven v4 di OpenRouter: $0,00004 per karakter masukan (termasuk tag), terverifikasi lewat
 * GET /api/v1/generation (kolom usage). Selisih kredit akun tidak dipakai karena akun dipakai bersama.
 */
const USD_PER_KARAKTER = 0.00004;

const buat = async (baris, keluar) => {
  const kerja = join(tmpdir(), `pulihin-narasi-${baris.id}-${process.pid}`);
  mkdirSync(kerja, { recursive: true });
  try {
    const berkas = [];
    if (PENYEDIA === 'openrouter') {
      const f = join(kerja, 'utuh.mp3');
      await ttsOpenRouter(teksV4(baris), SETELAN.suara, f, { model: SETELAN.model });
      berkas.push(f);
    } else {
      for (const [i, k] of kalimat(baris.ucapan).entries()) {
        const f = join(kerja, `k${i}.mp3`);
        await sintesisEdge(k, f);
        berkas.push(f);
      }
    }
    // Setiap bagian: potong hening di awal/akhir, lalu sambung dengan jeda tetap.
    const masukan = berkas.flatMap((f) => ['-i', f]);
    const rantai = berkas.map((_, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=mono,${POTONG}[p${i}]`);
    const sambung = [];
    berkas.forEach((_, i) => {
      sambung.push(`[p${i}]`);
      if (i < berkas.length - 1) {
        rantai.push(`anullsrc=r=44100:cl=mono,atrim=duration=${JEDA_KALIMAT}[j${i}]`);
        sambung.push(`[j${i}]`);
      }
    });
    const graf = `${rantai.join(';')};${sambung.join('')}concat=n=${sambung.length}:v=0:a=1,${FILTER},aresample=44100[a]`;
    await jalankan(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...masukan, '-filter_complex', graf, '-map', '[a]', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '160k', keluar], {
      maxBuffer: 1 << 24,
    });
  } finally {
    rmSync(kerja, { recursive: true, force: true });
  }
};

const dirNarasi = join(publik, 'audio', 'narasi');
mkdirSync(dirNarasi, { recursive: true });
const jalurIndeks = join(dirNarasi, 'indeks.json');
const indeks = existsSync(jalurIndeks) ? JSON.parse(readFileSync(jalurIndeks, 'utf8')) : {};
const catatanBiaya = indeks._biaya ?? { openrouterUsd: 0, karakter: 0 };

const hanya = opsi.hanya ? new Set(String(opsi.hanya).split(',')) : null;
const baris = semuaBaris();
const tugas = baris
  .filter((b) => !hanya || hanya.has(b.id))
  .map((b) => {
    const keluar = join(publik, audioBaris(b));
    const hash = createHash('sha256')
      .update(JSON.stringify({ PENYEDIA, SETELAN, FILTER, JEDA_KALIMAT, teks: PENYEDIA === 'openrouter' ? teksV4(b) : b.ucapan }))
      .digest('hex')
      .slice(0, 16);
    return { b, keluar, hash, perlu: opsi.paksa || indeks[b.id]?.hash !== hash || !existsSync(keluar) };
  });

const perlu = tugas.filter((t) => t.perlu);
console.log(`Narasi: penyedia ${PENYEDIA}, suara ${SETELAN.suara}, ${perlu.length} dari ${tugas.length} baris dibuat ulang`);
let i = 0;
const pekerja = async () => {
  while (i < tugas.length) {
    const t = tugas[i++];
    if (!t.perlu) continue;
    await buat(t.b, t.keluar);
    indeks[t.b.id] = { hash: t.hash, penyedia: PENYEDIA, suara: SETELAN.suara, teks: PENYEDIA === 'openrouter' ? teksV4(t.b) : t.b.ucapan };
    console.log(`  ${t.b.id.padEnd(6)} ${t.b.ucapan.slice(0, 80)}`);
  }
};
await Promise.all(Array.from({ length: PARALEL }, pekerja));
if (PENYEDIA === 'openrouter' && perlu.length) {
  const karakter = perlu.reduce((s, t) => s + teksV4(t.b).length, 0);
  catatanBiaya.karakter += karakter;
  catatanBiaya.openrouterUsd = Math.round(catatanBiaya.karakter * USD_PER_KARAKTER * 10000) / 10000;
  console.log(`Biaya OpenRouter putaran ini $${(karakter * USD_PER_KARAKTER).toFixed(4)} (${karakter} karakter); total narasi $${catatanBiaya.openrouterUsd}`);
}
indeks._biaya = catatanBiaya;

// Buang audio baris yang sudah tidak ada di timeline.
const dikenal = new Set(baris.map((b) => b.id));
for (const f of readdirSync(dirNarasi)) {
  const id = f.replace(/\.mp3$/, '');
  if (f.endsWith('.mp3') && !dikenal.has(id)) {
    rmSync(join(dirNarasi, f));
    delete indeks[id];
    console.log(`  dihapus: audio/narasi/${f}`);
  }
}
writeFileSync(jalurIndeks, `${JSON.stringify(indeks, null, 2)}\n`);
console.log('Selesai. Lanjutkan: npm run scan && npm run srt');
