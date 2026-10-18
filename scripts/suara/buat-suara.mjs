#!/usr/bin/env node
/**
 * Generator klip suara petunjuk PULIHIN: ElevenLabs Eleven v4 lewat OpenRouter, suara Matilda.
 *
 *   OPENROUTER_API_KEY=... node scripts/suara/buat-suara.mjs [--qa] [--dengar] [--paksa=<regex>]
 *
 * 1. Daftar segmen diambil dari `semuaUcapan()` (src/features/suara/semuaUcapan.ts) lewat Vite ssrLoadModule,
 *    jadi kalimat yang dibangkitkan PERSIS kalimat yang diucapkan aplikasi.
 * 2. Tiap segmen yang belum punya klip: tag ekspresi Eleven v4 sesuai gaya + teks -> OpenRouter
 *    (paralel <= 4, ulang dengan jeda pada 429/5xx) -> ffmpeg (potong hening awal/akhir, keras suara seragam
 *    -18 LUFS, mono 44,1 kHz, MP3 64 kbps) -> `public/suara/<kunci>-<isi>.mp3`. `kunci` = hash
 *    (teks|gaya|suara|VERSI_TAG), `isi` = hash berkas: nama berubah setiap kali isinya berubah, sehingga cache
 *    CacheFirst di perangkat tidak pernah memutar klip lama.
 * 3. Katalog `src/features/suara/katalogSuara.json` (teks -> { berkas, ms }) ditulis ulang; klip yatim dihapus.
 * 4. --qa: setiap klip ditranskripsi buta oleh juri audio (Gemini). Yang tidak cocok dibuat ulang (maks. 2x),
 *    lalu laporan `scripts/suara/laporan-qa.md` ditulis. Hasil per berkas disimpan di `scripts/suara/qa.json`
 *    agar klip yang sudah lulus tidak dinilai ulang.
 * 5. --dengar: juri mendengar 10 klip sampel dan menilai kehangatan/kealamian (catatan masuk laporan).
 * --paksa=<regex>: buat ulang segmen yang teksnya cocok walau klipnya sudah ada.
 * --ulang-gagal (dengan --qa): klip yang transkripsi butanya belum cocok dinilai ulang (dan dibuat ulang maks. 2x lagi).
 *
 * Kunci API hanya dibaca dari lingkungan, tidak pernah dicetak atau ditulis.
 */

import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DIR_SUARA = join(AKAR, 'public/suara');
const BERKAS_KATALOG = join(AKAR, 'src/features/suara/katalogSuara.json');
const BERKAS_QA = join(AKAR, 'scripts/suara/qa.json');
const BERKAS_LAPORAN = join(AKAR, 'scripts/suara/laporan-qa.md');

const API = 'https://openrouter.ai/api/v1';
const MODEL = 'elevenlabs/eleven-v4';
const SUARA = 'matilda';
const JURI = 'google/gemini-3.5-flash';
/** Naikkan bila olah ffmpeg berubah: semua klip dibuat ulang (perubahan TAG/masukan sudah ikut kunci per segmen). */
const VERSI_TAG = 'v1';
/** Harga Eleven v4 lewat OpenRouter per karakter masukan termasuk tag (USD; terukur Okt 2026: $0,00124 / 32 karakter). */
const HARGA_PER_KARAKTER = 0.00003875;
const PARALEL = 4;
const MAKS_BUAT_ULANG = 2;
const TARGET_LUFS = -18;
const PUNCAK_DB = -1.5;

/**
 * Tag ekspresi Eleven v4 per gaya (lihat GayaSuara di ucapan.ts). Tag tidak diucapkan, hanya mengarahkan.
 * Masukan pendek (angka, kata tunggal, suku kata) diberi `[Indonesian accent]`: tanpa itu model kadang membaca
 * dengan lafal asing ("meja" -> "meha", "pi-ring" -> "hearing"). Uji coba: lebih sedikit salah lafal dan ulangan.
 */
const TAG = {
  hitung: '[Indonesian accent] [confidently]',
  arahan: '[warmly]',
  koreksi: '[warmly]',
  pujian: '[cheerfully]',
  lembut: '[gently]',
  kata: '[Indonesian accent] [slowly]',
  sukuKata: '[Indonesian accent] [slowly]',
  kalimat: '[warmly]',
};

