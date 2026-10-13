/**
 * Lokasi aset MediaPipe (disajikan dari domain sendiri, bukan CDN) dan prefetch-nya agar sesi kamera
 * tetap bisa dimulai tanpa sinyal setelah aplikasi dibuka sekali (Bab 11, Ketahanan).
 *
 * Service worker tidak mem-precache MediaPipe (WASM ~13 MB + model 5,8 MB) agar landing page ringan;
 * runtime cache CacheFirst `pulihin-mediapipe` (vite.config.ts) menyimpan apa pun di `/mediapipe/` yang
 * lewat SW. `prefetchAsetPose()` mengunduh PERSIS varian WASM yang akan dipilih FilesetResolver
 * (SIMD atau tanpa SIMD) + model saat browser senggang, sehingga ketiganya masuk cache itu.
 * Modul ini sengaja kecil: `@mediapipe/tasks-vision` hanya diimpor dinamis saat cache belum lengkap.
 */

export const WASM_PATH = '/mediapipe/wasm';
export const MODEL_PATH = '/mediapipe/models/pose_landmarker_lite.task';
/** Harus sama dengan `cacheName` runtimeCaching `/mediapipe/` di vite.config.ts. */
const CACHE_MEDIAPIPE = 'pulihin-mediapipe';

interface InfoKoneksi {
  saveData?: boolean;
  effectiveType?: string;
}

let sudahDijadwalkan = false;

/**
 * Jadwalkan unduhan aset pose saat browser senggang (sekali per pemuatan halaman). Hanya dipanggil di jalur
 * pasien (Beranda dengan peran pasien, Detail Latihan): Pilih Peran, Keluarga, dan Terapis tidak perlu
 * mengunduh ~18 MB. Dilewati bila pengguna menyalakan Penghemat Data atau jaringan 2G, dan di mode
 * pengembangan (tanpa service worker).
 */
export function prefetchAsetPose(): void {
  if (sudahDijadwalkan || import.meta.env.DEV || typeof window === 'undefined') return;
  sudahDijadwalkan = true;
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;
  const koneksi = (navigator as Navigator & { connection?: InfoKoneksi }).connection;
  if (koneksi?.saveData || koneksi?.effectiveType === '2g' || koneksi?.effectiveType === 'slow-2g') return;
  const jalankan = () => {
    unduhAsetPose().catch((e: unknown) => console.warn('Prefetch aset pose gagal; akan dimuat saat sesi pertama', e));
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(jalankan, { timeout: 15_000 });
  else setTimeout(jalankan, 3000);
}

async function unduhAsetPose(): Promise<void> {
  // Fetch harus melewati SW (runtime cache). Kunjungan pertama: tunggu SW aktif mengendalikan halaman.
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((selesai) =>
      navigator.serviceWorker.addEventListener('controllerchange', () => selesai(), { once: true }),
    );
  }
  const cache = await caches.open(CACHE_MEDIAPIPE);
  const varian = ['vision_wasm_internal', 'vision_wasm_nosimd_internal'];
  const ada = async (url: string) => (await cache.match(url)) !== undefined;
  if (await ada(MODEL_PATH)) {
    for (const v of varian) {
      if ((await ada(`${WASM_PATH}/${v}.js`)) && (await ada(`${WASM_PATH}/${v}.wasm`))) return;
    }
  }

  // Varian WASM ditentukan oleh pustaka yang sama yang nanti memuatnya (cek dukungan SIMD).
  // Import dinamis disengaja (pemisahan bundel): pustaka ~ratusan KB tidak boleh masuk bundel awal AppShell.
  const { FilesetResolver } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
  const daftar = [fileset.wasmLoaderPath, fileset.wasmBinaryPath, MODEL_PATH];
  // Berurutan agar tidak bersaing bandwidth dengan pemakaian aplikasi; isi dibuang (SW menyimpan salinannya).
  for (const url of daftar) {
    if (await ada(url)) continue;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const pembaca = res.body?.getReader();
    if (pembaca) while (!(await pembaca.read()).done);
  }
}
