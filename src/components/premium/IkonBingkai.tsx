import type { ReactNode } from 'react';

type Nada = 'primer' | 'sukses' | 'aksen' | 'peringatan' | 'bahaya' | 'putih';
type Ukuran = 'normal' | 'besar';

const NADA: Record<Nada, string> = {
  primer: 'bg-primer-terang text-primer',
  sukses: 'bg-sukses-terang text-sukses',
  aksen: 'bg-aksen-terang text-aksen',
  peringatan: 'bg-peringatan-terang text-peringatan',
  bahaya: 'bg-bahaya-terang text-bahaya',
  putih: 'bg-permukaan text-primer border border-garis-halus',
};

// px: ubin ikon tidak ikut membesar pada Huruf Lebih Besar agar baris daftar tetap muat di 360px.
const UKURAN: Record<Ukuran, string> = {
  normal: 'size-[44px] rounded-[12px] [&>svg]:size-[24px]',
  besar: 'size-[56px] rounded-kontrol [&>svg]:size-[30px]',
};

/**
 * Ubin ikon dekoratif (ikon di dalam kotak membulat bernada lembut), untuk awal baris daftar, kartu fitur,
 * dan kartu status. Dekoratif: makna wajib tertulis di teks sebelahnya.
 */
export function IkonBingkai({ nada = 'primer', ukuran = 'normal', children, className = '' }: { nada?: Nada; ukuran?: Ukuran; children: ReactNode; className?: string }) {
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center ${NADA[nada]} ${UKURAN[ukuran]} ${className}`}>
      {children}
    </span>
  );
}
