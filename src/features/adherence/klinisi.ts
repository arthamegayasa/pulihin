import type { ISODate, Profile, Program, Schedule, Session } from '@/types';
import { buatLaporan, type LaporanKepatuhan } from './laporan';

/** Data mentah satu pasien dari penyimpanan lokal. */
export interface DataPasienKlinisi {
  profile: Profile;
  program: Program | undefined;
  schedule: Schedule | undefined;
  /** Sesi selesai, urut dari yang paling lama. */
  sessions: Session[];
}

/** Ringkasan satu pasien untuk Dashboard Klinisi (Bab 10.2): angka & red flag sama dengan tampilan keluarga. */
export interface RingkasanPasienKlinisi extends DataPasienKlinisi {
  laporan: LaporanKepatuhan;
  sesiTerakhir: Session | null;
  jumlahPenting: number;
  jumlahPerhatian: number;
}

export function ringkasPasien(d: DataPasienKlinisi, today: ISODate): RingkasanPasienKlinisi {
  const laporan = buatLaporan(d.sessions, today, { schedule: d.schedule, profile: d.profile });
  return {
    ...d,
    laporan,
    sesiTerakhir: sesiTerbaru(d.sessions.filter((s) => s.tanggal <= today), 1)[0] ?? null,
    jumlahPenting: laporan.redFlags.filter((f) => f.tingkat === 'tinggi').length,
    jumlahPerhatian: laporan.redFlags.filter((f) => f.tingkat === 'perhatian').length,
  };
}

/**
 * Pasien yang paling perlu perhatian di atas: penanda "Penting" terbanyak, lalu penanda "Perlu perhatian",
 * lalu kepatuhan mingguan terendah, lalu nama.
 */
export function urutkanPerluPerhatian<T extends Pick<RingkasanPasienKlinisi, 'jumlahPenting' | 'jumlahPerhatian' | 'laporan' | 'profile'>>(
  list: readonly T[],
): T[] {
  return [...list].sort(
    (a, b) =>
      b.jumlahPenting - a.jumlahPenting ||
      b.jumlahPerhatian - a.jumlahPerhatian ||
      a.laporan.kepatuhan.persen - b.laporan.kepatuhan.persen ||
      a.profile.namaSamaran.localeCompare(b.profile.namaSamaran, 'id'),
  );
}

/** Sesi selesai terbaru lebih dulu, paling banyak `n`. */
export function sesiTerbaru(sessions: readonly Session[], n = 5): Session[] {
  return sessions
    .filter((s) => s.selesai)
    .sort((a, b) => (b.selesaiAt ?? b.mulaiAt) - (a.selesaiAt ?? a.mulaiAt))
    .slice(0, n);
}
