import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Sisi } from '@/types';

/**
 * Contoh gerakan: figur datar bersendi (kepala, leher, badan, lengan atas/bawah, tangan, paha, betis, telapak)
 * dengan titik sendi seperti yang dilihat kamera. Anggota tubuh yang bergerak berwarna aksen; lintasan
 * ujungnya (tangan/kaki) digambar putus-putus dengan panah arah.
 * Pose kunci per latihan adalah DATA (sudut segmen), dihitung ke koordinat dengan kinematika maju
 * dan, untuk tangan yang berpegangan, kinematika balik dua ruas.
 * Irama mengikuti tempo target latihan (rata-rata min..max), gerak halus (ease-in-out sinus) dengan jeda di tiap pose.
 * Gerak dikurangi (prefers-reduced-motion): dua pose statis Mulai & Puncak berdampingan.
 */

type V = [number, number];

const P = { badan: 46, leher: 7, kepala: 10.5, lenganAtas: 26, lenganBawah: 23, paha: 36, betis: 35, telapak: 14 };
const TANAH = 165;
const W_PRIMER = '#0b4f4a';
const W_JAUH = '#80a7a1';
const W_AKSEN = '#c46a1b';
const W_AKSEN_JAUH = '#e2ad7c';
const W_LATAR = '#eaf2f0';
const W_KURSI = '#b4cac6';
const W_KURSI_TUA = '#93b0ab';
const W_TANAH = '#cfe0dc';
/** Porsi tiap ruas waktu yang dipakai diam di pose kunci sebelum bergerak lagi. */
const PORSI_TAHAN = 0.22;

const rad = (d: number) => (d * Math.PI) / 180;
/** Arah segmen dari sudut terhadap garis tegak ke bawah; positif = ke depan (+x). */
const arahBawah = (d: number): V => [Math.sin(rad(d)), Math.cos(rad(d))];
const tambah = (a: V, b: V, s = 1): V => [a[0] + b[0] * s, a[1] + b[1] * s];

/* ---------- model pose ---------- */

/** Tampak samping, figur menghadap ke kanan. Sudut lengan/tungkai mutlak dari garis tegak ke bawah. */
interface PoseSamping {
  /** Posisi pinggul (akar 'pinggul') atau pergelangan kaki dekat (akar 'kaki'). */
  akar: V;
  /** Condong badan dari tegak, positif ke depan. */
  badan: number;
  lengan: V;
  lenganJauh: V;
  tungkai: V;
  tungkaiJauh: V;
  /** Sudut telapak di bawah garis datar; negatif = ujung kaki naik. */
  telapak: number;
  telapakJauh: number;
  /** Bila ada, kedua tangan berpegangan pada titik ini (kinematika balik). */
  tangan?: V;
}

/** Tampak depan. Sisi aktif digambar di kanan penonton (seperti cermin kamera). Sudut positif = menjauhi badan. */
interface PoseDepan {
  pinggulY: number;
  /** Putaran batang tubuh, derajat. */
  rotasi: number;
  lenganAktif: V;
  lenganLain: V;
  tungkaiAktif: number;
  tungkaiLain: number;
  /** Tangan sisi lain berpegangan di titik ini. */
  tanganLain?: V;
}

type BagianSamping = 'lengan' | 'lenganBawah' | 'tungkai' | 'betis' | 'tungkaiJauh' | 'telapak';
type BagianDepan = 'lenganAktif' | 'tungkaiAktif' | 'badan';
/** Titik yang lintasannya digambar dari pose Mulai ke Puncak. */
type Jejak = 'tangan' | 'kaki' | 'pinggul';

interface KonfigUmum {
  kursi: 'duduk' | 'pegangan' | null;
  /** Indeks pose puncak di kf. */
  puncak: number;
  /** Banyak repetisi dalam satu putaran kf (2 untuk latihan kiri-kanan bergantian). */
  repPerSiklus: 1 | 2;
  jejak?: Jejak;
}

type KonfigDemo =
  | (KonfigUmum & { tampak: 'samping'; akarDi: 'pinggul' | 'kaki'; aktif: BagianSamping[]; kf: PoseSamping[] })
  | (KonfigUmum & { tampak: 'depan'; duduk: boolean; aktif: BagianDepan[]; kf: PoseDepan[] });

const DUDUK_SAMPING: PoseSamping = {
  akar: [86, 124],
  badan: 0,
  lengan: [6, 10],
  lenganJauh: [-4, 2],
  tungkai: [90, 0],
  tungkaiJauh: [90, 0],
  telapak: 0,
  telapakJauh: 0,
};
const sampingDuduk = (ubah: Partial<PoseSamping> = {}): PoseSamping => ({ ...DUDUK_SAMPING, ...ubah });
const BERDIRI_SAMPING: PoseSamping = {
  ...DUDUK_SAMPING,
  akar: [98, 159],
  tungkai: [0, 0],
  tungkaiJauh: [0, 0],
  tangan: [124, 92],
};

