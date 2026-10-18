/**
 * Lokasi aset MediaPipe (disajikan dari domain sendiri, bukan CDN) dan video peraga 3D, serta prefetch-nya
 * agar sesi kamera dan contoh gerakan tetap tersedia tanpa sinyal setelah aplikasi dibuka sekali (Bab 11, Ketahanan).
 *
 * Service worker tidak mem-precache MediaPipe (WASM ~13 MB + model 5,8 MB), video peraga, maupun klip suara agar
 * landing page ringan; runtime cache CacheFirst `pulihin-mediapipe`, `CACHE_PERAGA`, dan `CACHE_SUARA`
 * (vite.config.ts) menyimpan apa pun di `/mediapipe/`, `/peraga/`, dan `/suara/` yang lewat SW.
 * `prefetchAsetPose()` mengunduh saat browser senggang:
 * 1. video + poster peraga untuk latihan di program pasien aktif (kecil, ±0,5 MB per latihan);
 * 2. semua klip suara sesi kamera (petunjuk, hitungan 1..50, koreksi; 67 klip, ±1 MB);
 * 3. PERSIS varian WASM yang akan dipilih FilesetResolver (SIMD atau tanpa SIMD) + model.
 * `@mediapipe/tasks-vision` hanya diimpor dinamis saat cache MediaPipe belum lengkap.
 */

import { CACHE_PERAGA } from '@/config/cacheAset';
import { getProgram } from '@/data/db';
import { simpanKlipKeCache } from '@/features/suara/asetSuara';
import { segmenSemuaSesiKamera } from '@/features/suara/semuaUcapan';
import { getPrefs } from '@/lib/prefs';
import { getExercise } from './exerciseDefinitions';

export const WASM_PATH = '/mediapipe/wasm';
export const MODEL_PATH = '/mediapipe/models/pose_landmarker_lite.task';
/** Harus sama dengan `cacheName` runtimeCaching `/mediapipe/` di vite.config.ts. */
const CACHE_MEDIAPIPE = 'pulihin-mediapipe';

interface InfoKoneksi {
  saveData?: boolean;
  effectiveType?: string;
}

/** Berkas video peraga dari path dasar `ExerciseDefinition.animasiAtauVideo` (`'/peraga/<id>'`). */
export interface AsetPeraga {
  video: string;
  mulai: string;
  puncak: string;
  /** Gambar kecil daftar latihan 256x256 (pose puncak, latar ilustrasi #EEF4F2); di-precache service worker. */
  kartu: string;
}

export function asetPeraga(basePath: string): AsetPeraga {
  return {
    video: `${basePath}.mp4`,
    mulai: `${basePath}-mulai.webp`,
    puncak: `${basePath}-puncak.webp`,
    kartu: `${basePath}-kartu.webp`,
  };
}

/** Penghemat Data aktif atau jaringan 2G: jangan mengunduh besar atau memutar video otomatis. */
export function hematData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const koneksi = (navigator as Navigator & { connection?: InfoKoneksi }).connection;
  return Boolean(koneksi?.saveData || koneksi?.effectiveType === '2g' || koneksi?.effectiveType === 'slow-2g');
}

let sudahDijadwalkan = false;

/**
 * Jadwalkan unduhan aset peraga & pose saat browser senggang (sekali per pemuatan halaman). Hanya dipanggil
 * di jalur pasien (Beranda dengan peran pasien, Detail Latihan): Pilih Peran, Keluarga, dan Terapis tidak
 * perlu mengunduh ~18 MB. Dilewati bila Penghemat Data/2G, dan di mode pengembangan (tanpa service worker).
 */
export function prefetchAsetPose(): void {
  if (sudahDijadwalkan || import.meta.env.DEV || typeof window === 'undefined') return;
  sudahDijadwalkan = true;
  if (!('serviceWorker' in navigator) || !('caches' in window) || hematData()) return;
  const jalankan = async () => {
    await tungguServiceWorker();
    // Peraga dulu: kecil dan langsung terlihat di Detail Latihan; klip suara sesi; MediaPipe sesudahnya.
    await unduhPeragaProgram().catch((e: unknown) => console.warn('Prefetch video peraga gagal; dimuat saat Detail Latihan dibuka', e));
    await simpanKlipKeCache(segmenSemuaSesiKamera().map((s) => s.teks)).catch((e: unknown) =>
      console.warn('Prefetch suara sesi gagal; klip dimuat saat diputar', e),
    );
    await unduhAsetPose().catch((e: unknown) => console.warn('Prefetch aset pose gagal; akan dimuat saat sesi pertama', e));
  };
  // Mengembalikan void (bukan Promise): kegagalan sudah ditangani di dalam `jalankan`.
  const mulai = () => void jalankan();
  if (typeof requestIdleCallback === 'function') requestIdleCallback(mulai, { timeout: 15_000 });
  else setTimeout(mulai, 3000);
}

/** Fetch harus melewati SW (runtime cache). Kunjungan pertama: tunggu SW aktif mengendalikan halaman. */
async function tungguServiceWorker(): Promise<void> {
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller) return;
  await new Promise<void>((selesai) => navigator.serviceWorker.addEventListener('controllerchange', () => selesai(), { once: true }));
}

/**
 * Unduh satu URL lewat SW bila belum ada di `cache`; isi dibuang (SW menyimpan salinannya). Permintaan tanpa
 * header Range, jadi jawaban 200 utuh yang bisa disimpan (jawaban 206 dari elemen video tidak di-cache).
 */
async function unduhKeCache(cache: Cache, url: string): Promise<void> {
  if ((await cache.match(url)) !== undefined) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const pembaca = res.body?.getReader();
  if (pembaca) while (!(await pembaca.read()).done);
}

/** Video + kedua poster untuk tiap latihan program pasien aktif. */
async function unduhPeragaProgram(): Promise<void> {
  const program = await getProgram(getPrefs().activePatientId);
  const basis = new Set<string>();
  for (const item of program?.items ?? []) {
    const aset = getExercise(item.latihanId)?.animasiAtauVideo;
    if (aset !== undefined) basis.add(aset);
  }
  if (basis.size === 0) return;
  const cache = await caches.open(CACHE_PERAGA);
  // Berurutan agar tidak bersaing bandwidth dengan pemakaian aplikasi.
  for (const b of basis) {
    const { video, mulai, puncak } = asetPeraga(b);
    for (const url of [mulai, puncak, video]) await unduhKeCache(cache, url);
  }
}

async function unduhAsetPose(): Promise<void> {
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
  for (const url of [fileset.wasmLoaderPath, fileset.wasmBinaryPath, MODEL_PATH]) await unduhKeCache(cache, url);
}
