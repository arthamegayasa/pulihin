import { describe, expect, it } from 'vitest';
import { getExercise } from './exerciseDefinitions';
import { buatSesiSintetis, jalankanSintetis, type OpsiSintetis } from './synthetic';
import type { IdKoreksi } from './types';

/**
 * AC-F1-3 lewat putar ulang tracker: koreksi harus tampil < 700 ms setelah kondisi salah bertahan
 * 0,5 s. Latensi diukur dari awal FISIK kondisi + 0,5 s (bukan dari awal yang dilihat detektor), jadi
 * jeda perataan 4 frame dan jarak antar frame ikut terhitung. Hasil dicetak untuk docs/algoritma.md
 * Bagian 14: `npx vitest run src/features/pose/latensi.test.ts --silent=false`.
 */

const SIKU = getExercise('fleksi-siku')!;
const FPS = [12, 15, 24, 30] as const;
const PERCOBAAN = 12;

interface Kasus {
  id: IdKoreksi;
  /** Opsi sesi untuk percobaan ke-k; `awalMs` = awal fisik kondisi (ms relatif awal sesi). */
  sesi: (fps: number, k: number) => { opsi: OpsiSintetis; awalMs: number };
}

const KASUS: Kasus[] = [
  {
    id: 'badan-miring',
    sesi: (fps, k) => {
      const mulai = 3 + k * 0.037; // geser fase terhadap jam frame
      return {
        opsi: { gerakan: 'diam', durasiTotalDetik: 7, fps, miring: { mulaiDetik: mulai, selesaiDetik: mulai + 2, derajat: 18 }, derauPx: 1, seed: 100 + k },
        awalMs: mulai * 1000,
      };
    },
  },
  {
    id: 'bahu-terangkat',
    sesi: (fps, k) => {
      const mulai = 3.5 + k * 0.037;
      return {
        opsi: {
          gerakan: 'fleksi-siku',
          jumlahRepetisi: 1,
          durasiRepetisiDetik: 5,
          tahanAtasDetik: 2.5,
          angkatBahu: { mulaiDetik: mulai, selesaiDetik: mulai + 1.8, meter: 0.05 },
          derauPx: 1,
          fps,
          seed: 200 + k,
        },
        awalMs: mulai * 1000,
      };
    },
  },
];

function ukur(kasus: Kasus, fps: number) {
  const latensi: number[] = [];
  const keDetektor: number[] = [];
  for (let k = 0; k < PERCOBAAN; k++) {
    const { opsi, awalMs } = kasus.sesi(fps, k);
    const sesi = buatSesiSintetis(opsi);
    const jalan = jalankanSintetis(SIKU, sesi);
    const tampil = jalan.snapshot.find((x) => x.s.koreksiBaru?.id === kasus.id);
    if (!tampil) throw new Error(`${kasus.id} @${fps} fps percobaan ${k}: pesan tidak tampil`);
    latensi.push(tampil.t - sesi.tAwal - (awalMs + 500));
    // Awal kondisi menurut detektor (debug tracker, dipakai Mode Uji untuk pengukuran live).
    const awalDetektor = tampil.s.debug[`awal.${kasus.id}`];
    expect(typeof awalDetektor).toBe('number');
    keDetektor.push(tampil.t - ((awalDetektor as number) + 500));
  }
  const urut = [...latensi].sort((a, b) => a - b);
  return {
    min: urut[0],
    median: urut[Math.floor(urut.length / 2)],
    maks: urut[urut.length - 1],
    detektorMaks: Math.max(...keDetektor),
  };
}

describe('latensi koreksi AC-F1-3 (putar ulang tracker)', () => {
  it('semua koreksi kontinu tampil < 700 ms setelah kondisi fisik bertahan 0,5 s, pada 12-30 fps', () => {
    const baris: string[] = ['| Koreksi | fps | min | median | maks | maks sejak awal versi detektor |', '|---|---|---|---|---|---|'];
    for (const kasus of KASUS) {
      for (const fps of FPS) {
        const r = ukur(kasus, fps);
        baris.push(`| ${kasus.id} | ${fps} | ${r.min.toFixed(0)} ms | ${r.median.toFixed(0)} ms | ${r.maks.toFixed(0)} ms | ${r.detektorMaks.toFixed(0)} ms |`);
        expect(r.maks).toBeLessThan(700);
        // Sejak awal versi detektor, pesan tampil pada frame pertama yang melewati 0,5 s.
        expect(r.detektorMaks).toBeLessThanOrEqual(1000 / fps + 1);
      }
    }
    console.log(baris.join('\n'));
  });
});