const DUDUK_DEPAN: PoseDepan = { pinggulY: 120, rotasi: 0, lenganAktif: [5, 4], lenganLain: [5, 4], tungkaiAktif: 0, tungkaiLain: 0 };
const BERDIRI_DEPAN: PoseDepan = { ...DUDUK_DEPAN, pinggulY: 88, tanganLain: [62, 96] };
/** Lengan bersilang di dada untuk putaran badan. */
const SILANG: V = [18, -118];

/** Pose kunci per id latihan (exerciseDefinitions.ts). Indeks 0 = Mulai. */
const DEMO: Record<string, KonfigDemo> = {
  'fleksi-bahu': {
    tampak: 'samping',
    akarDi: 'pinggul',
    kursi: 'duduk',
    aktif: ['lengan'],
    kf: [sampingDuduk(), sampingDuduk({ lengan: [160, 164] })],
    puncak: 1,
    repPerSiklus: 1,
    jejak: 'tangan',
  },
  'fleksi-siku': {
    tampak: 'samping',
    akarDi: 'pinggul',
    kursi: 'duduk',
    aktif: ['lenganBawah'],
    kf: [sampingDuduk({ lengan: [2, 4] }), sampingDuduk({ lengan: [4, 146] })],
    puncak: 1,
    repPerSiklus: 1,
    jejak: 'tangan',
  },
  'abduksi-bahu': {
    tampak: 'depan',
    duduk: true,
    kursi: 'duduk',
    aktif: ['lenganAktif'],
    kf: [DUDUK_DEPAN, { ...DUDUK_DEPAN, lenganAktif: [90, 92] }],
    puncak: 1,
    repPerSiklus: 1,
    jejak: 'tangan',
  },
  'ekstensi-lutut': {
    tampak: 'samping',
    akarDi: 'pinggul',
    kursi: 'duduk',
    aktif: ['betis', 'telapak'],
    kf: [sampingDuduk(), sampingDuduk({ tungkai: [90, 82], telapak: -70 })],
    puncak: 1,
    repPerSiklus: 1,
    jejak: 'kaki',
  },
  'abduksi-pinggul': {
    tampak: 'depan',
    duduk: false,
    kursi: 'pegangan',
    aktif: ['tungkaiAktif'],
    kf: [BERDIRI_DEPAN, { ...BERDIRI_DEPAN, tungkaiAktif: 24 }],
    puncak: 1,
    repPerSiklus: 1,
    jejak: 'kaki',
  },
  'duduk-berdiri': {
    tampak: 'samping',
    akarDi: 'kaki',
    kursi: 'duduk',
    aktif: ['tungkai', 'tungkaiJauh'],
    kf: [
      sampingDuduk({ akar: [122, 159], badan: 6, lengan: [24, 50], lenganJauh: [24, 50] }),
      sampingDuduk({ akar: [122, 159], badan: 36, lengan: [40, 70], lenganJauh: [40, 70] }),
      sampingDuduk({ akar: [122, 159], badan: 0, tungkai: [0, 0], tungkaiJauh: [0, 0], lengan: [10, 20], lenganJauh: [10, 20] }),
      sampingDuduk({ akar: [122, 159], badan: 36, lengan: [40, 70], lenganJauh: [40, 70] }),
    ],
    puncak: 2,
    repPerSiklus: 1,
    jejak: 'pinggul',
  },
  jinjit: {
    tampak: 'samping',
    akarDi: 'kaki',
    kursi: 'pegangan',
    aktif: ['telapak'],
    kf: [BERDIRI_SAMPING, { ...BERDIRI_SAMPING, akar: [98, 151], telapak: 30, telapakJauh: 30 }],
    puncak: 1,
    repPerSiklus: 1,
  },
  menggapai: {
    tampak: 'samping',
    akarDi: 'pinggul',
    kursi: 'duduk',
    aktif: ['lengan'],
    kf: [sampingDuduk({ lengan: [10, 120] }), sampingDuduk({ badan: 16, lengan: [86, 90] })],
    puncak: 1,
    repPerSiklus: 1,
    jejak: 'tangan',
  },
  'putar-badan': {
    tampak: 'depan',
    duduk: true,
    kursi: 'duduk',
    aktif: ['badan'],
    kf: [
      { ...DUDUK_DEPAN, lenganAktif: SILANG, lenganLain: SILANG },
      { ...DUDUK_DEPAN, lenganAktif: SILANG, lenganLain: SILANG, rotasi: 45 },
      { ...DUDUK_DEPAN, lenganAktif: SILANG, lenganLain: SILANG },
      { ...DUDUK_DEPAN, lenganAktif: SILANG, lenganLain: SILANG, rotasi: -45 },
    ],
    puncak: 1,
    repPerSiklus: 2,
  },
  'langkah-duduk': {
    tampak: 'samping',
    akarDi: 'pinggul',
    kursi: 'duduk',
    aktif: ['tungkai', 'tungkaiJauh'],
    kf: [sampingDuduk(), sampingDuduk({ tungkai: [116, 10] }), sampingDuduk(), sampingDuduk({ tungkaiJauh: [116, 10] })],
    puncak: 1,
    repPerSiklus: 2,
    jejak: 'kaki',
  },
};