const argumen = new Set(process.argv.slice(2).filter((a) => !a.startsWith('--paksa=')));
const polaPaksa = process.argv.find((a) => a.startsWith('--paksa='))?.slice('--paksa='.length);
const paksa = polaPaksa ? new RegExp(polaPaksa) : null;

const KUNCI = process.env.OPENROUTER_API_KEY;
if (!KUNCI) {
  console.error('OPENROUTER_API_KEY belum diatur.');
  process.exit(1);
}
const HEADER = { Authorization: `Bearer ${KUNCI}`, 'Content-Type': 'application/json' };

const hash = (isi, n) => createHash('sha256').update(isi).digest('hex').slice(0, n);

/**
 * Ejaan bantu lafal untuk segmen yang terus dibaca dengan lafal Inggris walau sudah ditandai Indonesia
 * (laporan QA): "air" terbaca "er". Teks segmen (kunci katalog, cadangan speechSynthesis) tidak berubah.
 */
const LAFAL = { 'a. ir. air.': 'a... ir... a-ir.' };

/** Teks dasar untuk model: tag gaya + teks. Kata tunggal berhuruf awal kapital + titik; suku kata berjeda "...". */
function masukanModel({ teks, gaya }) {
  let isi = /[.!?]$/.test(teks) ? teks : `${teks}.`;
  if (gaya === 'kata') isi = isi.charAt(0).toUpperCase() + isi.slice(1);
  if (gaya === 'sukuKata') isi = isi.replace(/\. /g, '... ');
  return `${TAG[gaya]} ${LAFAL[teks] ?? isi}`;
}

/**
 * Masukan yang sungguh dikirim. Masukan sangat pendek (angka, kata tunggal, suku kata) sering diulang model
 * ("ikan ikan", "me me ja meja") atau dilafalkan asing. Didahului kalimat pembawa "Baik..." lalu bagian sebelum
 * jeda pertama dipotong (`jedaPembawa`), keduanya hilang: uji 20/20 benar vs. ±15% gagal tanpa pembawa.
 */
const PEMBAWA = 'Baik...';
const pakaiPembawa = (gaya) => gaya === 'hitung' || gaya === 'kata' || gaya === 'sukuKata';
const masukanTts = (s) => (pakaiPembawa(s.gaya) ? masukanModel(s).replace(TAG[s.gaya], `${TAG[s.gaya]} ${PEMBAWA}`) : masukanModel(s));

/**
 * Kunci klip: berubah bila teks, gaya, suara, masukan dasar (tag), atau versi olah berubah. Pembawa sengaja tidak
 * ikut: klip yang sudah lolos QA tetap berlaku.
 */
const kunciSegmen = (s) => hash(`${s.teks}|${s.gaya}|${SUARA}|${VERSI_TAG}|${masukanModel(s)}`, 12);

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

/** POST ke OpenRouter; galat jaringan/batas waktu (termasuk saat membaca isi), 429, dan 5xx diulang dengan jeda. */
async function panggil(path, body, { biner = false } = {}) {
  for (let coba = 0; ; coba++) {
    let status = 0;
    let teks = '';
    try {
      const res = await fetch(`${API}${path}`, { method: 'POST', headers: HEADER, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) });
      if (res.ok) return biner ? Buffer.from(await res.arrayBuffer()) : await res.json();
      status = res.status;
      teks = (await res.text()).slice(0, 300);
    } catch (e) {
      if (coba >= 5) throw e;
      await tidur(1000 * 2 ** coba);
      continue;
    }
    if ((status === 429 || status >= 500) && coba < 5) {
      await tidur(1000 * 2 ** coba + Math.random() * 500);
      continue;
    }
    throw new Error(`${path}: HTTP ${status} ${teks}`);
  }
}

async function kredit() {
  const res = await fetch(`${API}/credits`, { headers: HEADER });
  const { data } = await res.json();
  return data.total_usage;
}

