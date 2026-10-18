/**
 * Kontrak `video/data/sesi-meta.json` (dibuat scripts/rekam-sesi.mjs dari teks layar aplikasi asli).
 * Semua waktu = detik di dalam `layar-02-sesi-tekuk-siku.mp4`, diambil saat angka hitungan berubah atau
 * pesan muncul di aplikasi.
 */
export interface SesiMeta {
  fps: number;
  durasiDetik: number;
  berkas: { layar: string };
  /** Detik getUserMedia (aliran kamera palsu mulai = detik 0 video POV). */
  kameraMulaiDetik: number;
  siapDetik: number;
  repetisiDetik: number[];
  koreksi: { teks: string; mulaiDetik: number; selesaiDetik: number }[];
  selesaiDetik: number;
  ringkasanDetik: number;
}

/** Satu klip suara aplikasi yang berbunyi saat rekaman (video/data/suara-aplikasi.json). */
export interface KlipTercatat {
  /** Nama berkas di public/suara/ aplikasi. */
  klip: string;
  /** Detik di dalam rekaman saat klip mulai berbunyi (event playing). */
  detik: number;
  /** Posisi awal di dalam klip (detik). */
  mulaiKlip: number;
  /** Lama berbunyi sampai pause/ended (disela aplikasi = lebih pendek dari klip). */
  lama: number;
  /** Teks segmen dari katalog aplikasi (src/features/suara/katalogSuara.json). */
  teks: string | null;
}
