/**
 * Alat bantu uji akurasi hitung repetisi (Bab 7.4, AC-F1-2) untuk Mode Uji.
 * Penguji mengetuk sekali per repetisi nyata; setiap hitungan otomatis dipasangkan dengan ketukan
 * terdekat dalam jendela waktu. Pemasangan global terdekat-dulu, tiap ketukan/hitungan dipakai sekali.
 */

export interface PasanganRepetisi {
  manualMs: number;
  otomatisMs: number;
  selisihMs: number;
}

export interface HasilAkurasi {
  manual: number;
  otomatis: number;
  /** Hitungan otomatis yang cocok dengan repetisi nyata. */
  benar: number;
  /** Hitungan otomatis tanpa pasangan repetisi nyata (hitungan ganda / berlebih). */
  ganda: number;
  /** Repetisi nyata tanpa hitungan otomatis (hilang). */
  hilang: number;
  /** benar / (manual + ganda) x 100; null bila belum ada data. */
  akurasiPersen: number | null;
  pasangan: PasanganRepetisi[];
}

export const JENDELA_COCOK_MS = 1500;

export function hitungAkurasi(manual: readonly number[], otomatis: readonly number[], jendelaMs = JENDELA_COCOK_MS): HasilAkurasi {
  const kandidat: { m: number; o: number; d: number }[] = [];
  for (let m = 0; m < manual.length; m++) {
    for (let o = 0; o < otomatis.length; o++) {
      const d = Math.abs(manual[m] - otomatis[o]);
      if (d <= jendelaMs) kandidat.push({ m, o, d });
    }
  }
  kandidat.sort((a, b) => a.d - b.d || a.m - b.m || a.o - b.o);
  const mDipakai = new Uint8Array(manual.length);
  const oDipakai = new Uint8Array(otomatis.length);
  const pasangan: PasanganRepetisi[] = [];
  for (const k of kandidat) {
    if (mDipakai[k.m] || oDipakai[k.o]) continue;
    mDipakai[k.m] = 1;
    oDipakai[k.o] = 1;
    pasangan.push({ manualMs: manual[k.m], otomatisMs: otomatis[k.o], selisihMs: otomatis[k.o] - manual[k.m] });
  }
  pasangan.sort((a, b) => a.manualMs - b.manualMs);
  const benar = pasangan.length;
  const ganda = otomatis.length - benar;
  const hilang = manual.length - benar;
  const pembagi = manual.length + ganda;
  return {
    manual: manual.length,
    otomatis: otomatis.length,
    benar,
    ganda,
    hilang,
    akurasiPersen: pembagi === 0 ? null : Math.round((benar / pembagi) * 1000) / 10,
    pasangan,
  };
}
