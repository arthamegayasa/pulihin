import { Check } from '@phosphor-icons/react';

/**
 * Cincin kecil progres hari ini + "2 dari 4" (kata, bukan warna saja). Tanpa animasi: nilai langsung tampil.
 * Cincin dekoratif; pembaca layar membaca "2 dari 4 latihan selesai". `kecil` untuk Huruf Lebih Besar.
 */
export function CincinHariIni({ selesai, total, kecil = false }: { selesai: number; total: number; kecil?: boolean }) {
  const r = 15;
  const keliling = 2 * Math.PI * r;
  const porsi = total > 0 ? Math.min(1, selesai / total) : 0;
  const tuntas = total > 0 && selesai >= total;
  return (
    <p className="flex items-center gap-2 tipe-label text-teks">
      <span aria-hidden className={`relative grid shrink-0 place-items-center ${kecil ? 'size-[26px]' : 'size-[30px]'}`}>
        <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90">
          <circle cx={18} cy={18} r={r} fill="none" stroke="var(--color-primer-garis)" strokeWidth={kecil ? 6 : 4.5} />
          {porsi > 0 && (
            <circle
              cx={18}
              cy={18}
              r={r}
              fill="none"
              stroke={tuntas ? 'var(--color-sukses)' : 'var(--color-primer)'}
              strokeWidth={kecil ? 6 : 4.5}
              strokeLinecap="round"
              strokeDasharray={keliling}
              strokeDashoffset={keliling * (1 - porsi)}
            />
          )}
        </svg>
        {tuntas && !kecil && <Check size={16} weight="bold" className="text-sukses" />}
      </span>
      <span className="tabular whitespace-nowrap">
        {selesai} dari {total}
        <span className="sr-only"> latihan selesai</span>
      </span>
    </p>
  );
}
