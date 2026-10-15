/**
 * Pembentuk isyarat (cue) subtitle dari timeline.ts. Dipakai oleh CaptionTrack
 * (subtitle tertanam) dan scripts/build-srt.mjs (berkas SRT), sehingga
 * keduanya selalu identik.
 */
import { ADEGAN, type Adegan, type BarisNarasi } from './timeline.ts';

export type Bahasa = 'id' | 'en';

export interface Isyarat {
  nomor: number;
  mulai: number;
  selesai: number;
  baris: string[];
  barisNarasiId: string;
  adeganId: string;
}

export const MAKS_KARAKTER_BARIS = 42;
export const MAKS_BARIS = 2;
export const MIN_DETIK_ISYARAT = 1;
export const MAKS_DETIK_ISYARAT = 6;
const JARAK_ANTAR_ISYARAT = 0.04;
const MAKS_KARAKTER_ISYARAT = MAKS_KARAKTER_BARIS * MAKS_BARIS;

/** Kata yang enak menjadi awal potongan baru (pemisahan frasa alami). */
const KATA_SAMBUNG = new Set([
  'and', 'but', 'or', 'so', 'then', 'without', 'with', 'for', 'from', 'that', 'when', 'while',
  'dan', 'atau', 'tetapi', 'lalu', 'tanpa', 'dengan', 'untuk', 'yang', 'bila', 'saat', 'sampai', 'supaya', 'agar',
  'dari', 'melainkan', 'mulai',
]);

const bulat = (n: number): number => Math.round(n * 1000) / 1000;

/** Bungkus teks menjadi maksimal 2 baris ≤ 42 karakter, seimbang. Null bila tidak muat. */
export const bungkus = (teks: string): string[] | null => {
  if (teks.length <= MAKS_KARAKTER_BARIS) return [teks];
  const kata = teks.split(' ');
  let terbaik: string[] | null = null;
  let biayaTerbaik = Infinity;
  for (let i = 1; i < kata.length; i++) {
    const a = kata.slice(0, i).join(' ');
    const b = kata.slice(i).join(' ');
    if (a.length > MAKS_KARAKTER_BARIS || b.length > MAKS_KARAKTER_BARIS) continue;
    // Utamakan pemisahan setelah tanda baca atau sebelum kata sambung, lalu keseimbangan.
    const bonus = /[,.:;!?]$/.test(a) ? 12 : KATA_SAMBUNG.has(kata[i].toLowerCase()) ? 8 : 0;
    const biaya = Math.abs(a.length - b.length) - bonus;
    if (biaya < biayaTerbaik) {
      biayaTerbaik = biaya;
      terbaik = [a, b];
    }
  }
  return terbaik;
};

const muat = (p: string): boolean => p.length <= MAKS_KARAKTER_ISYARAT && bungkus(p) !== null;

/**
 * Bagi deret kata menjadi `n` potongan yang muat, seimbang panjangnya, dan
 * sebisa mungkin terpotong di tanda baca atau sebelum kata sambung.
 */
const bagiN = (kata: string[], n: number, target: number): { bagian: string[]; biaya: number } | null => {
  if (n === 1) {
    const p = kata.join(' ');
    return muat(p) ? { bagian: [p], biaya: (p.length - target) ** 2 } : null;
  }
  let terbaik: { bagian: string[]; biaya: number } | null = null;
  for (let i = 1; i <= kata.length - (n - 1); i++) {
    const p = kata.slice(0, i).join(' ');
    if (!muat(p)) break;
    const sisa = bagiN(kata.slice(i), n - 1, target);
    if (!sisa) continue;
    const alami = /[,;:]$/.test(kata[i - 1]) || KATA_SAMBUNG.has(kata[i].toLowerCase());
    const biaya = (p.length - target) ** 2 - (alami ? target * target * 0.12 : 0) + sisa.biaya;
    if (!terbaik || biaya < terbaik.biaya) terbaik = { bagian: [p, ...sisa.bagian], biaya };
  }
  return terbaik;
};

const bagi = (teks: string, minimal: number): string[] => {
  const kata = teks.split(/\s+/);
  for (let n = Math.max(minimal, Math.ceil(teks.length / MAKS_KARAKTER_ISYARAT)); n <= kata.length; n++) {
    const hasil = bagiN(kata, n, teks.length / n);
    if (hasil) return hasil.bagian;
  }
  return kata;
};

/** Durasi per potongan sebanding panjang teks, dengan lantai MIN_DETIK_ISYARAT (+ jarak). */
const bagiDurasi = (potongan: string[], durasi: number): number[] => {
  const lantai = MIN_DETIK_ISYARAT + JARAK_ANTAR_ISYARAT + 0.01;
  const tetap = new Set<number>();
  for (;;) {
    const sisa = durasi - tetap.size * lantai;
    const bebas = potongan.reduce((s, p, i) => (tetap.has(i) ? s : s + p.length), 0);
    const d = potongan.map((p, i) => (tetap.has(i) ? lantai : (sisa * p.length) / bebas));
    const baru = d.findIndex((x, i) => !tetap.has(i) && x < lantai);
    if (baru === -1) return d;
    tetap.add(baru);
  }
};

