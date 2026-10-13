import { PATHS } from '@/router-paths';
import { normalisasiRentang } from './tracker';
import type { Sisi } from '@/types';

/**
 * Parameter kueri sesi gerak: `?target=` (dari program), `?sisi=`, dan `?rentang=` (target rentang dari
 * terapis, persen ambang atas). Nilai tak valid jatuh ke bawaan.
 */
export function bacaTarget(nilai: string | null, bawaan: number): number {
  const n = nilai === null ? NaN : Number.parseInt(nilai, 10);
  return Number.isFinite(n) && n >= 1 && n <= 50 ? n : bawaan;
}

export function bacaSisi(nilai: string | null, bawaan: Sisi): Sisi {
  return nilai === 'kiri' || nilai === 'kanan' ? nilai : bawaan;
}

/** Rentang penuh (tanpa penyesuaian terapis). */
export const RENTANG_PENUH = 100;

/** `?rentang=` dibulatkan & dibatasi 50..100 seperti tracker; tidak ada atau bukan angka = 100 (rentang penuh). */
export function bacaRentang(nilai: string | null): number {
  return normalisasiRentang(nilai === null ? undefined : Number.parseInt(nilai, 10));
}

/** Bagian kueri `&rentang=P`; dihilangkan bila rentang penuh agar URL lama tetap sama. */
function kueriRentang(rentang: number | undefined): string {
  return rentang !== undefined && rentang < RENTANG_PENUH ? `&rentang=${rentang}` : '';
}

/**
 * Status navigasi dari Detail Latihan ke Sesi Kamera: menandai bahwa pasien sudah melewati layar keselamatan
 * (dan, untuk latihan berdiri, mencentang "berpegangan"). Sesi berdiri tanpa status ini dialihkan ke Detail.
 */
export interface StatusMulaiSesi {
  konfirmasiKeselamatan: true;
}

export function adaKonfirmasiKeselamatan(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as Partial<StatusMulaiSesi>).konfirmasiKeselamatan === true;
}

export function urlSesi(latihanId: string, target: number, sisi: Sisi, rentang?: number): string {
  return `${PATHS.sesi(latihanId)}?target=${target}&sisi=${sisi}${kueriRentang(rentang)}`;
}

/** Detail Latihan (peringatan keselamatan + tombol Mulai). `sisi` opsional: halaman detail memakainya sebagai sisi terpilih. */
export function urlDetail(latihanId: string, target: number, sisi?: Sisi, rentang?: number): string {
  return `${PATHS.detailLatihan(latihanId)}?target=${target}${sisi ? `&sisi=${sisi}` : ''}${kueriRentang(rentang)}`;
}