/** Figur netral untuk latihan tanpa pose kunci khusus. */
const DEMO_BAWAAN: KonfigDemo = {
  tampak: 'samping',
  akarDi: 'pinggul',
  kursi: 'duduk',
  aktif: [],
  kf: [sampingDuduk()],
  puncak: 0,
  repPerSiklus: 1,
};

/* ---------- interpolasi ---------- */

function campur<T>(a: T, b: T, k: number): T {
  if (typeof a === 'number' && typeof b === 'number') return (a + (b - a) * k) as T;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x: unknown, i) => campur(x, b[i] as unknown, k)) as T;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const hasil = { ...a } as Record<string, unknown>;
    for (const kunci of Object.keys(hasil)) hasil[kunci] = campur((a as Record<string, unknown>)[kunci], (b as Record<string, unknown>)[kunci], k);
    return hasil as T;
  }
  return a;
}

/** Pose pada detik `t`: diam sebentar di tiap pose kunci, lalu bergerak halus (ease-in-out sinus) ke pose berikutnya. */
function poseSaat<T>(kf: readonly T[], t: number, detikRuas: number): T {
  if (kf.length === 1) return kf[0];
  // Stempel rAF bisa sedikit lebih awal dari waktu mulai: jaga agar t tidak negatif.
  const waktu = Math.max(0, t);
  const i = Math.floor(waktu / detikRuas) % kf.length;
  const lokal = (waktu % detikRuas) / detikRuas;
  if (lokal < PORSI_TAHAN) return kf[i];
  const k = (lokal - PORSI_TAHAN) / (1 - PORSI_TAHAN);
  return campur(kf[i], kf[(i + 1) % kf.length], (1 - Math.cos(Math.PI * k)) / 2);
}

/* ---------- geometri ---------- */

/** Kinematika balik dua ruas; siku dipilih yang lebih rendah. */
function lenganMenuju(bahu: V, target: V): [V, V] {
  const a = P.lenganAtas;
  const b = P.lenganBawah;
  const dx = target[0] - bahu[0];
  const dy = target[1] - bahu[1];
  const d = Math.min(a + b - 0.01, Math.max(Math.abs(a - b) + 0.01, Math.hypot(dx, dy)));
  const arah = Math.atan2(dy, dx);
  const alfa = Math.acos((a * a + d * d - b * b) / (2 * a * d));
  const s1: V = [bahu[0] + a * Math.cos(arah + alfa), bahu[1] + a * Math.sin(arah + alfa)];
  const s2: V = [bahu[0] + a * Math.cos(arah - alfa), bahu[1] + a * Math.sin(arah - alfa)];
  return [s1[1] > s2[1] ? s1 : s2, [bahu[0] + d * Math.cos(arah), bahu[1] + d * Math.sin(arah)]];
}

/** Tangan sebagai bulatan sedikit di luar pergelangan, searah lengan bawah. */
function posisiTangan(siku: V, pergelangan: V): V {
  const dx = pergelangan[0] - siku[0];
  const dy = pergelangan[1] - siku[1];
  const d = Math.hypot(dx, dy) || 1;
  return [pergelangan[0] + (dx / d) * 4.5, pergelangan[1] + (dy / d) * 4.5];
}

type Peran = 'dekat' | 'jauh' | 'aktif' | 'aktifJauh';

const WARNA_PERAN: Record<Peran, string> = { dekat: W_PRIMER, jauh: W_JAUH, aktif: W_AKSEN, aktifJauh: W_AKSEN_JAUH };

/** Satu anggota tubuh: rangkaian ruas bersendi, tangan opsional, digambar sesuai urutan dalam Bentuk.lapisan. */
interface Anggota {
  titik: V[];
  tebal: number;
  peran: Peran;
  tangan?: V;
  /** Titik sendi diberi bulatan putih (anggota dekat). */
  sendi: boolean;
}

