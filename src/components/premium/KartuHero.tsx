import type { ReactNode } from 'react';
import { Ilustrasi } from '@/components/premium/Ilustrasi';
import { ukuranIlustrasi, type RefIlustrasi } from '@/components/premium/asetIlustrasi';

// Kelas ditulis utuh (bukan dirakit) agar terdeteksi pemindai Tailwind.
const KELAS = {
  otomatis: {
    gambar:
      'absolute inset-0 size-full object-cover object-right @max-[17rem]:static @max-[17rem]:col-start-1 @max-[17rem]:row-start-1 @max-[17rem]:h-auto @max-[17rem]:w-full',
    penjaga: 'col-start-1 row-start-1 block @max-[17rem]:hidden',
    tirai:
      'pointer-events-none absolute inset-y-0 left-0 block w-[78%] bg-[linear-gradient(90deg,var(--color-ilustrasi)_0%,var(--color-ilustrasi)_62%,transparent_100%)] @max-[17rem]:hidden',
    teks: 'relative col-start-1 row-start-1 w-[62%] self-center @max-[17rem]:row-start-2 @max-[17rem]:w-full @max-[17rem]:self-auto',
  },
  tumpuk: {
    gambar: 'col-start-1 row-start-1 block h-auto w-full',
    penjaga: 'hidden',
    tirai: 'hidden',
    teks: 'relative col-start-1 row-start-2 w-full',
  },
} as const;

/** Potongan gambar dalam piksel asli (x, y = sudut kiri atas). */
type Potong = { x: number; y: number; w: number; h: number };

/**
 * Kartu sorotan: ilustrasi lebar (subjek di kanan, sisi kiri tenang) dengan judul di sisi kiri.
 *
 * Tata letak `otomatis`: teks menindih sisi kiri gambar bila kartu cukup lebar (>= 17rem; rem ikut
 * Huruf Lebih Besar, sehingga di ponsel 360px dengan Huruf Lebih Besar kartu otomatis bertumpuk);
 * bila sempit, gambar di atas dan teks di bawahnya. `tumpuk` selalu bertumpuk (teks panjang).
 * Bila gambar gagal dimuat, kartu tetap utuh: bidang tenang berwarna latar ilustrasi dengan teks.
 * Teks berada di atas tirai warna latar ilustrasi (#EEF4F2) sehingga kontras teks tetap >= 7:1.
 *
 * `potong` (koordinat piksel asli) dipakai bila subjek gambar terlalu lebar untuk ditindih teks. Kartu lebar
 * (>= 24rem, mis. desktop): potongan `samping` di kolom kanan sendiri, teks di kiri di atas latar polos. Kartu
 * sempit (ponsel, kedua ukuran huruf): potongan `tumpuk` yang pendek di atas, teks selebar kartu di bawahnya.
 * Teks tidak pernah menindih orang.
 */
export function KartuHero({
  ilustrasi,
  judul,
  sub,
  label,
  potong,
  children,
  level = 2,
  prioritas = true,
  tata = 'otomatis',
  className = '',
}: {
  ilustrasi: RefIlustrasi;
  judul: ReactNode;
  sub?: ReactNode;
  /** Label kecil di atas judul (mis. tanggal atau "Untuk Keluarga"). */
  label?: ReactNode;
  /** Potongan gambar {x, y, w, h} dalam piksel asli untuk kartu lebar dan sempit; lihat keterangan komponen. */
  potong?: Record<'samping' | 'tumpuk', Potong>;
  /** Isi tambahan di bawah sub (lencana, tautan kecil). Tindakan utama sebaiknya di luar kartu, di separuh bawah layar. */
  children?: ReactNode;
  /** Tingkat judul: 1 bila kartu ini judul layar. */
  level?: 1 | 2;
  /** Bawaan `true`: kartu hero biasanya di atas lipatan. */
  prioritas?: boolean;
  tata?: 'otomatis' | 'tumpuk';
  className?: string;
}) {
  const { w, h } = ukuranIlustrasi(ilustrasi);
  const Judul = level === 1 ? 'h1' : 'h2';
  const k = KELAS[tata];

  const isiTeks = (
    <div className="flex flex-col gap-1.5 p-5 [overflow-wrap:break-word]">
      {label && <p className="tipe-label text-primer">{label}</p>}
      <Judul className="tipe-judul text-teks">{judul}</Judul>
      {sub && <div className="tipe-isi text-teks-2">{sub}</div>}
      {children && <div className="mt-1.5">{children}</div>}
    </div>
  );

  if (potong) {
    const bingkai = (p: Potong, kelas: string) => (
      <span aria-hidden className={`relative block overflow-hidden ${kelas}`} style={{ aspectRatio: `${p.w} / ${p.h}` }}>
        <span
          className="absolute block"
          style={{ width: `${(w / p.w) * 100}%`, left: `${(-p.x / p.w) * 100}%`, top: `${(-p.y / p.h) * 100}%` }}
        >
          <Ilustrasi {...ilustrasi} prioritas={prioritas} bilaGagal="sembunyi" className="block h-auto w-full max-w-none" />
        </span>
      </span>
    );
    return (
      <section className={`@container overflow-hidden rounded-kartu border border-primer-garis/70 bg-ilustrasi shadow-sedang ${className}`}>
        <div className="grid grid-cols-1 items-center @min-[24rem]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {bingkai(potong.tumpuk, 'col-start-1 row-start-1 @min-[24rem]:hidden')}
          {bingkai(potong.samping, 'hidden @min-[24rem]:col-start-2 @min-[24rem]:row-start-1 @min-[24rem]:block @min-[24rem]:self-end')}
          <div className="col-start-1 row-start-2 min-w-0 @min-[24rem]:row-start-1">{isiTeks}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={`@container overflow-hidden rounded-kartu border border-primer-garis/70 bg-ilustrasi shadow-sedang ${className}`}>
      {/* grid-cols-1 = minmax(0,1fr): lebar kolom mengikuti kartu, bukan lebar max-content teks. */}
      <div className="relative grid grid-cols-1">
        <Ilustrasi {...ilustrasi} prioritas={prioritas} bilaGagal="sembunyi" className={k.gambar} />
        {/* Penjaga tinggi minimum (rasio gambar) saat menindih; kartu memanjang bila teks lebih tinggi. */}
        <span aria-hidden className={k.penjaga} style={{ aspectRatio: `${w} / ${h}` }} />
        {/* Tirai lembut di sisi kiri agar teks selalu terbaca walau gambar sedikit melewati batas tenang. */}
        <span aria-hidden className={k.tirai} />
        <div className={k.teks}>{isiTeks}</div>
      </div>
    </section>
  );
}
