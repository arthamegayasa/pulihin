/**
 * Nama cache runtime service worker untuk `public/ilustrasi/` (dipakai vite.config.ts dan asetKata.ts).
 * Strateginya CacheFirst dengan URL tetap, jadi gambar yang isinya diganti TIDAK pernah diambil ulang oleh
 * perangkat yang sudah menyimpannya. Setiap kali isi berkas ilustrasi berubah: naikkan versi di sini dan
 * pindahkan nama lama ke `CACHE_ILUSTRASI_LAMA` agar dihapus saat aplikasi dibuka.
 */
export const CACHE_ILUSTRASI = 'pulihin-ilustrasi-2';

/** Nama cache ilustrasi versi sebelumnya; dihapus oleh `hapusCacheIlustrasiLama`. */
export const CACHE_ILUSTRASI_LAMA = ['pulihin-ilustrasi'] as const;

/** Hapus cache ilustrasi versi lama (gambar yang sudah diganti) agar tidak memakan ruang di HP. Tidak melempar galat. */
export function hapusCacheIlustrasiLama(): void {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  for (const nama of CACHE_ILUSTRASI_LAMA) void caches.delete(nama).catch(() => undefined);
}
