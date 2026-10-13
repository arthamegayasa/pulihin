import type { ReactNode } from 'react';
import type { TangkapanLayar } from './tangkapanLayar';

interface GambarProps {
  layar: TangkapanLayar;
  /** Gambar di atas lipatan: muat segera dengan prioritas tinggi (LCP). Selain itu lazy. */
  prioritas?: boolean;
  className?: string;
}

function Gambar({ layar, prioritas = false, className }: GambarProps) {
  return (
    <img
      src={layar.src}
      alt={layar.alt}
      width={layar.lebar}
      height={layar.tinggi}
      loading={prioritas ? 'eager' : 'lazy'}
      fetchPriority={prioritas ? 'high' : 'auto'}
      decoding="async"
      className={`block h-auto w-full bg-latar ${className}`}
    />
  );
}

const BAYANGAN = 'shadow-[0_28px_56px_-28px_rgb(11_79_74_/_0.55)]';

/**
 * Bingkai ponsel polos untuk tangkapan layar asli. Sudutnya lebih besar dari kartu (16px)
 * karena meniru benda fisik; sudut elemen halaman lainnya tetap 16px.
 * Lebar diatur lewat `className` (misalnya `w-[16rem]`); tinggi mengikuti rasio gambar.
 */
export function BingkaiPonsel({ layar, prioritas, className = '' }: GambarProps) {
  return (
    <div className={`rounded-[2.2rem] bg-teks p-[0.45rem] ring-1 ring-primer-tua/20 ${BAYANGAN} ${className}`}>
      <Gambar layar={layar} prioritas={prioritas} className="rounded-[1.8rem]" />
    </div>
  );
}

/** Bingkai layar lebar (laptop) tanpa hiasan jendela palsu: cukup tepi tipis dan bayangan. */
export function BingkaiLayarLebar({ layar, prioritas, className = '' }: GambarProps) {
  return (
    <div className={`overflow-hidden rounded-kartu bg-white ring-1 ring-garis ${BAYANGAN} ${className}`}>
      <Gambar layar={layar} prioritas={prioritas} />
    </div>
  );
}

/**
 * Area intip: tinggi tetap (tanpa geser tata letak), isinya terpotong rapi oleh tepi bawah panel.
 * Anak diposisikan absolut oleh pemanggil.
 */
export function AreaIntip({ tinggi, children }: { tinggi: string; children: ReactNode }) {
  return <div className={`relative overflow-hidden ${tinggi}`}>{children}</div>;
}
