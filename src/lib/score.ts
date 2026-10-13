export type LabelSkor = 'Perlu Pendampingan' | 'Berkembang' | 'Baik' | 'Sangat Baik';

/** Label kata untuk skor latihan 0..100 (Bab 5.3). Dipakai sama di semua layar. */
export function labelSkor(skor: number): LabelSkor {
  if (skor >= 80) return 'Sangat Baik';
  if (skor >= 60) return 'Baik';
  if (skor >= 40) return 'Berkembang';
  return 'Perlu Pendampingan';
}

/** Kalimat batasan wajib di layar ringkasan dan dashboard. */
export const KALIMAT_BUKAN_DIAGNOSIS =
  'Skor ini adalah skor latihan untuk motivasi dan pemantauan, bukan skor klinis dan bukan alat ukur diagnosis.';

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
