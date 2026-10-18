/**
 * Gambar kata afasia (`public/ilustrasi/kata/<kataId>.webp`, 512x512) dan klip suara sesi, serta unduhan lanjutannya.
 *
 * Service worker tidak mem-precache gambar kata (100 berkas) maupun klip suara; runtime cache CacheFirst
 * `CACHE_ILUSTRASI`/`CACHE_SUARA` (vite.config.ts) menyimpan setiap berkas yang lewat SW. Agar satu sesi 10 kata
 * tetap lengkap saat sinyal hilang di tengah latihan (Mode Latihan Mandiri tidak butuh internet),
 * `simpanGambarSesi` dan `simpanSuaraSesi` mengunduh gambar dan klip suara sesi begitu sesi dimulai. Dilewati bila
 * Penghemat Data/2G aktif atau halaman belum dikendalikan SW (kunjungan pertama, mode pengembangan): gambar tetap
 * dimuat satu per satu saat tampil, klip saat diputar.
 */

import { srcIlustrasi } from '@/components/premium/asetIlustrasi';
import { CACHE_ILUSTRASI } from '@/config/cacheAset';
import { hematData } from '@/features/pose/asetPose';
import { simpanKlipKeCache } from '@/features/suara/asetSuara';

const sedangDipramuat = new Set<string>();

/**
 * Muat gambar kata berikutnya lebih dulu (prioritas rendah) agar langsung tampil saat pasien menekan
 * Kata Berikutnya. Berkas kecil (< 20 KB), jadi tetap dijalankan saat Penghemat Data aktif.
 */
export function pramuatGambarKata(kataId: string): void {
  if (typeof Image === 'undefined' || sedangDipramuat.has(kataId)) return;
  sedangDipramuat.add(kataId);
  const img = new Image();
  img.decoding = 'async';
  img.fetchPriority = 'low';
  // Gagal (mis. luring): boleh dicoba lagi di sesi berikutnya.
  img.onerror = () => sedangDipramuat.delete(kataId);
  img.src = srcIlustrasi({ jenis: 'kata', nama: kataId });
}

/** Unduh gambar ke-10 kata sesi ke cache SW saat browser senggang. Tidak pernah melempar galat. */
export function simpanGambarSesi(kataIds: readonly string[]): void {
  if (typeof window === 'undefined' || !('caches' in window) || !navigator.serviceWorker?.controller || hematData()) return;
  const jalankan = async () => {
    const cache = await caches.open(CACHE_ILUSTRASI);
    // Berurutan: total ±100 KB, tidak perlu bersaing bandwidth dengan gambar kata yang sedang tampil.
    for (const id of kataIds) {
      const url = srcIlustrasi({ jenis: 'kata', nama: id });
      if ((await cache.match(url)) !== undefined) continue;
      // Lewat SW: strategi CacheFirst menyimpan salinannya; isi di sini dibuang.
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      await res.arrayBuffer();
    }
  };
  const mulai = () => void jalankan().catch((e: unknown) => console.warn('Gambar kata sesi belum tersimpan untuk luring', e));
  if (typeof requestIdleCallback === 'function') requestIdleCallback(mulai, { timeout: 4000 });
  else setTimeout(mulai, 1000);
}

/**
 * Unduh klip suara sesi (umpan balik, kata, kalimat contoh, ringkasan) ke cache SW saat browser senggang.
 * Promise selesai setelah unduhan selesai, gagal, atau dilewati; tidak pernah ditolak.
 */
export function simpanSuaraSesi(segmen: readonly string[]): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window) || !navigator.serviceWorker?.controller || hematData()) {
    return Promise.resolve();
  }
  return new Promise((selesai) => {
    const mulai = () =>
      void simpanKlipKeCache(segmen)
        .catch((e: unknown) => console.warn('Klip suara sesi belum tersimpan untuk luring', e))
        .finally(selesai);
    if (typeof requestIdleCallback === 'function') requestIdleCallback(mulai, { timeout: 2000 });
    else setTimeout(mulai, 500);
  });
}
