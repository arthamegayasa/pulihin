// Membuat narasi sintetis satu MP3 per baris dari src/timeline.ts:
//   narator          -> public/audio/narasi/<id>.mp3
//   suara aplikasi   -> public/audio/aplikasi/<id>.mp3 (disuarakan ulang: kata persis, warna speaker ponsel)
// Setelah itu jalankan `npm run scan` (mengukur durasi, timeline mengikuti audio) lalu `npm run srt`.
//
//   npm run narasi                               (penyedia bawaan: azure-edge, Microsoft neural id-ID)
//   npm run narasi -- --penyedia=elevenlabs      (ELEVENLABS_API_KEY_TTS atau ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID)
//   npm run narasi -- --paksa                    (abaikan cache)
//   npm run narasi -- --hanya=N01,N11-app
//
// azure-edge butuh modul Python `edge-tts` (`pip install edge-tts`; PYTHONPATH diteruskan) dan ffmpeg.
// Setiap kalimat disintesis terpisah lalu disambung dengan jeda tenang, ujung hening dipotong, dan
// kerasnya disamakan (loudnorm). Cache: public/audio/narasi/indeks.json (hash teks + suara + setelan).
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { audioBaris, semuaBaris } from '../src/timeline.ts';
import { bacaArgumen, cariFfmpeg } from './lib/peramban.mjs';

const jalankan = promisify(execFile);
const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const publik = join(akar, 'public');
const opsi = bacaArgumen(process.argv.slice(2));
const PENYEDIA = String(opsi.penyedia ?? process.env.NARASI_PENYEDIA ?? 'azure-edge');
const ffmpeg = cariFfmpeg();
const PARALEL = 2;

/** Jeda antar kalimat dalam satu baris (detik): napas tenang. */
const JEDA_KALIMAT = 0.42;

const SUARA = {
  'azure-edge': {
    narator: { suara: 'id-ID-ArdiNeural', rate: '-10%', pitch: '-2Hz' },
    aplikasi: { suara: 'id-ID-GadisNeural', rate: '-6%', pitch: '+0Hz' },
  },
  elevenlabs: {
    narator: { suara: process.env.ELEVENLABS_VOICE_ID ?? '', model: 'eleven_multilingual_v2' },
    aplikasi: { suara: process.env.ELEVENLABS_VOICE_ID_APLIKASI ?? process.env.ELEVENLABS_VOICE_ID ?? '', model: 'eleven_multilingual_v2' },
  },
}[PENYEDIA];
if (!SUARA) {
  console.error(`Penyedia tidak dikenal: ${PENYEDIA} (pilih azure-edge atau elevenlabs)`);
  process.exit(1);
}

/** Pasca-proses: narator jernih -16 LUFS; aplikasi = speaker ponsel (pita sempit, sedikit kompresi). */
const FILTER = {
  narator: 'highpass=f=70,acompressor=threshold=-20dB:ratio=2:attack=15:release=200,loudnorm=I=-16:TP=-1.5:LRA=7',
  aplikasi:
    'highpass=f=480,lowpass=f=3600,equalizer=f=1900:t=q:w=1.2:g=5,acompressor=threshold=-24dB:ratio=4:attack=5:release=120,loudnorm=I=-20:TP=-2:LRA=5',
};

const sintesisEdge = async (teks, setelan, keluar) => {
  await jalankan(
    process.env.PYTHON ?? 'python',
    ['-m', 'edge_tts', '--voice', setelan.suara, `--rate=${setelan.rate}`, `--pitch=${setelan.pitch}`, '--text', teks, '--write-media', keluar],
    { env: process.env, maxBuffer: 1 << 24 },
  );
};

const sintesisElevenLabs = async (teks, setelan, keluar) => {
  const kunci = process.env.ELEVENLABS_API_KEY_TTS ?? process.env.ELEVENLABS_API_KEY;
  if (!kunci || !setelan.suara) throw new Error('ElevenLabs butuh ELEVENLABS_API_KEY_TTS/ELEVENLABS_API_KEY dan ELEVENLABS_VOICE_ID');
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${setelan.suara}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': kunci, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: teks,
      model_id: setelan.model,
      language_code: 'id',
      voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.1, speed: 0.93 },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  writeFileSync(keluar, Buffer.from(await r.arrayBuffer()));
};

const sintesis = PENYEDIA === 'elevenlabs' ? sintesisElevenLabs : sintesisEdge;

