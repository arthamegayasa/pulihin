import { describe, expect, it } from 'vitest';
import { PengumpulBaseline, RataBergerak, sudutDi, sudutSendi, ukurMetrik } from './AngleCalculator';
import { getExercise } from './exerciseDefinitions';
import { indeksTitik } from './landmarks';
import { bangunAdegan, kameraBawaan, paramAwal, proyeksikan, type ParamPose } from './synthetic';
import type { MetrikDasar } from './AngleCalculator';
import type { PoseFrame } from './types';

const SIKU: MetrikDasar = { jenis: 'sudut', a: 'bahu', b: 'siku', c: 'pergelangan', ubah: 'fleksi' };
const BAHU: MetrikDasar = { jenis: 'sudut', a: 'pinggul', b: 'bahu', c: 'siku' };

function pose(ubah: (p: ParamPose) => void, yaw = 0, postur: ParamPose['postur'] = 'duduk'): PoseFrame {
  const p = paramAwal(postur);
  ubah(p);
  return proyeksikan(bangunAdegan(p), kameraBawaan(postur === 'berdiri' ? 'jinjit' : 'fleksi-siku'), 0, { yawDerajat: yaw });
}

const nilai = (m: MetrikDasar, f: PoseFrame, izinkan3D: boolean, sisi: 'kiri' | 'kanan' = 'kanan') =>
  ukurMetrik(m, f, sisi, izinkan3D, null)!.nilai;

describe('sudutDi (dot product, Bab 7.1)', () => {
  it('menghitung sudut di titik B', () => {
    const o = { x: 0, y: 0, z: 0 };
    expect(sudutDi({ x: 1, y: 0, z: 0 }, o, { x: 0, y: 1, z: 0 })).toBeCloseTo(90);
    expect(sudutDi({ x: 1, y: 0, z: 0 }, o, { x: -1, y: 0, z: 0 })).toBeCloseTo(180);
    expect(sudutDi({ x: 1, y: 1, z: 0 }, o, { x: 1, y: 0, z: 0 })).toBeCloseTo(45);
    expect(sudutDi(o, o, { x: 1, y: 0, z: 0 })).toBeNull();
  });
});

describe('RataBergerak', () => {
  it('meratakan N nilai terakhir', () => {
    const r = new RataBergerak(4);
    expect([10, 20, 30, 40, 50].map((v) => r.tambah(v))).toEqual([10, 15, 20, 25, 35]);
  });
});

describe('keterlihatan (Bab 7.1)', () => {
  it('sudut null bila salah satu landmark visibility < 0,5', () => {
    const f = pose((p) => (p.sikuFleksi.kanan = 90));
    const [a, b, c] = [indeksTitik('bahu', 'kanan'), indeksTitik('siku', 'kanan'), indeksTitik('pergelangan', 'kanan')];
    expect(sudutSendi(f, a, b, c, '3d')).not.toBeNull();
    f.landmarks[c].visibility = 0.49;
    expect(sudutSendi(f, a, b, c, '3d')).toBeNull();
    expect(ukurMetrik(SIKU, f, 'kanan', true, null)).toBeNull();
  });
});

describe('invariansi sudut pandang: 3D vs 2D', () => {
  const kasus: Array<{ nama: string; metrik: MetrikDasar; ubah: (p: ParamPose) => void; benar: number }> = [
    { nama: 'fleksi siku 60°', metrik: SIKU, ubah: (p) => (p.sikuFleksi.kanan = 60), benar: 60 },
    { nama: 'fleksi siku 130°', metrik: SIKU, ubah: (p) => (p.sikuFleksi.kanan = 130), benar: 130 },
    { nama: 'fleksi bahu 90°', metrik: BAHU, ubah: (p) => ((p.bahuFleksi.kanan = 90), (p.bahuAbduksi.kanan = 0)), benar: 90 },
  ];
  for (const k of kasus) {
    it(`${k.nama}: 3D stabil saat tubuh diputar 0-75°, proyeksi 2D bergeser`, () => {
      const galat2D: number[] = [];
      for (const yaw of [0, 15, 30, 45, 60, 75, -30]) {
        const f = pose(k.ubah, yaw);
        // Batang tubuh-lengan untuk fleksi bahu: acuan bahu->pinggul condong ~9° karena bahu lebih lebar dari pinggul.
        const acuan = k.metrik === BAHU ? nilai(k.metrik, pose(k.ubah, 0), true) : k.benar;
        expect(Math.abs(nilai(k.metrik, f, true) - acuan)).toBeLessThan(0.5);
        galat2D.push(Math.abs(nilai(k.metrik, f, false) - acuan));
      }
      // Proyeksi 2D bergantung pada arah pandang: galat berubah besar antar sudut putar.
      expect(Math.max(...galat2D)).toBeGreaterThan(25);
      expect(Math.max(...galat2D) - Math.min(...galat2D)).toBeGreaterThan(20);
    });
  }

  it('abduksi bahu (bidang frontal) terbaca baik oleh keduanya dari depan', () => {
    const f = pose((p) => ((p.bahuAbduksi.kanan = 80), (p.bahuFleksi.kanan = 0)));
    expect(Math.abs(nilai(BAHU, f, true) - nilai(BAHU, f, false))).toBeLessThan(3);
  });
});

