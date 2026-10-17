import type { ReactNode } from 'react';
import { Ilustrasi } from '@/components/premium';

/**
 * Pita ringkasan di atas layar klinisi: judul + angka utama di kiri, ilustrasi terapis di kanan (laptop).
 * Ponsel: ilustrasi menjadi strip ringkas di atas dengan judul di sisi kirinya yang tenang, angka di bawahnya;
 * `gambarPonsel={false}` menyembunyikan ilustrasi di ponsel (layar yang isinya panjang).
 * Kolom ilustrasi laptop lebarnya tetap: bila teks/angka lebih tinggi, gambar dipotong (object-cover), tidak melebar
 * menutupi angka. Gambar dekoratif dan disembunyikan bila gagal dimuat.
 */
export function PitaRingkasan({
  idJudul,
  label,
  judul,
  sub,
  depan,
  children,
  gambarPonsel = true,
}: {
  idJudul: string;
  label?: ReactNode;
  judul: ReactNode;
  sub?: ReactNode;
  /** Elemen di kiri judul (mis. avatar inisial pasien). */
  depan?: ReactNode;
  /** Baris angka (KartuStat) di bawah judul. */
  children?: ReactNode;
  gambarPonsel?: boolean;
}) {
  return (
    <section
      aria-labelledby={idJudul}
      className="relative grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-kartu border border-primer-garis/70 bg-ilustrasi shadow-sedang lg:grid-cols-[minmax(0,1fr)_28rem]"
    >
      <Ilustrasi
        jenis="momen"
        nama="terapis"
        prioritas
        bilaGagal="sembunyi"
        className={`${gambarPonsel ? 'absolute' : 'hidden lg:block'} inset-x-0 top-0 h-[10rem] w-full object-cover object-right lg:static lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full`}
      />
      {/* Tirai warna latar ilustrasi di bawah judul (ponsel): kontras teks tetap >= 7:1 walau gambar sedikit masuk. */}
      {gambarPonsel && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-[10rem] w-[80%] bg-[linear-gradient(90deg,var(--color-ilustrasi)_0%,var(--color-ilustrasi)_60%,transparent_100%)] lg:hidden"
        />
      )}
      <div
        className={`relative flex items-center gap-3.5 p-4 pb-2 lg:col-start-1 lg:row-start-1 lg:min-h-0 lg:w-auto lg:px-7 lg:pb-0 lg:pt-7 ${gambarPonsel ? 'min-h-[10rem] w-[64%]' : ''}`}
      >
        {depan}
        <div className="min-w-0 [overflow-wrap:break-word]">
          {label && <p className="tipe-label text-primer">{label}</p>}
          <h2 id={idJudul} className="tipe-subjudul text-teks sm:tipe-judul">
            {judul}
          </h2>
          {sub && <div className="mt-1 tipe-keterangan text-teks-2 lg:tipe-isi">{sub}</div>}
        </div>
      </div>
      {children && <div className="relative p-4 pt-2 lg:col-start-1 lg:row-start-2 lg:px-7 lg:pb-7 lg:pt-5">{children}</div>}
    </section>
  );
}

/** Avatar inisial pasien (tanpa foto atau wajah buatan). Sapaan "Pak"/"Bu" dilewati: "Pak Budi" menjadi "B". */
export function AvatarInisial({ nama, ukuran = 'normal' }: { nama: string; ukuran?: 'normal' | 'besar' }) {
  const kata = nama.trim().split(/\s+/);
  const inti = kata.length > 1 && /^(pak|bapak|bu|ibu)$/i.test(kata[0]) ? kata.slice(1) : kata;
  const inisial = inti
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full border border-primer-garis bg-primer-terang font-extrabold text-primer ${ukuran === 'besar' ? 'size-[64px] text-[26px]' : 'size-[48px] text-[20px]'}`}
    >
      {inisial}
    </span>
  );
}
