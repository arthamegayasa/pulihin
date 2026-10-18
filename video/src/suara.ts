/**
 * Rencana suara video: narasi, suara aplikasi asli, suara video AI, SFX, dan musik latar dengan ducking.
 * Dipakai komposisi (src/PulihinDemo.tsx) dan pemeriksaan build-srt (narasi tidak menimpa suara penting).
 *
 * Level (LUFS, relatif narasi -16 LUFS): musik -38 di bawah suara (22 dB di bawah narasi), -31 di jeda, naik ke
 * -27 hanya di pergantian bab dan -25 di penutup. Suara aplikasi = klip asli (-17..-19 LUFS) berwarna speaker
 * ponsel; hitungan repetisi dikecilkan bila tertimpa narasi. Tanpa bunyi per repetisi.
 */
import { ADEGAN, FADE_FRAME, FPS, SFX, TAHAP, TOTAL_DETIK, audioBaris, keFrame, type Adegan } from './timeline.ts';
import { DURASI_AUDIO, KERAS_AUDIO, KETUKAN } from './terukur.ts';

export interface Bunyi {
  id: string;
  src: string;
  /** Frame mulai di komposisi. */
  dari: number;
  /** Lama (frame); bila kosong diputar sampai berkas habis. */
  lama?: number;
  /** Mulai dari detik ini di dalam berkas. */
  mulaiKlip?: number;
  loop?: boolean;
  /** Volume per frame relatif terhadap `dari` (0..1). */
  volume: (frameLokal: number) => number;
}

const dB = (db: number): number => 10 ** (db / 20);
const jepit = (x: number): number => Math.min(1, Math.max(0, x));
/** Trapesium 0-1-1-0 dengan tepi linier. */
const trapesium = (t: number, a: number, b: number, c: number, d: number): number =>
  t <= a || t >= d ? 0 : t < b ? (t - a) / (b - a) : t <= c ? 1 : (d - t) / (d - c);

// ---------- rentang bicara (narasi + suara penting) ----------

export const RENTANG_NARASI: [number, number][] = ADEGAN.flatMap((a) => a.narasi.map((n): [number, number] => [n.mulai, n.selesai]));
const RENTANG_SUARA: [number, number][] = ADEGAN.flatMap((a) => a.suara.filter((s) => s.penting).map((s) => s.ucapan));
const RENTANG_BICARA = [...RENTANG_NARASI, ...RENTANG_SUARA].sort((x, y) => x[0] - y[0]);

/** 0..1: seberapa "ada suara bicara" pada detik t (serangan 0,35 dtk sebelum, lepas 0,7 dtk sesudah). */
const bicaraPada = (t: number, rentang: [number, number][]): number => {
  let d = 0;
  for (const [s, e] of rentang) {
    if (s - 0.4 > t) break;
    d = Math.max(d, trapesium(t, s - 0.35, s, e, e + 0.7));
  }
  return d;
};

// ---------- musik ----------

/** Pergantian bab (detik) untuk ayunan musik dan SFX transisi. */
export const PERGANTIAN_BAB = ADEGAN.filter((a, i) => i > 0 && ADEGAN[i - 1].tahap !== a.tahap).map((a) => a.mulai);
const AKHIR_NARASI = Math.max(...RENTANG_NARASI.map(([, e]) => e));

const LUFS_MUSIK = { bicara: -38, jeda: -31, ayun: -27, penutup: -25 } as const;

/** Level musik (LUFS) pada detik t. */
export const levelMusik = (t: number): number => {
  const ayun = Math.max(0, ...PERGANTIAN_BAB.map((b) => trapesium(t, b - 1.4, b - 0.2, b + 1.8, b + 3.2)));
  let lv = LUFS_MUSIK.jeda + (LUFS_MUSIK.ayun - LUFS_MUSIK.jeda) * ayun;
  if (t > AKHIR_NARASI) lv = Math.max(lv, LUFS_MUSIK.jeda + (LUFS_MUSIK.penutup - LUFS_MUSIK.jeda) * jepit((t - AKHIR_NARASI) / 2));
  return lv + (LUFS_MUSIK.bicara - lv) * bicaraPada(t, RENTANG_BICARA);
};

const MUSIK = 'audio/musik/latar-1.mp3';
/** Skor Lyria berakhir (hening setelah detik ini). */
const AKHIR_SKOR = 179.2;
const SILANG = 2.5;

/**
 * Susunan skor: bab 1-3 berurutan dari awal skor; bab 4 dan 5 mengulang bagian hangat (mulai 0:38 skor);
 * penutup memakai outro asli skor sehingga akor terakhir jatuh tepat di akhir video. Crossfade di pergantian bab.
 */
const segmenMusik = (): { dari: number; sampai: number; offset: number }[] => {
  const bab4 = ADEGAN.find((a) => a.tahap === TAHAP.keluarga)?.mulai ?? TOTAL_DETIK / 2;
  const awalC = ADEGAN.find((a) => a.tata === 'penutup-ai')?.mulai ?? TOTAL_DETIK - 25;
  return [
    { dari: 0, sampai: Math.min(bab4 + SILANG / 2, AKHIR_SKOR), offset: 0 },
    { dari: bab4 - SILANG / 2, sampai: awalC + SILANG / 2, offset: 38 },
    { dari: awalC - SILANG / 2, sampai: TOTAL_DETIK, offset: AKHIR_SKOR - (TOTAL_DETIK - (awalC - SILANG / 2)) },
  ];
};

