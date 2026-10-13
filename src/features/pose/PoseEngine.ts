import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { MODEL_PATH, WASM_PATH } from './asetPose';
import { ATURAN_UMUM } from './exerciseDefinitions';
import {
  langkahKebijakan,
  mulaiSesiKebijakan,
  statusAwalKebijakan,
  type JumlahOrang,
  type StatusKebijakanOrang,
} from './kebijakanOrang';
import { INDEKS_MEDIAPIPE } from './landmarks';
import type { Landmark, PoseFrame } from './types';

/**
 * Pembungkus tunggal (singleton) MediaPipe PoseLandmarker.
 *
 * - `@mediapipe/tasks-vision` hanya dimuat lewat import dinamis, jadi tidak masuk bundel utama:
 *   pustaka & model baru diunduh saat Detail Latihan, Sesi Kamera, atau Mode Uji dibuka
 *   (atau lebih awal oleh `prefetchAsetPose` saat browser senggang, asetPose.ts).
 * - Runtime WASM dan model disajikan dari domain sendiri (`/mediapipe/...`), tidak dari CDN.
 * - Semua inferensi terjadi di perangkat. Modul ini tidak pernah mengirim frame ke mana pun (AC-F1-5).
 * - Mulai dengan 2 orang agar anggota keluarga di belakang pasien tidak "mencuri" kerangka;
 *   `pilihPoseUtama` memilih pasien (badan terbesar, dekat tengah, lengket). Biaya terukur (Chrome
 *   desktop, GPU): inferensi 13,6 -> 25,5 ms per frame. Bila perangkat lambat (fps < 15 karena
 *   inferensi, atau inferensi > 60 ms, selama 3 s) mesin turun ke 1 orang saat berjalan
 *   (`setOptions`), lihat kebijakanOrang.ts dan docs/algoritma.md Bagian 14.
 */

export type Delegasi = 'GPU' | 'CPU';

export interface StatistikMesin {
  /** Frame yang diproses per detik (rata-rata eksponensial). */
  fps: number;
  /** Lama satu inferensi dalam ms (rata-rata eksponensial). */
  inferensiMs: number;
  delegasi: Delegasi | null;
  /** Jumlah orang maksimum yang sedang dideteksi model. */
  jumlahOrang: JumlahOrang;
  /** 'adaptif' = kebijakan otomatis; 'dipaksa' = diatur Mode Uji. */
  modeOrang: 'adaptif' | 'dipaksa';
  /** Sebab jumlah orang saat ini (kebijakan adaptif). */
  alasanOrang: StatusKebijakanOrang['alasan'];
  /** Adaptif sudah terkunci di 1 orang (turun lagi setelah pernah naik). */
  terkunci: boolean;
}

const EMA = 0.1;

let landmarker: PoseLandmarker | null = null;
let delegasi: Delegasi | null = null;
let memuat: Promise<void> | null = null;
let tsTerakhir = -1;
let deteksiTerakhir = 0;
let fps = 0;
let inferensiMs = 0;
let orangUtama: PusatOrang | null = null;
/** Awal penolakan kandidat tunggal asing (mode 1 orang), ms. */
let asingSejak: number | null = null;
/** Delegasi yang dipaksa Mode Uji (null = GPU lalu CPU bila GPU gagal). */
let delegasiPaksa: Delegasi | null = null;
/** Jumlah orang yang dipaksa Mode Uji (null = kebijakan adaptif). */
let orangPaksa: JumlahOrang | null = null;
let kebijakan: StatusKebijakanOrang = statusAwalKebijakan();
/** Jumlah orang yang terpasang di model saat ini. */
let orangTerpasang: JumlahOrang = 2;
/** setOptions sedang berjalan: frame dilewati agar graph tidak dipakai saat dibangun ulang. */
let berganti = false;

const jumlahOrangDiinginkan = (): JumlahOrang => orangPaksa ?? kebijakan.jumlahOrang;

async function buat(pilihan: Delegasi): Promise<PoseLandmarker> {
  // Import dinamis disengaja: MediaPipe (~ratusan KB + WASM) harus terpisah dari bundel utama dan
  // hanya diunduh di layar kamera. Impor statis akan menariknya ke chunk halaman awal.
  const { FilesetResolver, PoseLandmarker: PL } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
  const jumlah = jumlahOrangDiinginkan();
  const lm = await PL.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate: pilihan },
    runningMode: 'VIDEO',
    numPoses: jumlah,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  });
  orangTerpasang = jumlah;
  return lm;
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
  if (delegasiPaksa === 'CPU') {
    landmarker = await buat('CPU');
    delegasi = 'CPU';
    pemanasan(landmarker);
    return;
  }
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
  asingSejak = null;
  kebijakan = mulaiSesiKebijakan(kebijakan, typeof performance === 'undefined' ? 0 : performance.now());
}

