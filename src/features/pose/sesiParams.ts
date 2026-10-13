import { PATHS } from '@/router-paths';
import type { Sisi } from '@/types';

/** Parameter kueri sesi gerak: `?target=` (dari program) dan `?sisi=`. Nilai tak valid jatuh ke bawaan. */
export function bacaTarget(nilai: string | null, bawaan: number): number {
  const n = nilai === null ? NaN : Number.parseInt(nilai, 10);
  return Number.isFinite(n) && n >= 1 && n <= 50 ? n : bawaan;
}

export function bacaSisi(nilai: string | null, bawaan: Sisi): Sisi {
  return nilai === 'kiri' || nilai === 'kanan' ? nilai : bawaan;
}

export function urlSesi(latihanId: string, target: number, sisi: Sisi): string {
  return `${PATHS.sesi(latihanId)}?target=${target}&sisi=${sisi}`;
}

export function urlDetail(latihanId: string, target: number): string {
  return `${PATHS.detailLatihan(latihanId)}?target=${target}`;
}
