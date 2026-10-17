import { CheckCircle, Warning, WarningOctagon } from '@phosphor-icons/react';
import { Card } from '@/components/Card';
import type { RedFlag } from '@/features/adherence/redFlags';

/**
 * Kartu penanda lengkap, dipakai bersama halaman Untuk Keluarga dan Dashboard Klinisi.
 * Label tingkat ditulis dengan warna teks utama (kontras penuh); warna tingkat ada pada ikon, garis tepi kiri, dan kartu.
 * role="note" (bukan "alert"): penanda adalah ringkasan yang dibaca saat halaman dibuka, bukan kejadian mendadak.
 */
export function KartuRedFlag({ flag }: { flag: RedFlag }) {
  const tinggi = flag.tingkat === 'tinggi';
  const Ikon = tinggi ? WarningOctagon : Warning;
  return (
    <Card
      nada={tinggi ? 'bahaya' : 'peringatan'}
      className={`flex gap-3.5 border-l-[6px] ${tinggi ? 'border-l-bahaya' : 'border-l-peringatan'}`}
      role="note"
    >
      <span
        aria-hidden
        className={`grid size-[44px] shrink-0 place-items-center rounded-[12px] bg-permukaan shadow-tipis ${tinggi ? 'text-bahaya' : 'text-peringatan'}`}
      >
        <Ikon size={28} weight="fill" />
      </span>
      <div className="min-w-0">
        <p className="tipe-label text-teks">{tinggi ? 'Penting' : 'Perlu perhatian'}</p>
        <p className="tipe-subjudul text-teks">{flag.judul}</p>
        <p className="mt-1 tipe-isi text-teks">{flag.pesan}</p>
      </div>
    </Card>
  );
}

/** Penanda ringkas untuk daftar pasien: ikon + tingkat + judul (tidak hanya warna). */
export function ChipRedFlag({ flag }: { flag: RedFlag }) {
  const tinggi = flag.tingkat === 'tinggi';
  const Ikon = tinggi ? WarningOctagon : Warning;
  return (
    <li
      className={`flex items-start gap-1.5 rounded-kecil border px-2.5 py-1.5 text-[0.95rem] leading-snug ${tinggi ? 'border-bahaya/30 bg-bahaya-terang' : 'border-peringatan/30 bg-peringatan-terang'}`}
    >
      <Ikon size={20} weight="fill" className={`mt-px shrink-0 ${tinggi ? 'text-bahaya' : 'text-peringatan'}`} aria-hidden />
      <span className="text-teks">
        <span className="font-extrabold">{tinggi ? 'Penting' : 'Perlu perhatian'}:</span> <span className="font-semibold">{flag.judul}</span>
      </span>
    </li>
  );
}

export function TanpaRedFlag() {
  return (
    <p className="flex items-center gap-1.5 text-[0.95rem] font-semibold text-teks">
      <CheckCircle size={20} weight="fill" className="shrink-0 text-sukses" aria-hidden />
      Tidak ada tanda perlu perhatian
    </p>
  );
}
