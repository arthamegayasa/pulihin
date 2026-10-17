import type { ReactNode } from 'react';

/**
 * Judul bagian di dalam layar (di bawah judul layar). `aksi` = tautan teks kecil di kanan (mis. "Lihat semua"),
 * bukan tombol utama. Pada layar sempit aksi turun ke baris berikutnya, tidak memotong judul.
 */
export function JudulBagian({
  judul,
  sub,
  label,
  aksi,
  as: Tag = 'h2',
  id,
  className = '',
}: {
  judul: ReactNode;
  sub?: ReactNode;
  /** Label kecil di atas judul. */
  label?: ReactNode;
  aksi?: ReactNode;
  as?: 'h2' | 'h3';
  /** Id judul, untuk `aria-labelledby` pada <section> induk. */
  id?: string;
  className?: string;
}) {
  return (
    <div className={`mb-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-1 ${className}`}>
      <div className="min-w-0">
        {label && <p className="tipe-label text-primer">{label}</p>}
        <Tag id={id} className="tipe-subjudul text-teks">
          {judul}
        </Tag>
        {sub && <p className="tipe-keterangan text-teks-2">{sub}</p>}
      </div>
      {aksi && <div className="shrink-0">{aksi}</div>}
    </div>
  );
}