const kalimat = (teks) => teks.split(/(?<=[.!?:])\s+/).map((k) => k.trim()).filter(Boolean);

const buat = async (baris, jenis, keluar) => {
  const setelan = SUARA[jenis];
  const kerja = join(tmpdir(), `pulihin-narasi-${baris.id}-${process.pid}`);
  mkdirSync(kerja, { recursive: true });
  try {
    const bagian = kalimat(baris.ucapan);
    const berkas = [];
    for (const [i, k] of bagian.entries()) {
      const f = join(kerja, `k${i}.mp3`);
      await sintesis(k, setelan, f);
      berkas.push(f);
    }
    // Setiap kalimat: potong hening di awal/akhir, lalu sambung dengan jeda tetap.
    const masukan = berkas.flatMap((f) => ['-i', f]);
    const potong = 'silenceremove=start_periods=1:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_threshold=-48dB,areverse';
    const rantai = berkas.map((_, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=mono,${potong}[p${i}]`);
    const sambung = [];
    berkas.forEach((_, i) => {
      sambung.push(`[p${i}]`);
      if (i < berkas.length - 1) {
        rantai.push(`anullsrc=r=44100:cl=mono,atrim=duration=${JEDA_KALIMAT}[j${i}]`);
        sambung.push(`[j${i}]`);
      }
    });
    const graf = `${rantai.join(';')};${sambung.join('')}concat=n=${sambung.length}:v=0:a=1,${FILTER[jenis]},aresample=44100[a]`;
    await jalankan(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...masukan, '-filter_complex', graf, '-map', '[a]', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '160k', keluar], {
      maxBuffer: 1 << 24,
    });
  } finally {
    rmSync(kerja, { recursive: true, force: true });
  }
};

const dirIndeks = join(publik, 'audio', 'narasi');
mkdirSync(dirIndeks, { recursive: true });
mkdirSync(join(publik, 'audio', 'aplikasi'), { recursive: true });
const jalurIndeks = join(dirIndeks, 'indeks.json');
const indeks = existsSync(jalurIndeks) ? JSON.parse(readFileSync(jalurIndeks, 'utf8')) : {};

const hanya = opsi.hanya ? new Set(String(opsi.hanya).split(',')) : null;
const baris = semuaBaris();
const tugas = baris
  .filter((b) => !hanya || hanya.has(b.id))
  .map((b) => {
    const jenis = b.pembicara === 'Suara aplikasi (disuarakan ulang)' ? 'aplikasi' : 'narator';
    const keluar = join(publik, audioBaris(b));
    const hash = createHash('sha256')
      .update(JSON.stringify({ PENYEDIA, setelan: SUARA[jenis], filter: FILTER[jenis], JEDA_KALIMAT, ucapan: b.ucapan }))
      .digest('hex')
      .slice(0, 16);
    return { b, jenis, keluar, hash, perlu: opsi.paksa || indeks[b.id]?.hash !== hash || !existsSync(keluar) };
  });

let i = 0;
const pekerja = async () => {
  while (i < tugas.length) {
    const t = tugas[i++];
    if (!t.perlu) continue;
    await buat(t.b, t.jenis, t.keluar);
    indeks[t.b.id] = { hash: t.hash, penyedia: PENYEDIA, suara: SUARA[t.jenis].suara, ucapan: t.b.ucapan };
    console.log(`  ${t.b.id.padEnd(8)} ${t.jenis.padEnd(9)} ${t.b.ucapan.slice(0, 70)}`);
  }
};
console.log(`Narasi: penyedia ${PENYEDIA}, ${tugas.filter((t) => t.perlu).length} dari ${tugas.length} baris dibuat ulang`);
await Promise.all(Array.from({ length: PARALEL }, pekerja));

// Buang audio baris yang sudah tidak ada di timeline.
const dikenal = new Set(baris.map((b) => b.id));
for (const dir of ['narasi', 'aplikasi']) {
  for (const f of readdirSync(join(publik, 'audio', dir))) {
    const id = f.replace(/\.mp3$/, '');
    if (f.endsWith('.mp3') && !dikenal.has(id)) {
      rmSync(join(publik, 'audio', dir, f));
      delete indeks[id];
      console.log(`  dihapus: audio/${dir}/${f}`);
    }
  }
}
writeFileSync(jalurIndeks, `${JSON.stringify(indeks, null, 2)}\n`);
console.log('Selesai. Lanjutkan: npm run scan && npm run srt');