interface Bentuk {
  /** Lapisan belakang (sisi jauh), digambar sebelum badan. */
  belakang: Anggota[];
  /** Lapisan depan, digambar sesudah badan & kepala. */
  depan: Anggota[];
  badan: { titik: V[]; poligon: boolean };
  leher: [V, V];
  kepala: V;
  /** Tampak samping: mata di sisi depan wajah. */
  mata?: V;
  jejak: Record<Jejak, V>;
  /** Putaran batang tubuh (tampak depan), untuk panah petunjuk. */
  putar?: { rotasi: number; y: number };
}

function bentukSamping(p: PoseSamping, akarDi: 'pinggul' | 'kaki', aktif: readonly BagianSamping[]): Bentuk {
  let pinggul: V;
  let lutut: V;
  let pkaki: V;
  if (akarDi === 'pinggul') {
    pinggul = p.akar;
    lutut = tambah(pinggul, arahBawah(p.tungkai[0]), P.paha);
    pkaki = tambah(lutut, arahBawah(p.tungkai[1]), P.betis);
  } else {
    pkaki = p.akar;
    lutut = tambah(pkaki, arahBawah(p.tungkai[1]), -P.betis);
    pinggul = tambah(lutut, arahBawah(p.tungkai[0]), -P.paha);
  }
  const lututJauh = tambah(pinggul, arahBawah(p.tungkaiJauh[0]), P.paha);
  const kakiJauh = tambah(lututJauh, arahBawah(p.tungkaiJauh[1]), P.betis);
  const atas: V = [Math.sin(rad(p.badan)), -Math.cos(rad(p.badan))];
  const bahu = tambah(pinggul, atas, P.badan);
  const pangkalLeher = tambah(bahu, atas, -2);
  const kepala = tambah(bahu, atas, P.leher + P.kepala);

  const lengan = (s: V): [V, V] => {
    if (p.tangan) return lenganMenuju(bahu, p.tangan);
    const siku = tambah(bahu, arahBawah(s[0]), P.lenganAtas);
    return [siku, tambah(siku, arahBawah(s[1]), P.lenganBawah)];
  };
  const ujungTelapak = (k: V, sudut: number): V => tambah(k, [Math.cos(rad(sudut)), Math.sin(rad(sudut))], P.telapak);
  const [sikuJ, tanganJ] = lengan(p.lenganJauh);
  const [siku, tangan] = lengan(p.lengan);
  const peran = (b: BagianSamping, jauh: boolean): Peran => (aktif.includes(b) ? (jauh ? 'aktifJauh' : 'aktif') : jauh ? 'jauh' : 'dekat');
  const tungkaiPeran = peran('tungkai', false);

  return {
    belakang: [
      { titik: [pinggul, lututJauh, kakiJauh], tebal: 10, peran: peran('tungkaiJauh', true), sendi: false },
      { titik: [kakiJauh, ujungTelapak(kakiJauh, p.telapakJauh)], tebal: 7, peran: peran('telapak', true), sendi: false },
      { titik: [bahu, sikuJ, tanganJ], tebal: 8, peran: 'jauh', tangan: posisiTangan(sikuJ, tanganJ), sendi: false },
    ],
    depan: [
      // 'betis' / 'lenganBawah': hanya ruas bawah yang bergerak (sendi lutut / siku), ruas atas tetap diam.
      ...(aktif.includes('betis')
        ? [
            { titik: [pinggul, lutut], tebal: 11, peran: 'dekat', sendi: true } satisfies Anggota,
            { titik: [lutut, pkaki], tebal: 10, peran: 'aktif', sendi: true } satisfies Anggota,
          ]
        : [{ titik: [pinggul, lutut, pkaki], tebal: 11, peran: tungkaiPeran, sendi: true } satisfies Anggota]),
      { titik: [pkaki, ujungTelapak(pkaki, p.telapak)], tebal: 7.5, peran: aktif.includes('telapak') ? 'aktif' : tungkaiPeran, sendi: false },
      ...(aktif.includes('lenganBawah')
        ? [
            { titik: [bahu, siku], tebal: 9, peran: 'dekat', sendi: true } satisfies Anggota,
            { titik: [siku, tangan], tebal: 8.5, peran: 'aktif', tangan: posisiTangan(siku, tangan), sendi: true } satisfies Anggota,
          ]
        : [{ titik: [bahu, siku, tangan], tebal: 9, peran: peran('lengan', false), tangan: posisiTangan(siku, tangan), sendi: true } satisfies Anggota]),
    ],
    badan: { titik: [pinggul, bahu], poligon: false },
    leher: [pangkalLeher, tambah(bahu, atas, P.leher + 2)],
    kepala,
    mata: tambah(kepala, [Math.cos(rad(p.badan)) * 5, -2 + Math.sin(rad(p.badan)) * 5]),
    jejak: { tangan: posisiTangan(siku, tangan), kaki: pkaki, pinggul },
  };
}

