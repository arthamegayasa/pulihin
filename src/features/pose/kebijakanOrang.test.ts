import { describe, expect, it } from 'vitest';
import { ATURAN_UMUM } from './exerciseDefinitions';
import {
  langkahKebijakan,
  mulaiSesiKebijakan,
  sampelLambat,
  sampelLapang,
  statusAwalKebijakan,
  type SampelKinerja,
  type StatusKebijakanOrang,
} from './kebijakanOrang';
import { kandidatTunggalAsing, pusatOrang } from './PoseEngine';

const A = ATURAN_UMUM.adaptifOrang;

/** Putar deret sampel per frame (interval = 1000/fps) dan catat jumlah orang tiap sampel. */
function putar(
  awal: StatusKebijakanOrang,
  potongan: ReadonlyArray<{ detik: number; fps: number; inferensiMs: number }>,
  t0 = 0,
) {
  let s = awal;
  let t = t0;
  const jejak: Array<{ t: number; jumlah: 1 | 2 }> = [];
  for (const p of potongan) {
    const akhir = t + p.detik * 1000;
    for (; t < akhir; t += 1000 / p.fps) {
      const x: SampelKinerja = { t, fps: p.fps, inferensiMs: p.inferensiMs };
      s = langkahKebijakan(s, x);
      jejak.push({ t, jumlah: s.jumlahOrang });
    }
  }
  return { s, jejak, t };
}

const waktuBerubah = (jejak: Array<{ t: number; jumlah: 1 | 2 }>) =>
  jejak.filter((j, i) => i > 0 && j.jumlah !== jejak[i - 1].jumlah).map((j) => ({ t: Math.round(j.t), ke: j.jumlah }));