function jalankan(perintah, args) {
  return new Promise((selesai, gagal) => {
    const p = spawn(perintah, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let keluar = '';
    let galat = '';
    p.stdout.on('data', (d) => (keluar += d));
    p.stderr.on('data', (d) => (galat += d));
    p.on('error', gagal);
    p.on('close', (kode) => (kode === 0 ? selesai({ keluar, galat }) : gagal(new Error(`${perintah} keluar ${kode}: ${galat.slice(-500)}`))));
  });
}

/** Detik akhir jeda pertama setelah pembawa ("Baik..."), atau null bila model tidak memberi jeda. */
async function jedaPembawa(mentah) {
  const sementara = join(tmpdir(), `pulihin-pembawa-${process.pid}-${hash(mentah, 8)}.mp3`);
  writeFileSync(sementara, mentah);
  try {
    const { galat } = await jalankan('ffmpeg', ['-hide_banner', '-nostats', '-i', sementara, '-af', 'silencedetect=n=-38dB:d=0.2', '-f', 'null', '-']);
    const awal = [...galat.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
    const akhir = [...galat.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
    const i = awal.findIndex((s, j) => s > 0.15 && akhir[j] !== undefined);
    return i < 0 ? null : Math.max(0, akhir[i] - 0.03);
  } finally {
    rmSync(sementara, { force: true });
  }
}

/** Potong hening awal/akhir (dan pembawa sebelum `mulai` detik), ukur keras suara, normalkan, kodekan MP3 64 kbps mono. */
async function olah(mentah, keluaran, mulai = 0) {
  const sementara = join(tmpdir(), `pulihin-suara-${process.pid}-${hash(keluaran, 8)}`);
  const wav = `${sementara}.wav`;
  writeFileSync(`${sementara}.mp3`, mentah);
  const potong =
    'silenceremove=start_periods=1:start_threshold=-45dB:detection=peak,areverse,' +
    'silenceremove=start_periods=1:start_threshold=-45dB:detection=peak,areverse,' +
    'afade=t=in:d=0.008,apad=pad_dur=0.06';
  await jalankan('ffmpeg', ['-v', 'error', '-y', '-ss', mulai.toFixed(3), '-i', `${sementara}.mp3`, '-af', potong, '-ac', '1', '-ar', '44100', wav]);
  // Klip pendek ("Satu.") diulang 4x saat diukur agar loudness terintegrasi EBU R128 punya cukup blok 400 ms.
  const { galat } = await jalankan('ffmpeg', ['-hide_banner', '-nostats', '-stream_loop', '3', '-i', wav, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const ringkas = galat.slice(galat.lastIndexOf('Summary:'));
  const lufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(ringkas)?.[1]);
  const puncak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(ringkas)?.[1]);
  if (!Number.isFinite(lufs) || !Number.isFinite(puncak)) throw new Error(`Gagal mengukur keras suara ${keluaran}`);
  // Penguatan dibatasi agar limiter bekerja paling banyak 3 dB pada puncak.
  const gain = Math.min(TARGET_LUFS - lufs, PUNCAK_DB - puncak + 3);
  const batas = 10 ** (PUNCAK_DB / 20);
  await jalankan('ffmpeg', [
    '-v', 'error', '-y', '-i', wav,
    '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=${batas.toFixed(3)}:attack=5:release=50:level=false`,
    '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '64k', '-map_metadata', '-1', '-id3v2_version', '0', keluaran,
  ]);
  const { keluar } = await jalankan('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', keluaran]);
  rmSync(`${sementara}.mp3`, { force: true });
  rmSync(wav, { force: true });
  return Math.round(Number(keluar.trim()) * 1000);
}

let karakterTerkirim = 0;

/**
 * Bangkitkan satu segmen; mengembalikan entri katalog. `ulang` = dibuat ulang karena QA tidak cocok: gaya tanpa
 * `[Indonesian accent]` mendapatkannya (mis. "Cucu" sempat terbaca "kuku").
 */
async function bangkitkan(segmen, ulang = false) {
  const dasar = masukanTts(segmen);
  const input = ulang && !dasar.includes('[Indonesian accent]') ? `[Indonesian accent] ${dasar}` : dasar;
  for (let coba = 0; ; coba++) {
    karakterTerkirim += input.length;
    const mentah = await panggil('/audio/speech', { model: MODEL, input, voice: SUARA, response_format: 'mp3' }, { biner: true });
    const mulai = pakaiPembawa(segmen.gaya) ? await jedaPembawa(mentah) : 0;
    if (mulai === null) {
      if (coba >= 2) throw new Error(`Tidak ada jeda setelah pembawa untuk "${segmen.teks}"`);
      continue;
    }
    const kunci = kunciSegmen(segmen);
    const sementara = join(DIR_SUARA, `${kunci}.tmp.mp3`);
    const ms = await olah(mentah, sementara, mulai);
    const isi = readFileSync(sementara);
    const berkas = `${kunci}-${hash(isi, 6)}.mp3`;
    writeFileSync(join(DIR_SUARA, berkas), isi);
    rmSync(sementara, { force: true });
    return { berkas, ms };
  }
}

async function paralel(daftar, fn, n = PARALEL) {
  const hasil = new Array(daftar.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, daftar.length) }, async () => {
      while (i < daftar.length) {
        const j = i++;
        hasil[j] = await fn(daftar[j], j);
      }
    }),
  );
  return hasil;
}

