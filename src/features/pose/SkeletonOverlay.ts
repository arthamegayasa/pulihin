import { POSE_CONNECTIONS } from './landmarks';
import type { PoseFrame } from './types';

/**
 * Penggambar skeleton di atas video kamera.
 * - Perhitungan sudut tetap memakai landmark mentah; mirror hanya untuk tampilan (selaras video selfie yang dicerminkan).
 * - Gaya tenang: garis putih bertepi gelap, sendi bulat, sendi aktif berwarna aksen. Tanpa kedip.
 * - Posisi titik dihaluskan ringan khusus untuk tampilan agar tidak bergetar.
 */

const WARNA_GARIS = 'rgba(255,255,255,0.92)';
const WARNA_TEPI = 'rgba(8,59,55,0.55)';
const WARNA_SENDI = '#ffffff';
const WARNA_SENDI_TEPI = '#0b4f4a';
const WARNA_AKSEN = '#c46a1b';
const AMBANG_TERLIHAT = 0.5;
/** Indeks 0..10 adalah wajah; skeleton tubuh dimulai dari bahu (11). */
const INDEKS_TUBUH_PERTAMA = 11;
const PENGHALUS = 0.55;
/** Batas devicePixelRatio agar kanvas tetap ringan di HP kelas bawah. */
const DPR_MAKS = 2;

export interface OpsiPenggambar {
  /** Cerminkan horizontal (video selfie dicerminkan). */
  cermin: boolean;
  /** Cara video mengisi kotak: sama dengan CSS object-fit elemen video. */
  isi: 'cover' | 'contain';
}

export interface PenggambarSkeleton {
  /** Gambar satu frame. `frame` null = hapus skeleton. */
  gambar(frame: PoseFrame | null, lebarVideo: number, tinggiVideo: number, titikAktif: readonly number[]): void;
  bersihkan(): void;
}

export function buatPenggambarSkeleton(canvas: HTMLCanvasElement, opsi: OpsiPenggambar): PenggambarSkeleton {
  const ctx = canvas.getContext('2d');
  let halus: Float32Array | null = null; // x,y per landmark dalam piksel kanvas
  const terlihat = new Uint8Array(33);

  function sesuaikanUkuran(): { w: number; h: number; dpr: number } {
    const dpr = Math.min(DPR_MAKS, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      halus = null;
    }
    return { w, h, dpr };
  }

  function bersihkan(): void {
    halus = null;
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function gambar(frame: PoseFrame | null, lebarVideo: number, tinggiVideo: number, titikAktif: readonly number[]): void {
    if (!ctx) return;
    const { w, h, dpr } = sesuaikanUkuran();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!frame || lebarVideo === 0 || tinggiVideo === 0 || w === 0 || h === 0) {
      halus = null;
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Peta koordinat ternormalisasi -> piksel CSS, mengikuti object-fit video.
    const skala = opsi.isi === 'cover' ? Math.max(w / lebarVideo, h / tinggiVideo) : Math.min(w / lebarVideo, h / tinggiVideo);
    const lebarTampil = lebarVideo * skala;
    const tinggiTampil = tinggiVideo * skala;
    const geserX = (w - lebarTampil) / 2;
    const geserY = (h - tinggiTampil) / 2;

    const lm = frame.landmarks;
    const n = Math.min(33, lm.length);
    const baru = halus === null;
    if (baru) halus = new Float32Array(66);
    const pos = halus!;
    for (let i = 0; i < n; i++) {
      const l = lm[i];
      let x = geserX + l.x * lebarTampil;
      if (opsi.cermin) x = w - x;
      const y = geserY + l.y * tinggiTampil;
      terlihat[i] = (l.visibility ?? 1) >= AMBANG_TERLIHAT ? 1 : 0;
      if (baru) {
        pos[i * 2] = x;
        pos[i * 2 + 1] = y;
      } else {
        pos[i * 2] += PENGHALUS * (x - pos[i * 2]);
        pos[i * 2 + 1] += PENGHALUS * (y - pos[i * 2 + 1]);
      }
    }

    const tebal = Math.max(3, Math.min(w, h) / 90);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Tepi gelap dulu agar garis terbaca di latar terang maupun gelap.
    ctx.beginPath();
    for (const [a, b] of POSE_CONNECTIONS) {
      if (a < INDEKS_TUBUH_PERTAMA || b < INDEKS_TUBUH_PERTAMA || a >= n || b >= n) continue;
      if (!terlihat[a] || !terlihat[b]) continue;
      ctx.moveTo(pos[a * 2], pos[a * 2 + 1]);
      ctx.lineTo(pos[b * 2], pos[b * 2 + 1]);
    }
    ctx.strokeStyle = WARNA_TEPI;
    ctx.lineWidth = tebal + 3;
    ctx.stroke();
    ctx.strokeStyle = WARNA_GARIS;
    ctx.lineWidth = tebal;
    ctx.stroke();

    const r = tebal * 0.9;
    for (let i = INDEKS_TUBUH_PERTAMA; i < n; i++) {
      if (!terlihat[i] || titikAktif.includes(i)) continue;
      ctx.beginPath();
      ctx.arc(pos[i * 2], pos[i * 2 + 1], r, 0, Math.PI * 2);
      ctx.fillStyle = WARNA_SENDI;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = WARNA_SENDI_TEPI;
      ctx.stroke();
    }
    // Sendi aktif digambar terakhir dan lebih besar, warna aksen.
    for (const i of titikAktif) {
      if (i >= n || !terlihat[i]) continue;
      ctx.beginPath();
      ctx.arc(pos[i * 2], pos[i * 2 + 1], r * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = WARNA_AKSEN;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  }

  return { gambar, bersihkan };
}
