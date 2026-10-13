import { Check, Minus } from '@phosphor-icons/react';
import type { HariKalender, StatusKalender } from '@/features/adherence/adherence';
import { formatTanggalPendek, namaHari } from '@/lib/date';

const KATA: Record<StatusKalender, string> = {
  selesai: 'ada latihan',
  terlewat: 'terlewat',
  'hari-ini-belum': 'hari ini belum',
};

function Tanda({ status, kecil = false }: { status: StatusKalender; kecil?: boolean }) {
  const ikon = kecil ? 14 : 20;
  return (
    <span
      aria-hidden
      className={[
        'grid shrink-0 place-items-center rounded-full',
        kecil ? 'size-6' : 'size-9',
        status === 'selesai' ? 'bg-sukses text-white' : '',
        status === 'terlewat' ? 'border-2 border-garis bg-white text-teks-2' : '',
        status === 'hari-ini-belum' ? 'border-2 border-dashed border-primer bg-white text-primer' : '',
      ].join(' ')}
    >
      {status === 'selesai' ? <Check size={ikon} weight="bold" /> : status === 'terlewat' ? <Minus size={ikon} weight="bold" /> : null}
    </span>
  );
}

/**
 * Kalender 7 hari terakhir (Bab 9.1): centang = ada latihan, garis = terlewat, lingkaran putus-putus = hari ini belum.
 * Bentuk tanda + keterangan kata, bukan warna saja.
 */
export function StreakCalendar({ hari, className = '' }: { hari: HariKalender[]; className?: string }) {
  const keterangan: StatusKalender[] = ['selesai', 'terlewat'];
  if (hari.some((h) => h.status === 'hari-ini-belum')) keterangan.push('hari-ini-belum');
  return (
    <div className={className}>
      <ol className="grid grid-cols-7 gap-1" aria-label="Kalender latihan 7 hari terakhir">
        {hari.map((h) => (
          <li
            key={h.tanggal}
            className={`flex flex-col items-center gap-1 rounded-xl py-1.5 ${h.hariIni ? 'bg-primer-terang' : ''}`}
            aria-label={`${h.hariIni ? 'Hari ini, ' : ''}${namaHari(h.tanggal)} ${formatTanggalPendek(h.tanggal)}: ${KATA[h.status]}`}
          >
            <span className={`text-[0.8rem] ${h.hariIni ? 'font-extrabold text-primer' : 'font-semibold text-teks-2'}`} aria-hidden>
              {h.label}
            </span>
            <Tanda status={h.status} />
          </li>
        ))}
      </ol>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.85rem] text-teks-2" aria-hidden>
        {keterangan.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <Tanda status={s} kecil />
            {KATA[s]}
          </li>
        ))}
      </ul>
    </div>
  );
}
