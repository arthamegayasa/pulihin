import type { ReactNode } from 'react';
import { Ilustrasi } from '@/components/premium/Ilustrasi';

/**
 * Keadaan kosong/luring/privasi yang tenang: ilustrasi kecil di tengah, judul, penjelasan, tindakan opsional.
 * Ilustrasi dekoratif dan disembunyikan bila gagal dimuat (mis. luring sebelum tersimpan di cache),
 * sehingga pesan tetap utuh. Kalimat tidak menyalahkan (Bab 12.4).
 */
export function KeadaanKosong({
  ilustrasi = 'kosong',
  judul,
  children,
  aksi,
  as: Tag = 'h2',
  className = '',
}: {
  ilustrasi?: 'kosong' | 'luring' | 'privasi';
  judul: ReactNode;
  children?: ReactNode;
  /** Satu tindakan (BigButton/BigLink) di bawah teks. */
  aksi?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-3 rounded-kartu border border-garis-halus bg-permukaan px-5 pb-5 pt-4 text-center shadow-tipis ${className}`}>
      <Ilustrasi jenis="momen" nama={ilustrasi} bilaGagal="sembunyi" className="block h-auto w-full max-w-[240px] rounded-kartu" />
      <Tag className="tipe-subjudul text-teks text-balance">{judul}</Tag>
      {children && <div className="tipe-isi max-w-[32ch] text-teks-2">{children}</div>}
      {aksi && <div className="mt-1 w-full">{aksi}</div>}
    </div>
  );
}
