import { describe, expect, it } from 'vitest';
import type { Schedule } from '@/types';
import { statusHari, type StatusHari } from './adherence';
import { bannerPengingat, baruJatuhTempo, jamKeMenit, pengingatHariIni } from './reminders';
import { sesi } from './testUtils';

const TODAY = '2026-10-13';
const JADWAL: Schedule = { patientId: 'uji', jamGerak: '08:00', jamAfasia: '16:00', notifikasiAktif: true };
const pukul = (h: number, m = 0) => new Date(2026, 9, 13, h, m);
/** Banner Beranda pada jam tertentu (pengingat + kalimat dihitung pada waktu yang sama). */
const banner = (s: StatusHari, h: number, m = 0) => bannerPengingat(pengingatHariIni(JADWAL, s, pukul(h, m)), pukul(h, m));

describe('pengingat hari ini', () => {
  it('nanti -> waktunya -> selesai', () => {
    const kosong = statusHari([], TODAY);
    expect(pengingatHariIni(JADWAL, kosong, pukul(7, 59)).map((i) => i.status)).toEqual(['nanti', 'nanti']);
    expect(pengingatHariIni(JADWAL, kosong, pukul(8)).map((i) => i.status)).toEqual(['waktunya', 'nanti']);
    const gerakSelesai = statusHari([sesi(TODAY, 'gerak')], TODAY);
    expect(pengingatHariIni(JADWAL, gerakSelesai, pukul(16, 30)).map((i) => i.status)).toEqual(['selesai', 'waktunya']);
  });

  it('tanpa jadwal tidak ada pengingat', () => {
    expect(pengingatHariIni(undefined, statusHari([], TODAY), pukul(9))).toEqual([]);
    expect(bannerPengingat([], pukul(9))).toBeNull();
  });

  it('notifikasi hanya untuk transisi nanti -> waktunya', () => {
    const kosong = statusHari([], TODAY);
    const a = pengingatHariIni(JADWAL, kosong, pukul(7, 59));
    const b = pengingatHariIni(JADWAL, kosong, pukul(8, 0));
    expect(baruJatuhTempo(a, b)).toEqual([{ jenis: 'gerak', jam: '08:00', status: 'waktunya' }]);
    expect(baruJatuhTempo(b, b)).toEqual([]);
  });

  it('banner hangat sesuai keadaan', () => {
    const kosong = statusHari([], TODAY);
    expect(banner(kosong, 8, 30)).toEqual({ nada: 'aksen', teks: 'Yuk, latihan gerak (08.00)' });
    expect(banner(statusHari([sesi(TODAY)], TODAY), 9)?.teks).toBe('Latihan bicara nanti pukul 16.00');
    const semua = statusHari([sesi(TODAY), sesi(TODAY, 'afasia', 70, 16)], TODAY);
    expect(banner(semua, 17)?.nada).toBe('sukses');
  });

  it('jadwal yang sudah lewat lama: tanpa "Yuk ... (08.00)" di malam hari, tetap mengajak', () => {
    const kosong = statusHari([], TODAY);
    expect(banner(kosong, 9)).toEqual({ nada: 'aksen', teks: 'Jadwal 08.00 sudah lewat. Masih bisa latihan hari ini.' });
    // Jadwal yang baru jatuh tempo didahulukan daripada jadwal pagi yang terlewat.
    expect(banner(kosong, 16, 10)?.teks).toBe('Yuk, latihan bicara (16.00)');
    expect(banner(kosong, 21)?.teks).toBe('Jadwal 08.00 sudah lewat. Masih bisa latihan hari ini.');
    expect(banner(statusHari([sesi(TODAY)], TODAY), 21)?.teks).toBe('Jadwal 16.00 sudah lewat. Masih bisa latihan hari ini.');
  });

  it('jamKeMenit memvalidasi format', () => {
    expect(jamKeMenit('08:30')).toBe(510);
    expect(jamKeMenit('24:00')).toBeNull();
    expect(jamKeMenit('abc')).toBeNull();
  });
});