// ---------------------------------------------------------------------------------------------------------
// QA: transkripsi buta + penilaian dengar

/** Huruf kecil, tanpa tanda baca, tanpa spasi: "kur. si. kursi." == "kursi kursi" == "kur-si kur-si". */
const normal = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const ANGKA = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
/** Juri kadang menulis angka sebagai digit; ubah digit tunggal 0-9 dan 10-50 ke kata. */
function angkaKeKataKasar(s) {
  return s.replace(/\d+/g, (d) => {
    const n = Number(d);
    if (n < 10) return ANGKA[n];
    if (n === 10) return 'sepuluh';
    if (n === 11) return 'sebelas';
    if (n < 20) return `${ANGKA[n - 10]} belas`;
    const sisa = n % 10;
    return `${ANGKA[Math.floor(n / 10)]} puluh${sisa ? ` ${ANGKA[sisa]}` : ''}`;
  });
}

let biayaJuri = 0;

/** Tanya juri audio. Transkripsi cukup tanpa penalaran (`minimal`, ±$0,0003/klip); penilaian memakai `low`. */
async function tanyaJuri(berkas, soal, effort = 'minimal') {
  const data = readFileSync(join(DIR_SUARA, berkas)).toString('base64');
  for (let coba = 0; ; coba++) {
    const j = await panggil('/chat/completions', {
      model: JURI,
      messages: [{ role: 'user', content: [{ type: 'text', text: soal }, { type: 'input_audio', input_audio: { data, format: 'mp3' } }] }],
      response_format: { type: 'json_object' },
      temperature: 0,
      reasoning: { effort },
      usage: { include: true },
    });
    biayaJuri += Number(j.usage?.cost ?? 0);
    const isi = j.choices?.[0]?.message?.content ?? '';
    try {
      return JSON.parse(isi.slice(isi.indexOf('{'), isi.lastIndexOf('}') + 1));
    } catch (e) {
      // Jawaban juri kadang kosong/terpotong: tanya ulang.
      if (coba >= 3) throw new Error(`Jawaban juri tidak terbaca untuk ${berkas}: ${String(isi).slice(0, 200)}`, { cause: e });
      await tidur(1000 * (coba + 1));
    }
  }
}

const SOAL_TRANSKRIPSI =
  'You are a strict Indonesian speech transcriber. Transcribe this Indonesian audio exactly, word for word, ' +
  'exactly as spoken (if a word or syllable is repeated, repeat it; write numbers as Indonesian words). ' +
  'Do not guess or correct. Reply ONLY JSON: {"transkripsi": string, "bahasa_asing_atau_tag_terbaca": boolean, "catatan": string}';

/** Verifikasi kedua bila transkripsi buta tidak cocok: apakah bedanya hanya ejaan (mis. "mie" untuk "mi")? */
const soalBanding = (teks) =>
  'You are a strict native Indonesian listener. The intended Indonesian text is: "' + teks + '". ' +
  'Listen carefully. Does the audio say exactly these words, in this order, with standard Indonesian pronunciation ' +
  '(differences in spelling, punctuation or pauses do not matter; missing, extra, wrong or mispronounced words do)? ' +
  'Reply ONLY JSON: {"sesuai": boolean, "alasan": string (short, Indonesian)}';

