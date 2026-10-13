import type { HTMLAttributes, ReactNode } from 'react';

type Nada = 'putih' | 'primer' | 'peringatan' | 'bahaya' | 'sukses' | 'aksen';

const NADA: Record<Nada, string> = {
  putih: 'bg-white border border-garis',
  primer: 'bg-primer-terang border border-primer-garis',
  peringatan: 'bg-peringatan-terang border border-peringatan/30',
  bahaya: 'bg-bahaya-terang border border-bahaya/30',
  sukses: 'bg-sukses-terang border border-sukses/30',
  aksen: 'bg-aksen-terang border border-aksen/30',
};

export function Card({ nada = 'putih', className = '', children, ...rest }: { nada?: Nada; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-kartu shadow-tipis p-4 ${NADA[nada]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
