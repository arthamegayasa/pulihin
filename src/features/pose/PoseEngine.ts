import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { ATURAN_UMUM } from './exerciseDefinitions';
import { INDEKS_MEDIAPIPE } from './landmarks';
import type { Landmark, PoseFrame } from './types';

/**
 * Pembungkus tunggal (singleton) MediaPipe PoseLandmarker.
 *
 * - `@mediapipe/tasks-vision` hanya dimuat lewat import dinamis, jadi tidak masuk bundel utama:
 *   pustaka & model baru diunduh saat Detail Latihan, Sesi Kamera, atau Mode Uji dibuka.
 * - Runtime WASM dan model disajikan dari domain sendiri (`/mediapipe/...`), tidak dari CDN.
 * - Semua inferensi terjadi di perangkat. Modul ini tidak pernah mengirim frame ke mana pun (AC-F1-5).
 * - Hingga 2 orang dideteksi (`JUMLAH_ORANG`) agar anggota keluarga di belakang pasien tidak
 *   "mencuri" kerangka; `pilihPoseUtama` memilih pasien (badan terbesar, dekat tengah, lengket).
 *   Biaya terukur (Chrome desktop, GPU): inferensi 13,6 -> 25,5 ms per frame pada rekaman yang
 *   sama (docs/algoritma.md Bagian 13).
 */

export type Delegasi = 'GPU' | 'CPU';

export interface StatistikMesin {
  /** Frame yang diproses per detik (rata-rata eksponensial). */
  fps: number;
  /** Lama satu inferensi dalam ms (rata-rata eksponensial). */
  inferensiMs: number;
  delegasi: Delegasi | null;
}

const WASM_PATH = '/mediapipe/wasm';
const MODEL_PATH = '/mediapipe/models/pose_landmarker_lite.task';
const EMA = 0.1;
const JUMLAH_ORANG = 2;

let landmarker: PoseLandmarker | null = null;
let delegasi: Delegasi | null = null;
let memuat: Promise<void> | null = null;
let tsTerakhir = -1;
let deteksiTerakhir = 0;
let fps = 0;
let inferensiMs = 0;
let orangUtama: PusatOrang | null = null;

async function buat(pilihan: Delegasi): Promise<PoseLandmarker> {
  // Import dinamis disengaja: MediaPipe (~ratusan KB + WASM) harus terpisah dari bundel utama dan
  // hanya diunduh di layar kamera. Impor statis akan menariknya ke chunk halaman awal.
  const { FilesetResolver, PoseLandmarker: PL } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
  return PL.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate: pilihan },
    runningMode: 'VIDEO',
    numPoses: JUMLAH_ORANG,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  });
}

function stempel(tMs: number): number {
  // MediaPipe mode VIDEO mewajibkan stempel waktu yang naik ketat.
  const ts = Math.max(Math.floor(tMs), tsTerakhir + 1);
  tsTerakhir = ts;
  return ts;
}

/** Satu inferensi pada kanvas kosong agar shader GPU/WASM sudah terkompilasi sebelum kamera menyala (AC-F1-1). */
function pemanasan(lm: PoseLandmarker): void {
  if (typeof document === 'undefined') return;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  lm.detectForVideo(c, stempel(performance.now()));
}

async function muat(): Promise<void> {
  try {
    landmarker = await buat('GPU');
    delegasi = 'GPU';
    pemanasan(landmarker);
  } catch (e) {
    console.warn('PoseLandmarker GPU tidak tersedia, beralih ke CPU', e);
    landmarker?.close();
    landmarker = await buat('CPU');
    delegasi = 'CPU';
    pemanasan(landmarker);
  }
}

/**
 * Mulai memuat pustaka + model tanpa menunggu. Aman dipanggil berkali-kali.
 * Dipanggil dari Detail Latihan agar model sudah hangat saat kamera menyala.
 */
export function preloadPoseEngine(): Promise<void> {
  if (landmarker) return Promise.resolve();
  if (!memuat) {
    memuat = muat().catch((e: unknown) => {
      memuat = null; // izinkan Coba Lagi
      landmarker = null;
      delegasi = null;
      throw e;
    });
  }
  return memuat;
}

export function isPoseEngineReady(): boolean {
  return landmarker !== null;
}

/** Atur ulang statistik dan ingatan orang utama saat sesi baru dimulai. */
export function resetPoseStats(): void {
  fps = 0;
  inferensiMs = 0;
  deteksiTerakhir = 0;
  orangUtama = null;
}

export function getPoseStats(): StatistikMesin {
  return { fps, inferensiMs, delegasi };
}

function salin(daftar: ReadonlyArray<{ x: number; y: number; z: number; visibility?: number }>): Landmark[] {
  const hasil: Landmark[] = new Array(daftar.length);
  for (let i = 0; i < daftar.length; i++) {
    const l = daftar[i];
    hasil[i] = { x: l.x, y: l.y, z: l.z, visibility: l.visibility };
  }
  return hasil;
}

