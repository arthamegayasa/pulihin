/**
 * Simpan klip suara ke cache service worker agar tetap berbunyi tanpa sinyal (Bab 11, Ketahanan).
 *
 * Runtime cache CacheFirst `CACHE_SUARA` (vite.config.ts) menyimpan setiap `/suara/*.mp3` yang diambil lewat SW
 * tanpa header Range. Elemen audio sendiri meminta Range (jawaban 206 tidak di-cache), jadi klip hanya tersedia
 * luring setelah diunduh di sini: sesi kamera oleh `prefetchAsetPose` (Beranda pasien, Detail Latihan), sesi
 * latihan bicara oleh `simpanSuaraSesi` (asetKata.ts) saat sesi dimulai. Keduanya dilewati saat Penghemat Data/2G.
 */

import { CACHE_SUARA } from '@/config/cacheAset';
import { klipSuara } from './katalog';

/** Unduh klip segmen-segmen ini lewat SW (berurutan, yang sudah ada di cache dilewati). Segmen tanpa klip diabaikan. */
export async function simpanKlipKeCache(segmen: Iterable<string>): Promise<void> {
  const url = new Set<string>();
  for (const s of segmen) {
    const klip = klipSuara(s);
    if (klip) url.add(klip.url);
  }
  const cache = await caches.open(CACHE_SUARA);
  // Berurutan: klip kecil (±15 KB), tidak perlu bersaing bandwidth dengan pemakaian aplikasi.
  for (const u of url) {
    if ((await cache.match(u)) !== undefined) continue;
    const res = await fetch(u);
    if (!res.ok) throw new Error(`${u}: HTTP ${res.status}`);
    await res.arrayBuffer();
  }
}
