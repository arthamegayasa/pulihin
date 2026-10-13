import { describe, expect, it } from 'vitest';
import { getExercise, KOREKSI_BAWAAN } from './exerciseDefinitions';
import { FormChecker, PenjadwalKoreksi, type KandidatKoreksi, type MasukanForm } from './FormChecker';
import type { PeristiwaSiklus } from './RepCounter';
import { buatSesiSintetis, jalankanSintetis, type HasilJalan } from './synthetic';
import type { IdKoreksi } from './types';

const SIKU = getExercise('fleksi-siku')!;

/** Waktu (ms, relatif awal sesi) saat pesan `id` mulai tampil. */
function mulaiTampil(jalan: HasilJalan, id: IdKoreksi, tAwal: number): number[] {
  return jalan.snapshot.filter((x) => x.s.koreksiBaru?.id === id).map((x) => x.t - tAwal);
}

describe('deteksi koreksi lewat tracker (Bab 7.3, AC-F1-3)', () => {
  it('bahu terangkat saat fase naik/atas: muncul setelah bertahan >= 0,5 s dan <= 0,7 s sesudahnya', () => {
    for (const fps of [15, 30]) {
      // Repetisi 1: mulai 2,0 s, naik 1,25 s, tahan 2,5 s di atas. Bahu terangkat 5 cm pada 3,5-5,5 s.
      const sesi = buatSesiSintetis({
        gerakan: 'fleksi-siku',
        jumlahRepetisi: 1,
        durasiRepetisiDetik: 5,
        tahanAtasDetik: 2.5,
        angkatBahu: { mulaiDetik: 3.5, selesaiDetik: 5.5, meter: 0.05 },
        derauPx: 1,
        fps,
      });
      const jalan = jalankanSintetis(SIKU, sesi);
      const t = mulaiTampil(jalan, 'bahu-terangkat', sesi.tAwal);
      expect(t).toHaveLength(1);
      expect(t[0]).toBeGreaterThanOrEqual(3500 + 500);
      expect(t[0]).toBeLessThanOrEqual(3500 + 500 + 700);
      expect(jalan.hasil.repLogs[0].koreksi).toContain('bahu-terangkat');
    }
  });

  it('bahu terangkat saat diam di posisi bawah tidak dievaluasi', () => {
    const sesi = buatSesiSintetis({
      gerakan: 'fleksi-siku',
      jumlahRepetisi: 1,
      awalDiamDetik: 4,
      angkatBahu: { mulaiDetik: 1.5, selesaiDetik: 3.5, meter: 0.06 },
    });
    expect(mulaiTampil(jalankanSintetis(SIKU, sesi), 'bahu-terangkat', sesi.tAwal)).toHaveLength(0);
  });

  it('badan miring > 12° memunculkan "Tegakkan badan" setelah 0,5 s', () => {
    const sesi = buatSesiSintetis({ gerakan: 'diam', durasiTotalDetik: 8, miring: { mulaiDetik: 3, selesaiDetik: 5, derajat: 18 }, derauPx: 1 });
    const jalan = jalankanSintetis(SIKU, sesi);
    const t = mulaiTampil(jalan, 'badan-miring', sesi.tAwal);
    expect(t).toHaveLength(1);
    expect(t[0]).toBeGreaterThanOrEqual(3500);
    expect(t[0]).toBeLessThanOrEqual(4200);
    expect(jalan.snapshot.find((x) => x.s.koreksiBaru)!.s.koreksiBaru!.pesan).toBe('Tegakkan badan, jangan miring');
  });

  it('miring 8° (di bawah ambang) tidak memunculkan pesan', () => {
    const sesi = buatSesiSintetis({ gerakan: 'diam', durasiTotalDetik: 6, miring: { mulaiDetik: 2, selesaiDetik: 5, derajat: 8 } });
    expect(mulaiTampil(jalankanSintetis(SIKU, sesi), 'badan-miring', sesi.tAwal)).toHaveLength(0);
  });

  it('keluar frame: pesan muncul setelah landmark kunci hilang > 1 s', () => {
    const sesi = buatSesiSintetis({ gerakan: 'diam', durasiTotalDetik: 8, keluarFrame: { mulaiDetik: 3, selesaiDetik: 5.5 } });
    const jalan = jalankanSintetis(SIKU, sesi);
    const t = mulaiTampil(jalan, 'keluar-frame', sesi.tAwal);
    expect(t).toHaveLength(1);
    expect(t[0]).toBeGreaterThanOrEqual(4000);
    expect(t[0]).toBeLessThan(4100);
    expect(jalan.hasil.koreksiTerhitung['keluar-frame']).toBe(1);
  });

  it('hilang 0,8 s tidak memunculkan pesan keluar frame', () => {
    const sesi = buatSesiSintetis({ gerakan: 'diam', durasiTotalDetik: 6, keluarFrame: { mulaiDetik: 3, selesaiDetik: 3.8 } });
    expect(mulaiTampil(jalankanSintetis(SIKU, sesi), 'keluar-frame', sesi.tAwal)).toHaveLength(0);
  });

  it('tempo cepat dua siklus berturut-turut -> "Perlambat gerakan Anda"', () => {
    const sesi = buatSesiSintetis({ gerakan: 'fleksi-siku', jumlahRepetisi: 3, durasiRepetisiDetik: 1.6, tahanAtasDetik: 0.3 });
    const jalan = jalankanSintetis(SIKU, sesi);
    const cepat = jalan.hasil.repLogs.filter((l) => l.durasiSiklusDetik < SIKU.tempoTargetDetik.min);
    expect(cepat.length).toBeGreaterThanOrEqual(2);
    expect(jalan.hasil.koreksiTerhitung['tempo-cepat']).toBe(1);
    expect(jalan.snapshot.find((x) => x.s.koreksiBaru?.id === 'tempo-cepat')!.s.koreksiBaru!.pesan).toBe(
      'Perlambat gerakan Anda',
    );
  });

  it('pesan tidak pernah menyalahkan pasien', () => {
    for (const k of Object.values(KOREKSI_BAWAAN)) {
      expect(k.pesan).not.toMatch(/gagal|salah|tidak valid|buruk/i);
    }
  });
});