function bentukDepan(p: PoseDepan, duduk: boolean, aktif: readonly BagianDepan[]): Bentuk {
  const cx = 100;
  const hy = p.pinggulY;
  const sy = hy - P.badan;
  const lebarBahu = 18 * Math.cos(rad(p.rotasi));
  const geser = 5 * Math.sin(rad(p.rotasi));
  const bahuA: V = [cx + lebarBahu + geser, sy];
  const bahuL: V = [cx - lebarBahu + geser, sy];
  const pinggulA: V = [cx + 10, hy];
  const pinggulL: V = [cx - 10, hy];
  const kepala: V = [cx + geser * 2, sy - P.leher - P.kepala];

  const lengan = (bahu: V, s: V, arah: 1 | -1): [V, V] => {
    const siku = tambah(bahu, [arah * Math.sin(rad(s[0])), Math.cos(rad(s[0]))], P.lenganAtas);
    return [siku, tambah(siku, [arah * Math.sin(rad(s[1])), Math.cos(rad(s[1]))], P.lenganBawah)];
  };
  const tungkai = (pg: V, sudut: number, arah: 1 | -1): { titik: V[]; kaki: V } => {
    if (duduk) {
      // Paha mengarah ke kamera: tampak pendek; betis tegak ke lantai.
      const lutut = tambah(pg, [arah * 4, 7]);
      const k = tambah(lutut, [arah, P.betis]);
      return { titik: [pg, lutut, k], kaki: k };
    }
    const u: V = [arah * Math.sin(rad(sudut)), Math.cos(rad(sudut))];
    const lutut = tambah(pg, u, P.paha);
    const k = tambah(lutut, u, P.betis);
    return { titik: [pg, lutut, k], kaki: k };
  };
  const [sikuA, tanganA] = lengan(bahuA, p.lenganAktif, 1);
  const [sikuL, tanganL] = p.tanganLain ? lenganMenuju(bahuL, p.tanganLain) : lengan(bahuL, p.lenganLain, -1);
  const putarAktif = aktif.includes('badan');
  const tungkaiL = tungkai(pinggulL, p.tungkaiLain, -1);
  const tungkaiA = tungkai(pinggulA, p.tungkaiAktif, 1);
  const tungkaiAPeran: Peran = aktif.includes('tungkaiAktif') ? 'aktif' : 'dekat';
  const telapak = (k: V, arah: 1 | -1): V[] => [k, tambah(k, [arah * 6, 1])];
  const lenganDiDepanBadan = p.lenganAktif[1] < -60;

  const lenganL: Anggota = { titik: [bahuL, sikuL, tanganL], tebal: 9, peran: 'dekat', tangan: posisiTangan(sikuL, tanganL), sendi: true };
  const lenganA: Anggota = {
    titik: [bahuA, sikuA, tanganA],
    tebal: 9,
    peran: aktif.includes('lenganAktif') ? 'aktif' : 'dekat',
    tangan: posisiTangan(sikuA, tanganA),
    sendi: true,
  };
  return {
    belakang: [
      { titik: tungkaiL.titik, tebal: 11, peran: 'dekat', sendi: true },
      { titik: telapak(tungkaiL.kaki, -1), tebal: 7.5, peran: 'dekat', sendi: false },
      { titik: tungkaiA.titik, tebal: 11, peran: tungkaiAPeran, sendi: true },
      { titik: telapak(tungkaiA.kaki, 1), tebal: 7.5, peran: tungkaiAPeran, sendi: false },
      // Lengan yang terjuntai di samping badan digambar di belakang badan agar bahu tampak menyatu.
      ...(lenganDiDepanBadan ? [] : [lenganL, lenganA]),
    ],
    depan: lenganDiDepanBadan ? [lenganL, lenganA] : [],
    badan: { titik: [bahuL, bahuA, pinggulA, pinggulL], poligon: true },
    leher: [[cx + geser, sy + 2], [kepala[0], kepala[1] + P.kepala - 1]],
    kepala,
    jejak: { tangan: posisiTangan(sikuA, tanganA), kaki: tungkaiA.kaki, pinggul: [cx, hy] },
    // Panah putar di depan perut, di bawah lengan yang bersilang.
    putar: putarAktif ? { rotasi: p.rotasi, y: hy - 8 } : undefined,
  };
}

