import { Chair, PersonSimple } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { LABEL_POSISI } from '@/features/pose/labels';
import type { Posisi } from '@/features/pose/types';

/** Chip info kecil (bukan tombol): teks gelap >= 7:1 di latar cekung, ikon opsional bernada primer. */
export function ChipInfo({ ikon, children }: { ikon?: ReactNode; children: ReactNode }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-[3px] rounded-kecil bg-cekung py-0.5 text-[0.95rem] font-semibold leading-snug text-teks ${ikon ? 'pl-1 pr-1.5' : 'px-1.5'}`}
    >
      {ikon && (
        <span aria-hidden className="shrink-0 text-primer [&>svg]:size-[18px]">
          {ikon}
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </span>
  );
}

/** Chip posisi latihan: duduk (kursi) atau berdiri berpegangan (sosok berdiri). */
export function ChipPosisi({ posisi }: { posisi: Posisi }) {
  return <ChipInfo ikon={posisi === 'berdiri-berpegangan' ? <PersonSimple weight="bold" /> : <Chair weight="bold" />}>{LABEL_POSISI[posisi]}</ChipInfo>;
}
