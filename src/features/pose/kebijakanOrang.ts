import { ATURAN_UMUM } from './exerciseDefinitions';

/**
 * Kebijakan jumlah orang adaptif untuk PoseLandmarker (fungsi murni, diuji tanpa browser).
 *
 * Deteksi 2 orang menahan anggota keluarga di latar agar tidak "mencuri" kerangka, tetapi biayanya
 * hampir 2x inferensi. Bila perangkat terlalu lambat, kecepatan didahulukan (Bab 1.2, 17.4): turun ke
 * 1 orang. Pemilihan orang utama yang lengket tetap berjalan di kedua mode. Angka: `ATURAN_UMUM.adaptifOrang`.
 */

export type JumlahOrang = 1 | 2;

export interface SampelKinerja {
  /** performance.now() saat sampel diambil, ms. */
  t: number;
  /** Frame yang diproses per detik (rata-rata eksponensial). */
  fps: number;
  /** Lama satu inferensi, ms (rata-rata eksponensial). */
  inferensiMs: number;
}

export interface StatusKebijakanOrang {
  jumlahOrang: JumlahOrang;
  /** Awal deret sampel lambat tanpa putus (ms), null bila sampel terakhir tidak lambat. */
  lambatSejak: number | null;
  /** Awal deret sampel lapang tanpa putus (ms), hanya dipakai saat 1 orang. */
  lapangSejak: number | null;
  /** Sampel sebelum waktu ini diabaikan (pemanasan sesi / sesudah berganti mode). */
  abaikanSampai: number;
  /** Sudah pernah naik kembali ke 2 orang. */
  pernahNaik: boolean;
  /** Turun lagi setelah pernah naik: tetap 1 orang selama aplikasi terbuka (anti bolak-balik). */
  terkunci: boolean;
  /** Sebab perubahan terakhir, untuk Mode Uji. */
  alasan: 'awal' | 'lambat' | 'lapang';
}

export type AturanAdaptifOrang = typeof ATURAN_UMUM.adaptifOrang;

export function statusAwalKebijakan(): StatusKebijakanOrang {
  return {
    jumlahOrang: 2,
    lambatSejak: null,
    lapangSejak: null,
    abaikanSampai: 0,
    pernahNaik: false,
    terkunci: false,
    alasan: 'awal',
  };
}

/** Sesi baru: deret diatur ulang, mode dan kunci dipertahankan (kemampuan perangkat tidak berubah). */
export function mulaiSesiKebijakan(
  s: StatusKebijakanOrang,
  t: number,
  aturan: AturanAdaptifOrang = ATURAN_UMUM.adaptifOrang,
): StatusKebijakanOrang {
  return { ...s, lambatSejak: null, lapangSejak: null, abaikanSampai: t + aturan.tenangDetik * 1000 };
}

/** Sampel lambat: inferensi terlalu lama, atau fps rendah yang memang disebabkan inferensi. */
export function sampelLambat(x: SampelKinerja, aturan: AturanAdaptifOrang = ATURAN_UMUM.adaptifOrang): boolean {
  if (x.inferensiMs > aturan.inferensiMaksMs) return true;
  return x.fps > 0 && x.fps < aturan.fpsMin && (x.inferensiMs * x.fps) / 1000 >= aturan.porsiInferensiMin;
}

/** Sampel lapang (saat 1 orang): perkiraan biaya 2 orang masih jauh di bawah anggaran frame. */
export function sampelLapang(x: SampelKinerja, aturan: AturanAdaptifOrang = ATURAN_UMUM.adaptifOrang): boolean {
  return x.fps >= aturan.fpsLapang && x.inferensiMs * aturan.faktorBiayaDuaOrang <= aturan.inferensiLapangMs;
}

/** Satu langkah kebijakan per frame. Mengembalikan objek yang sama bila tidak ada perubahan. */
export function langkahKebijakan(
  s: StatusKebijakanOrang,
  x: SampelKinerja,
  aturan: AturanAdaptifOrang = ATURAN_UMUM.adaptifOrang,
): StatusKebijakanOrang {
  if (x.t < s.abaikanSampai || x.fps <= 0) return s;
  const tenang = x.t + aturan.tenangDetik * 1000;

  if (s.jumlahOrang === 2) {
    if (!sampelLambat(x, aturan)) return s.lambatSejak === null ? s : { ...s, lambatSejak: null };
    const sejak = s.lambatSejak ?? x.t;
    if (x.t - sejak < aturan.turunSetelahDetik * 1000) return s.lambatSejak === sejak ? s : { ...s, lambatSejak: sejak };
    return {
      ...s,
      jumlahOrang: 1,
      lambatSejak: null,
      lapangSejak: null,
      abaikanSampai: tenang,
      terkunci: s.pernahNaik,
      alasan: 'lambat',
    };
  }

  if (s.terkunci || !sampelLapang(x, aturan)) return s.lapangSejak === null ? s : { ...s, lapangSejak: null };
  const sejak = s.lapangSejak ?? x.t;
  if (x.t - sejak < aturan.naikSetelahDetik * 1000) return s.lapangSejak === sejak ? s : { ...s, lapangSejak: sejak };
  return {
    ...s,
    jumlahOrang: 2,
    lambatSejak: null,
    lapangSejak: null,
    abaikanSampai: tenang,
    pernahNaik: true,
    alasan: 'lapang',
  };
}
