/**
 * Nama cache runtime service worker untuk aset ber-URL tetap yang isinya bisa diganti (dipakai vite.config.ts,
 * asetKata.ts, asetPose.ts). Strateginya CacheFirst, jadi berkas yang isinya diganti TIDAK pernah diambil ulang
 * oleh perangkat yang sudah menyimpannya. Setiap kali isi berkas di folder itu berubah: naikkan versi nama cache
 * di sini dan pindahkan nama lama ke `CACHE_LAMA` agar dihapus saat aplikasi dibuka.
 */
/** `public/ilustrasi/` (kata, momen, landing). */
export const CACHE_ILUSTRASI = 'pulihin-ilustrasi-2';
/** `public/peraga/` (video peraga + poster; gambar kecil `-kartu` ikut precache). v2 = gaya S2 flat editorial. */
export const CACHE_PERAGA = 'pulihin-peraga-2';

/** Nama cache versi sebelumnya; dihapus oleh `hapusCacheLama`. */
export const CACHE_LAMA = ['pulihin-ilustrasi', 'pulihin-peraga'] as const;

/** Hapus cache versi lama (berkas yang sudah diganti) agar tidak memakan ruang di HP. Tidak melempar galat. */
export function hapusCacheLama(): void {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  for (const nama of CACHE_LAMA) void caches.delete(nama).catch(() => undefined);
}
