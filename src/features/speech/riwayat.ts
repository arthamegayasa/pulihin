import { listSessions, listSpeechAttempts } from '@/data/db';
import type { RiwayatAfasia } from './pilihKata';

/**
 * Riwayat afasia satu pasien dari penyimpanan lokal: kata yang pernah dinilai Benar (dari semua
 * SpeechAttempt, termasuk sesi yang terputus) dan kata untuk diulang dari sesi selesai terakhir.
 */
export async function muatRiwayatAfasia(patientId: string): Promise<RiwayatAfasia> {
  const sesi = await listSessions(patientId, { jenis: 'afasia', hanyaSelesai: false });
  const percobaan = (await Promise.all(sesi.map((s) => listSpeechAttempts(s.id)))).flat();
  const terakhir = sesi.findLast((s) => s.selesai && s.ringkasanAfasia);
  return {
    kataBenar: new Set(percobaan.filter((p) => p.kategoriHasil === 'benar').map((p) => p.kataId)),
    kataUlang: terakhir?.ringkasanAfasia?.kataUlang ?? [],
  };
}
