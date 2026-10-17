import { ArrowLeft, House } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { TautanIkon, TombolIkon } from '@/components/premium/TombolIkon';
import { berandaUntukPeran } from '@/router-paths';
import { usePrefs } from '@/lib/prefs';

/**
 * Judul layar + tombol Kembali + tombol Beranda.
 * Dari mana pun ke Beranda maksimal 2 ketuk (Bab 11): tombol Beranda selalu ada di kanan atas.
 */
export function PageHeader({ judul, sub, kembali, aksi }: { judul: string; sub?: ReactNode; kembali?: string | false; aksi?: ReactNode }) {
  const navigate = useNavigate();
  const { role } = usePrefs();
  const beranda = berandaUntukPeran(role);
  return (
    <header className="mb-4 flex items-start gap-2.5">
      {kembali !== false && (
        <TombolIkon
          varian="permukaan"
          label="Kembali"
          onClick={() => (kembali ? navigate(kembali) : navigate(-1))}
          ikon={<ArrowLeft weight="bold" />}
        />
      )}
      <div className="min-w-0 flex-1 pt-[7px]">
        <h1 className="tipe-judul text-teks">{judul}</h1>
        {sub && <div className="mt-1 text-teks-2">{sub}</div>}
      </div>
      {aksi}
      <TautanIkon varian="permukaan" to={beranda} label="Ke Beranda" ikon={<House weight="bold" />} />
    </header>
  );
}
