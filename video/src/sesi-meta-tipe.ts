/**
 * Kontrak `video/blender/out/sesi-meta.json` (dibuat agen Blender3D oleh rekam-sesi-3d.mjs).
 * Semua waktu = detik di dalam `layar-02-sesi-tekuk-siku.mp4` (sinkron frame-ke-frame dengan
 * `kamera-sesi-lebar.mp4`), diambil dari aplikasi asli saat angka hitungan berubah atau pesan muncul.
 */
export interface SesiMeta {
  fps: number;
  durasiDetik: number;
  berkas: { layar: string; lebar: string };
  siapDetik: number;
  repetisiDetik: number[];
  koreksi: { teks: string; mulaiDetik: number; selesaiDetik: number }[];
  selesaiDetik: number;
  ringkasanDetik: number;
  /** Opsional: detik setiap ketukan terskrip di layar-02 (untuk bunyi ketukan). */
  ketukanDetik?: number[];
}
