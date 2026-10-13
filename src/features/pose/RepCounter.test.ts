import { describe, expect, it } from 'vitest';
import { RepCounter, type KonfigRepetisi, type PeristiwaSiklus } from './RepCounter';

const SIKU: KonfigRepetisi = { ambangAtas: 120, ambangBawah: 30, histeresis: 5, durasiMinDetik: 1 };
const FPS = 30;
const DT = 1000 / FPS;

/** Deret nilai satu gerakan cosinus dari `dari` ke `puncak` lalu kembali, dalam `detik`. */
function gerak(dari: number, puncak: number, detik: number): number[] {
  const n = Math.round(detik * FPS);
  return Array.from({ length: n }, (_, i) => dari + ((puncak - dari) * (1 - Math.cos((2 * Math.PI * i) / n))) / 2);
}

const diam = (nilai: number, detik: number) => Array.from({ length: Math.round(detik * FPS) }, () => nilai);

function jalankan(nilai: ReadonlyArray<number | null>, konfig = SIKU) {
  const c = new RepCounter(konfig);
  const peristiwa: PeristiwaSiklus[] = [];
  const fase: string[] = [];
  nilai.forEach((v, i) => {
    const p = c.update(v, i * DT);
    if (p) peristiwa.push(p);
    fase.push(c.fase);
  });
  return { c, peristiwa, fase };
}

describe('RepCounter (Bab 7.2)', () => {
  it('10 repetisi lambat -> tepat 10, puncak dan durasi tercatat', () => {
    const deret = [...diam(10, 1), ...Array.from({ length: 10 }, () => [...gerak(10, 140, 3), ...diam(10, 0.5)]).flat()];
    const { c, peristiwa } = jalankan(deret);
    expect(c.repetisi).toBe(10);
    expect(c.percobaan).toBe(10);
    for (const p of peristiwa) {
      expect(p.jenis).toBe('repetisi');
      expect(p.puncak).toBeCloseTo(140, 0);
      expect(p.durasiDetik).toBeGreaterThan(2);
      expect(p.durasiDetik).toBeLessThan(3);
    }
  });

  it('setengah gerakan (tidak mencapai ATAS) -> 0 terhitung, percobaan dicatat dengan puncaknya', () => {
    const deret = [...diam(10, 1), ...Array.from({ length: 5 }, () => [...gerak(10, 80, 3), ...diam(10, 0.5)]).flat()];
    const { c, peristiwa } = jalankan(deret);
    expect(c.repetisi).toBe(0);
    expect(c.percobaan).toBe(5);
    expect(peristiwa.every((p) => p.jenis === 'rentang-kurang' && !p.lengkap)).toBe(true);
    expect(peristiwa[0].puncak).toBeCloseTo(80, 0);
  });

  it('gerakan cepat (< 1 detik) -> 0 terhitung, tercatat sebagai percobaan terlalu cepat', () => {
    const deret = [...diam(10, 1), ...Array.from({ length: 5 }, () => [...gerak(10, 140, 0.7), ...diam(10, 0.3)]).flat()];
    const { c, peristiwa } = jalankan(deret);
    expect(c.repetisi).toBe(0);
    expect(c.percobaan).toBe(5);
    expect(peristiwa.every((p) => p.jenis === 'terlalu-cepat' && p.lengkap && p.durasiDetik < 1)).toBe(true);
  });

  it('getaran di sekitar ambang atas dan ambang bawah+h tidak menghasilkan hitungan ganda', () => {
    const getarAtas = Array.from({ length: 90 }, (_, i) => 120 + (i % 2 ? 4 : -4));
    const getarBawah = Array.from({ length: 90 }, (_, i) => 35 + (i % 2 ? 3 : -3));
    const deret = [...diam(10, 1), ...getarBawah, ...gerak(35, 120, 1).slice(0, 15), ...getarAtas, ...gerak(120, 10, 2).slice(0, 30), ...diam(10, 1)];
    const { c } = jalankan(deret);
    expect(c.repetisi).toBe(1);
    expect(c.percobaan).toBe(1);
  });

  it('nilai null tidak pernah mengubah state', () => {
    const deret: Array<number | null> = [...diam(10, 1), ...gerak(10, 140, 3)];
    // Sisipkan null di tiap fase.
    for (const i of [5, 40, 60, 75, 90, 100]) deret.splice(i, 0, null, null, null);
    const { c, fase } = jalankan(deret);
    deret.forEach((v, i) => {
      if (v === null && i > 0) expect(fase[i]).toBe(fase[i - 1]);
    });
    expect(c.repetisi).toBe(1);
  });

  it('belum bersenjata sampai nilai pernah <= ambangBawah (mulai dengan lengan terangkat tidak dihitung)', () => {
    const deret = [...diam(130, 1), ...gerak(130, 10, 2).slice(0, 30), ...diam(10, 1), ...gerak(10, 140, 3), ...diam(10, 0.5)];
    const { c } = jalankan(deret);
    expect(c.repetisi).toBe(1);
  });

  it('memantul TURUN -> ATAS tidak menambah hitungan', () => {
    const deret = [...diam(10, 1), ...gerak(10, 140, 2).slice(0, 30), ...gerak(140, 105, 1), ...gerak(10, 140, 2).slice(30), ...diam(10, 1)];
    const { c } = jalankan(deret);
    expect(c.repetisi).toBe(1);
    expect(c.percobaan).toBe(1);
  });

  it('menolak ambang yang membuat histeresis tumpang tindih', () => {
    expect(() => new RepCounter({ ambangAtas: 20, ambangBawah: 12, histeresis: 5, durasiMinDetik: 1 })).toThrow();
  });
});
