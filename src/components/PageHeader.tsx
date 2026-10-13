import { ArrowLeft, House } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
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
    <header className="mb-4 flex items-start gap-2">
      {kembali !== false && (
        <button
          type="button"
          onClick={() => (kembali ? navigate(kembali) : navigate(-1))}
          className="-ml-2 grid size-12 shrink-0 place-items-center rounded-xl text-primer hover:bg-primer-terang"
          aria-label="Kembali"
        >
          <ArrowLeft size={28} weight="bold" />
        </button>
      )}
      <div className="min-w-0 flex-1 pt-1.5">
        <h1 className="text-[1.5rem] font-extrabold leading-tight text-teks">{judul}</h1>
        {sub && <div className="mt-1 text-teks-2">{sub}</div>}
      </div>
      {aksi}
      <Link
        to={beranda}
        className="grid size-12 shrink-0 place-items-center rounded-xl text-primer hover:bg-primer-terang"
        aria-label="Ke Beranda"
      >
        <House size={28} weight="bold" />
      </Link>
    </header>
  );
}
