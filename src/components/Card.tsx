import type { HTMLAttributes, ReactNode } from 'react';

type Nada = 'putih' | 'primer' | 'peringatan' | 'bahaya' | 'sukses' | 'aksen';
/** Ketinggian permukaan: `datar` tanpa bayangan (kartu di dalam kartu), `biasa` (bawaan), `naik` untuk kartu sorotan. */
type Tingkat = 'datar' | 'biasa' | 'naik';

const NADA: Record<Nada, string> = {
  putih: 'bg-permukaan border border-garis-halus',
  primer: 'bg-primer-terang border border-primer-garis',
  peringatan: 'bg-peringatan-terang border border-peringatan/30',
  bahaya: 'bg-bahaya-terang border border-bahaya/30',
  sukses: 'bg-sukses-terang border border-sukses/30',
  aksen: 'bg-aksen-terang border border-aksen/30',
};

// Kartu bernada (bukan putih) cukup dibedakan oleh warnanya: bayangannya dibuat lebih tipis agar tidak "melayang".
const TINGKAT: Record<Tingkat, (nada: Nada) => string> = {
  datar: () => '',
  biasa: (nada) => (nada === 'putih' ? 'shadow-tipis' : 'shadow-[0_1px_2px_rgb(11_79_74/0.04)]'),
  naik: () => 'shadow-sedang',
};

export function Card({
  nada = 'putih',
  tingkat = 'biasa',
  className = '',
  children,
  ...rest
}: { nada?: Nada; tingkat?: Tingkat; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-kartu p-4 ${NADA[nada]} ${TINGKAT[tingkat](nada)} ${className}`} {...rest}>
      {children}
    </div>
  );
}