describe('FormChecker: rentang kurang', () => {
  const siklus = (puncak: number, t: number): PeristiwaSiklus => ({
    jenis: puncak >= SIKU.ambangAtas ? 'repetisi' : 'rentang-kurang',
    dihitung: puncak >= SIKU.ambangAtas,
    lengkap: puncak >= SIKU.ambangAtas,
    puncak,
    durasiDetik: 3,
    mulai: t - 3000,
    selesai: t,
  });
  const masukan = (t: number, s: PeristiwaSiklus[] = []): MasukanForm => ({
    t,
    tubuhTerlihat: true,
    siap: true,
    sedangNaik: false,
    kemiringanBahu: 0,
    susutBahuTelinga: 0,
    siklus: s,
  });

  it('dua percobaan berturut-turut di bawah ambangAtas - 15 -> pesan; satu saja atau diselingi repetisi penuh -> tidak', () => {
    const fc = new FormChecker(SIKU);
    expect(fc.update(masukan(1000, [siklus(80, 1000)])).koreksiBaru).toBeNull();
    expect(fc.update(masukan(5000, [siklus(130, 5000)])).koreksiBaru).toBeNull();
    expect(fc.update(masukan(9000, [siklus(80, 9000)])).koreksiBaru).toBeNull();
    // 110 >= 120 - 15: tidak dianggap rendah dan memutus deret.
    expect(fc.update(masukan(13000, [siklus(110, 13000)])).koreksiBaru).toBeNull();
    expect(fc.update(masukan(17000, [siklus(80, 17000)])).koreksiBaru).toBeNull();
    const k = fc.update(masukan(21000, [siklus(90, 21000)])).koreksiBaru;
    expect(k?.id).toBe('rentang-kurang');
    expect(k?.pesan).toBe('Sedikit lagi, angkat lebih tinggi bila mampu');
  });
});

