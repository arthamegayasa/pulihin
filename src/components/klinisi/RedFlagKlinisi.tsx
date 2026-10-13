import { CheckCircle, Warning, WarningOctagon } from '@phosphor-icons/react';
import { Card } from '@/components/Card';
import type { RedFlag } from '@/features/adherence/redFlags';

/** Kartu penanda lengkap, gaya dan kalimat sama dengan halaman Untuk Keluarga. */
export function KartuRedFlag({ flag }: { flag: RedFlag }) {
  const tinggi = flag.tingkat === 'tinggi';
  const Ikon = tinggi ? WarningOctagon : Warning;
  return (
    <Card nada={tinggi ? 'bahaya' : 'peringatan'} className="flex gap-3">
      <Ikon size={30} weight="fill" className={`mt-0.5 shrink-0 ${tinggi ? 'text-bahaya' : 'text-peringatan'}`} aria-hidden />
      <div>
        <p className={`text-[0.8rem] font-extrabold uppercase tracking-wide ${tinggi ? 'text-bahaya' : 'text-peringatan'}`}>
          {tinggi ? 'Penting' : 'Perlu perhatian'}
        </p>
        <p className="text-[1.05rem] font-extrabold leading-snug text-teks">{flag.judul}</p>
        <p className="mt-1 text-[0.95rem] text-teks">{flag.pesan}</p>
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
      className={`flex items-start gap-1.5 rounded-xl border px-2.5 py-1.5 text-[0.9rem] leading-snug ${tinggi ? 'border-bahaya/30 bg-bahaya-terang' : 'border-peringatan/30 bg-peringatan-terang'}`}
    >
      <Ikon size={20} weight="fill" className={`mt-0.5 shrink-0 ${tinggi ? 'text-bahaya' : 'text-peringatan'}`} aria-hidden />
      <span>
        <span className={`font-extrabold ${tinggi ? 'text-bahaya' : 'text-peringatan'}`}>{tinggi ? 'Penting' : 'Perlu perhatian'}:</span>{' '}
        <span className="font-semibold text-teks">{flag.judul}</span>
      </span>
    </li>
  );
}

export function TanpaRedFlag() {
  return (
    <p className="flex items-center gap-1.5 text-[0.9rem] font-semibold text-sukses">
      <CheckCircle size={20} weight="fill" aria-hidden />
      Tidak ada tanda perlu perhatian
    </p>
  );
}
