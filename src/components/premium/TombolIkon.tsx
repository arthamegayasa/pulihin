import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';

type Varian = 'polos' | 'permukaan';

const VARIAN: Record<Varian, string> = {
  // Di atas permukaan putih (header): tanpa bingkai, latar muncul saat hover/ditekan.
  polos: 'text-primer hover:bg-primer-terang active:bg-primer-terang',
  // Di atas latar halaman: ubin putih bergaris rambut, terbaca jelas sebagai tombol.
  permukaan: 'border border-garis-halus bg-permukaan text-primer shadow-tipis hover:bg-primer-terang active:bg-primer-terang active:shadow-none',
};

function kelas(varian: Varian, className: string) {
  return [
    'grid size-[48px] shrink-0 place-items-center rounded-kontrol [&>svg]:size-[26px]',
    'transition-[transform,background-color,box-shadow] duration-(--durasi-cepat) ease-tekan active:translate-y-px',
    'disabled:opacity-50 disabled:pointer-events-none',
    VARIAN[varian],
    className,
  ].join(' ');
}

interface Common {
  /** Nama tombol untuk pembaca layar (wajib: tombol ini hanya berisi ikon). */
  label: string;
  /** Ikon Phosphor `weight="bold"`; ukurannya diseragamkan 26px. */
  ikon: ReactNode;
  varian?: Varian;
  className?: string;
}

/** Tombol ikon 48x48px (target sentuh tetap px agar header muat di 360px dengan Huruf Lebih Besar). */
export function TombolIkon({ label, ikon, varian = 'polos', className = '', type = 'button', ...rest }: Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type={type} aria-label={label} className={kelas(varian, className)} {...rest}>
      {ikon}
    </button>
  );
}

/** Tautan ikon 48x48px, tampilan sama dengan TombolIkon. */
export function TautanIkon({ label, ikon, varian = 'polos', className = '', to }: Common & { to: string }) {
  return (
    <Link to={to} aria-label={label} className={kelas(varian, className)}>
      {ikon}
    </Link>
  );
}
