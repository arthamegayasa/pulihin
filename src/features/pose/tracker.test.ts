import { describe, expect, it } from 'vitest';
import { EXERCISES, getExercise } from './exerciseDefinitions';
import { buatSesiSintetis, jalankanSintetis, type GerakanSintetis } from './synthetic';
import type { ExerciseDefinition } from './types';

const def = (id: string): ExerciseDefinition => {
  const d = getExercise(id);
  if (!d) throw new Error(`latihan ${id} tidak ada`);
  return d;
};

const INTI = ['fleksi-bahu', 'fleksi-siku', 'abduksi-bahu'] as const;

describe('tracker: hitungan dasar latihan inti', () => {
  for (const id of INTI) {
    it(`${id}: 10 repetisi lambat -> tepat 10`, () => {
      const sesi = buatSesiSintetis({ gerakan: id, jumlahRepetisi: 10, durasiRepetisiDetik: [3, 4.5], seed: 11 });
      const { hasil } = jalankanSintetis(def(id), sesi);
      expect(hasil.repetisi).toBe(10);
      expect(hasil.percobaan).toBe(10);
      expect(hasil.repLogs.every((l) => l.dihitung)).toBe(true);
    });

    it(`${id}: setengah gerakan -> 0 terhitung, percobaan tercatat dengan puncaknya`, () => {
      const sesi = buatSesiSintetis({ gerakan: id, jumlahRepetisi: 6, amplitudo: 0.5, seed: 12 });
      const { hasil, snapshot } = jalankanSintetis(def(id), sesi);
      expect(hasil.repetisi).toBe(0);
      expect(hasil.percobaan).toBe(6);
      for (const l of hasil.repLogs) {
        expect(l.dihitung).toBe(false);
        expect(l.sudutPuncak).toBeLessThan(def(id).ambangAtas);
      }
      expect(snapshot.some((x) => x.s.alasanTidakDihitung === 'rentang-kurang')).toBe(true);
    });

    it(`${id}: gerakan cepat (< 1 detik) -> 0 terhitung, percobaan tercatat`, () => {
      const sesi = buatSesiSintetis({
        gerakan: id,
        jumlahRepetisi: 6,
        durasiRepetisiDetik: 0.8,
        tahanAtasDetik: 0.05,
        seed: 13,
      });
      const { hasil, snapshot } = jalankanSintetis(def(id), sesi);
      expect(hasil.repetisi).toBe(0);
      expect(hasil.percobaan).toBe(6);
      expect(hasil.repLogs.every((l) => !l.dihitung && l.durasiSiklusDetik < 1)).toBe(true);
      const tandai = snapshot.filter((x) => x.s.percobaanTidakDihitung);
      expect(tandai).toHaveLength(6);
      expect(tandai.every((x) => x.s.alasanTidakDihitung === 'terlalu-cepat')).toBe(true);
    });

    it(`${id}: derau Gaussian 4 derajat + derau piksel -> hitungan tepat`, () => {
      for (const fps of [15, 30]) {
        const sesi = buatSesiSintetis({
          gerakan: id,
          jumlahRepetisi: 10,
          durasiRepetisiDetik: [2.5, 4],
          derauSudut: 4,
          derauPx: 1.5,
          fps,
          seed: 14 + fps,
        });
        expect(jalankanSintetis(def(id), sesi).hasil.repetisi).toBe(10);
      }
    });
  }
});

describe('tracker: frame yang diabaikan', () => {
  it('frame visibility rendah & frame hilang tidak mengubah state dan nilai null', () => {
    const sesi = buatSesiSintetis({
      gerakan: 'fleksi-siku',
      jumlahRepetisi: 10,
      peluangBuram: 0.15,
      peluangHilang: 0.05,
      seed: 21,
    });
    const { hasil, snapshot } = jalankanSintetis(def('fleksi-siku'), sesi);
    expect(hasil.repetisi).toBe(10);
    let diabaikan = 0;
    for (let i = 1; i < snapshot.length; i++) {
      const { s } = snapshot[i];
      if (s.nilai === null && s.siap) {
        diabaikan++;
        expect(s.fase).toBe(snapshot[i - 1].s.fase);
        expect(s.repetisi).toBe(snapshot[i - 1].s.repetisi);
        expect(s.repetisiBaru).toBe(false);
      }
    }
    expect(diabaikan).toBeGreaterThan(20);
  });
});

