import type { HasilKata } from '@/types';
import type { Kata } from './types';

/**
 * Penilaian ucapan afasia (Bab 8.3). Semua ambang ada di satu objek konfigurasi agar mudah disetel
 * tanpa mengubah logika.
 */
export interface KonfigPenilaian {
  /** Panjang minimum kata target (huruf, tanpa spasi) agar salah sedikit masih dianggap Benar. */
  panjangMinToleransi: number;
  /** Jarak edit (Levenshtein) maksimum yang masih Benar untuk kata panjang. */
  jarakEditMaks: number;
  /** Kemiripan 0..1 minimum untuk Hampir. */
  ambangHampir: number;
  /**
   * Panjang minimum awalan pada aturan "suku kata awal benar". Bila suku kata pertama lebih pendek
   * (mis. 'a' pada a-yam), awalan diperpanjang dengan huruf suku berikutnya ('ay') agar kata acak
   * yang kebetulan berawalan sama tidak langsung dianggap Hampir.
   */
  panjangMinSukuAwal: number;
  /** Batas percobaan per kata. */
  maksPercobaan: number;
  skor: { benarPertama: number; benarBerikutnya: number; hampir: number; belum: number };
}

export const KONFIG_PENILAIAN: KonfigPenilaian = {
  panjangMinToleransi: 6,
  jarakEditMaks: 1,
  ambangHampir: 0.6,
  panjangMinSukuAwal: 2,
  maksPercobaan: 3,
  skor: { benarPertama: 100, benarBerikutnya: 70, hampir: 40, belum: 0 },
};

/** Huruf kecil, buang diakritik dan tanda baca, rapikan spasi. */
export function normalisasi(teks: string): string {
  return teks
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function jarakLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let sebelum = Array.from({ length: b.length + 1 }, (_, j) => j);
  let kini = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    kini[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const ganti = a[i - 1] === b[j - 1] ? 0 : 1;
      kini[j] = Math.min(sebelum[j] + 1, kini[j - 1] + 1, sebelum[j - 1] + ganti);
    }
    [sebelum, kini] = [kini, sebelum];
  }
  return sebelum[b.length];
}

export interface HasilPenilaian {
  hasil: HasilKata;
  /** Transkrip asli dari alternatif yang menang ('' bila tidak ada yang terdengar). */
  teks: string;
  /** Kemiripan terbaik 0..1 setelah normalisasi. */
  kemiripan: number;
}

export type TargetPenilaian = Pick<Kata, 'kata' | 'sukuKata' | 'varian'>;

const PERINGKAT: Record<HasilKata, number> = { benar: 2, hampir: 1, belum: 0 };

function nilaiSatuFrasa(target: TargetPenilaian, frasa: string, k: KonfigPenilaian): Omit<HasilPenilaian, 'teks'> {
  const p = normalisasi(frasa);
  if (!p) return { hasil: 'belum', kemiripan: 0 };
  const tokenFrasa = p.split(' ');
  const bentukDiterima = [target.kata, ...(target.varian ?? [])].map(normalisasi).filter(Boolean);

  let kemiripan = 0;
  for (const bentuk of bentukDiterima) {
    const n = bentuk.split(' ').length;
    const padat = bentuk.replaceAll(' ', '');
    // Kandidat: seluruh frasa, lalu setiap potongan token sepanjang target ("itu kursi" → "kursi").
    const kandidat = [p];
    for (let i = 0; i + n <= tokenFrasa.length; i++) kandidat.push(tokenFrasa.slice(i, i + n).join(' '));
    for (const c of kandidat) {
      const jarak = jarakLevenshtein(c.replaceAll(' ', ''), padat);
      if (jarak === 0) return { hasil: 'benar', kemiripan: 1 };
      if (padat.length >= k.panjangMinToleransi && jarak <= k.jarakEditMaks) {
        return { hasil: 'benar', kemiripan: 1 - jarak / Math.max(padat.length, c.length) };
      }
      kemiripan = Math.max(kemiripan, 1 - jarak / Math.max(padat.length, c.replaceAll(' ', '').length));
    }
  }
  if (kemiripan >= k.ambangHampir) return { hasil: 'hampir', kemiripan };

  const [suku1 = '', suku2 = ''] = target.sukuKata.map(normalisasi);
  const awalan = suku1.length >= k.panjangMinSukuAwal ? suku1 : (suku1 + suku2).slice(0, k.panjangMinSukuAwal);
  if (awalan && tokenFrasa.some((t) => t.startsWith(awalan))) return { hasil: 'hampir', kemiripan };
  return { hasil: 'belum', kemiripan };
}