/**
 * Pecah teks menjadi potongan per kalimat (masing-masing ≤ 2 baris), lalu
 * pecah lagi potongan yang akan tampil lebih dari 6 detik.
 */
export const pecah = (teks: string, durasi: number): { potongan: string[]; durasi: number[] } => {
  const potongan = teks
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .flatMap((k) => bagi(k, 1));
  for (;;) {
    const d = bagiDurasi(potongan, durasi);
    const terlalu = d.findIndex((x, i) => x > MAKS_DETIK_ISYARAT && potongan[i].includes(' '));
    if (terlalu === -1) return { potongan, durasi: d };
    potongan.splice(terlalu, 1, ...bagi(potongan[terlalu], 2));
  }
};

/** Rentang bicara satu baris narasi (detik absolut): dari durasi audio terukur di timeline.ts. */
export const rentangBicara = (_adegan: Adegan, baris: BarisNarasi): [number, number] => [baris.mulai, baris.selesai];

const isyaratBaris = (adegan: Adegan, baris: BarisNarasi, bahasa: Bahasa): Omit<Isyarat, 'nomor'>[] => {
  const [mulai, selesai] = rentangBicara(adegan, baris);
  const { potongan, durasi } = pecah(bahasa === 'id' ? baris.teksId : baris.teksEn, selesai - mulai);
  let t = mulai;
  return potongan.map((p, i) => {
    const baris2 = bungkus(p);
    if (!baris2) throw new Error(`Potongan tidak muat 2 baris: "${p}"`);
    const isyarat = {
      mulai: bulat(t),
      selesai: bulat(t + Math.min(durasi[i], MAKS_DETIK_ISYARAT)),
      baris: baris2,
      barisNarasiId: baris.id,
      adeganId: adegan.id,
    };
    t += durasi[i];
    return isyarat;
  });
};

export const buatIsyarat = (bahasa: Bahasa): Isyarat[] => {
  const semua = ADEGAN.flatMap((a) => a.narasi.flatMap((b) => isyaratBaris(a, b, bahasa)));
  semua.sort((x, y) => x.mulai - y.mulai);
  return semua.map((s, i) => {
    const berikut = semua[i + 1];
    const selesai =
      berikut && s.selesai > berikut.mulai - JARAK_ANTAR_ISYARAT ? bulat(berikut.mulai - JARAK_ANTAR_ISYARAT) : s.selesai;
    return { ...s, selesai, nomor: i + 1 };
  });
};

/** Periksa aturan keterbacaan. Mengembalikan daftar pelanggaran (kosong = lolos). */
export const periksaIsyarat = (isyarat: Isyarat[], batasDetik: number): string[] => {
  const salah: string[] = [];
  isyarat.forEach((s, i) => {
    const d = s.selesai - s.mulai;
    if (s.baris.length > MAKS_BARIS) salah.push(`#${s.nomor}: lebih dari ${MAKS_BARIS} baris`);
    for (const b of s.baris) {
      if (b.length > MAKS_KARAKTER_BARIS) salah.push(`#${s.nomor}: baris ${b.length} karakter > ${MAKS_KARAKTER_BARIS}`);
    }
    if (d < MIN_DETIK_ISYARAT - 1e-6) salah.push(`#${s.nomor}: durasi ${d.toFixed(2)} dtk < ${MIN_DETIK_ISYARAT}`);
    if (d > MAKS_DETIK_ISYARAT + 1e-6) salah.push(`#${s.nomor}: durasi ${d.toFixed(2)} dtk > ${MAKS_DETIK_ISYARAT}`);
    const berikut = isyarat[i + 1];
    if (berikut && s.selesai > berikut.mulai) salah.push(`#${s.nomor}: tumpang tindih dengan #${berikut.nomor}`);
    if (s.selesai > batasDetik) salah.push(`#${s.nomor}: berakhir ${s.selesai} > ${batasDetik}`);
  });
  return salah;
};

const waktuSrt = (detik: number): string => {
  const ms = Math.round(detik * 1000);
  const dua = (n: number) => String(n).padStart(2, '0');
  return `${dua(Math.floor(ms / 3_600_000))}:${dua(Math.floor((ms % 3_600_000) / 60_000))}:${dua(
    Math.floor((ms % 60_000) / 1000),
  )},${String(ms % 1000).padStart(3, '0')}`;
};

export const keSrt = (isyarat: Isyarat[]): string =>
  isyarat
    .map((s) => `${s.nomor}\r\n${waktuSrt(s.mulai)} --> ${waktuSrt(s.selesai)}\r\n${s.baris.join('\r\n')}\r\n`)
    .join('\r\n');

/** Isyarat yang aktif pada detik tertentu (untuk subtitle tertanam). */
export const isyaratPada = (isyarat: Isyarat[], detik: number): Isyarat | undefined =>
  isyarat.find((s) => detik >= s.mulai && detik < s.selesai);
