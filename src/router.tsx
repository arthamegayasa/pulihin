import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from '@/components/AppShell';
import { RouteError } from '@/components/RouteError';
import { berandaUntukPeran } from '@/router-paths';
import { getPrefs } from '@/lib/prefs';

type PageModule = { default: React.ComponentType };
const page = (load: () => Promise<PageModule>) => async () => ({ Component: (await load()).default });

function AppIndex() {
  const { role } = getPrefs();
  if (!role) return null;
  return <Navigate to={berandaUntukPeran(role)} replace />;
}

/**
 * Peta navigasi (Bab 13). Setiap layar dimuat terpisah (code splitting) agar halaman awal ringan
 * dan MediaPipe hanya diunduh saat sesi kamera dibuka.
 */
export const router = createBrowserRouter([
  { path: '/', lazy: page(() => import('@/pages/Landing')), errorElement: <RouteError /> },
  // Layar penuh tanpa kerangka: kamera dan mode uji.
  { path: '/app/sesi/:id', lazy: page(() => import('@/pages/SesiKamera')), errorElement: <RouteError /> },
  { path: '/app/uji', lazy: page(() => import('@/pages/ModeUji')), errorElement: <RouteError /> },
  {
    path: '/app',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: PilihPeran } = await import('@/pages/PilihPeran');
          return { Component: () => (getPrefs().role ? <AppIndex /> : <PilihPeran />) };
        },
      },
      { path: 'beranda', lazy: page(() => import('@/pages/Beranda')) },
      { path: 'latihan', lazy: page(() => import('@/pages/DaftarLatihan')) },
      { path: 'latihan/:id', lazy: page(() => import('@/pages/DetailLatihan')) },
      { path: 'ringkasan/:sessionId', lazy: page(() => import('@/pages/RingkasanSesi')) },
      { path: 'afasia', lazy: page(() => import('@/pages/afasia/AfasiaKategori')) },
      { path: 'afasia/latihan', lazy: page(() => import('@/pages/afasia/AfasiaLatihan')) },
      { path: 'afasia/ringkasan/:sessionId', lazy: page(() => import('@/pages/afasia/AfasiaRingkasan')) },
      { path: 'keluarga', lazy: page(() => import('@/pages/Pendamping')) },
      { path: 'klinisi', lazy: page(() => import('@/pages/klinisi/KlinisiDashboard')) },
      { path: 'klinisi/:patientId', lazy: page(() => import('@/pages/klinisi/KlinisiPasien')) },
      { path: 'pengaturan', lazy: page(() => import('@/pages/Pengaturan')) },
      { path: 'tentang', lazy: page(() => import('@/pages/Tentang')) },
      { path: '*', element: <Navigate to="/app" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
