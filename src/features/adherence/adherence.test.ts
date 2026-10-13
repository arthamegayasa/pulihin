import { describe, expect, it } from 'vitest';
import { addDays } from '@/lib/date';
import {
  batang7Hari,
  hitungStreak,
  kalender7Hari,
  kepatuhanMingguan,
  statusHari,
  targetHarian,
  tren14Hari,
} from './adherence';
import { hariLengkap, sesi } from './testUtils';

const TODAY = '2026-10-13'; // Selasa

describe('targetHarian', () => {
  it('satu sesi gerak + satu sesi bicara per hari', () => {
    expect(targetHarian()).toEqual({ gerak: 1, afasia: 1, total: 2 });
    expect(targetHarian({ patientId: 'x', jamGerak: '08:00', jamAfasia: '16:00', notifikasiAktif: false }).total).toBe(2);
  });
});

describe('statusHari', () => {
  it('membaca gerak/bicara selesai, jam terakhir, dan skor terakhir', () => {
    const s = [sesi(TODAY, 'gerak', 60, 8), sesi(TODAY, 'gerak', 66, 9), sesi(TODAY, 'afasia', 55, 16)];
    const st = statusHari(s, TODAY);
    expect(st.gerakSelesai).toBe(true);
    expect(st.afasiaSelesai).toBe(true);
    expect(st.jumlahGerak).toBe(2);
    expect(st.selesai).toBe(2); // dibatasi target per jenis
    expect(st.skorTerakhir).toBe(55);
    expect(st.skorGerakTerakhir).toBe(66);
    expect(st.jenisTerakhir).toBe('afasia');
  });

  it('sesi yang belum selesai tidak dihitung', () => {
    const st = statusHari([sesi(TODAY, 'gerak', 60, 8, false)], TODAY);
    expect(st.adaSesi).toBe(false);
    expect(st.selesai).toBe(0);
    expect(st.terakhirAt).toBeNull();
  });
});

describe('kepatuhan mingguan & batang 7 hari', () => {
  it('Σ min(selesai, target) / Σ target', () => {
    const s = [
      ...hariLengkap(TODAY, [1, 2]),
      sesi(addDays(TODAY, -3), 'gerak'),
      sesi(addDays(TODAY, -3), 'gerak', 70, 10), // gerak kedua tidak menambah melebihi target
      sesi(addDays(TODAY, -10), 'gerak'), // di luar 7 hari
    ];
    const k = kepatuhanMingguan(s, TODAY);
    expect(k).toMatchObject({ selesai: 5, target: 14, persen: 36, dari: addDays(TODAY, -6), sampai: TODAY });
  });

  it('7 batang berlabel hari, hari ini ditandai', () => {
    const bars = batang7Hari(hariLengkap(TODAY, [0, 1]), TODAY);
    expect(bars).toHaveLength(7);
    expect(bars.map((b) => b.label)).toEqual(['Rab', 'Kam', 'Jum', 'Sab', 'Min', 'Sen', 'Sel']);
    expect(bars[6]).toMatchObject({ tanggal: TODAY, hariIni: true, selesai: 2, target: 2 });
    expect(bars[5].selesai).toBe(2);
    expect(bars[0].selesai).toBe(0);
    expect(bars.filter((b) => b.hariIni)).toHaveLength(1);
  });
});

describe('streak', () => {
  it('hari ini belum berlatih tidak memutus streak (dihitung sampai kemarin)', () => {
    const s = hariLengkap(TODAY, [1, 2, 3]);
    expect(hitungStreak(s, TODAY)).toEqual({ saatIni: 3, terpanjang: 3, hariIniSelesai: false, perluLanjutHariIni: true });
  });

  it('sesi pertama di hari baru menambah tepat satu; sesi berikutnya hari itu tidak menambah', () => {
    const s = hariLengkap(TODAY, [1, 2, 3]);
    const sebelum = hitungStreak(s, TODAY).saatIni;
    const satu = hitungStreak([...s, sesi(TODAY, 'gerak')], TODAY).saatIni;
    const dua = hitungStreak([...s, sesi(TODAY, 'gerak'), sesi(TODAY, 'afasia', 70, 16)], TODAY).saatIni;
    expect(satu).toBe(sebelum + 1);
    expect(dua).toBe(satu);
  });

  it('jeda dua hari memutus streak; streak terpanjang tetap diingat', () => {
    const s = hariLengkap(TODAY, [0, 1, 4, 5, 6, 7, 8, 12]);
    const st = hitungStreak(s, TODAY);
    expect(st.saatIni).toBe(2);
    expect(st.terpanjang).toBe(5);
    expect(st.perluLanjutHariIni).toBe(false);
  });

  it('tanpa sesi: streak 0', () => {
    expect(hitungStreak([], TODAY)).toEqual({ saatIni: 0, terpanjang: 0, hariIniSelesai: false, perluLanjutHariIni: false });
  });

  it('streak melewati pergantian bulan', () => {
    const s = hariLengkap('2026-11-01', [0, 1, 2]);
    expect(hitungStreak(s, '2026-11-01').saatIni).toBe(3);
  });
});

describe('kalender 7 hari', () => {
  it('selesai / terlewat / hari ini belum', () => {
    const k = kalender7Hari(hariLengkap(TODAY, [1, 3]), TODAY);
    expect(k.map((h) => h.status)).toEqual(['terlewat', 'terlewat', 'terlewat', 'selesai', 'terlewat', 'selesai', 'hari-ini-belum']);
    expect(kalender7Hari([sesi(TODAY)], TODAY)[6].status).toBe('selesai');
  });
});

describe('tren 14 hari', () => {
  it('rata-rata harian per jenis, hari kosong = null', () => {
    const s = [sesi(TODAY, 'gerak', 60, 8), sesi(TODAY, 'gerak', 71, 9), sesi(addDays(TODAY, -13), 'afasia', 50)];
    const t = tren14Hari(s, TODAY);
    expect(t).toHaveLength(14);
    expect(t[13]).toEqual({ tanggal: TODAY, gerak: 66, afasia: null });
    expect(t[0]).toEqual({ tanggal: addDays(TODAY, -13), gerak: null, afasia: 50 });
    expect(t[5]).toEqual({ tanggal: addDays(TODAY, -8), gerak: null, afasia: null });
  });
});
