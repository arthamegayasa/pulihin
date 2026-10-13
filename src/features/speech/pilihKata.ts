import type { Kata, KategoriKata } from './types';
import { getKata, KATA, kataPerKategori } from './wordBank';

/** Satu sesi afasia berisi 10 kata (Bab 8.2). */
export const JUMLAH_KATA_SESI = 10;

export interface RiwayatAfasia {
  /** id kata yang pernah dinilai Benar oleh pasien ini. */
  kataBenar: ReadonlySet<string>;
  /** `kataUlang` dari sesi afasia selesai terakhir. */
  kataUlang: readonly string[];
}

export interface OpsiPilihKata {
  /** null = Latihan Hari Ini (campuran semua kategori). */
  kategori: KategoriKata | null;
  riwayat: RiwayatAfasia;
  /** Benih acak agar susunan stabil dalam satu hari, mis. tanggal hari ini. */
  benih: string;
  jumlah?: number;
}

/** Acak stabil (Fisher-Yates dengan mulberry32 dari hash benih). */
function acakStabil<T>(daftar: readonly T[], benih: string): T[] {
  let h = 1779033703 ^ benih.length;
  for (let i = 0; i < benih.length; i++) {
    h = Math.imul(h ^ benih.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const acak = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hasil = [...daftar];
  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

/**
 * Pilih kata untuk satu sesi. Prioritas: kata untuk diulang dari sesi terakhir, lalu kata yang belum
 * pernah Benar, lalu kata yang sudah lancar. Hasil diurutkan dari tingkat paling mudah agar sesi
 * dimulai dengan keberhasilan kecil.
 */
export function pilihKataSesi({ kategori, riwayat, benih, jumlah = JUMLAH_KATA_SESI }: OpsiPilihKata): Kata[] {
  const kolam = kategori ? kataPerKategori(kategori) : KATA;
  const diKolam = new Set(kolam.map((k) => k.id));
  const ulang = [...new Set(riwayat.kataUlang)]
    .filter((id) => diKolam.has(id))
    .map((id) => getKata(id))
    .filter((k): k is Kata => k !== undefined);
  const sudahUlang = new Set(ulang.map((k) => k.id));
  const sisa = acakStabil(kolam, benih)
    .filter((k) => !sudahUlang.has(k.id))
    .sort((a, b) => a.tingkat - b.tingkat);
  const belumLancar = sisa.filter((k) => !riwayat.kataBenar.has(k.id));
  const sudahLancar = sisa.filter((k) => riwayat.kataBenar.has(k.id));
  return [...ulang, ...belumLancar, ...sudahLancar].slice(0, jumlah).sort((a, b) => a.tingkat - b.tingkat);
}