describe('PenjadwalKoreksi: aturan penayangan (Bab 7.3)', () => {
  const K = (id: IdKoreksi, peristiwa = false): KandidatKoreksi => ({ id, pesan: `pesan ${id}`, peristiwa });

  /** Jalankan penjadwal per 1/30 s; `aktif(t)` = kandidat pada waktu t (ms). */
  function simulasi(durasiMs: number, aktif: (t: number) => KandidatKoreksi[]) {
    const p = new PenjadwalKoreksi();
    const log: Array<{ t: number; id: IdKoreksi | null; baru: IdKoreksi | null }> = [];
    for (let t = 0; t <= durasiMs; t += 1000 / 30) {
      const h = p.update(t, aktif(t));
      log.push({ t, id: h.koreksi?.id ?? null, baru: h.koreksiBaru?.id ?? null });
    }
    return { p, log };
  }

  it('maksimal satu pesan: dua kondisi bersamaan -> hanya yang prioritas lebih tinggi', () => {
    const { log } = simulasi(3000, () => [K('tempo-cepat'), K('badan-miring')]);
    expect(log[0].baru).toBe('badan-miring');
    expect(log.every((x) => x.id === 'badan-miring')).toBe(true);
  });

  it('tampil minimal 1,5 s walau kondisi sudah hilang', () => {
    const { log } = simulasi(3000, (t) => (t < 300 ? [K('badan-miring')] : []));
    const tampil = log.filter((x) => x.id === 'badan-miring');
    expect(tampil[0].t).toBe(0);
    expect(tampil[tampil.length - 1].t).toBeGreaterThanOrEqual(1450);
    expect(tampil[tampil.length - 1].t).toBeLessThan(1550);
  });

  it('pesan yang sama tidak diulang dalam 4 s', () => {
    const { log } = simulasi(10000, (t) => (t < 200 || t > 2000 ? [K('badan-miring')] : []));
    const mulai = log.filter((x) => x.baru === 'badan-miring').map((x) => x.t);
    expect(mulai).toHaveLength(2);
    const selesaiPertama = log.find((x) => x.t > 0 && x.id === null)!.t;
    expect(mulai[1] - selesaiPertama).toBeGreaterThanOrEqual(4000);
    expect(mulai[1] - selesaiPertama).toBeLessThan(4050);
  });

  it('pesan lebih penting langsung menggantikan (AC-F1-3); yang setara/kurang penting menunggu 1,5 s', () => {
    const { log } = simulasi(4000, (t) => [K('tempo-cepat'), ...(t >= 500 ? [K('keluar-frame')] : [])]);
    const ganti = log.find((x) => x.baru === 'keluar-frame')!;
    expect(ganti.t).toBeGreaterThanOrEqual(500);
    expect(ganti.t).toBeLessThan(540);
    // Kurang penting tidak memotong: rentang-kurang muncul saat badan-miring tampil -> tunggu.
    const b = simulasi(4000, (t) => [...(t < 200 ? [K('badan-miring')] : []), ...(t >= 300 ? [K('rentang-kurang', true)] : [])]);
    const mulaiRentang = b.log.find((x) => x.baru === 'rentang-kurang')!.t;
    expect(mulaiRentang).toBeGreaterThanOrEqual(1500);
    expect(mulaiRentang).toBeLessThan(1550);
  });

  it('tidak pernah dua pesan; setiap pergantian ke pesan setara/kurang penting didahului tayang >= 1,5 s', () => {
    const urutan: IdKoreksi[] = ['tempo-cepat', 'rentang-kurang', 'bahu-terangkat', 'badan-miring', 'keluar-frame'];
    // Kondisi acak berganti tiap 0,4 s.
    const { log } = simulasi(30000, (t) => urutan.filter((_, i) => (Math.floor(t / 400) * 7 + i * 3) % 5 < 2).map((id) => K(id)));
    let sejak = 0;
    let sebelumnya: IdKoreksi | null = null;
    const rank = (id: IdKoreksi) => urutan.length - urutan.indexOf(id);
    for (const x of log) {
      if (x.baru && sebelumnya && rank(x.baru) >= rank(sebelumnya)) expect(x.t - sejak).toBeGreaterThanOrEqual(1500);
      if (x.baru) {
        expect(x.id).toBe(x.baru);
        sejak = x.t;
      }
      sebelumnya = x.id;
    }
  });

  it('pesan peristiwa tampil sekali selama 2,5 s lalu hilang', () => {
    const { log, p } = simulasi(6000, (t) => (t < 100 ? [K('rentang-kurang', true)] : []));
    const tampil = log.filter((x) => x.id === 'rentang-kurang');
    expect(tampil[tampil.length - 1].t - tampil[0].t).toBeGreaterThanOrEqual(2450);
    expect(tampil[tampil.length - 1].t - tampil[0].t).toBeLessThan(2550);
    expect(p.terhitung['rentang-kurang']).toBe(1);
  });
});
