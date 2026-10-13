import { GearSix } from '@phosphor-icons/react';
import { Link, Outlet, useLocation } from 'react-router';
import { DemoBadge } from '@/components/DemoBadge';
import { Logo } from '@/components/Logo';
import { useDataPasien, useNotifikasiPengingat, useSekarang } from '@/features/adherence/hooks';
import { berandaUntukPeran, PATHS } from '@/router-paths';
import { usePrefs } from '@/lib/prefs';

/** Notifikasi pengingat jadwal aktif di semua layar aplikasi selama PULIHIN terbuka (Bab 9.1). */
function PengingatJadwal() {
  const sekarang = useSekarang();
  const { data } = useDataPasien();
  useNotifikasiPengingat(data, sekarang);
  return null;
}

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
      <PengingatJadwal />
      <div className="sticky top-0 z-20 border-b border-garis/70 bg-white">
        {/* Ukuran header dalam px: tidak ikut membesar pada Huruf Lebih Besar agar muat di 360px. */}
        <div className={`mx-auto flex h-[56px] items-center gap-[12px] px-[16px] ${lebar}`}>
          <Link to={berandaUntukPeran(role)} className="flex min-h-[48px] shrink-0 items-center gap-2" aria-label="PULIHIN, ke Beranda">
            <Logo className="h-[28px] w-auto" />
          </Link>
          <DemoBadge />
          <div className="flex-1" />
          <Link
            to={PATHS.pengaturan}
            className="grid size-[48px] shrink-0 place-items-center rounded-xl text-primer hover:bg-primer-terang"
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