function bentuk(konfig: KonfigDemo, pose: PoseSamping | PoseDepan): Bentuk {
  return konfig.tampak === 'samping'
    ? bentukSamping(pose as PoseSamping, konfig.akarDi, konfig.aktif)
    : bentukDepan(pose as PoseDepan, konfig.duduk, konfig.aktif);
}

/** Lintasan titik jejak dari pose Mulai ke Puncak (sampel interpolasi sudut, jadi melengkung seperti gerak sendi). */
function lintasan(konfig: KonfigDemo): V[] | null {
  if (!konfig.jejak || konfig.kf.length < 2) return null;
  const kf = konfig.kf as readonly (PoseSamping | PoseDepan)[];
  const mulai = kf[0];
  const puncak = kf[konfig.puncak];
  const titik: V[] = [];
  for (let i = 0; i <= 16; i++) titik.push(bentuk(konfig, campur(mulai, puncak, i / 16)).jejak[konfig.jejak]);
  const [ax, ay] = titik[0];
  const [bx, by] = titik[titik.length - 1];
  return Math.hypot(bx - ax, by - ay) < 6 ? null : titik;
}

/* ---------- gambar ---------- */

const poin = (t: readonly V[]) => t.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

function Kursi({ konfig }: { konfig: KonfigDemo }) {
  const kaki = { stroke: W_KURSI_TUA, strokeWidth: 4, strokeLinecap: 'round' as const };
  if (konfig.tampak === 'samping') {
    if (konfig.kursi === 'duduk') {
      // Pinggul pose Mulai (pangkal poros badan), apa pun akar kinematikanya.
      const pinggul = bentukSamping(konfig.kf[0], konfig.akarDi, []).badan.titik[0];
      const dudukY = pinggul[1] + 8;
      const x0 = pinggul[0] - 20;
      const x1 = pinggul[0] + 18;
      return (
        <g>
          <line x1={x0 + 3} y1={dudukY} x2={x0 + 3} y2={TANAH} {...kaki} />
          <line x1={x1 - 3} y1={dudukY} x2={x1 - 3} y2={TANAH} {...kaki} />
          <rect x={x0 - 4} y={dudukY - 52} width={7} height={56} rx={3.5} fill={W_KURSI} transform={`rotate(-6 ${x0} ${dudukY})`} />
          <rect x={x0 - 4} y={dudukY - 1} width={x1 - x0 + 6} height={7} rx={3.5} fill={W_KURSI} />
        </g>
      );
    }
    if (konfig.kursi === 'pegangan') {
      const [tx, ty] = konfig.kf[0].tangan ?? [124, 92];
      const x = tx + 3;
      return (
        <g>
          <rect x={x - 3.5} y={ty - 3} width={7} height={44} rx={3.5} fill={W_KURSI} />
          <rect x={x - 3.5} y={ty + 36} width={34} height={7} rx={3.5} fill={W_KURSI} />
          <line x1={x} y1={ty + 40} x2={x} y2={TANAH} {...kaki} />
          <line x1={x + 27} y1={ty + 40} x2={x + 27} y2={TANAH} {...kaki} />
        </g>
      );
    }
    return null;
  }
  if (konfig.kursi === 'duduk') {
    const y = konfig.kf[0].pinggulY + 8;
    return (
      <g>
        {/* sandaran di belakang badan, dudukan, kaki kursi */}
        <rect x={74} y={y - 58} width={52} height={40} rx={6} fill={W_KURSI} opacity={0.55} />
        <line x1={78} y1={y} x2={78} y2={TANAH} {...kaki} />
        <line x1={122} y1={y} x2={122} y2={TANAH} {...kaki} />
        <rect x={70} y={y - 2} width={60} height={8} rx={4} fill={W_KURSI} />
      </g>
    );
  }
  if (konfig.kursi === 'pegangan') {
    const [tx, ty] = konfig.kf[0].tanganLain ?? [62, 96];
    return (
      <g>
        <rect x={tx - 26} y={ty - 3} width={32} height={7} rx={3.5} fill={W_KURSI} />
        <line x1={tx - 22} y1={ty} x2={tx - 22} y2={TANAH} {...kaki} />
        <line x1={tx + 2} y1={ty} x2={tx + 2} y2={TANAH} {...kaki} />
        <rect x={tx - 28} y={ty + 34} width={36} height={7} rx={3.5} fill={W_KURSI} />
      </g>
    );
  }
  return null;
}

