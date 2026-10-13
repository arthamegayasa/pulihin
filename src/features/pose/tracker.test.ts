import { describe, expect, it } from 'vitest';
import { EXERCISES, getExercise } from './exerciseDefinitions';
import { buatSesiSintetis, jalankanSintetis, type GerakanSintetis } from './synthetic';
import { ambangAtasRentang, normalisasiRentang } from './tracker';
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
    for (const k of ['sudut.siku.kiri.2d', 'sudut.siku.kiri.3d', 'bobot.2d']) expect(typeof akhir.debug[k]).toBe('number');
    expect(akhir.debug.mode).toBe('Hibrida');
    expect(akhir.sisiTerlihat).toEqual({ kiri: true, kanan: true });
    expect(akhir.sisiLainTerlihat).toBe(false);
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
    // Sumber 3D: pada kerangka sintetis nilai puncaknya tepat sudut sebenarnya.
    // Puncak 0,8 amplitudo ~ 102 derajat: lolos ambang 100, tidak lolos ambang 110.
    const opsi = { modeSudut: '3d' } as const;
    const asli = jalankanSintetis(def('fleksi-bahu'), sesi, opsi).hasil.repetisi;
    const salinan: ExerciseDefinition = { ...def('fleksi-bahu'), ambangAtas: 110 };
    const diubah = jalankanSintetis(salinan, sesi, opsi).hasil.repetisi;
    expect(asli).toBe(5);
    expect(diubah).toBe(0);
    const lebihRendah: ExerciseDefinition = { ...def('fleksi-bahu'), ambangAtas: 80 };
    const sesiRendah = buatSesiSintetis({ gerakan: 'fleksi-bahu', jumlahRepetisi: 5, amplitudo: 0.7, seed: 42 });
    expect(jalankanSintetis(lebihRendah, sesiRendah, opsi).hasil.repetisi).toBe(5);
  });

  it('sumberSudut adalah data definisi: modeSudut otomatis mengikuti def, Mode Uji dapat memaksa', () => {
    const sesi = buatSesiSintetis({ gerakan: 'fleksi-siku', jumlahRepetisi: 2, seed: 43 });
    const mode = (d: ExerciseDefinition, modeSudut?: 'otomatis' | '2d' | '3d') =>
      jalankanSintetis(d, sesi, { modeSudut }).snapshot.at(-1)!.s.debug.mode;
    expect(mode(def('fleksi-siku'))).toBe('Hibrida');
    expect(mode({ ...def('fleksi-siku'), sumberSudut: '3d' })).toBe('3D');
    expect(mode(def('fleksi-siku'), '2d')).toBe('2D');
    expect(mode(def('fleksi-siku'), '3d')).toBe('3D');
  });
});

