// Musik latar instrumental (Google Lyria 3 Pro lewat OpenRouter) untuk video demo.
//
//   npm run musik                 (buat public/audio/musik/latar-1.mp3 bila belum ada)
//   npm run musik -- --paksa
//   npm run musik -- --analisis   (juri audio Gemini: vokal? struktur? akhir? -> indeks.json)
//
// Satu skor ±3 menit (latar-1). Video ±4:40 menyusun skor itu menjadi beberapa segmen dengan crossfade di
// pergantian bab (MUSIK di src/suara.ts): bab 1-3 berurutan, bab 4-5 mengulang bagian hangat lalu outro aslinya.
// Dua percobaan "bagian kedua" (dengan dan tanpa suling) ditolak karena juri audio mendengar suara mirip
// paduan suara/vokal; keduanya tidak dipakai (catatan di indeks.json). Lyria 3 Pro lewat OpenRouter mewajibkan
// stream: true; audio datang sebagai potongan base64. Biaya per lagu (usage.cost) dicatat di indeks.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bacaArgumen } from './lib/peramban.mjs';
import { H_OPENROUTER } from './lib/openrouter.mjs';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(akar, 'public', 'audio', 'musik');
mkdirSync(dir, { recursive: true });
const opsi = bacaArgumen(process.argv.slice(2));
const jalurIndeks = join(dir, 'indeks.json');
const indeks = existsSync(jalurIndeks) ? JSON.parse(readFileSync(jalurIndeks, 'utf8')) : { bagian: {} };

const GAYA = `Instrumental only, absolutely no vocals, no choir, no humming, no lyrics. A premium, calm, warm cinematic underscore for a documentary-style product film about a family helping an elderly Indonesian father do stroke rehabilitation exercises at home. Tempo about 72 BPM, D major, intimate and hopeful, never sentimental or dramatic.
Instrumentation: felt upright piano as the lead, soft legato string ensemble (violins, violas, cellos), warm sustained pads, and a subtle Indonesian texture: a gentle gamelan-like metallophone (gender / bonang colour, pentatonic slendro-flavoured motifs) and a soft suling bamboo flute used sparingly. No drums, no heavy percussion, no electronic beats, no risers or hits.`;
const AKHIR = 'Keep dynamics moderate throughout so it can sit under narration; leave space in the mid frequencies for a spoken voice.';

/** Prompt persis yang menghasilkan latar-1.mp3 (meminta 4:40; Lyria memberi 3:01). */
const BAGIAN = {
  'latar-1': `${GAYA.replace('for a documentary-style', 'for a 4 minute 40 second documentary-style')}
Structure with timestamps:
[0:00-0:45] Quiet, reflective opening: sparse piano notes over a soft pad, a few distant metallophone tones. Restrained and slightly pensive.
[0:45-1:50] Gentle lift: piano motif becomes steadier, light pizzicato strings, warm and encouraging.
[1:50-2:50] Focused and steady: soft rhythmic piano ostinato, cellos underneath, calm forward motion.
[2:50-3:50] Tender family warmth: strings bloom softly, suling flute phrase answers the piano.
[3:50-4:40] Hopeful resolution: full but gentle strings and piano, metallophone shimmer, then a soft, clean ending on a sustained D major chord that fades out naturally.
${AKHIR}`,
};

const H = H_OPENROUTER();

const buat = async (nama) => {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ model: 'google/lyria-3-pro-preview', modalities: ['text', 'audio'], stream: true, messages: [{ role: 'user', content: BAGIAN[nama] }] }),
  });
  if (!r.ok) throw new Error(`Lyria ${r.status}: ${(await r.text()).slice(0, 400)}`);
  const teks = await r.text();
  const potongan = [];
  let struktur = '';
  let biaya = null;
  let galat = null;
  for (const baris of teks.split('\n')) {
    if (!baris.startsWith('data: ') || baris === 'data: [DONE]') continue;
    const j = JSON.parse(baris.slice(6));
    const d = j.choices?.[0]?.delta ?? {};
    if (d.audio?.data) potongan.push(d.audio.data);
    if (typeof d.content === 'string') struktur += d.content;
    if (j.usage?.cost != null) biaya = j.usage.cost;
    if (j.error) galat = j.error.message;
  }
  if (!potongan.length) throw new Error(`${nama}: respons tanpa audio (${galat ?? 'tanpa pesan'}); kegagalan tidak ditagih`);
  writeFileSync(join(dir, `${nama}.mp3`), Buffer.concat(potongan.map((p) => Buffer.from(p, 'base64'))));
  indeks.bagian[nama] = { model: 'google/lyria-3-pro-preview', biayaUsd: biaya, struktur: struktur.slice(0, 3000), prompt: BAGIAN[nama], dibuat: new Date().toISOString() };
  console.log(`  ${nama}.mp3 dibuat, biaya $${biaya ?? '?'}`);
};

const paksa = typeof opsi.paksa === 'string' ? new Set(opsi.paksa.split(',')) : opsi.paksa ? new Set(Object.keys(BAGIAN)) : new Set();
for (const nama of Object.keys(BAGIAN)) {
  if (existsSync(join(dir, `${nama}.mp3`)) && !paksa.has(nama)) continue;
  for (let percobaan = 1; ; percobaan++) {
    try {
      await buat(nama);
      break;
    } catch (e) {
      if (percobaan >= 3) throw e;
      console.warn(`  ${e.message}; mencoba lagi`);
    }
  }
}

if (opsi.analisis) {
  for (const nama of Object.keys(BAGIAN)) {
    const data = readFileSync(join(dir, `${nama}.mp3`)).toString('base64');
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({
        model: 'google/gemini-3.5-flash',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'You are a film music editor. Listen to this score. Reply ONLY JSON: {"vokal": bool (any singing, humming, choir or spoken words), "instrumen": [..], "suasana": short, "bagian": [{"mulai": "m:ss", "selesai": "m:ss", "isi": short}], "akhir": "how it ends (fade, sustained chord, abrupt cut)", "masalah": [problems for use under narration: loud swells, abrupt changes, clipping]}',
              },
              { type: 'input_audio', input_audio: { data, format: 'mp3' } },
            ],
          },
        ],
      }),
    });
    const isi = (await r.json()).choices?.[0]?.message?.content ?? '{}';
    indeks.bagian[nama] = { ...indeks.bagian[nama], analisis: JSON.parse(isi.slice(isi.indexOf('{'), isi.lastIndexOf('}') + 1)) };
    console.log(`${nama}: ${JSON.stringify(indeks.bagian[nama].analisis)}`);
  }
}
writeFileSync(jalurIndeks, `${JSON.stringify(indeks, null, 2)}\n`);