describe('kebijakan jumlah orang adaptif', () => {
  it('perangkat cepat (25 fps, 25 ms) tetap 2 orang', () => {
    const { s, jejak } = putar(statusAwalKebijakan(), [{ detik: 60, fps: 25, inferensiMs: 25 }]);
    expect(s.jumlahOrang).toBe(2);
    expect(waktuBerubah(jejak)).toEqual([]);
  });

  it('fps < 15 karena inferensi selama 3 s -> turun ke 1 orang tepat setelah 3 s', () => {
    const { s, jejak } = putar(statusAwalKebijakan(), [
      { detik: 2, fps: 25, inferensiMs: 25 },
      { detik: 10, fps: 10, inferensiMs: 50 },
    ]);
    expect(s.jumlahOrang).toBe(1);
    expect(s.alasan).toBe('lambat');
    const [ubah] = waktuBerubah(jejak);
    expect(ubah.ke).toBe(1);
    expect(ubah.t).toBeGreaterThanOrEqual(2000 + A.turunSetelahDetik * 1000);
    expect(ubah.t).toBeLessThanOrEqual(2000 + A.turunSetelahDetik * 1000 + 150);
  });

  it('inferensi > 60 ms memicu turun walau fps masih >= 15', () => {
    const { s } = putar(statusAwalKebijakan(), [{ detik: 5, fps: 15.5, inferensiMs: 64 }]);
    expect(s.jumlahOrang).toBe(1);
  });

  it('lambat yang terputus sebelum 3 s tidak memicu turun', () => {
    const { s } = putar(statusAwalKebijakan(), [
      { detik: 2.5, fps: 10, inferensiMs: 50 },
      { detik: 0.2, fps: 25, inferensiMs: 25 },
      { detik: 2.5, fps: 10, inferensiMs: 50 },
      { detik: 0.2, fps: 25, inferensiMs: 25 },
    ]);
    expect(s.jumlahOrang).toBe(2);
  });

  it('fps rendah karena kamera (inferensi kecil) tidak memicu turun', () => {
    expect(sampelLambat({ t: 0, fps: 12, inferensiMs: 12 })).toBe(false);
    const { s } = putar(statusAwalKebijakan(), [{ detik: 30, fps: 12, inferensiMs: 12 }]);
    expect(s.jumlahOrang).toBe(2);
  });

  it('sampel dalam masa tenang setelah sesi mulai diabaikan', () => {
    const awal = mulaiSesiKebijakan(statusAwalKebijakan(), 0);
    const { s, jejak } = putar(awal, [{ detik: 6, fps: 10, inferensiMs: 50 }]);
    expect(s.jumlahOrang).toBe(1);
    expect(waktuBerubah(jejak)[0].t).toBeGreaterThanOrEqual((A.tenangDetik + A.turunSetelahDetik) * 1000);
  });

  it('naik kembali ke 2 orang hanya setelah 10 s lapang', () => {
    const turun = putar(statusAwalKebijakan(), [{ detik: 5, fps: 10, inferensiMs: 50 }]);
    expect(turun.s.jumlahOrang).toBe(1);
    expect(sampelLapang({ t: 0, fps: 28, inferensiMs: 14 })).toBe(true);
    const naik = putar(turun.s, [{ detik: 15, fps: 28, inferensiMs: 14 }], turun.t);
    expect(naik.s.jumlahOrang).toBe(2);
    expect(naik.s.alasan).toBe('lapang');
    const [ubah] = waktuBerubah(naik.jejak);
    expect(ubah.t - turun.t).toBeGreaterThanOrEqual(A.naikSetelahDetik * 1000 - 50);
    expect(ubah.t - turun.t).toBeLessThanOrEqual(A.naikSetelahDetik * 1000 + 100);
  });

  it('1 orang yang masih berat (perkiraan 2 orang > 35 ms) tidak naik', () => {
    const turun = putar(statusAwalKebijakan(), [{ detik: 5, fps: 10, inferensiMs: 50 }]);
    const tetap = putar(turun.s, [{ detik: 60, fps: 22, inferensiMs: 26 }], turun.t);
    expect(tetap.s.jumlahOrang).toBe(1);
  });

  it('tanpa bolak-balik: turun lagi setelah pernah naik -> terkunci di 1 orang', () => {
    const { s, jejak } = putar(statusAwalKebijakan(), [
      { detik: 5, fps: 10, inferensiMs: 50 }, // turun
      { detik: 15, fps: 28, inferensiMs: 14 }, // naik
      { detik: 5, fps: 10, inferensiMs: 50 }, // turun lagi -> kunci
      { detik: 60, fps: 28, inferensiMs: 14 }, // lapang lama: tetap 1
    ]);
    expect(waktuBerubah(jejak).map((u) => u.ke)).toEqual([1, 2, 1]);
    expect(s.terkunci).toBe(true);
    expect(s.jumlahOrang).toBe(1);
  });

  it('osilasi cepat lambat/cepat tiap 1 s tidak pernah mengubah mode', () => {
    const potongan = Array.from({ length: 60 }, (_, i) =>
      i % 2 === 0 ? { detik: 1, fps: 10, inferensiMs: 50 } : { detik: 1, fps: 25, inferensiMs: 25 },
    );
    const { jejak } = putar(statusAwalKebijakan(), potongan);
    expect(waktuBerubah(jejak)).toEqual([]);
  });

  it('sesi baru mempertahankan mode dan kunci, hanya mengatur ulang deret', () => {
    const lambat: StatusKebijakanOrang = { ...statusAwalKebijakan(), jumlahOrang: 1, terkunci: true, lapangSejak: 5 };
    const s = mulaiSesiKebijakan(lambat, 1000);
    expect(s).toMatchObject({ jumlahOrang: 1, terkunci: true, lapangSejak: null, lambatSejak: null });
    expect(s.abaikanSampai).toBe(1000 + A.tenangDetik * 1000);
  });
});

describe('kandidat tunggal di mode 1 orang (kelengketan orang utama)', () => {
  /** Orang dengan pusat bahu (x, y) dan panjang batang tubuh `b` (satuan tinggi gambar, aspek 1). */
  const orang = (x: number, y: number, b: number) => {
    const lm = Array.from({ length: 33 }, () => ({ x, y }));
    lm[11] = { x: x + b * 0.2, y };
    lm[12] = { x: x - b * 0.2, y };
    lm[23] = { x: x + b * 0.1, y: y + b };
    lm[24] = { x: x - b * 0.1, y: y + b };
    return lm;
  };
  const pasien = orang(0.5, 0.3, 0.4);
  const utama = pusatOrang(pasien, 1);

  it('pasien yang sama (bergeser sedikit) diterima', () => {
    expect(kandidatTunggalAsing(orang(0.55, 0.32, 0.4), 1, utama)).toBe(false);
  });

  it('orang lebih kecil jauh di latar ditolak', () => {
    expect(kandidatTunggalAsing(orang(0.1, 0.2, 0.2), 1, utama)).toBe(true);
  });

  it('orang sama besar di tempat lain diterima (pasien berpindah), begitu pula tanpa orang utama', () => {
    expect(kandidatTunggalAsing(orang(0.1, 0.3, 0.4), 1, utama)).toBe(false);
    expect(kandidatTunggalAsing(orang(0.1, 0.2, 0.2), 1, null)).toBe(false);
  });
});