/**
 * Nilai satu percobaan terhadap SEMUA alternatif dari pengenal suara; alternatif terbaik menang
 * (Benar > Hampir > Belum, lalu kemiripan tertinggi).
 */
export function nilaiUcapan(
  target: TargetPenilaian,
  alternatif: readonly string[],
  k: KonfigPenilaian = KONFIG_PENILAIAN,
): HasilPenilaian {
  let terbaik: HasilPenilaian = { hasil: 'belum', teks: alternatif.find((a) => a.trim()) ?? '', kemiripan: 0 };
  for (const teks of alternatif) {
    const h = nilaiSatuFrasa(target, teks, k);
    const lebihBaik =
      PERINGKAT[h.hasil] > PERINGKAT[terbaik.hasil] ||
      (PERINGKAT[h.hasil] === PERINGKAT[terbaik.hasil] && h.kemiripan > terbaik.kemiripan);
    if (lebihBaik) terbaik = { ...h, teks: teks.trim() };
    if (terbaik.hasil === 'benar' && terbaik.kemiripan === 1) break;
  }
  return terbaik;
}

/** Skor satu percobaan: 100 Benar pada percobaan pertama, 70 Benar sesudahnya, 40 Hampir, 0 Belum. */
export function skorPercobaan(hasil: HasilKata, nomorPercobaan: number, k: KonfigPenilaian = KONFIG_PENILAIAN): number {
  if (hasil === 'benar') return nomorPercobaan <= 1 ? k.skor.benarPertama : k.skor.benarBerikutnya;
  return hasil === 'hampir' ? k.skor.hampir : k.skor.belum;
}

/** Skor sesi = rata-rata skor akhir tiap kata, dibulatkan (0 bila kosong). */
export function skorSesi(skorPerKata: readonly number[]): number {
  if (skorPerKata.length === 0) return 0;
  return Math.round(skorPerKata.reduce((a, b) => a + b, 0) / skorPerKata.length);
}

export interface PercobaanRingkas {
  kataId: string;
  kategoriHasil: HasilKata;
  nomorPercobaan: number;
}

export interface HasilAkhirKata {
  kataId: string;
  hasil: HasilKata;
  skor: number;
}

/**
 * Hasil akhir satu kata dari semua percobaannya: Benar bila salah satu percobaan Benar (skor dari
 * percobaan Benar pertama), selain itu hasil terbaik yang pernah dicapai. Kata yang dilewati tanpa
 * percobaan dihitung Belum.
 */
export function hasilAkhirKata(
  kataId: string,
  percobaan: readonly PercobaanRingkas[],
  k: KonfigPenilaian = KONFIG_PENILAIAN,
): HasilAkhirKata {
  let terbaik: HasilAkhirKata = { kataId, hasil: 'belum', skor: k.skor.belum };
  for (const p of percobaan) {
    if (p.kataId !== kataId) continue;
    const skor = skorPercobaan(p.kategoriHasil, p.nomorPercobaan, k);
    if (skor > terbaik.skor || PERINGKAT[p.kategoriHasil] > PERINGKAT[terbaik.hasil]) {
      terbaik = { kataId, hasil: p.kategoriHasil, skor };
    }
  }
  return terbaik;
}

export interface RingkasanSesiKata {
  benar: number;
  hampir: number;
  belum: number;
  /** Kata Hampir dan Belum, urut sesuai sesi: disarankan diulang besok. */
  kataUlang: string[];
  skor: number;
  perKata: HasilAkhirKata[];
}

/** Ringkas satu sesi 10 kata dari seluruh percobaannya (Bab 8.2 langkah 5). */
export function ringkasSesi(
  kataIds: readonly string[],
  percobaan: readonly PercobaanRingkas[],
  k: KonfigPenilaian = KONFIG_PENILAIAN,
): RingkasanSesiKata {
  const perKata = kataIds.map((id) => hasilAkhirKata(id, percobaan, k));
  return {
    benar: perKata.filter((h) => h.hasil === 'benar').length,
    hampir: perKata.filter((h) => h.hasil === 'hampir').length,
    belum: perKata.filter((h) => h.hasil === 'belum').length,
    kataUlang: perKata.filter((h) => h.hasil !== 'benar').map((h) => h.kataId),
    skor: skorSesi(perKata.map((h) => h.skor)),
    perKata,
  };
}
