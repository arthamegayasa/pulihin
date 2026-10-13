import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';

type Varian = 'primer' | 'garis' | 'bahaya' | 'sukses' | 'teks';
type Ukuran = 'normal' | 'besar';

const VARIAN: Record<Varian, string> = {
  primer: 'bg-primer text-white shadow-angkat hover:bg-primer-tua',
  garis: 'bg-white text-primer border-2 border-primer hover:bg-primer-terang',
  bahaya: 'bg-bahaya text-white shadow-angkat hover:brightness-95',
  sukses: 'bg-sukses text-white shadow-angkat hover:brightness-95',
  teks: 'bg-transparent text-primer underline underline-offset-4 decoration-2 hover:bg-primer-terang',
};

// Tinggi minimum: tombol utama 56px, tombol Mulai Sesi 72px (Bab 12.2). Nilai px agar tidak ikut membesar berlebihan.
// Label tombol besar muat satu baris di layar 360px ("Mulai dengan Kamera"); pada Huruf Lebih Besar boleh dua baris.
const UKURAN: Record<Ukuran, string> = {
  normal: 'min-h-[56px] px-5 gap-3 text-[1.05rem]',
  besar: 'min-h-[72px] px-4 gap-2.5 text-[1.15rem]',
};

interface Common {
  varian?: Varian;
  ukuran?: Ukuran;
  ikon?: ReactNode;
  penuh?: boolean;
  children: ReactNode;
  className?: string;
}

function kelas({ varian = 'primer', ukuran = 'normal', penuh = true, className = '' }: Omit<Common, 'children' | 'ikon'>) {
  return [
    'inline-flex items-center justify-center rounded-2xl font-bold leading-tight text-center text-balance',
    'transition-[transform,background-color] duration-150 active:scale-[0.98] select-none',
    'disabled:opacity-50 disabled:pointer-events-none',
    VARIAN[varian],
    UKURAN[ukuran],
    penuh ? 'w-full' : '',
    className,
  ].join(' ');
}

export function BigButton({ varian, ukuran, ikon, penuh, children, className, type = 'button', ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={kelas({ varian, ukuran, penuh, className })} {...rest}>
      {ikon}
      <span>{children}</span>
    </button>
  );
}

export function BigLink({ to, varian, ukuran, ikon, penuh, children, className, replace }: Common & { to: string; replace?: boolean }) {
  return (
    <Link to={to} replace={replace} className={kelas({ varian, ukuran, penuh, className })}>
      {ikon}
      <span>{children}</span>
    </Link>
  );
}
