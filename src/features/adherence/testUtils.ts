import type { ISODate, JenisSesi, Session } from '@/types';
import { addDays } from '@/lib/date';

/** Pembuat sesi untuk tes logika kepatuhan. */
export function sesi(tanggal: ISODate, jenis: JenisSesi = 'gerak', skor = 70, jam = 9, selesai = true): Session {
  const [y, m, d] = tanggal.split('-').map(Number);
  const mulaiAt = new Date(y, m - 1, d, jam, 0).getTime();
  return {
    id: `${tanggal}-${jenis}-${jam}-${skor}`,
    patientId: 'uji',
    tanggal,
    mulaiAt,
    selesaiAt: selesai ? mulaiAt + 120_000 : null,
    jenis,
    latihanId: jenis === 'gerak' ? 'fleksi-siku' : null,
    kategoriKata: null,
    repetisiTarget: 10,
    repetisiTercapai: 8,
    skor,
    skorKomponen: null,
    ringkasanAfasia: null,
    durasiDetik: 120,
    selesai,
    saran: null,
    sisi: null,
    isDemo: false,
  };
}

/** Sesi lengkap (gerak + bicara) pada hari-hari `hariLalu` (0 = hari ini) relatif ke `today`. */
export function hariLengkap(today: ISODate, hariLalu: number[], skor = 70): Session[] {
  return hariLalu.flatMap((n) => [sesi(addDays(today, -n), 'gerak', skor), sesi(addDays(today, -n), 'afasia', skor, 16)]);
}