function GambarAnggota({ a }: { a: Anggota }) {
  const warna = WARNA_PERAN[a.peran];
  const latar = a.peran === 'jauh' || a.peran === 'aktifJauh';
  return (
    <g>
      {/* Tepi warna latar memisahkan anggota tubuh yang saling menutupi. */}
      {!latar && <polyline points={poin(a.titik)} stroke={W_LATAR} strokeWidth={a.tebal + 3.5} />}
      <polyline points={poin(a.titik)} stroke={warna} strokeWidth={a.tebal} />
      {a.tangan && <circle cx={a.tangan[0]} cy={a.tangan[1]} r={a.tebal * 0.55} fill={warna} stroke={latar ? 'none' : W_LATAR} strokeWidth={1.5} />}
      {a.sendi &&
        a.titik.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.4} fill="#ffffff" stroke={a.peran === 'aktif' ? '#8a4610' : W_PRIMER} strokeWidth={1.3} />
        ))}
    </g>
  );
}

function Figur({ b }: { b: Bentuk }) {
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {b.belakang.map((a, i) => (
        <GambarAnggota key={`b${i}`} a={a} />
      ))}
      {b.badan.poligon ? (
        <polygon points={poin(b.badan.titik)} fill={W_PRIMER} stroke={W_PRIMER} strokeWidth={9} />
      ) : (
        <>
          <polyline points={poin(b.badan.titik)} stroke={W_LATAR} strokeWidth={24} />
          <polyline points={poin(b.badan.titik)} stroke={W_PRIMER} strokeWidth={20} />
        </>
      )}
      <polyline points={poin(b.leher)} stroke={W_PRIMER} strokeWidth={7.5} />
      <circle cx={b.kepala[0]} cy={b.kepala[1]} r={P.kepala} fill={W_PRIMER} stroke={W_LATAR} strokeWidth={2.5} />
      {b.mata && <circle cx={b.mata[0]} cy={b.mata[1]} r={1.5} fill="#ffffff" />}
      {b.depan.map((a, i) => (
        <GambarAnggota key={`d${i}`} a={a} />
      ))}
      {b.putar && <PanahPutar {...b.putar} />}
    </g>
  );
}

/** Bayangan anggota aktif pada pose puncak: petunjuk ke mana gerakan menuju. */
function Hantu({ b }: { b: Bentuk }) {
  const aktif = [...b.belakang, ...b.depan].filter((a) => a.peran === 'aktif' || a.peran === 'aktifJauh');
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.2}>
      {aktif.map((a, i) => (
        <g key={i}>
          <polyline points={poin(a.titik)} stroke={W_AKSEN} strokeWidth={a.tebal} />
          {a.tangan && <circle cx={a.tangan[0]} cy={a.tangan[1]} r={a.tebal * 0.55} fill={W_AKSEN} />}
        </g>
      ))}
    </g>
  );
}

/** Lintasan putus-putus dengan kepala panah di ujung (arah menuju puncak). */
function Lintasan({ titik }: { titik: V[] }) {
  const n = titik.length;
  const [ux, uy] = titik[n - 1];
  const [px, py] = titik[n - 3];
  const sudut = Math.atan2(uy - py, ux - px);
  const ujung = (d: number): V => [ux + Math.cos(sudut + d) * 6, uy + Math.sin(sudut + d) * 6];
  return (
    <g fill="none" stroke={W_AKSEN} strokeLinecap="round" strokeLinejoin="round" opacity={0.75}>
      <polyline points={poin(titik.slice(0, -1))} strokeWidth={1.8} strokeDasharray="3 4" />
      <polyline points={poin([ujung(Math.PI - 0.5), [ux, uy], ujung(Math.PI + 0.5)])} strokeWidth={2} />
    </g>
  );
}

/** Panah melengkung di depan dada yang menunjukkan arah putaran badan. */
function PanahPutar({ rotasi, y }: { rotasi: number; y: number }) {
  const kuat = Math.min(1, Math.abs(rotasi) / 20);
  if (kuat === 0) return null;
  return (
    <g opacity={kuat} transform={rotasi < 0 ? 'translate(200 0) scale(-1 1)' : undefined}>
      <path d={`M66 ${y} A34 9 0 0 0 134 ${y}`} stroke={W_LATAR} strokeWidth={8} />
      <path d={`M66 ${y} A34 9 0 0 0 134 ${y}`} stroke={W_AKSEN} strokeWidth={4} />
      <polyline points={`128,${y + 2} 134,${y - 5} 140,${y + 2}`} stroke={W_AKSEN} strokeWidth={4} />
    </g>
  );
}