export function getPoseStats(): StatistikMesin {
  return {
    fps,
    inferensiMs,
    delegasi,
    jumlahOrang: orangTerpasang,
    modeOrang: orangPaksa === null ? 'adaptif' : 'dipaksa',
    alasanOrang: kebijakan.alasan,
    terkunci: kebijakan.terkunci,
  };
}

/**
 * Mode Uji: paksa delegasi (mis. 'CPU' untuk mengukur perangkat tanpa GPU) atau kembali ke bawaan (null).
 * Model dimuat ulang saat kamera dinyalakan berikutnya; panggil hanya saat kamera mati.
 */
export function aturDelegasiPaksa(d: Delegasi | null): void {
  if (d === delegasiPaksa) return;
  delegasiPaksa = d;
  landmarker?.close();
  landmarker = null;
  delegasi = null;
  memuat = null;
}

/** Mode Uji: paksa jumlah orang (1 atau 2) atau kembali ke kebijakan adaptif (null). */
export function aturJumlahOrangPaksa(n: JumlahOrang | null): void {
  orangPaksa = n;
  terapkanJumlahOrang();
}

/** Samakan numPoses model dengan jumlah yang diinginkan. Frame dilewati selama graph dibangun ulang. */
function terapkanJumlahOrang(): void {
  const lm = landmarker;
  const n = jumlahOrangDiinginkan();
  if (!lm || berganti || n === orangTerpasang) return;
  berganti = true;
  const mulai = performance.now();
  lm.setOptions({ numPoses: n })
    .then(() => {
      if (landmarker !== lm) return;
      orangTerpasang = n;
      // Ukur ulang dari nol: rata-rata lama mencerminkan jumlah orang sebelumnya.
      fps = 0;
      inferensiMs = 0;
      deteksiTerakhir = 0;
      console.info(`PoseLandmarker: deteksi ${n} orang (${orangPaksa === null ? kebijakan.alasan : 'dipaksa'}), ganti ${Math.round(performance.now() - mulai)} ms`);
    })
    .catch((e: unknown) => console.warn('Gagal mengubah jumlah orang', e))
    .finally(() => {
      berganti = false;
    });
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

/**
 * Mode 1 orang: MediaPipe memilih deteksi paling yakin, yang bisa saja orang di latar. Kandidat tunggal
 * yang jauh dari orang utama sebelumnya DAN lebih kecil dianggap bukan pasien
 * (`ATURAN_UMUM.pilihOrang.asing`). PoseEngine menolaknya paling lama `tahanMaksDetik`.
 */
export function kandidatTunggalAsing(lm: readonly TitikGambar[], aspect: number, utama: PusatOrang | null): boolean {
  if (!utama) return false;
  const p = pusatOrang(lm, aspect);
  const { radius, rasioUkuranMaks } = ATURAN_UMUM.pilihOrang.asing;
  const jarak = Math.hypot((p.x - utama.x) * aspect, p.y - utama.y);
  return jarak > radius * utama.ukuran && p.ukuran < rasioUkuranMaks * utama.ukuran;
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
 * Mengembalikan null bila mesin belum siap, sedang berganti jumlah orang, video belum punya gambar,
 * atau tidak ada tubuh.
 */
export function detectPose(video: HTMLVideoElement, tMs: number): PoseFrame | null {
  const lm = landmarker;
  if (!lm || berganti || video.videoWidth === 0 || video.videoHeight === 0) return null;
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
  if (orangPaksa === null) {
    kebijakan = langkahKebijakan(kebijakan, { t: selesai, fps, inferensiMs });
    if (kebijakan.jumlahOrang !== orangTerpasang) terapkanJumlahOrang();
  }

  const kandidat = hasil.landmarks.filter((p) => p.length >= 33);
  if (kandidat.length === 0) return null;
  const aspect = video.videoWidth / video.videoHeight;
  const i = kandidat.length === 1 ? 0 : pilihPoseUtama(kandidat, aspect, orangUtama);
  const pose = kandidat[i];
  if (orangTerpasang === 1 && kandidatTunggalAsing(pose, aspect, orangUtama)) {
    // Kerangka tidak melompat ke orang di latar; bila bertahan, pasien dianggap berpindah tempat.
    asingSejak ??= tMs;
    if (tMs - asingSejak < ATURAN_UMUM.pilihOrang.asing.tahanMaksDetik * 1000) return null;
  }
  asingSejak = null;
  orangUtama = pusatOrang(pose, aspect);
  const dunia = hasil.worldLandmarks[hasil.landmarks.indexOf(pose)];
  return {
    landmarks: salin(pose),
    worldLandmarks: dunia ? salin(dunia) : undefined,
    t: tMs,
    aspect,
  };
}
