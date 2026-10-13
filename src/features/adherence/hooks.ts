import { useEffect, useMemo, useRef, useState } from 'react';
import type { Profile, Program, Schedule, Session } from '@/types';
import { getProgram, getSchedule, listProfiles, listSessions } from '@/data/db';
import { useLiveQuery } from '@/data/useLiveQuery';
import { toISODate } from '@/lib/date';
import { usePrefs } from '@/lib/prefs';
import { statusHari, targetHarian } from './adherence';
import { buatLaporan, type LaporanKepatuhan } from './laporan';
import { baruJatuhTempo, pengingatHariIni, tampilkanNotifikasi, teksNotifikasi, type ItemPengingat } from './reminders';

/** Waktu sekarang yang diperbarui berkala, agar pergantian hari dan jam jadwal ikut terbaca. */
export function useSekarang(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
  return now;
}

export interface DataPasien {
  profiles: Profile[];
  /** Pasien aktif (prefs.activePatientId, cadangan: profil pertama). */
  profile: Profile | undefined;
  program: Program | undefined;
  schedule: Schedule | undefined;
  /** Semua sesi selesai pasien aktif, urut dari yang paling lama. */
  sessions: Session[];
}

/** Data pasien aktif dari IndexedDB; otomatis diperbarui saat ada sesi baru (AC F4: < 2 detik). */
export function useDataPasien() {
  const { activePatientId } = usePrefs();
  return useLiveQuery<DataPasien>(async () => {
    const profiles = await listProfiles();
    const profile = profiles.find((p) => p.id === activePatientId) ?? profiles[0];
    if (!profile) return { profiles, profile, program: undefined, schedule: undefined, sessions: [] };
    const [program, schedule, sessions] = await Promise.all([
      getProgram(profile.id),
      getSchedule(profile.id),
      listSessions(profile.id),
    ]);
    return { profiles, profile, program, schedule, sessions };
  }, [activePatientId]);
}

export function useLaporan(data: DataPasien | undefined, sekarang: Date): LaporanKepatuhan | null {
  const today = toISODate(sekarang);
  return useMemo(
    () => (data?.profile ? buatLaporan(data.sessions, today, { schedule: data.schedule, profile: data.profile }) : null),
    [data, today],
  );
}

/**
 * Notifikasi PWA selama aplikasi terbuka: saat jam jadwal lewat dan sesi itu belum selesai, tampilkan satu
 * notifikasi. Hanya transisi "nanti" -> "waktunya" yang memicu, jadi membuka aplikasi tidak memunculkan notifikasi ganda.
 */
export function useNotifikasiPengingat(data: DataPasien | undefined, sekarang: Date): void {
  const sebelum = useRef<ItemPengingat[] | null>(null);
  const schedule = data?.schedule;
  const items = useMemo(() => {
    if (!data || !schedule) return [];
    return pengingatHariIni(schedule, statusHari(data.sessions, toISODate(sekarang), targetHarian(schedule)), sekarang);
  }, [data, schedule, sekarang]);

  useEffect(() => {
    const lama = sebelum.current;
    sebelum.current = items;
    if (!lama || !schedule?.notifikasiAktif) return;
    for (const item of baruJatuhTempo(lama, items)) {
      const { judul, isi } = teksNotifikasi(item);
      void tampilkanNotifikasi(judul, isi);
    }
  }, [items, schedule?.notifikasiAktif]);
}
