import type { ReactNode } from 'react';

type Nada = 'putih' | 'primer' | 'sukses' | 'aksen';

const LATAR: Record<Nada, string> = {
  putih: 'bg-permukaan border-garis-halus shadow-tipis',
  primer: 'bg-primer-terang border-primer-garis',
  sukses: 'bg-sukses-terang border-sukses/30',
  aksen: 'bg-aksen-terang border-aksen/30',
};

// Angka besar (>= 2.25rem, teks besar: cukup 3:1, semuanya >= 4.7:1). Teks kecil selalu teks/teks-2 (>= 7:1).
const ANGKA: Record<Nada, string> = {
  putih: 'text-primer',
  primer: 'text-primer',
  sukses: 'text-sukses',
  aksen: 'text-aksen-teks',
};

const IKON: Record<Nada, string> = {
  putih: 'text-primer',
  primer: 'text-primer',
  sukses: 'text-sukses',
  aksen: 'text-aksen',
};

/**
 * Satu angka penting + labelnya (mis. "Latihan minggu ini 5 dari 7"). Urutan baca: label, angka, keterangan.
 * Angka memakai angka sejajar (tabular). Jangan pakai warna sebagai satu-satunya makna: tulis artinya di label.
 * Kartu sempit (isi < 8rem: 2 kolom di ponsel, 4 kolom di pita ringkasan desktop): ikon di atas label agar kata
 * seperti "Kepatuhan" tidak terpotong di tengah kata. Ambang dalam rem sehingga ikut membesar saat Huruf Lebih Besar.
 */
export function KartuStat({
  label,
  nilai,
  satuan,
  keterangan,
  ikon,
  nada = 'putih',
  className = '',
}: {
  label: ReactNode;
  nilai: ReactNode;
  /** Teks kecil setelah angka, mis. "hari" atau "/ 7". */
  satuan?: ReactNode;
  keterangan?: ReactNode;
  /** Ikon Phosphor `weight="bold"`/`"fill"`; ukurannya diseragamkan 22px. */
  ikon?: ReactNode;
  nada?: Nada;
  className?: string;
}) {
  return (
    <div className={`@container flex min-w-0 flex-col gap-1 rounded-kartu border p-4 ${LATAR[nada]} ${className}`}>
      <p className="flex flex-col items-start gap-1 tipe-label text-teks-2 @min-[8rem]:flex-row @min-[8rem]:items-center @min-[8rem]:gap-1.5">
        {ikon && (
          <span aria-hidden className={`shrink-0 [&>svg]:size-[22px] ${IKON[nada]}`}>
            {ikon}
          </span>
        )}
        <span className="min-w-0 max-w-full [overflow-wrap:anywhere]">{label}</span>
      </p>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className={`tabular text-[2.25rem] font-extrabold leading-none tracking-[-0.02em] ${ANGKA[nada]}`}>{nilai}</span>
        {satuan && <span className="tipe-isi font-bold text-teks-2">{satuan}</span>}
      </p>
      {keterangan && <p className="tipe-keterangan text-teks-2">{keterangan}</p>}
    </div>
  );
}
