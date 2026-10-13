import type { ISODate, JenisSesi, Schedule, Session } from '@/types';
import { addDays, lastNDays, namaHariPendek } from '@/lib/date';

/**
 * Logika kepatuhan (Bab 9.1, 9.2). Semua fungsi murni: menerima daftar sesi dan tanggal "hari ini"
 * secara eksplisit sehingga mudah diuji dan selalu dihitung dari data yang benar-benar tersimpan (AC F5).
 * Hanya sesi `selesai` yang dihitung; sesi terputus diabaikan.
 */

export interface TargetHarian {
  gerak: number;
  afasia: number;
  total: number;
}

/** Jadwal bawaan: satu sesi gerak + satu sesi bicara per hari (Bab 9.1). */
export function targetHarian(schedule?: Schedule | null): TargetHarian {
  const gerak = !schedule || schedule.jamGerak ? 1 : 0;
  const afasia = !schedule || schedule.jamAfasia ? 1 : 0;
  return { gerak, afasia, total: gerak + afasia };
}

export function hanyaSelesai(sessions: readonly Session[]): Session[] {
  return sessions.filter((s) => s.selesai);
}

/** Sesi selesai dikelompokkan per tanggal, tiap kelompok urut dari yang paling awal. */
export function kelompokkanPerTanggal(sessions: readonly Session[]): Map<ISODate, Session[]> {
  const map = new Map<ISODate, Session[]>();
  for (const s of hanyaSelesai(sessions)) {
    const list = map.get(s.tanggal);
    if (list) list.push(s);
    else map.set(s.tanggal, [s]);
  }
  for (const list of map.values()) list.sort((a, b) => waktuSesi(a) - waktuSesi(b));
  return map;
}

const waktuSesi = (s: Session) => s.selesaiAt ?? s.mulaiAt;

export interface StatusHari {
  tanggal: ISODate;
  /** jumlah sesi gerak selesai (satu sesi = satu latihan) */
  jumlahGerak: number;
  jumlahAfasia: number;
  gerakSelesai: boolean;
  afasiaSelesai: boolean;
  /** Sesi terjadwal yang terpenuhi, dibatasi target per jenis: min(gerak, tGerak) + min(afasia, tAfasia). */
  selesai: number;
  target: number;
  adaSesi: boolean;
  terakhirAt: number | null;
  skorTerakhir: number | null;
  jenisTerakhir: JenisSesi | null;
  /** Skor sesi gerak/bicara terakhir hari itu, null bila belum ada. */
  skorGerakTerakhir: number | null;
  skorAfasiaTerakhir: number | null;
}

export function statusHari(sessions: readonly Session[], tanggal: ISODate, target: TargetHarian = targetHarian()): StatusHari {
  const hari = (kelompokkanPerTanggal(sessions).get(tanggal) ?? []);
  return statusDariSesiHari(hari, tanggal, target);
}

function statusDariSesiHari(hari: Session[], tanggal: ISODate, target: TargetHarian): StatusHari {
  const gerak = hari.filter((s) => s.jenis === 'gerak');
  const afasia = hari.filter((s) => s.jenis === 'afasia');
  const terakhir = hari.at(-1) ?? null;
  return {
    tanggal,
    jumlahGerak: gerak.length,
    jumlahAfasia: afasia.length,
    gerakSelesai: gerak.length > 0,
    afasiaSelesai: afasia.length > 0,
    selesai: Math.min(gerak.length, target.gerak) + Math.min(afasia.length, target.afasia),
    target: target.total,
    adaSesi: hari.length > 0,
    terakhirAt: terakhir ? waktuSesi(terakhir) : null,
    skorTerakhir: terakhir ? terakhir.skor : null,
    jenisTerakhir: terakhir ? terakhir.jenis : null,
    skorGerakTerakhir: gerak.at(-1)?.skor ?? null,
    skorAfasiaTerakhir: afasia.at(-1)?.skor ?? null,
  };
}

export interface BatangHari {
  tanggal: ISODate;
  /** "Sen".."Min" */
  label: string;
  selesai: number;
  target: number;
  hariIni: boolean;
}

/**
 * 7 batang (6 hari lalu sampai hari ini): sesi terjadwal yang selesai dibanding target.
 * Hari sebelum program dimulai (tanpa sesi) bertarget 0 agar pasien baru tidak dianggap melewatkan latihan.
 */
export function batang7Hari(
  sessions: readonly Session[],
  today: ISODate,
  target: TargetHarian = targetHarian(),
  mulaiProgram?: ISODate,
): BatangHari[] {
  const perTanggal = kelompokkanPerTanggal(sessions);
  return lastNDays(7, today).map((tanggal) => {
    const st = statusDariSesiHari(perTanggal.get(tanggal) ?? [], tanggal, target);
    const terjadwal = !mulaiProgram || tanggal >= mulaiProgram || st.adaSesi;
    return { tanggal, label: namaHariPendek(tanggal), selesai: st.selesai, target: terjadwal ? st.target : 0, hariIni: tanggal === today };
  });
}

export interface Kepatuhan {
  selesai: number;
  target: number;
  /** 0..100, dibulatkan */
  persen: number;
  dari: ISODate;
  sampai: ISODate;
}

