import { GearSix } from '@phosphor-icons/react';
import { Link, Outlet, useLocation } from 'react-router';
import { DemoBadge } from '@/components/DemoBadge';
import { Logo } from '@/components/Logo';
import { berandaUntukPeran, PATHS } from '@/router-paths';
import { usePrefs } from '@/lib/prefs';

/**
 * Kerangka layar aplikasi. Lebar seukuran ponsel di layar besar, kecuali Dashboard Klinisi (lebar desktop).
 * Sesi kamera memakai layar penuh tanpa kerangka ini.
 */
export function AppShell() {
  const { role } = usePrefs();
  const { pathname } = useLocation();
  const lebar = pathname.startsWith(PATHS.klinisi) ? 'max-w-6xl' : 'max-w-md';
  return (
    <div className="min-h-[100dvh]">
      <div className="sticky top-0 z-20 border-b border-garis/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className={`mx-auto flex h-14 items-center gap-3 px-4 ${lebar}`}>
          <Link to={berandaUntukPeran(role)} className="flex items-center gap-2" aria-label="PULIHIN, ke Beranda">
            <Logo className="h-7 w-auto" />
          </Link>
          <DemoBadge />
          <div className="flex-1" />
          <Link
            to={PATHS.pengaturan}
            className="grid size-11 place-items-center rounded-xl text-primer hover:bg-primer-terang"
            aria-label="Pengaturan"
          >
            <GearSix size={26} weight="bold" />
          </Link>
        </div>
      </div>
      <main className={`mx-auto px-4 pb-10 pt-4 ${lebar}`}>
        <Outlet />
      </main>
    </div>
  );
}
