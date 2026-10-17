import { Info } from '@phosphor-icons/react';
import { KALIMAT_BUKAN_DIAGNOSIS } from '@/lib/score';

/** Kalimat batasan wajib di layar ringkasan (Bab 5.3). */
export function NonDiagnosisNote({ className = '' }: { className?: string }) {
  return (
    <p className={`flex gap-2 tipe-keterangan text-teks-2 ${className}`}>
      <Info size={22} weight="bold" className="mt-px shrink-0 text-primer" aria-hidden />
      <span>{KALIMAT_BUKAN_DIAGNOSIS}</span>
    </p>
  );
}
