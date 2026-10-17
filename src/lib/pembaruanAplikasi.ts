import { registerSW } from 'virtual:pwa-register';
import type { router as RouterAplikasi } from '@/router';

/**
 * Versi baru (deploy) langsung tampil tanpa pengguna harus memuat ulang sendiri.
 *
 * Service worker melayani kerangka aplikasi dari precache, jadi kunjungan pertama setelah deploy masih memuat
 * versi lama sementara versi baru diunduh di latar. SW baru langsung aktif (registerType 'autoUpdate'); begitu
 * aktif, halaman dimuat ulang ke versi baru, KECUALI saat pengguna di tengah sesi atau sedang mengubah resep:
 * pemuatan ulang ditunda sampai ia pindah ke layar lain, agar sesi yang berjalan dan isian yang belum disimpan
 * tidak hilang.
 */
const RUTE_DITUNDA = [/^\/app\/sesi\//, /^\/app\/uji/, /^\/app\/afasia\/latihan/, /^\/app\/klinisi\/[^/]+/];

const bolehMuatUlang = (pathname: string) => !RUTE_DITUNDA.some((r) => r.test(pathname));

export function pasangPembaruanAplikasi(router: typeof RouterAplikasi): void {
  if (!('serviceWorker' in navigator)) return;
  let perluMuatUlang = false;
  const muatUlangBilaAman = (pathname: string) => {
    if (perluMuatUlang && bolehMuatUlang(pathname)) window.location.reload();
  };
  registerSW({
    immediate: true,
    onNeedReload() {
      perluMuatUlang = true;
      muatUlangBilaAman(router.state.location.pathname);
    },
    onRegisteredSW(_url: string, reg: ServiceWorkerRegistration | undefined) {
      // Aplikasi yang terpasang sering dibiarkan terbuka berhari-hari: periksa versi baru tiap kali dibuka lagi.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) void reg?.update().catch(() => undefined);
      });
    },
  });
  router.subscribe((state) => {
    if (state.navigation.state === 'idle') muatUlangBilaAman(state.location.pathname);
  });
}
