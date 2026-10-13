import { getProfile, getProgram, getSchedule, listProfiles, listSessions } from '@/data/db';
import { useLiveQuery } from '@/data/useLiveQuery';
import type { DataPasienKlinisi } from '@/features/adherence/klinisi';
import type { Profile } from '@/types';

async function muatPasien(profile: Profile): Promise<DataPasienKlinisi> {
  const [program, schedule, sessions] = await Promise.all([getProgram(profile.id), getSchedule(profile.id), listSessions(profile.id)]);
  return { profile, program, schedule, sessions };
}

/** Semua pasien demo beserta program, jadwal, dan sesi selesai; diperbarui otomatis saat data berubah. */
export function useDaftarPasienKlinisi() {
  return useLiveQuery(async () => Promise.all((await listProfiles()).map(muatPasien)), []);
}

/** Satu pasien; `data === null` bila id tidak dikenal. */
export function usePasienKlinisi(patientId: string) {
  return useLiveQuery(async () => {
    const profile = await getProfile(patientId);
    return profile ? muatPasien(profile) : null;
  }, [patientId]);
}
