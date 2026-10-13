import type { NamaTitik, Posisi, SendiTarget } from './types';

/** Label tampilan Bahasa Indonesia untuk data latihan. */
export const LABEL_POSISI: Record<Posisi, string> = {
  duduk: 'Duduk',
  'berdiri-berpegangan': 'Berdiri berpegangan',
  'duduk-ke-berdiri': 'Duduk ke berdiri',
};

export const LABEL_SENDI: Record<SendiTarget, string> = {
  bahu: 'Bahu',
  siku: 'Siku',
  lutut: 'Lutut',
  pinggul: 'Pinggul',
  'pergelangan-kaki': 'Pergelangan kaki',
  'batang-tubuh': 'Batang tubuh',
};

export function labelSendi(sendi: readonly SendiTarget[]): string {
  return sendi.map((s, i) => (i === 0 ? LABEL_SENDI[s] : LABEL_SENDI[s].toLowerCase())).join(' dan ');
}

const LABEL_TITIK: Record<NamaTitik, string> = {
  hidung: 'kepala',
  telinga: 'kepala',
  bahu: 'bahu',
  siku: 'siku',
  pergelangan: 'pergelangan tangan',
  pinggul: 'pinggul',
  lutut: 'lutut',
  'pergelangan-kaki': 'pergelangan kaki',
  tumit: 'tumit',
  'ujung-kaki': 'ujung kaki',
};

/** "bahu, siku, dan pergelangan tangan" untuk petunjuk agar titik kunci terlihat kamera. */
export function daftarTitik(titik: readonly NamaTitik[]): string {
  const unik = [...new Set(titik.map((t) => LABEL_TITIK[t]))];
  if (unik.length <= 1) return unik.join('');
  if (unik.length === 2) return `${unik[0]} dan ${unik[1]}`;
  return `${unik.slice(0, -1).join(', ')}, dan ${unik[unik.length - 1]}`;
}

const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];

/** Angka 1..999 sebagai kata Bahasa Indonesia berhuruf awal kapital, untuk hitungan suara: 'Satu', 'Dua belas'. */
export function angkaKeKata(n: number): string {
  const kata = (x: number): string => {
    if (x < 10) return SATUAN[x];
    if (x === 10) return 'sepuluh';
    if (x === 11) return 'sebelas';
    if (x < 20) return `${SATUAN[x - 10]} belas`;
    if (x < 100) {
      const sisa = x % 10;
      return `${SATUAN[Math.floor(x / 10)]} puluh${sisa ? ` ${SATUAN[sisa]}` : ''}`;
    }
    const ratus = Math.floor(x / 100);
    const sisa = x % 100;
    return `${ratus === 1 ? 'seratus' : `${SATUAN[ratus]} ratus`}${sisa ? ` ${kata(sisa)}` : ''}`;
  };
  const bulat = Math.round(n);
  if (bulat <= 0 || bulat > 999) return String(bulat);
  const hasil = kata(bulat);
  return hasil.charAt(0).toUpperCase() + hasil.slice(1);
}
