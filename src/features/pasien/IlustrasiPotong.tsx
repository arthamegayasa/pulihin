import { Ilustrasi, ukuranIlustrasi, type RefIlustrasi } from '@/components/premium';

/** Potongan persegi di koordinat piksel asli ilustrasi (x, y = sudut kiri atas). */
export interface Potongan {
  x: number;
  y: number;
  sisi: number;
}

/**
 * Bingkai persegi berisi sebagian ilustrasi S2 (mis. wajah Pak Budi dari `momen/beranda`) untuk gambar kecil
 * di baris/kartu. Ukuran bingkai dari `className` (mis. `size-[56px] rounded-[12px]`); potongan dihitung dalam persen
 * sehingga tetap tepat di ukuran apa pun. Dekoratif; berkas gagal → bingkai tenang berwarna latar ilustrasi.
 */
export function IlustrasiPotong({
  ilustrasi,
  potong,
  className = '',
  prioritas = false,
}: {
  ilustrasi: RefIlustrasi;
  potong: Potongan;
  className?: string;
  prioritas?: boolean;
}) {
  const { w } = ukuranIlustrasi(ilustrasi);
  return (
    <span aria-hidden className={`relative block shrink-0 overflow-hidden bg-ilustrasi ${className}`}>
      <span
        className="absolute block"
        style={{ width: `${(w / potong.sisi) * 100}%`, left: `${(-potong.x / potong.sisi) * 100}%`, top: `${(-potong.y / potong.sisi) * 100}%` }}
      >
        <Ilustrasi {...ilustrasi} prioritas={prioritas} bilaGagal="sembunyi" className="block h-auto w-full max-w-none" />
      </span>
    </span>
  );
}