describe('tracker: target rentang personal (rentangPersen)', () => {
  const ABDUKSI = def('abduksi-bahu'); // atas 90, bawah 25, histeresis 5
  /**
   * Sesi abduksi sintetis dengan puncak TERUKUR `puncak` derajat. Parameter sendi = 8 + 102 x amplitudo;
   * metrik tracker (sudut lengan atas terhadap garis bahu-pinggul) terbaca ±9 derajat di atasnya pada
   * kerangka sintetis, jadi amplitudo dihitung mundur dan setiap tes memeriksa puncak terukurnya.
   */
  const sesiAbduksi = (puncak: number, jumlahRepetisi: number, seed: number) =>
    buatSesiSintetis({
      gerakan: 'abduksi-bahu',
      jumlahRepetisi,
      amplitudo: (puncak - 9 - 8) / 102,
      durasiRepetisiDetik: [3, 4],
      tahanAtasDetik: 0.5,
      seed,
    });
  const opsi = { modeSudut: '3d' } as const;
  const sesi86 = sesiAbduksi(86, 6, 61);

  it('puncak abduksi 86 derajat: terhitung pada 80%, tidak pada 100% (bawaan)', () => {
    const penuh = jalankanSintetis(ABDUKSI, sesi86, opsi).hasil;
    const bawaan = jalankanSintetis(ABDUKSI, sesi86, { ...opsi, rentangPersen: 100 }).hasil;
    const delapanPuluh = jalankanSintetis(ABDUKSI, sesi86, { ...opsi, rentangPersen: 80 }).hasil;
    expect(penuh.repLogs).toHaveLength(6);
    for (const l of penuh.repLogs) expect(Math.abs(l.sudutPuncak - 86)).toBeLessThanOrEqual(1.5);
    expect(penuh.repetisi).toBe(0);
    expect(bawaan.repetisi).toBe(0);
    expect(delapanPuluh.repetisi).toBe(6);
    expect(delapanPuluh.percobaan).toBe(6);
  });

  it('pasien yang mencapai rentang resep: skor rentang penuh, tanpa "rentang kurang"', () => {
    const penuh = jalankanSintetis(ABDUKSI, sesi86, opsi);
    const delapanPuluh = jalankanSintetis(ABDUKSI, sesi86, { ...opsi, rentangPersen: 80 });
    // 100%: 86 di atas batas rentang kurang (90 - 15), tetapi tidak terhitung dan skor rentang < 100.
    expect(penuh.hasil.skorKomponen.rentang).toBeLessThan(100);
    expect(delapanPuluh.hasil.skorKomponen.rentang).toBe(100);
    expect(delapanPuluh.hasil.koreksiTerhitung['rentang-kurang'] ?? 0).toBe(0);
    expect(delapanPuluh.snapshot.some((x) => x.s.progres === 1)).toBe(true);
    expect(delapanPuluh.snapshot.at(-1)!.s.debug['ambang.atas']).toBe(72);
  });

  it('batas "rentang kurang" ikut ambang efektif (ambang efektif - 15)', () => {
    // 100%: batas 90 - 15 = 75; 80%: batas 72 - 15 = 57. Puncak 66 derajat di antara keduanya: dianggap
    // kurang pada 100%, tidak pada 80%. Puncak 50 derajat kurang pada keduanya.
    const koreksi = (puncak: number, rentangPersen: number) => {
      const { hasil } = jalankanSintetis(ABDUKSI, sesiAbduksi(puncak, 4, 62), { ...opsi, rentangPersen });
      for (const l of hasil.repLogs) expect(Math.abs(l.sudutPuncak - puncak)).toBeLessThanOrEqual(1.5);
      expect(hasil.repetisi).toBe(0);
      return hasil.koreksiTerhitung['rentang-kurang'] ?? 0;
    };
    expect(koreksi(66, 100)).toBeGreaterThan(0);
    expect(koreksi(66, 80)).toBe(0);
    expect(koreksi(50, 100)).toBeGreaterThan(0);
    expect(koreksi(50, 80)).toBeGreaterThan(0);
  });

  it('normalisasiRentang: tidak ada / tidak valid = 100, dibulatkan, dibatasi 50..100', () => {
    expect(normalisasiRentang(undefined)).toBe(100);
    expect(normalisasiRentang(Number.NaN)).toBe(100);
    expect(normalisasiRentang(80)).toBe(80);
    expect(normalisasiRentang(84.6)).toBe(85);
    expect(normalisasiRentang(20)).toBe(50);
    expect(normalisasiRentang(140)).toBe(100);
  });

  it('ambangAtasRentang: skala ambang atas, lantai ambangBawah + 3 x histeresis, tidak melebihi ambang asli', () => {
    expect(ambangAtasRentang(ABDUKSI)).toBe(90);
    expect(ambangAtasRentang(ABDUKSI, 90)).toBe(81);
    expect(ambangAtasRentang(ABDUKSI, 80)).toBe(72);
    expect(ambangAtasRentang(ABDUKSI, 50)).toBe(45);
    expect(ambangAtasRentang(ABDUKSI, 10)).toBe(45); // dibatasi ke 50%
    // Ekstensi lutut (bawah 100, atas 150, histeresis 5): 50% = 75 jatuh ke lantai 115.
    expect(ambangAtasRentang(def('ekstensi-lutut'), 50)).toBe(115);
    // Jinjit (bawah 4, atas 10, histeresis 2,5): lantai 11,5 > 10 -> pita sempit, ambang tetap 10.
    expect(ambangAtasRentang(def('jinjit'), 70)).toBe(10);
    for (const e of EXERCISES) {
      for (const p of [50, 70, 80, 90, 100]) {
        const atas = ambangAtasRentang(e, p);
        const h = e.histeresis ?? 5;
        expect(atas).toBeLessThanOrEqual(e.ambangAtas);
        // Syarat RepCounter tetap terpenuhi untuk semua latihan dan semua target.
        expect(e.ambangBawah + h).toBeLessThan(atas - h);
      }
    }
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
