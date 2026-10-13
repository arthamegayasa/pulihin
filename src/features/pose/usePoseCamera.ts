import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { klasifikasiGalatKamera, matikanKamera, mintaKamera, pasangKeVideo, type JenisGalatKamera } from './camera';
import { detectPose, preloadPoseEngine, resetPoseStats } from './PoseEngine';
import { buatPenggambarSkeleton, type OpsiPenggambar } from './SkeletonOverlay';
import type { PoseFrame } from './types';

export type StatusKamera =
  | { tahap: 'siaga' }
  | { tahap: 'menyiapkan' }
  | { tahap: 'berjalan' }
  | { tahap: 'galat-kamera'; jenis: JenisGalatKamera }
  | { tahap: 'galat-model' }
  | { tahap: 'berhenti' };

export interface OpsiPoseCamera {
  /** Kamera & model dinyalakan saat true. */
  aktif: boolean;
  /**
   * Dipanggil sekali per frame yang diproses. `frame` null = tidak ada tubuh.
   * Kembalikan indeks landmark yang disorot (titikAktif) untuk overlay.
   */
  onFrame: (frame: PoseFrame | null, t: number) => readonly number[];
  tampilan?: Partial<OpsiPenggambar>;
}

export interface PoseCamera {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  status: StatusKamera;
  /** Coba lagi setelah galat atau setelah berhenti. */
  ulangi: () => void;
  /** Matikan kamera & loop secara sinkron (AC-F1-7). */
  hentikan: () => void;
  /** Rasio lebar/tinggi gambar kamera (null sampai kamera memberi frame). Untuk menyesuaikan kotak video. */
  rasio: number | null;
}

const TANPA_TITIK: readonly number[] = [];

/**
 * Siklus hidup kamera + MediaPipe + loop frame untuk Sesi Kamera dan Mode Uji.
 * - Kamera dan model dimuat paralel; model biasanya sudah hangat dari Detail Latihan.
 * - Loop memakai requestVideoFrameCallback (satu panggilan per frame kamera baru) atau rAF sebagai cadangan.
 * - Frame dilewati bila inferensi sebelumnya belum selesai atau tab tersembunyi.
 * - Kamera dimatikan saat berhenti, unmount, atau pagehide; dinyalakan lagi bila halaman dipulihkan dari bfcache.
 */
export function usePoseCamera({ aktif, onFrame, tampilan }: OpsiPoseCamera): PoseCamera {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const hentikanRef = useRef<() => void>(() => {});
  const [percobaan, setPercobaan] = useState(0);
  const [status, setStatus] = useState<StatusKamera>({ tahap: 'siaga' });
  const [rasio, setRasio] = useState<number | null>(null);
  const cermin = tampilan?.cermin ?? true;
  // Bawaan 'contain': seluruh gambar yang dilihat model tampil (tidak ada anggota tubuh terpotong).
  const isi = tampilan?.isi ?? 'contain';

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!aktif || !video || !canvas) return;

    let hidup = true;
    let stream: MediaStream | null = null;
    let jalan = false;
    let handle = 0;
    let sibuk = false;
    let waktuVideoTerakhir = -1;
    const pakaiRvfc = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
    const penggambar = buatPenggambarSkeleton(canvas, { cermin, isi });

    const jadwalkan = () => {
      handle = pakaiRvfc ? video.requestVideoFrameCallback(langkah) : requestAnimationFrame(langkah);
    };
    function langkah() {
      if (!jalan) return;
      jadwalkan();
      if (sibuk || document.hidden || video!.readyState < 2) return;
      if (!pakaiRvfc) {
        // rAF berjalan 60 Hz; proses hanya bila kamera memberi frame baru.
        if (video!.currentTime === waktuVideoTerakhir) return;
        waktuVideoTerakhir = video!.currentTime;
      }
      sibuk = true;
      try {
        const t = performance.now();
        const frame = detectPose(video!, t);
        const titik = onFrameRef.current(frame, t);
        if (jalan) penggambar.gambar(frame, video!.videoWidth, video!.videoHeight, titik ?? TANPA_TITIK);
      } catch (e) {
        console.error('Frame pose gagal diproses', e);
      } finally {
        sibuk = false;
      }
    }

    const hentikanLoop = () => {
      if (!jalan) return;
      jalan = false;
      if (pakaiRvfc) video.cancelVideoFrameCallback(handle);
      else cancelAnimationFrame(handle);
    };
    const hentikanSemua = () => {
      hidup = false;
      hentikanLoop();
      matikanKamera(stream, video);
      stream = null;
      penggambar.bersihkan();
    };
    hentikanRef.current = () => {
      hentikanSemua();
      setStatus({ tahap: 'berhenti' });
    };

    // Ukuran gambar kamera bisa berubah (ponsel diputar): kotak video ikut menyesuaikan.
    const saatUkuran = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) setRasio(video.videoWidth / video.videoHeight);
    };
    setStatus({ tahap: 'menyiapkan' });
    const model = preloadPoseEngine();
    model.catch(() => {}); // ditangani di bawah; cegah unhandled rejection bila kamera gagal duluan

    void (async () => {
      let s: MediaStream;
      try {
        s = await mintaKamera();
      } catch (e) {
        if (hidup) setStatus({ tahap: 'galat-kamera', jenis: klasifikasiGalatKamera(e) });
        return;
      }
      if (!hidup) {
        // Efek sudah dibersihkan selama izin ditanyakan: matikan tanpa menyentuh elemen video yang mungkin dipakai efek baru.
        matikanKamera(s);
        return;
      }
      stream = s;
      try {
        await pasangKeVideo(video, s);
      } catch (e) {
        if (hidup) {
          hentikanSemua();
          setStatus({ tahap: 'galat-kamera', jenis: klasifikasiGalatKamera(e) });
        }
        return;
      }
      if (!hidup) return;
      saatUkuran();
      try {
        await model;
      } catch (e) {
        console.error('Model pose gagal dimuat', e);
        if (hidup) {
          hentikanSemua();
          setStatus({ tahap: 'galat-model' });
        }
        return;
      }
      if (!hidup) return;
      resetPoseStats();
      jalan = true;
      setStatus({ tahap: 'berjalan' });
      jadwalkan();
    })();

    const saatTerlihat = () => {
      // Sebagian browser menjeda video saat tab disembunyikan; lanjutkan saat kembali.
      if (!document.hidden && jalan && video.paused) void video.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', saatTerlihat);
    video.addEventListener('resize', saatUkuran);
    video.addEventListener('loadedmetadata', saatUkuran);

    return () => {
      document.removeEventListener('visibilitychange', saatTerlihat);
      video.removeEventListener('resize', saatUkuran);
      video.removeEventListener('loadedmetadata', saatUkuran);
      hentikanSemua();
    };
  }, [aktif, percobaan, cermin, isi]);

  // Tab ditutup / halaman ditinggalkan: matikan kamera seketika. Dipulihkan dari bfcache: nyalakan lagi.
  useEffect(() => {
    const saatPergi = () => hentikanRef.current();
    const saatKembali = (e: PageTransitionEvent) => {
      if (e.persisted) setPercobaan((n) => n + 1);
    };
    window.addEventListener('pagehide', saatPergi);
    window.addEventListener('pageshow', saatKembali);
    return () => {
      window.removeEventListener('pagehide', saatPergi);
      window.removeEventListener('pageshow', saatKembali);
    };
  }, []);

  const ulangi = useCallback(() => setPercobaan((n) => n + 1), []);
  const hentikan = useCallback(() => hentikanRef.current(), []);

  return { videoRef, canvasRef, status, ulangi, hentikan, rasio };
}
