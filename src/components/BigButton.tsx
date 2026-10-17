import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';

type Varian = 'primer' | 'garis' | 'bahaya' | 'sukses' | 'teks';
type Ukuran = 'normal' | 'besar';

// Tombol berwarna: bayangan berlapis bernada teal + sorot tipis di tepi atas; saat ditekan turun 1px dan
// bayangannya menipis (umpan balik "ditekan" tanpa animasi berat).
const VARIAN: Record<Varian, string> = {
  primer: 'bg-primer text-white shadow-angkat inset-shadow-sorot hover:bg-primer-tua active:shadow-tipis',
  garis: 'bg-permukaan text-primer border-2 border-primer shadow-tipis hover:bg-primer-terang active:bg-primer-terang active:shadow-none',
  bahaya: 'bg-bahaya text-white shadow-angkat inset-shadow-sorot hover:brightness-95 active:shadow-tipis',
  sukses: 'bg-sukses text-white shadow-angkat inset-shadow-sorot hover:brightness-95 active:shadow-tipis',
  teks: 'bg-transparent text-primer underline underline-offset-4 decoration-2 hover:bg-primer-terang active:bg-primer-terang',
};

// Tinggi minimum: tombol utama 56px, tombol Mulai Sesi 72px (Bab 12.2). Nilai px agar tidak ikut membesar berlebihan.
// Label tombol besar muat satu baris di layar 360px ("Mulai dengan Kamera"); pada Huruf Lebih Besar boleh dua baris.
// Ikon diseragamkan: 24px (normal) / 28px (besar), apa pun `size` yang dikirim pemanggil.
const UKURAN: Record<Ukuran, string> = {
  normal: 'min-h-[56px] px-5 gap-3 text-[1.05rem] [&>svg]:size-[24px]',
  besar: 'min-h-[72px] px-4 gap-2.5 text-[1.15rem] [&>svg]:size-[28px]',
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
    'inline-flex items-center justify-center rounded-kontrol font-bold leading-tight text-center text-balance tracking-[-0.005em]',
    '[&>svg]:shrink-0 transition-[transform,background-color,box-shadow,filter] duration-(--durasi-cepat) ease-tekan',
    'active:translate-y-px active:scale-[0.985] select-none',
    'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none',
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