// ---------- daftar bunyi ----------

const ADEGAN_AI: Adegan['tata'][] = ['data', 'judul', 'broll', 'split', 'penutup-ai'];

const daftarBunyi = (): Bunyi[] => {
  const b: Bunyi[] = [];

  // Narasi.
  for (const a of ADEGAN) {
    for (const n of a.narasi) {
      const src = audioBaris(n);
      if (DURASI_AUDIO[src] !== undefined) b.push({ id: `narasi-${n.id}`, src, dari: keFrame(n.mulai), volume: () => 1 });
    }
  }

  // Suara aplikasi asli (detik tercatat) dan suara video AI.
  for (const a of ADEGAN) {
    for (const [i, s] of a.suara.entries()) {
      const lama = Math.max(1, Math.round(s.lama * FPS));
      if (s.sumber === 'aplikasi') {
        if (DURASI_AUDIO[s.src] === undefined) continue;
        const durasiKlip = DURASI_AUDIO[s.src];
        const disela = s.mulaiKlip + s.lama < durasiKlip - 0.08;
        // Hitungan yang tertimpa narasi dikecilkan (narasi tidak pernah menimpa suara penting).
        const tertimpa = !s.penting && RENTANG_NARASI.some(([x, y]) => s.mulai < y + 0.2 && s.mulai + s.lama > x - 0.2);
        const dasar = tertimpa ? dB(-7) : 1;
        b.push({
          id: `aplikasi-${a.id}-${i}`,
          src: s.src,
          dari: keFrame(s.mulai),
          lama,
          mulaiKlip: s.mulaiKlip,
          // Klip yang disela aplikasi berhenti di detik yang sama, dengan pudar 3 frame agar tanpa klik.
          volume: (f) => dasar * (disela ? jepit((lama - f) / 3) : 1),
        });
      } else {
        const keras = KERAS_AUDIO[s.src];
        const dasar = keras === undefined ? 0.8 : Math.min(1, dB(-21 - keras));
        b.push({
          id: `ai-${a.id}`,
          src: s.src,
          dari: keFrame(s.mulai),
          lama,
          mulaiKlip: s.mulaiKlip,
          volume: (f) => dasar * jepit(f / 8) * jepit((lama - f) / FADE_FRAME),
        });
      }
    }
  }

  // Ketukan pada detik ketukan tercatat (hanya di jendela adegan itu sendiri).
  for (const a of ADEGAN) {
    if (!a.layar) continue;
    for (const t of KETUKAN[a.layar.berkas] ?? []) {
      const rel = t - a.layar.mulaiDi;
      if (rel >= 0 && rel < a.selesai - a.mulai) b.push({ id: `ketuk-${a.id}-${t}`, src: SFX.ketuk, dari: keFrame(a.mulai + rel), volume: () => 0.28 });
    }
  }

  // Transisi lembut di pergantian bab.
  for (const t of PERGANTIAN_BAB) b.push({ id: `transisi-${t}`, src: SFX.transisi, dari: Math.max(0, keFrame(t - 0.4)), volume: () => 0.12 });

  // Suasana rumah sangat pelan di bawah adegan video AI yang berurutan.
  let mulai: number | null = null;
  ADEGAN.forEach((a, i) => {
    const ai = ADEGAN_AI.includes(a.tata);
    if (ai && mulai === null) mulai = a.mulai;
    const akhir = ai && (i === ADEGAN.length - 1 || !ADEGAN_AI.includes(ADEGAN[i + 1].tata));
    if (akhir && mulai !== null) {
      const lama = keFrame(a.selesai) - keFrame(mulai) + FADE_FRAME;
      b.push({ id: `suasana-${a.id}`, src: SFX.suasana, dari: keFrame(mulai), lama, loop: true, volume: (f) => 0.05 * trapesium(f, 0, 24, lama - 30, lama) });
      mulai = null;
    }
  });

  // Musik: segmen skor dengan crossfade, level mengikuti levelMusik().
  const keras = KERAS_AUDIO[MUSIK];
  if (keras !== undefined && DURASI_AUDIO[MUSIK] !== undefined) {
    segmenMusik().forEach((s, i, semua) => {
      const dari = keFrame(s.dari);
      const lama = keFrame(s.sampai) - dari;
      const masuk = i === 0 ? 1.5 : SILANG;
      const keluar = i === semua.length - 1 ? 3.5 : SILANG;
      b.push({
        id: `musik-${i}`,
        src: MUSIK,
        dari,
        lama,
        mulaiKlip: s.offset,
        volume: (f) => {
          const t = s.dari + f / FPS;
          // Crossfade daya-setara antar segmen.
          const silang = Math.min(jepit((t - s.dari) / masuk), jepit((s.sampai - t) / keluar));
          return Math.min(1, dB(levelMusik(t) - keras) * Math.sin((silang * Math.PI) / 2));
        },
      });
    });
  }

  // Berkas yang belum ada dilewati (draf); suara video AI terdaftar di KERAS_AUDIO setelah npm run scan.
  return b.filter((x) => DURASI_AUDIO[x.src] !== undefined || KERAS_AUDIO[x.src] !== undefined);
};

export const BUNYI: Bunyi[] = daftarBunyi();