async function periksa(segmen, entri) {
  const t = await tanyaJuri(entri.berkas, SOAL_TRANSKRIPSI);
  const transkripsi = String(t.transkripsi ?? '');
  const harap = normal(segmen.teks);
  const dengar = normal(angkaKeKataKasar(transkripsi));
  const tag = Boolean(t.bahasa_asing_atau_tag_terbaca);
  // "kur. si. kursi." boleh terdengar "kursi kursi" (tanpa jeda): pembandingan tanpa spasi menangani itu.
  if (harap === dengar && !tag) return { cocok: true, transkripsi };
  // Transkripsi buta yang lebih panjang dari teks hampir selalu berarti kata/suku kata diulang ("ikan ikan"):
  // cacat nyata bagi pasien afasia, jadi tidak boleh diloloskan oleh juri banding.
  if (dengar.length > harap.length + 1) {
    return { cocok: false, transkripsi, banding: false, alasan: 'Ada kata atau suku kata yang terucap lebih dari yang tertulis (pengulangan).', tag };
  }
  const b = await tanyaJuri(entri.berkas, soalBanding(segmen.teks), 'low');
  return { cocok: false, transkripsi, banding: Boolean(b.sesuai) && !tag, alasan: String(b.alasan ?? ''), tag };
}

const SOAL_DENGAR =
  'You are evaluating a voice prompt for a stroke home-rehabilitation app for elderly Indonesians. Listen. ' +
  'Reply ONLY JSON: {"transkripsi": string, "kehangatan": 1-10, "kealamian": 1-10, "kejelasan_lansia": 1-10, ' +
  '"aksen_indonesia": 1-10, "catatan": string (short, Indonesian: what sounds good or off)}';

// ---------------------------------------------------------------------------------------------------------

async function muatSegmen() {
  const { createServer } = await import('vite');
  const server = await createServer({
    root: AKAR,
    configFile: false,
    logLevel: 'error',
    resolve: { alias: { '@': join(AKAR, 'src') } },
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const mod = await server.ssrLoadModule('/src/features/suara/semuaUcapan.ts');
    return mod.semuaUcapan();
  } finally {
    await server.close();
  }
}

function bacaJson(path, bawaan) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : bawaan;
}

function tulisKatalog(segmen, katalog) {
  const urut = Object.fromEntries(segmen.map((s) => s.teks).sort((a, b) => a.localeCompare(b, 'id')).map((t) => [t, katalog[t]]));
  writeFileSync(BERKAS_KATALOG, `${JSON.stringify(urut, null, 1)}\n`);
}

