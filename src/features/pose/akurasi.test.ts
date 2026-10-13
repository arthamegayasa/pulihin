import { describe, expect, it } from 'vitest';
import { ukurMetrik, type MetrikDasar } from './AngleCalculator';
import { getExercise } from './exerciseDefinitions';
import { buatSesiSintetis, cocokkanRepetisi, jalankanSintetis, type OpsiSintetis } from './synthetic';

/**
 * SIMULASI uji 50 repetisi terkontrol per latihan inti (AC-F1-2 versi sintetis).
 * Bukan hasil perangkat: protokol uji manusia di HP ada di docs/algoritma.md.
 * Jalankan dengan `npx vitest run src/features/pose/akurasi.test.ts --silent=false` untuk melihat tabel.
 */

const INTI = ['fleksi-bahu', 'fleksi-siku', 'abduksi-bahu'] as const;

/** Orang sehat menirukan gerakan lambat pasien, ponsel di depan (sedikit serong), kamera HP kelas bawah. */
const SKENARIO_UTAMA: Omit<OpsiSintetis, 'gerakan'> = {
  jumlahRepetisi: 50,
  fps: 15,
  durasiRepetisiDetik: [3, 5.5],
  jedaDetik: [0.5, 2],
  tahanAtasDetik: [0.2, 0.8],
  amplitudo: [0.92, 1.08],
  derauSudut: 3,
  derauPx: 2,
  peluangHilang: 0.03,
  peluangBuram: 0.02,
  yawDerajat: 15,
};

interface Baris {
  latihan: string;
  kondisi: string;
  benar: number;
  ganda: number;
  hilang: number;
  akurasi: string;
}

function uji(id: (typeof INTI)[number], kondisi: string, ubah: Partial<OpsiSintetis>, seed: number) {
  const sesi = buatSesiSintetis({ ...SKENARIO_UTAMA, ...ubah, gerakan: id, seed });
  const { waktuHitung, hasil } = jalankanSintetis(getExercise(id)!, sesi, { targetRepetisi: 50 });
  const a = cocokkanRepetisi(sesi.repetisi, waktuHitung);
  const baris: Baris = {
    latihan: id,
    kondisi,
    benar: a.benar,
    ganda: a.ganda,
    hilang: a.hilang,
    akurasi: `${(a.akurasi * 100).toFixed(0)}%`,
  };
  return { a, hasil, baris };
}

describe('SIMULASI akurasi 50 repetisi latihan inti', () => {
  const tabel: Baris[] = [];

  for (const id of INTI) {
    it(`${id}: 15 fps, derau realistis, tempo lambat -> akurasi >= 90%`, () => {
      const { a, hasil, baris } = uji(id, '3D, 15 fps, yaw 15°', {}, 101);
      tabel.push(baris);
      expect(a.akurasi).toBeGreaterThanOrEqual(0.9);
      expect(hasil.repetisi).toBe(a.benar + a.ganda);
    });

    it(`${id}: ketahanan (30 fps; ponsel tepat di depan; serong 35°; derau berat)`, () => {
      const varian: Array<[string, Partial<OpsiSintetis>]> = [
        ['3D, 30 fps, yaw 15°', { fps: 30 }],
        ['3D, 15 fps, yaw 0°', { yawDerajat: 0 }],
        ['3D, 15 fps, yaw 35°', { yawDerajat: 35 }],
        ['3D, 15 fps, derau berat', { derauSudut: 5, derauPx: 4, peluangHilang: 0.1, peluangBuram: 0.05 }],
      ];
      for (const [nama, ubah] of varian) {
        const { a, baris } = uji(id, nama, ubah, 202);
        tabel.push(baris);
        expect(a.akurasi).toBeGreaterThanOrEqual(0.9);
      }
    });

    it(`${id}: pembanding 2D saja (tanpa worldLandmarks), ponsel tepat di depan`, () => {
      // Tidak diasersi >= 90%. Hitungan 2D tetap bisa melewati ambang, tetapi NILAI sudutnya salah besar
      // dari depan (lihat tabel galat di bawah), sehingga skor rentang & koreksi rentang-kurang tidak andal.
      const { baris } = uji(id, '2D saja, 15 fps, yaw 0°', { yawDerajat: 0, tanpaDunia: true }, 303);
      tabel.push(baris);
      expect(baris.benar + baris.hilang).toBe(50);
    });
  }

  it('cetak tabel hasil SIMULASI', () => {
    console.log('\nSIMULASI (bukan hasil perangkat) - 50 repetisi per baris');
    console.table(tabel);
    expect(tabel.length).toBe(INTI.length * 6);
  });
});

describe('SIMULASI galat sudut: 3D vs 2D terhadap sudut sebenarnya', () => {
  /** Rata-rata galat mutlak nilai mentah tracker vs nilai sebenarnya dari pose tanpa derau. */
  function galat(id: (typeof INTI)[number], yawDerajat: number, tanpaDunia: boolean): number {
    const opsi: OpsiSintetis = { ...SKENARIO_UTAMA, gerakan: id, jumlahRepetisi: 10, yawDerajat, seed: 404 };
    const bersih = buatSesiSintetis({ ...opsi, derauSudut: 0, derauPx: 0, peluangHilang: 0, peluangBuram: 0 });
    const berderau = buatSesiSintetis({ ...opsi, tanpaDunia });
    const def = getExercise(id)!;
    const { snapshot } = jalankanSintetis(def, berderau);
    let jumlah = 0;
    let n = 0;
    snapshot.forEach(({ s }, i) => {
      const f = bersih.frames[i].frame;
      const mentah = s.debug['nilai.mentah'];
      if (!f || typeof mentah !== 'number') return;
      const benar = ukurMetrik(def.metrik as MetrikDasar, f, 'kanan', true, null);
      if (!benar) return;
      jumlah += Math.abs(mentah - benar.nilai);
      n++;
    });
    return jumlah / n;
  }

  it('sudut 3D tetap akurat dari depan maupun serong; 2D dari depan tidak (fleksi bidang sagital)', () => {
    const tabel: Array<Record<string, string>> = [];
    for (const id of INTI) {
      const baris: Record<string, string> = { latihan: id };
      for (const yaw of [0, 30, 60]) {
        const g3 = galat(id, yaw, false);
        const g2 = galat(id, yaw, true);
        baris[`3D yaw ${yaw}°`] = `${g3.toFixed(1)}°`;
        baris[`2D yaw ${yaw}°`] = `${g2.toFixed(1)}°`;
        expect(g3).toBeLessThan(6);
      }
      tabel.push(baris);
    }
    // Fleksi bahu & siku bergerak ke arah kamera: 2D dari depan salah besar.
    expect(Number.parseFloat(tabel[0]['2D yaw 0°'])).toBeGreaterThan(15);
    expect(Number.parseFloat(tabel[1]['2D yaw 0°'])).toBeGreaterThan(15);
    console.log('\nSIMULASI galat rata-rata nilai mentah (derajat), derau 3°/2 px, 15 fps');
    console.table(tabel);
  });
});