function Panggung({
  konfig,
  cermin,
  label,
  pose,
  hantu,
  tampakLabel,
}: {
  konfig: KonfigDemo;
  cermin: boolean;
  label: string;
  pose: PoseSamping | PoseDepan;
  hantu?: PoseSamping | PoseDepan;
  tampakLabel: boolean;
}) {
  const jalur = lintasan(konfig);
  return (
    <svg viewBox="0 0 200 172" role="img" aria-label={label} className="h-auto w-full">
      <g transform={cermin ? 'translate(200 0) scale(-1 1)' : undefined}>
        <ellipse cx={100} cy={TANAH + 1} rx={70} ry={4} fill={W_TANAH} />
        <Kursi konfig={konfig} />
        {hantu && <Hantu b={bentuk(konfig, hantu)} />}
        {jalur && <Lintasan titik={jalur} />}
        <Figur b={bentuk(konfig, pose)} />
      </g>
      {tampakLabel && (
        <text x={8} y={14} fontSize={8.5} fontWeight={700} fill={W_PRIMER} opacity={0.7}>
          {konfig.tampak === 'samping' ? 'Tampak samping' : 'Tampak depan'}
        </text>
      )}
    </svg>
  );
}

function subscribeGerak(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function useGerakDikurangi(): boolean {
  return useSyncExternalStore(
    subscribeGerak,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

/** Waktu animasi dalam detik, ~30 fps agar ringan di HP kelas bawah. */
function useWaktuAnimasi(aktif: boolean): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!aktif) return;
    let id = 0;
    let terakhir = 0;
    const mulai = performance.now();
    const langkah = (now: number) => {
      id = requestAnimationFrame(langkah);
      if (now - terakhir < 33) return;
      terakhir = now;
      setT((now - mulai) / 1000);
    };
    id = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(id);
  }, [aktif]);
  return t;
}

export interface ExerciseDemoProps {
  exerciseId: string;
  nama: string;
  /** Sisi yang dilatih; menentukan arah figur. Kosongkan untuk latihan dua sisi. */
  sisi?: Sisi;
  /** Tempo target satu repetisi (detik), dari definisi latihan; irama contoh memakai nilai tengahnya. */
  tempoDetik?: { min: number; max: number };
}

export function ExerciseDemo({ exerciseId, nama, sisi, tempoDetik }: ExerciseDemoProps) {
  const konfig = DEMO[exerciseId] ?? DEMO_BAWAAN;
  const dikurangi = useGerakDikurangi();
  const t = useWaktuAnimasi(!dikurangi && konfig.kf.length > 1);
  // Tampak samping: figur menghadap kanan memperlihatkan sisi kirinya. Tampak depan: sisi aktif di kanan layar.
  const cermin = konfig.tampak === 'samping' ? sisi === 'kanan' : sisi === 'kiri';
  const kf = konfig.kf as readonly (PoseSamping | PoseDepan)[];
  const puncak = kf[konfig.puncak];
  // Satu repetisi = tempo tengah, dibatasi 2..6 detik agar contoh tidak terlalu cepat atau membosankan.
  const tempo = tempoDetik ? Math.min(6, Math.max(2, (tempoDetik.min + tempoDetik.max) / 2)) : 3;
  const detikRuas = (tempo * konfig.repPerSiklus) / kf.length;
  const tempoTeks = (Math.round(tempo * 2) / 2).toLocaleString('id-ID');

  if (dikurangi && kf.length > 1) {
    return (
      <figure className="rounded-kartu bg-primer-terang p-2">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['1. Mulai', kf[0]],
              ['2. Puncak', puncak],
            ] as const
          ).map(([label, pose]) => (
            <div key={label} className="rounded-xl bg-white/60 p-1">
              <Panggung konfig={konfig} cermin={cermin} label={`${nama}: posisi ${label.slice(3).toLowerCase()}`} pose={pose} tampakLabel={false} />
              <p className="pb-1 text-center font-bold text-primer">{label}</p>
            </div>
          ))}
        </div>
        <figcaption className="mt-1.5 text-center text-[0.95rem] text-teks-2">
          Gerak pelan dari Mulai ke Puncak, sekitar {tempoTeks} detik tiap gerakan.
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="rounded-kartu bg-primer-terang p-3">
      <Panggung
        konfig={konfig}
        cermin={cermin}
        label={`Contoh gerakan ${nama}`}
        pose={poseSaat(kf, t, detikRuas)}
        hantu={konfig.aktif.length > 0 ? puncak : undefined}
        tampakLabel
      />
      <figcaption className="mt-1 text-center text-[0.95rem] text-teks-2">
        Ikuti irama pelan ini: sekitar <span className="tabular font-semibold text-teks">{tempoTeks} detik</span> tiap gerakan.
      </figcaption>
    </figure>
  );
}