async function main() {
  mkdirSync(DIR_SUARA, { recursive: true });
  const segmen = await muatSegmen();
  if (argumen.has('--daftar')) {
    const perGaya = {};
    for (const s of segmen) perGaya[s.gaya] = (perGaya[s.gaya] ?? 0) + 1;
    const karakter = segmen.reduce((n, s) => n + masukanTts(s).length, 0);
    for (const s of segmen) console.log(`${s.gaya.padEnd(8)} ${masukanTts(s)}`);
    console.log(perGaya, `${segmen.length} segmen, ${karakter} karakter (perkiraan $${(karakter * HARGA_PER_KARAKTER).toFixed(3)})`);
    return;
  }
  const pakaiAwal = await kredit();
  const katalogLama = bacaJson(BERKAS_KATALOG, {});
  const katalog = {};
  const perlu = [];
  for (const s of segmen) {
    const e = katalogLama[s.teks];
    const masihBerlaku = e && e.berkas.startsWith(`${kunciSegmen(s)}-`) && existsSync(join(DIR_SUARA, e.berkas));
    if (masihBerlaku && !paksa?.test(s.teks)) katalog[s.teks] = e;
    else perlu.push(s);
  }
  console.log(`${segmen.length} segmen; ${perlu.length} perlu dibuat.`);

  let selesai = 0;
  await paralel(perlu, async (s) => {
    katalog[s.teks] = await bangkitkan(s);
    selesai++;
    if (selesai % 20 === 0 || selesai === perlu.length) {
      console.log(`  ${selesai}/${perlu.length}`);
      tulisKatalog(segmen.filter((x) => katalog[x.teks]), katalog);
    }
  });
  tulisKatalog(segmen, katalog);

  const qa = bacaJson(BERKAS_QA, { klip: {}, dengar: [] });
  if (argumen.has('--qa')) {
    const perTeks = new Map(segmen.map((s) => [s.teks, s]));
    const ulangGagal = argumen.has('--ulang-gagal');
    let antre = segmen.filter((s) => {
      const h = qa.klip[katalog[s.teks].berkas];
      return !h || (ulangGagal && !h.cocok);
    });
    console.log(`QA: ${antre.length} klip ditranskripsi.`);
    for (let putaran = 0; antre.length > 0; putaran++) {
      const gagal = [];
      let dinilai = 0;
      await paralel(antre, async (s) => {
        const h = await periksa(s, katalog[s.teks]);
        qa.klip[katalog[s.teks].berkas] = { teks: s.teks, gaya: s.gaya, percobaan: putaran + 1, ...h };
        if (!h.cocok) gagal.push(s);
        if (++dinilai % 25 === 0) {
          console.log(`  QA ${dinilai}/${antre.length}`);
          writeFileSync(BERKAS_QA, `${JSON.stringify(qa, null, 1)}\n`);
        }
      });
      writeFileSync(BERKAS_QA, `${JSON.stringify(qa, null, 1)}\n`);
      if (gagal.length === 0 || putaran >= MAKS_BUAT_ULANG) break;
      console.log(`  putaran ${putaran + 1}: ${gagal.length} tidak cocok, dibuat ulang.`);
      await paralel(gagal, async (s) => {
        const lama = katalog[s.teks].berkas;
        katalog[s.teks] = await bangkitkan(perTeks.get(s.teks), true);
        if (katalog[s.teks].berkas !== lama) rmSync(join(DIR_SUARA, lama), { force: true });
      });
      tulisKatalog(segmen, katalog);
      antre = gagal;
    }
  }

  if (argumen.has('--dengar')) {
    // Sampel tetap: satu atau dua per gaya, mencakup kalimat terpanjang.
    const perGaya = {};
    for (const s of segmen) (perGaya[s.gaya] ??= []).push(s);
    const sampel = Object.values(perGaya)
      .flatMap((d) => [d[0], d.length > 6 ? d[Math.floor(d.length / 2)] : null])
      .filter(Boolean)
      .slice(0, 10);
    qa.dengar = await paralel(sampel, async (s) => ({
      teks: s.teks,
      gaya: s.gaya,
      berkas: katalog[s.teks].berkas,
      ...(await tanyaJuri(katalog[s.teks].berkas, SOAL_DENGAR, 'low')),
    }));
    writeFileSync(BERKAS_QA, `${JSON.stringify(qa, null, 1)}\n`);
  }

  // Bersihkan klip yatim dan hasil QA untuk berkas yang tidak lagi dipakai.
  const dipakai = new Set(Object.values(katalog).map((e) => e.berkas));
  for (const f of readdirSync(DIR_SUARA)) if (!dipakai.has(f)) rmSync(join(DIR_SUARA, f), { force: true });
  for (const b of Object.keys(qa.klip)) if (!dipakai.has(b)) delete qa.klip[b];

  const ukuran = [...dipakai].reduce((n, f) => n + statSync(join(DIR_SUARA, f)).size, 0);
  const totalMs = Object.values(katalog).reduce((n, e) => n + e.ms, 0);
  const pakaiAkhir = await kredit();
  const biaya = {
    tanggal: new Date().toISOString(),
    karakterTts: karakterTerkirim,
    tts: Number((karakterTerkirim * HARGA_PER_KARAKTER).toFixed(4)),
    juri: Number(biayaJuri.toFixed(4)),
    kreditKunci: Number((pakaiAkhir - pakaiAwal).toFixed(4)),
  };
  if (biaya.karakterTts > 0 || biaya.juri > 0) (qa.biaya ??= []).push(biaya);
  writeFileSync(BERKAS_QA, `${JSON.stringify(qa, null, 1)}\n`);
  console.log(
    `Selesai: ${dipakai.size} klip, ${(ukuran / 1024 / 1024).toFixed(2)} MB, ${(totalMs / 60000).toFixed(1)} menit audio. ` +
      `Karakter TTS terkirim ${biaya.karakterTts} (±$${biaya.tts}); juri audio $${biaya.juri}; ` +
      `pemakaian kredit OpenRouter (seluruh kunci) selama run ini $${biaya.kreditKunci}.`,
  );
  if (argumen.has('--qa') || argumen.has('--dengar')) tulisLaporan(segmen, katalog, qa, ukuran, totalMs);
}