/** Pusat dan ukuran batang tubuh satu orang pada gambar (satuan tinggi gambar). */
export interface PusatOrang {
  x: number;
  y: number;
  ukuran: number;
}

type TitikGambar = Pick<Landmark, 'x' | 'y'>;

/**
 * Pusat = titik tengah kedua bahu; ukuran = max(panjang batang tubuh, lebar bahu), x dikali
 * rasio aspek. Koordinat dipakai walau visibility rendah: MediaPipe tetap memperkirakannya.
 */
export function pusatOrang(lm: readonly TitikGambar[], aspect: number): PusatOrang {
  const { bahu, pinggul } = INDEKS_MEDIAPIPE;
  const [bl, br, pl, pr] = [lm[bahu.kiri], lm[bahu.kanan], lm[pinggul.kiri], lm[pinggul.kanan]];
  const x = (bl.x + br.x) / 2;
  const y = (bl.y + br.y) / 2;
  const batang = Math.hypot((x - (pl.x + pr.x) / 2) * aspect, y - (pl.y + pr.y) / 2);
  const lebar = Math.hypot((bl.x - br.x) * aspect, bl.y - br.y);
  return { x, y, ukuran: Math.max(batang, lebar) };
}

/**
 * Indeks kandidat yang dianggap pasien: skor = ukuran x (1 - bobotPusat x jarak ke tengah gambar),
 * dikali faktorLengket bila pusatnya dekat pusat orang utama frame sebelumnya. Urutan keluaran
 * MediaPipe tidak stabil antar frame, jadi tidak dipakai.
 */
export function pilihPoseUtama(
  kandidat: ReadonlyArray<readonly TitikGambar[]>,
  aspect: number,
  sebelumnya: PusatOrang | null,
): number {
  const { bobotPusat, faktorLengket, radiusLengket } = ATURAN_UMUM.pilihOrang;
  let terbaik = 0;
  let skorTerbaik = -Infinity;
  kandidat.forEach((lm, i) => {
    const p = pusatOrang(lm, aspect);
    const keTengah = Math.min(1, Math.hypot((p.x - 0.5) * aspect, p.y - 0.5));
    let skor = p.ukuran * (1 - bobotPusat * keTengah);
    if (
      sebelumnya &&
      Math.hypot((p.x - sebelumnya.x) * aspect, p.y - sebelumnya.y) <= radiusLengket * sebelumnya.ukuran
    ) {
      skor *= faktorLengket;
    }
    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      terbaik = i;
    }
  });
  return terbaik;
}

/** GPU kadang gagal saat inferensi pertama di perangkat tertentu: muat ulang di CPU tanpa menghentikan sesi. */
function turunKeCpu(e: unknown): void {
  if (delegasi !== 'GPU' || memuat === null) return;
  console.warn('Inferensi GPU gagal, memuat ulang di CPU', e);
  landmarker?.close();
  landmarker = null;
  delegasi = null;
  memuat = buat('CPU')
    .then((lm) => {
      landmarker = lm;
      delegasi = 'CPU';
    })
    .catch((err: unknown) => {
      memuat = null;
      console.error('PoseLandmarker CPU gagal dimuat', err);
    });
}

/**
 * Deteksi pose pada frame video saat ini. `tMs` = performance.now().
 * Mengembalikan null bila mesin belum siap, video belum punya gambar, atau tidak ada tubuh.
 */
export function detectPose(video: HTMLVideoElement, tMs: number): PoseFrame | null {
  const lm = landmarker;
  if (!lm || video.videoWidth === 0 || video.videoHeight === 0) return null;
  const mulai = performance.now();
  let hasil;
  try {
    hasil = lm.detectForVideo(video, stempel(tMs));
  } catch (e) {
    turunKeCpu(e);
    return null;
  }
  const selesai = performance.now();
  const lama = selesai - mulai;
  inferensiMs = inferensiMs === 0 ? lama : inferensiMs + EMA * (lama - inferensiMs);
  if (deteksiTerakhir > 0) {
    const sesaat = 1000 / Math.max(1, selesai - deteksiTerakhir);
    fps = fps === 0 ? sesaat : fps + EMA * (sesaat - fps);
  }
  deteksiTerakhir = selesai;

  const kandidat = hasil.landmarks.filter((p) => p.length >= 33);
  if (kandidat.length === 0) return null;
  const aspect = video.videoWidth / video.videoHeight;
  const i = kandidat.length === 1 ? 0 : pilihPoseUtama(kandidat, aspect, orangUtama);
  const pose = kandidat[i];
  orangUtama = pusatOrang(pose, aspect);
  const dunia = hasil.worldLandmarks[hasil.landmarks.indexOf(pose)];
  return {
    landmarks: salin(pose),
    worldLandmarks: dunia ? salin(dunia) : undefined,
    t: tMs,
    aspect,
  };
}
