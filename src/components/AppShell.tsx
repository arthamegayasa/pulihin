import { GearSix } from '@phosphor-icons/react';
import { Link, Outlet, useLocation } from 'react-router';
import { DemoBadge } from '@/components/DemoBadge';
import { Logo } from '@/components/Logo';
import { TautanIkon } from '@/components/premium/TombolIkon';
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
      {/* Header permukaan-naik: garis rambut + bayangan sangat lembut, tanpa blur (ringan untuk HP kelas bawah). */}
      <div className="sticky top-0 z-20 bg-permukaan-naik shadow-[0_1px_0_var(--color-garis-halus),0_8px_20px_-16px_rgb(11_79_74/0.35)]">
        {/* Ukuran header dalam px: tidak ikut membesar pada Huruf Lebih Besar agar muat di 360px. Tinggi 56px dan
            padding <main> tetap: layar satu-halaman (Afasia, Pilih Peran) menghitung min-h dari 100dvh-7rem. */}
        <div className={`mx-auto flex h-[56px] items-center gap-[12px] px-[16px] ${lebar}`}>
          <Link
            to={berandaUntukPeran(role)}
            className="-ml-[6px] flex min-h-[48px] shrink-0 items-center rounded-kontrol px-[6px]"
            aria-label="PULIHIN, ke Beranda"
          >
            <Logo className="h-[28px] w-auto" />
          </Link>
          <span aria-hidden className="h-[24px] w-px shrink-0 bg-garis" />
          <DemoBadge />
          <div className="flex-1" />
          <TautanIkon to={PATHS.pengaturan} label="Pengaturan" ikon={<GearSix weight="bold" />} className="-mr-[6px]" />
        </div>
      </div>
      <main className={`mx-auto px-4 pb-10 pt-4 ${lebar}`}>
        <Outlet />
      </main>
    </div>
  );
}