function tulisLaporan(segmen, katalog, qa, ukuran, totalMs) {
  const baris = segmen.map((s) => ({ s, h: qa.klip[katalog[s.teks].berkas] }));
  const belumDinilai = baris.filter((b) => !b.h);
  const lulus = baris.filter((b) => b.h?.cocok);
  const lulusBanding = baris.filter((b) => b.h && !b.h.cocok && b.h.banding);
  const gagal = baris.filter((b) => b.h && !b.h.cocok && !b.h.banding);
  const dibuatUlang = baris.filter((b) => (b.h?.percobaan ?? 1) > 1).length;
  const sel = (t) => String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const jumlah = (k) => (qa.biaya ?? []).reduce((n, b) => n + (b[k] ?? 0), 0);
  const out = [
    '# Laporan QA klip suara',
    '',
    `Dibuat oleh \`scripts/suara/buat-suara.mjs\`. Model ${MODEL}, suara ${SUARA}, juri ${JURI} (transkripsi buta).`,
    '',
    `- Klip: ${segmen.length}, ${(ukuran / 1024 / 1024).toFixed(2)} MB di \`public/suara/\`, ${(totalMs / 60000).toFixed(1)} menit audio`,
    `- Transkripsi buta cocok persis: ${lulus.length} (${dibuatUlang} di antaranya setelah dibuat ulang)`,
    `- Transkripsi buta berbeda, tetapi juri yang diberi teks menyatakan sesuai (beda ejaan/jeda): ${lulusBanding.length}`,
    `- Masih tidak cocok setelah ${MAKS_BUAT_ULANG}x dibuat ulang: ${gagal.length}`,
    `- Belum dinilai: ${belumDinilai.length}`,
    `- Biaya tercatat semua run: TTS ±$${jumlah('tts').toFixed(3)} (${jumlah('karakterTts')} karakter), juri $${jumlah('juri').toFixed(3)}`,
    '',
  ];
  if (gagal.length) {
    out.push('## Masih tidak cocok', '', '| Teks | Gaya | Transkripsi juri | Alasan |', '|---|---|---|---|');
    for (const { s, h } of gagal) out.push(`| ${sel(s.teks)} | ${s.gaya} | ${sel(h.transkripsi)} | ${sel(h.alasan)}${h.tag ? ' (tag/bahasa asing terbaca)' : ''} |`);
    out.push('');
  }
  if (lulusBanding.length) {
    out.push('## Beda transkripsi yang dinyatakan sesuai', '', '| Teks | Transkripsi buta | Catatan juri |', '|---|---|---|');
    for (const { s, h } of lulusBanding) out.push(`| ${sel(s.teks)} | ${sel(h.transkripsi)} | ${sel(h.alasan)} |`);
    out.push('');
  }
  if (qa.dengar?.length) {
    out.push('## Uji dengar 10 klip (kehangatan, kealamian)', '', '| Teks | Gaya | Hangat | Alami | Jelas (lansia) | Aksen ID | Catatan |', '|---|---|---|---|---|---|---|');
    for (const d of qa.dengar) out.push(`| ${sel(d.teks)} | ${d.gaya} | ${d.kehangatan} | ${d.kealamian} | ${d.kejelasan_lansia} | ${d.aksen_indonesia} | ${sel(d.catatan)} |`);
    out.push('');
  }
  writeFileSync(BERKAS_LAPORAN, `${out.join('\n')}\n`);
  console.log(`Laporan: ${BERKAS_LAPORAN}`);
}

await main();