describe('metrik selain sudut', () => {
  it('abduksi pinggul terhadap garis panggul (selisih-90) tidak terpengaruh fleksi pinggul', () => {
    const m = getExercise('abduksi-pinggul')!.metrik as MetrikDasar;
    for (const yaw of [0, 40]) {
      const lurus = pose((p) => (p.pinggulAbduksi.kanan = 0), yaw, 'berdiri');
      const abd = pose((p) => (p.pinggulAbduksi.kanan = 30), yaw, 'berdiri');
      expect(nilai(m, lurus, true)).toBeCloseTo(0, 0);
      expect(nilai(m, abd, true)).toBeCloseTo(30, 0);
    }
  });

  it('kenaikan tumit (jinjit) dalam persen lebar bahu terhadap acuan', () => {
    const m: MetrikDasar = { jenis: 'kenaikan', titik: 'tumit' };
    const diam = pose(() => {}, 0, 'berdiri');
    const kumpul = new PengumpulBaseline([indeksTitik('tumit', 'kiri'), indeksTitik('tumit', 'kanan')]);
    kumpul.tambah(diam);
    const acuan = kumpul.hasil();
    expect(ukurMetrik(m, diam, 'kiri', true, null)).toBeNull(); // tanpa acuan belum bisa diukur
    expect(ukurMetrik(m, diam, 'kiri', true, acuan)!.nilai).toBeCloseTo(0, 5);
    const naik = pose((p) => (p.jinjit = 0.06), 0, 'berdiri');
    // 6 cm / lebar bahu 36 cm ~ 17% (sedikit berbeda karena perspektif).
    expect(ukurMetrik(m, naik, 'kiri', true, acuan)!.nilai).toBeGreaterThan(14);
    expect(ukurMetrik(m, naik, 'kiri', true, acuan)!.nilai).toBeLessThan(20);
  });

  it('jarak pergelangan-bahu (menggapai) memakai 3D: lengan lurus ke arah kamera tetap terbaca', () => {
    const m: MetrikDasar = { jenis: 'jarak', dari: 'bahu', ke: 'pergelangan' };
    const dada = pose((p) => ((p.bahuFleksi.kanan = 55), (p.sikuFleksi.kanan = 125)));
    const gapai = pose((p) => ((p.bahuFleksi.kanan = 90), (p.sikuFleksi.kanan = 5)));
    expect(nilai(m, dada, true)).toBeLessThan(90);
    expect(nilai(m, gapai, true)).toBeGreaterThan(150);
    // 2D dari depan hampir tidak melihat gerak menggapai.
    expect(nilai(m, gapai, false)).toBeLessThan(135);
  });

  it('rotasi garis bahu: 3D atan2(dz, dx) relatif acuan; 2D memperkirakan dari pemendekan', () => {
    const m: MetrikDasar = { jenis: 'rotasi-bahu' };
    const lurus = pose(() => {}, 20); // ponsel agak serong 20°
    const kumpul = new PengumpulBaseline([]);
    kumpul.tambah(lurus);
    const acuan = kumpul.hasil();
    const putar = pose((p) => (p.rotasiBatang = -25), 20);
    expect(ukurMetrik(m, lurus, 'kiri', true, acuan)!.nilai).toBeCloseTo(0, 5);
    expect(ukurMetrik(m, putar, 'kiri', true, acuan)!.nilai).toBeCloseTo(25, 0);
    const lurusDepan = pose(() => {});
    const kumpul2D = new PengumpulBaseline([]);
    kumpul2D.tambah(lurusDepan);
    const putarDepan = pose((p) => (p.rotasiBatang = 25));
    expect(ukurMetrik(m, putarDepan, 'kiri', false, kumpul2D.hasil())!.nilai).toBeGreaterThan(18);
  });
});
