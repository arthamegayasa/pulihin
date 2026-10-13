import type { Role } from '@/types';

/** Peta rute aplikasi. Semua layar aplikasi berada di bawah /app; landing page di /. */
export const PATHS = {
  landing: '/',
  app: '/app',
  beranda: '/app/beranda',
  latihan: '/app/latihan',
  detailLatihan: (id: string) => `/app/latihan/${id}`,
  sesi: (id: string) => `/app/sesi/${id}`,
  ringkasan: (sessionId: string) => `/app/ringkasan/${sessionId}`,
  afasia: '/app/afasia',
  afasiaLatihan: (kategori?: string) => (kategori ? `/app/afasia/latihan?kategori=${kategori}` : '/app/afasia/latihan'),
  afasiaRingkasan: (sessionId: string) => `/app/afasia/ringkasan/${sessionId}`,
  keluarga: '/app/keluarga',
  klinisi: '/app/klinisi',
  klinisiPasien: (patientId: string) => `/app/klinisi/${patientId}`,
  pengaturan: '/app/pengaturan',
  tentang: '/app/tentang',
  uji: '/app/uji',
} as const;

export function berandaUntukPeran(role: Role | null): string {
  if (role === 'keluarga') return PATHS.keluarga;
  if (role === 'terapis') return PATHS.klinisi;
  if (role === 'pasien') return PATHS.beranda;
  return PATHS.app;
}