/** Kepatuhan mingguan = Σ min(selesai, target) / Σ target selama 7 hari yang berakhir hari ini. */
export function kepatuhanMingguan(
  sessions: readonly Session[],
  today: ISODate,
  target: TargetHarian = targetHarian(),
  mulaiProgram?: ISODate,
): Kepatuhan {
  const bars = batang7Hari(sessions, today, target, mulaiProgram);
  const selesai = bars.reduce((n, b) => n + b.selesai, 0);
  const total = bars.reduce((n, b) => n + b.target, 0);
  return {
    selesai,
    target: total,
    persen: total === 0 ? 0 : Math.round((selesai / total) * 100),
    dari: bars[0].tanggal,
    sampai: today,
  };
}

export interface InfoStreak {
  /** Hari berturut-turut dengan minimal satu sesi selesai, sampai hari ini (atau kemarin bila hari ini belum). */
  saatIni: number;
  terpanjang: number;
  hariIniSelesai: boolean;
  /** Streak masih hidup tetapi hari ini belum ada sesi: tampilkan "Lanjutkan hari ini". */
  perluLanjutHariIni: boolean;
}

/**
 * Streak (Bab 9.1): satu hari dihitung bila ada minimal satu sesi selesai. Hari ini yang belum ada sesinya
 * tidak memutus streak (hitungan berhenti di kemarin), sehingga sesi pertama di hari baru menambah tepat satu.
 */
export function hitungStreak(sessions: readonly Session[], today: ISODate): InfoStreak {
  const hari = new Set(hanyaSelesai(sessions).map((s) => s.tanggal));
  const hariIniSelesai = hari.has(today);
  let saatIni = 0;
  for (let d = hariIniSelesai ? today : addDays(today, -1); hari.has(d); d = addDays(d, -1)) saatIni++;

  let terpanjang = 0;
  let jalan = 0;
  let sebelum: ISODate | null = null;
  for (const d of [...hari].filter((x) => x <= today).sort()) {
    jalan = sebelum !== null && addDays(sebelum, 1) === d ? jalan + 1 : 1;
    terpanjang = Math.max(terpanjang, jalan);
    sebelum = d;
  }
  return { saatIni, terpanjang: Math.max(terpanjang, saatIni), hariIniSelesai, perluLanjutHariIni: !hariIniSelesai && saatIni > 0 };
}

export type StatusKalender = 'selesai' | 'terlewat' | 'hari-ini-belum';

export interface HariKalender {
  tanggal: ISODate;
  label: string;
  status: StatusKalender;
  hariIni: boolean;
}

/** Kalender 7 hari terakhir dengan tanda selesai / terlewat; hari ini yang belum berlatih bukan "terlewat". */
export function kalender7Hari(sessions: readonly Session[], today: ISODate): HariKalender[] {
  const hari = new Set(hanyaSelesai(sessions).map((s) => s.tanggal));
  return lastNDays(7, today).map((tanggal) => ({
    tanggal,
    label: namaHariPendek(tanggal),
    hariIni: tanggal === today,
    status: hari.has(tanggal) ? 'selesai' : tanggal === today ? 'hari-ini-belum' : 'terlewat',
  }));
}

export interface TitikTren {
  tanggal: ISODate;
  /** rata-rata skor sesi gerak hari itu; null bila tidak ada sesi */
  gerak: number | null;
  afasia: number | null;
}

/** Rata-rata harian skor gerak dan skor bicara selama 14 hari terakhir (boleh berlubang). */
export function tren14Hari(sessions: readonly Session[], today: ISODate): TitikTren[] {
  const perTanggal = kelompokkanPerTanggal(sessions);
  return lastNDays(14, today).map((tanggal) => {
    const hari = perTanggal.get(tanggal) ?? [];
    return {
      tanggal,
      gerak: rataRata(hari.filter((s) => s.jenis === 'gerak').map((s) => s.skor)),
      afasia: rataRata(hari.filter((s) => s.jenis === 'afasia').map((s) => s.skor)),
    };
  });
}

export function rataRata(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Rata-rata skor sesi selesai satu jenis dalam rentang tanggal inklusif. */
export function rataSkor(sessions: readonly Session[], jenis: JenisSesi, dari: ISODate, sampai: ISODate): number | null {
  return rataRata(
    hanyaSelesai(sessions)
      .filter((s) => s.jenis === jenis && s.tanggal >= dari && s.tanggal <= sampai)
      .map((s) => s.skor),
  );
}

export interface PerbandinganSkor {
  jenis: JenisSesi;
  /** 7 hari terakhir (6 hari lalu s.d. hari ini) */
  sekarang: number | null;
  /** 7 hari sebelumnya */
  sebelum: number | null;
}

export function bandingkanSkorMingguan(sessions: readonly Session[], jenis: JenisSesi, today: ISODate): PerbandinganSkor {
  return {
    jenis,
    sekarang: rataSkor(sessions, jenis, addDays(today, -6), today),
    sebelum: rataSkor(sessions, jenis, addDays(today, -13), addDays(today, -7)),
  };
}
