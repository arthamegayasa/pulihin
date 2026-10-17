import { useState } from 'react';
import { srcIlustrasi, ukuranIlustrasi, type RefIlustrasi } from '@/components/premium/asetIlustrasi';

export type IlustrasiProps = RefIlustrasi & {
  /**
   * Teks alternatif. Tanpa `alt` gambar dianggap dekoratif (`alt=""`, disembunyikan dari pembaca layar).
   * Isi `alt` hanya bila gambar membawa makna yang tidak tertulis di dekatnya (mis. gambar kata afasia
   * sebelum jawaban ditampilkan: jangan isi nama bendanya, karena itu membocorkan jawaban).
   */
  alt?: string;
  /** Gambar di atas lipatan (hero Beranda, gambar kata aktif): muat segera dengan prioritas tinggi. Lainnya lazy. */
  prioritas?: boolean;
  /** Kelas untuk <img>. Bawaan `block w-full h-auto` (ikut lebar induk, rasio dari width/height). */
  className?: string;
  /** Saat gagal dimuat: `kotak` (bawaan) menyisakan bidang berwarna latar ilustrasi seukuran gambar; `sembunyi` tidak merender apa pun. */
  bilaGagal?: 'kotak' | 'sembunyi';
  /** Dipanggil sekali saat berkas gagal dimuat (mis. luring sebelum tersimpan di cache). */
  onGagal?: () => void;
  /** Atribut `sizes` bila tata letak memakai lebar tetap; tidak wajib (satu berkas per ilustrasi). */
  sizes?: string;
};

/**
 * Ilustrasi WebP dari `public/ilustrasi/` dengan width/height intrinsik (tanpa CLS), lazy kecuali `prioritas`,
 * latar #EEF4F2 selama memuat, dan cadangan tenang bila berkas tidak ada/gagal (tanpa ikon gambar rusak).
 */
export function Ilustrasi({ alt, prioritas = false, className = 'block h-auto w-full', bilaGagal = 'kotak', onGagal, sizes, ...ref }: IlustrasiProps) {
  const src = srcIlustrasi(ref);
  const { w, h } = ukuranIlustrasi(ref);
  const [gagalSrc, setGagalSrc] = useState<string | null>(null);
  const dekoratif = !alt;

  if (gagalSrc === src) {
    if (bilaGagal === 'sembunyi') return null;
    return (
      <span
        role={dekoratif ? undefined : 'img'}
        aria-label={dekoratif ? undefined : alt}
        aria-hidden={dekoratif || undefined}
        className={`${className} bg-ilustrasi`}
        style={{ aspectRatio: `${w} / ${h}` }}
      />
    );
  }

  return (
    <img
      src={src}
      width={w}
      height={h}
      alt={alt ?? ''}
      aria-hidden={dekoratif || undefined}
      loading={prioritas ? 'eager' : 'lazy'}
      fetchPriority={prioritas ? 'high' : 'auto'}
      decoding="async"
      draggable={false}
      sizes={sizes}
      className={`${className} bg-ilustrasi select-none`}
      onError={() => {
        setGagalSrc(src);
        onGagal?.();
      }}
    />
  );
}