describe('tracker: kesiapan dan snapshot', () => {
  it('siap hanya setelah landmark kunci terlihat terus-menerus 1 detik', () => {
    const sesi = buatSesiSintetis({ gerakan: 'diam', durasiTotalDetik: 3, keluarFrame: { mulaiDetik: 0, selesaiDetik: 0.5 } });
    const { snapshot } = jalankanSintetis(def('fleksi-bahu'), sesi);
    const pertamaTerlihat = snapshot.find((x) => x.s.tubuhTerlihat)!.t;
    const pertamaSiap = snapshot.find((x) => x.s.siap)!.t;
    expect(pertamaSiap - pertamaTerlihat).toBeGreaterThanOrEqual(1000);
    expect(pertamaSiap - pertamaTerlihat).toBeLessThan(1100);
  });

  it('mengisi semua field snapshot; flag hanya true pada frame kejadian', () => {
    const sesi = buatSesiSintetis({ gerakan: 'fleksi-bahu', sisi: 'kiri', jumlahRepetisi: 3, seed: 31 });
    const { snapshot } = jalankanSintetis(def('fleksi-bahu'), sesi, { sisi: 'kiri' });
    const akhir = snapshot[snapshot.length - 1].s;
    expect(akhir.repetisi).toBe(3);
    expect(akhir.satuan).toBe('°');
    expect(akhir.titikAktif).toEqual([11, 13, 23]);
    expect(snapshot.filter((x) => x.s.repetisiBaru)).toHaveLength(3);
    for (const k of ['sudut.bahu.kiri', 'sudut.siku.kanan', 'sudut.lutut.kiri', 'sudut.pinggul.kanan', 'fase', 'mode']) {
      expect(akhir.debug).toHaveProperty(k);
    }
    expect(akhir.debug.mode).toBe('3D');
    const progres = snapshot.map((x) => x.s.progres);
    expect(Math.min(...progres)).toBe(0);
    expect(Math.max(...progres)).toBe(1);
    expect(snapshot.every((x) => x.s.progres >= 0 && x.s.progres <= 1)).toBe(true);
  });

  it('finish() mengembalikan log setiap percobaan, durasi, skor, dan saran', () => {
    const sesi = buatSesiSintetis({
      gerakan: 'fleksi-siku',
      jumlahRepetisi: 6,
      amplitudoPerRepetisi: [1, 1, 1, 1, 0.5, 0.5],
      seed: 32,
    });
    const { hasil } = jalankanSintetis(def('fleksi-siku'), sesi, { targetRepetisi: 10 });
    expect(hasil.repetisi).toBe(4);
    expect(hasil.percobaan).toBe(6);
    expect(hasil.repLogs.map((l) => l.nomor)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(hasil.repLogs.map((l) => l.dihitung)).toEqual([true, true, true, true, false, false]);
    expect(hasil.repLogs[0].sudutPuncak).toBeGreaterThan(120);
    expect(hasil.durasiDetik).toBe(Math.round((sesi.tAkhir - sesi.tAwal) / 1000));
    expect(hasil.skorKomponen.repetisi).toBe(40);
    expect(hasil.skor).toBeGreaterThan(0);
    expect(hasil.saran.length).toBeGreaterThan(10);
    // Dua setengah gerakan berturut-turut memunculkan koreksi rentang-kurang di log percobaan ke-6.
    expect(hasil.koreksiTerhitung['rentang-kurang']).toBe(1);
    expect(hasil.repLogs[5].koreksi).toContain('rentang-kurang');
  });

  it('mode 2D dipakai bila worldLandmarks tidak ada', () => {
    const sesi = buatSesiSintetis({ gerakan: 'abduksi-bahu', jumlahRepetisi: 3, tanpaDunia: true, seed: 33 });
    const { hasil, snapshot } = jalankanSintetis(def('abduksi-bahu'), sesi);
    expect(snapshot[snapshot.length - 1].s.debug.mode).toBe('2D');
    expect(hasil.repetisi).toBe(3);
  });
});

describe('tracker: ambang hanya dari data (AC-F2)', () => {
  it('mengubah ambangAtas pada salinan definisi mengubah hitungan tanpa mengubah logika', () => {
    const sesi = buatSesiSintetis({ gerakan: 'fleksi-bahu', jumlahRepetisi: 5, amplitudo: 0.8, seed: 41 });
    // Puncak 0,8 amplitudo ~ 102 derajat: lolos ambang 100, tidak lolos ambang 110.
    const asli = jalankanSintetis(def('fleksi-bahu'), sesi).hasil.repetisi;
    const salinan: ExerciseDefinition = { ...def('fleksi-bahu'), ambangAtas: 110 };
    const diubah = jalankanSintetis(salinan, sesi).hasil.repetisi;
    expect(asli).toBe(5);
    expect(diubah).toBe(0);
    const lebihRendah: ExerciseDefinition = { ...def('fleksi-bahu'), ambangAtas: 80 };
    expect(jalankanSintetis(lebihRendah, buatSesiSintetis({ gerakan: 'fleksi-bahu', jumlahRepetisi: 5, amplitudo: 0.7, seed: 42 })).hasil.repetisi).toBe(5);
  });
});

describe('tracker: seluruh 10 latihan berjalan dengan data sintetis', () => {
  const peta: Record<string, GerakanSintetis> = Object.fromEntries(EXERCISES.map((e) => [e.id, e.id as GerakanSintetis]));
  for (const e of EXERCISES) {
    it(`${e.id}: 6 repetisi lambat berderau -> 6`, () => {
      const sesi = buatSesiSintetis({
        gerakan: peta[e.id],
        sisi: 'kiri',
        jumlahRepetisi: 6,
        durasiRepetisiDetik: [e.tempoTargetDetik.min + 1, e.tempoTargetDetik.min + 2.5],
        derauSudut: 2,
        derauPx: 1,
        seed: 51,
      });
      const { hasil } = jalankanSintetis(e, sesi, { sisi: 'kiri' });
      expect(hasil.repetisi).toBe(6);
      expect(hasil.repLogs.every((l) => l.dihitung)).toBe(true);
    });
  }
});
