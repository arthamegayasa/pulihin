import { clamp, labelSkor } from '@/lib/score';

/**
 * Cincin skor latihan 0..100: angka besar berwarna primer dan label kata (Bab 5.3).
 * Angka yang tampil adalah nilai tersimpan apa adanya (dibulatkan), tanpa animasi hitung.
 */
export function ScoreRing({ skor, ukuran = 184 }: { skor: number; ukuran?: number }) {
  const nilai = Math.round(clamp(skor, 0, 100));
  const r = 42;
  const keliling = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: ukuran, height: ukuran }}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx={50} cy={50} r={r} fill="none" stroke="var(--color-primer-terang)" strokeWidth={9} />
          <circle
            cx={50}
            cy={50}
            r={r}
            fill="none"
            stroke="var(--color-primer)"
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={keliling}
            strokeDashoffset={keliling * (1 - nilai / 100)}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="tabular text-[3.4rem] font-extrabold leading-none text-primer">{nilai}</span>
        </div>
      </div>
      <p className="text-[1.3rem] font-bold text-teks">
        <span className="sr-only">Skor latihan {nilai} dari 100, </span>
        {labelSkor(nilai)}
      </p>
    </div>
  );
}
