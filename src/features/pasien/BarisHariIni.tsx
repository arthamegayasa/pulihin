import { CaretRight, CheckCircle } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

/**
 * Baris "Latihan Hari Ini" di Beranda: gambar kecil (opsional), nama, lalu status berupa kata di kanan
 * ("Belum" / "Selesai" + centang). Bila sudah dikerjakan sebagian, kalimat progresnya tampil di bawah nama.
 * Seluruh baris satu tautan (>= 56px); antarbaris berjarak 8px dari induk (Bab 12.2). Ukuran latihan
 * ("10 kali") cukup dibacakan pembaca layar; tampil lengkap di halaman detail sebelum mulai.
 */
export function BarisHariIni({
  to,
  gambar,
  nama,
  ukuran,
  selesai,
  skor,
  progres = null,
}: {
  to: string;
  /** Gambar kecil dekoratif (poster peraga atau potongan ilustrasi), sudah berukuran. Kosong = tanpa gambar. */
  gambar?: ReactNode;
  nama: string;
  /** "10 kali" / "10 kata"; untuk pembaca layar. */
  ukuran: string;
  selesai: boolean;
  skor: number | null;
  /** "1 dari 2 set" atau "Sudah dicoba: 3 dari 10" bila sudah dikerjakan sebagian. */
  progres?: string | null;
}) {
  return (
    <li>
      <Link
        to={to}
        className={`flex items-center gap-2.5 rounded-kontrol border bg-permukaan pr-2 shadow-tipis transition-colors hover:bg-primer-terang/60 active:bg-primer-terang ${gambar ? 'min-h-[64px] py-[3px] pl-[3px]' : 'min-h-[56px] py-1 pl-3.5'} ${selesai ? 'border-sukses/35' : 'border-garis-halus'}`}
      >
        {gambar}
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-tight text-teks">{nama}</span>
          <span className="sr-only">
            , {ukuran}
            {selesai && skor !== null && `, skor ${skor}`}
          </span>
          {!selesai && progres && <span className="mt-0.5 block text-[0.95rem] font-bold leading-snug text-aksen-teks">{progres}</span>}
        </span>
        {selesai ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-kecil bg-sukses-terang py-0.5 pl-1.5 pr-1 text-[0.95rem] font-bold leading-snug text-teks">
            Selesai
            <CheckCircle size={20} weight="fill" className="shrink-0 text-sukses" aria-hidden />
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1">
            {!progres && <span className="rounded-kecil bg-cekung px-1.5 py-0.5 text-[0.95rem] font-bold leading-snug text-teks-2">Belum</span>}
            <CaretRight size={20} weight="bold" className="shrink-0 text-primer" aria-hidden />
          </span>
        )}
      </Link>
    </li>
  );
}
