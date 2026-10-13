import type { ISODate, Profile, Schedule, Session } from '@/types';
import { formatTanggalPendek } from '@/lib/date';
import {
  bandingkanSkorMingguan,
  batang7Hari,
  hitungStreak,
  kalender7Hari,
  kepatuhanMingguan,
  statusHari,
  targetHarian,
  tren14Hari,
  type BatangHari,
  type HariKalender,
  type InfoStreak,
  type Kepatuhan,
  type PerbandinganSkor,
  type StatusHari,
  type TargetHarian,
  type TitikTren,
} from './adherence';
import { hitungRedFlag, type RedFlag } from './redFlags';

/** Semua angka kepatuhan satu pasien untuk satu hari; dipakai Beranda, Untuk Keluarga, dan Dashboard Klinisi. */
export interface LaporanKepatuhan {
  today: ISODate;
  target: TargetHarian;
  hariIni: StatusHari;
  batang: BatangHari[];
  kepatuhan: Kepatuhan;
  streak: InfoStreak;
  kalender: HariKalender[];
  tren: TitikTren[];
  skorGerak: PerbandinganSkor;
  skorAfasia: PerbandinganSkor;
  redFlags: RedFlag[];
}

export function buatLaporan(
  sessions: readonly Session[],
  today: ISODate,
  opsi: { schedule?: Schedule | null; profile?: Profile | null } = {},
): LaporanKepatuhan {
  const target = targetHarian(opsi.schedule);
  const mulai = opsi.profile?.tanggalMulaiProgram;
  return {
    today,
    target,
    hariIni: statusHari(sessions, today, target),
    batang: batang7Hari(sessions, today, target, mulai),
    kepatuhan: kepatuhanMingguan(sessions, today, target, mulai),
    streak: hitungStreak(sessions, today),
    kalender: kalender7Hari(sessions, today),
    tren: tren14Hari(sessions, today),
    skorGerak: bandingkanSkorMingguan(sessions, 'gerak', today),
    skorAfasia: bandingkanSkorMingguan(sessions, 'afasia', today),
    redFlags: hitungRedFlag(sessions, today, { target, mulaiProgram: mulai }),
  };
}

/** "naik", "turun", atau "stabil" dibanding 7 hari sebelumnya; selisih < 3 poin dianggap stabil. */
export function kataTren(p: PerbandinganSkor): string {
  if (p.sekarang === null) return 'belum ada sesi minggu ini';
  if (p.sebelum === null) return 'belum ada pembanding minggu lalu';
  const selisih = p.sekarang - p.sebelum;
  if (Math.abs(selisih) < 3) return `stabil, minggu lalu ${p.sebelum}`;
  return `${selisih > 0 ? 'naik' : 'turun'} dari ${p.sebelum} minggu lalu`;
}

export const FOOTER_RINGKASAN = 'Ringkasan latihan dari aplikasi PULIHIN (prototype), bukan penilaian medis.';

/** Teks ringkasan mingguan untuk ditempel di WhatsApp ke terapis (Bab 9.2). */
export function teksRingkasanMingguan(profile: Pick<Profile, 'namaSamaran' | 'isDemo'>, lap: LaporanKepatuhan): string {
  const { kepatuhan: k, streak } = lap;
  const skor = (label: string, p: PerbandinganSkor) =>
    p.sekarang === null ? `${label}: belum ada sesi minggu ini` : `${label}: rata-rata ${p.sekarang} (${kataTren(p)})`;
  const baris = [
    '*Ringkasan Latihan Mingguan PULIHIN*',
    `Pasien: ${profile.namaSamaran}${profile.isDemo ? ' (data contoh Demo)' : ''}`,
    `Periode: ${formatTanggalPendek(k.dari)} sampai ${formatTanggalPendek(k.sampai)} ${k.sampai.slice(0, 4)}`,
    `Latihan selesai: ${k.selesai} dari ${k.target} latihan terjadwal (${k.persen}%)`,
    `Hari berturut-turut berlatih: ${streak.saatIni} hari (terpanjang ${streak.terpanjang} hari)`,
    skor('Skor latihan gerak', lap.skorGerak),
    skor('Skor latihan bicara', lap.skorAfasia),
    '',
  ];
  if (lap.redFlags.length === 0) {
    baris.push('Tanda perlu perhatian: tidak ada.');
  } else {
    baris.push('Tanda perlu perhatian:');
    for (const f of lap.redFlags) baris.push(`- ${f.judul}. ${f.pesan}`);
  }
  baris.push('', FOOTER_RINGKASAN);
  return baris.join('\n');
}
