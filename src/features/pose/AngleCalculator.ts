import type { Sisi } from '@/types';
import { ATURAN_UMUM } from './exerciseDefinitions';
import { AMBANG_VISIBILITAS, INDEKS_MEDIAPIPE, indeksMetrik, indeksTitik, semuaTerlihat } from './landmarks';
import type { Landmark, Metrik, NamaTitik, PoseFrame, SumberSudut } from './types';

/**
 * Perhitungan sudut & metrik (Bab 7.1).
 *
 * Sumber sudut per latihan (`def.sumberSudut`, lihat docs/algoritma.md Bagian 3 dan 13):
 * - '2d'      : koordinat gambar dikoreksi rasio aspek (x * aspect, y).
 * - '3d'      : `worldLandmarks` MediaPipe (meter, berpusat di pinggul).
 * - 'hibrida' : rata-rata berbobot sudut 2D dan 3D. Bobot 2D = 1 bila kedua ruas sendi sejajar
 *               bidang gambar, turun ke 0 bila salah satu ruas memendek tajam (mengarah ke kamera),
 *               tempat sudut 2D tidak terdefinisi. Rekaman manusia nyata menunjukkan sudut 3D
 *               MediaPipe memampatkan fleksi siku dari depan (istirahat 25-50°, puncak 100-110°),
 *               sedangkan 2D bersih di titik ekstrem (istirahat 2-20°, puncak 160-178°).
 * Tanpa worldLandmarks semua sumber jatuh ke 2D.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Basis efektif satu frame (setelah memperhitungkan ada/tidaknya worldLandmarks). */
export type BasisKoordinat = SumberSudut;
export type MetrikDasar = Exclude<Metrik, { jenis: 'bergantian' }>;

const RAD = 180 / Math.PI;

/** Koordinat gambar dalam satuan tinggi gambar: x dikali rasio aspek agar sudut tidak terdistorsi. */
export function titik2D(lm: Landmark, aspect: number): Vec3 {
  return { x: lm.x * aspect, y: lm.y, z: 0 };
}

function jarak(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Sudut (derajat, 0..180) di titik B dari vektor BA dan BC memakai dot product. Null bila vektor nol. */
export function sudutDi(a: Vec3, b: Vec3, c: Vec3): number | null {
  const bax = a.x - b.x;
  const bay = a.y - b.y;
  const baz = a.z - b.z;
  const bcx = c.x - b.x;
  const bcy = c.y - b.y;
  const bcz = c.z - b.z;
  const panjang = Math.hypot(bax, bay, baz) * Math.hypot(bcx, bcy, bcz);
  if (!(panjang > 1e-12)) return null;
  const cos = (bax * bcx + bay * bcy + baz * bcz) / panjang;
  return Math.acos(Math.min(1, Math.max(-1, cos))) * RAD;
}

/** worldLandmarks lengkap tersedia. */
export function punyaDunia(frame: PoseFrame): boolean {
  return frame.worldLandmarks !== undefined && frame.worldLandmarks.length >= 33;
}

/** Basis koordinat untuk frame ini: sumber yang diminta, atau 2D bila worldLandmarks tidak ada. */
export function basisFrame(frame: PoseFrame, sumber: SumberSudut): BasisKoordinat {
  return sumber === '2d' || !punyaDunia(frame) ? '2d' : sumber;
}

/** Titik ke-i pada koordinat gambar ('2d') atau dunia ('3d'). Keterlihatan selalu dinilai dari landmark gambar. */
export function titikBasis(frame: PoseFrame, i: number, basis: '2d' | '3d'): Vec3 {
  if (basis === '3d') {
    const w = frame.worldLandmarks![i];
    return { x: w.x, y: w.y, z: w.z };
  }
  return titik2D(frame.landmarks[i], frame.aspect);
}

/**
 * Bobot sudut 2D (0..1) untuk sendi B dengan ruas BA dan BC.
 * r = (|BC|/|BA| pada gambar) / (|BC|/|BA| pada dunia 3D); pemendekan relatif p = min(r, 1/r).
 * p = 1: kedua ruas sama-sama sejajar bidang gambar (2D tepat). p kecil: satu ruas mengarah ke
 * kamera (2D tidak terdefinisi). Perbandingan antar-ruas tidak memerlukan panjang acuan per sesi.
 */
export function bobot2D(frame: PoseFrame, ia: number, ib: number, ic: number): number {
  const [a2, b2, c2] = [ia, ib, ic].map((i) => titikBasis(frame, i, '2d'));
  const [a3, b3, c3] = [ia, ib, ic].map((i) => titikBasis(frame, i, '3d'));
  const ba2 = jarak(a2, b2);
  const ba3 = jarak(a3, b3);
  const bc3 = jarak(c3, b3);
  if (!(ba2 > 1e-9 && ba3 > 1e-9 && bc3 > 1e-9)) return 0;
  const r = jarak(c2, b2) / ba2 / (bc3 / ba3);
  const p = r > 1 ? 1 / r : r;
  const { pemendekan3D, pemendekan2D } = ATURAN_UMUM.hibrida;
  return Math.min(1, Math.max(0, (p - pemendekan3D) / (pemendekan2D - pemendekan3D)));
}

export interface HasilSudut {
  /** Derajat, 0..180. */
  sudut: number;
  /** Porsi sudut 2D dalam nilai (1 = murni 2D, 0 = murni 3D). */
  bobot2D: number;
}

/** Sudut di B (dot product) menurut basis; null bila vektor nol. Tidak memeriksa keterlihatan. */
export function sudutBasis(frame: PoseFrame, ia: number, ib: number, ic: number, basis: BasisKoordinat): HasilSudut | null {
  const sudutPada = (b: '2d' | '3d') =>
    sudutDi(titikBasis(frame, ia, b), titikBasis(frame, ib, b), titikBasis(frame, ic, b));
  if (basis === '2d') {
    const s = sudutPada('2d');
    return s === null ? null : { sudut: s, bobot2D: 1 };
  }
  const s3 = sudutPada('3d');
  if (s3 === null) return null;
  if (basis === '3d') return { sudut: s3, bobot2D: 0 };
  const s2 = sudutPada('2d');
  const w = s2 === null ? 0 : bobot2D(frame, ia, ib, ic);
  return { sudut: w * (s2 ?? 0) + (1 - w) * s3, bobot2D: w };
}

/**
 * Sudut di B untuk tiga indeks landmark. Null bila salah satu landmark visibility < 0,5
 * (frame diabaikan, Bab 7.1).
 */
export function sudutSendi(
  frame: PoseFrame,
  ia: number,
  ib: number,
  ic: number,
  basis: BasisKoordinat,
  ambangVisibilitas = AMBANG_VISIBILITAS,
): number | null {
  if (!semuaTerlihat(frame.landmarks, [ia, ib, ic], ambangVisibilitas)) return null;
  return sudutBasis(frame, ia, ib, ic, basis)?.sudut ?? null;
}

/** Moving average atas N nilai valid terakhir (Bab 7.1). Frame yang diabaikan tidak dimasukkan. */
export class RataBergerak {
  private readonly isi: number[] = [];
  private jumlah = 0;

  constructor(private readonly jendela: number) {
    if (!Number.isInteger(jendela) || jendela < 1) throw new Error('Jendela moving average harus bilangan bulat >= 1');
  }

  tambah(nilai: number): number {
    this.isi.push(nilai);
    this.jumlah += nilai;
    if (this.isi.length > this.jendela) this.jumlah -= this.isi.shift()!;
    return this.jumlah / this.isi.length;
  }

  reset(): void {
    this.isi.length = 0;
    this.jumlah = 0;
  }
}

const BAHU_KIRI = INDEKS_MEDIAPIPE.bahu.kiri;
const BAHU_KANAN = INDEKS_MEDIAPIPE.bahu.kanan;

/** Lebar bahu pada gambar (satuan tinggi gambar), null bila salah satu bahu tidak terlihat. */
export function lebarBahu2D(frame: PoseFrame, ambangVisibilitas = AMBANG_VISIBILITAS): number | null {
  if (!semuaTerlihat(frame.landmarks, [BAHU_KIRI, BAHU_KANAN], ambangVisibilitas)) return null;
  return jarak(titik2D(frame.landmarks[BAHU_KIRI], frame.aspect), titik2D(frame.landmarks[BAHU_KANAN], frame.aspect));
}

/**
 * Kemiringan garis bahu dari horizontal, derajat 0..90 (koreksi badan-miring), tahan putaran badan.
 *
 * 1. Badan sangat berputar -> null (tidak dinilai): lebar bahu pada gambar < `rasioLebarBahuMin` x
 *    panjang batang tubuh pada gambar (menghadap kamera ~0,81 pada rekaman nyata, 0,5 ~ putaran 50°).
 *    Pada putaran sebesar itu bidang frontal hampir searah pandang kamera: garis bahu 2D memendek
 *    sehingga beda tinggi kecil terbaca miring besar, dan kedalaman MediaPipe yang termampatkan
 *    juga membesarkan elevasi 3D (video gym `curl`: 3D 15-30° pada rasio 0,42).
 * 2. Dengan worldLandmarks: elevasi 3D garis bahu atan2(|dy|, hypot(dx, dz)); putaran sedang (yaw)
 *    hanya mengubah dx/dz, bukan elevasinya. Tanpa 3D: kemiringan pada gambar.
 * Pinggul tidak terlihat: langkah 1 dilewati bila ada 3D (bingkai dekat menghadap kamera), selain
 * itu null karena putaran tidak dapat diperiksa.
 * Rekaman nyata curl2 (serong, tegak): 2D 15-24°, 3D 0,7-4,1°, rasio 0,29-0,46.
 */
export function kemiringanBahu(frame: PoseFrame, ambangVisibilitas = AMBANG_VISIBILITAS): number | null {
  if (!semuaTerlihat(frame.landmarks, [BAHU_KIRI, BAHU_KANAN], ambangVisibilitas)) return null;
  const pinggul = [INDEKS_MEDIAPIPE.pinggul.kiri, INDEKS_MEDIAPIPE.pinggul.kanan];
  const [l, r, pl, pr] = [BAHU_KIRI, BAHU_KANAN, ...pinggul].map((i) => titik2D(frame.landmarks[i], frame.aspect));
  const dunia = punyaDunia(frame);
  if (semuaTerlihat(frame.landmarks, pinggul, ambangVisibilitas)) {
    const batang = Math.hypot((l.x + r.x - pl.x - pr.x) / 2, (l.y + r.y - pl.y - pr.y) / 2);
    if (jarak(l, r) < ATURAN_UMUM.koreksi.rasioLebarBahuMin * batang) return null;
  } else if (!dunia) {
    return null;
  }
  if (dunia) {
    const wl = frame.worldLandmarks![BAHU_KIRI];
    const wr = frame.worldLandmarks![BAHU_KANAN];
    return Math.atan2(Math.abs(wl.y - wr.y), Math.hypot(wl.x - wr.x, wl.z - wr.z)) * RAD;
  }
  return Math.atan2(Math.abs(l.y - r.y), Math.abs(l.x - r.x)) * RAD;
}

/**
 * Sudut garis bahu terhadap bidang kamera dari landmark dunia: atan2(dz, dx), derajat.
 * 0 bila bahu sejajar bidang gambar. Null tanpa worldLandmarks atau bila bahu tidak terlihat.
 */
export function rotasiBahu3D(frame: PoseFrame, ambangVisibilitas = AMBANG_VISIBILITAS): number | null {
  if (!punyaDunia(frame)) return null;
  if (!semuaTerlihat(frame.landmarks, [BAHU_KIRI, BAHU_KANAN], ambangVisibilitas)) return null;
  const l = frame.worldLandmarks![BAHU_KIRI];
  const r = frame.worldLandmarks![BAHU_KANAN];
  return Math.atan2(l.z - r.z, l.x - r.x) * RAD;
}

/** Jarak tegak bahu ke telinga sisi yang sama pada gambar (satuan tinggi gambar). Menyusut saat bahu terangkat. */
export function jarakTelingaBahu(frame: PoseFrame, sisi: Sisi, ambangVisibilitas = AMBANG_VISIBILITAS): number | null {
  const iBahu = indeksTitik('bahu', sisi);
  const iTelinga = indeksTitik('telinga', sisi);
  if (!semuaTerlihat(frame.landmarks, [iBahu, iTelinga], ambangVisibilitas)) return null;
  return frame.landmarks[iBahu].y - frame.landmarks[iTelinga].y;
}

/** Nilai acuan yang direkam selama masa stabil sebelum siap (Bab 5.1 langkah 4). */
export interface Baseline {
  /** Lebar bahu pada gambar, satuan tinggi gambar. */
  lebarBahu2D: number | null;
  /** Sudut garis bahu 3D saat siap (ponsel boleh agak serong). */
  rotasiBahu3D: number | null;
  /** y gambar rata-rata per indeks landmark (untuk metrik kenaikan). */
  y: Record<number, number>;
  /** Jarak tegak bahu-telinga per sisi (koreksi bahu-terangkat). */
  telingaBahu: Record<Sisi, number | null>;
}

/** Mengumpulkan rata-rata nilai acuan selama masa stabil. */
export class PengumpulBaseline {
  private jumlah: Record<string, number> = {};
  private cacah: Record<string, number> = {};

  constructor(
    /** Indeks landmark yang posisi y-nya perlu diingat (metrik kenaikan). */
    private readonly indeksY: readonly number[],
    private readonly ambangVisibilitas = AMBANG_VISIBILITAS,
  ) {}

  private catat(kunci: string, nilai: number | null): void {
    if (nilai === null || !Number.isFinite(nilai)) return;
    this.jumlah[kunci] = (this.jumlah[kunci] ?? 0) + nilai;
    this.cacah[kunci] = (this.cacah[kunci] ?? 0) + 1;
  }

  private rata(kunci: string): number | null {
    const n = this.cacah[kunci];
    return n ? this.jumlah[kunci] / n : null;
  }

  tambah(frame: PoseFrame): void {
    const v = this.ambangVisibilitas;
    this.catat('lebar', lebarBahu2D(frame, v));
    this.catat('rotasi', rotasiBahu3D(frame, v));
    this.catat('telinga:kiri', jarakTelingaBahu(frame, 'kiri', v));
    this.catat('telinga:kanan', jarakTelingaBahu(frame, 'kanan', v));
    for (const i of this.indeksY) {
      if (semuaTerlihat(frame.landmarks, [i], v)) this.catat(`y:${i}`, frame.landmarks[i].y);
    }
  }

  reset(): void {
    this.jumlah = {};
    this.cacah = {};
  }

  hasil(): Baseline {
    const y: Record<number, number> = {};
    for (const i of this.indeksY) {
      const r = this.rata(`y:${i}`);
      if (r !== null) y[i] = r;
    }
    return {
      lebarBahu2D: this.rata('lebar'),
      rotasiBahu3D: this.rata('rotasi'),
      y,
      telingaBahu: { kiri: this.rata('telinga:kiri'), kanan: this.rata('telinga:kanan') },
    };
  }
}

/** Selisih sudut terkecil a - b dalam rentang -180..180. */
function selisihSudut(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

export interface HasilMetrik {
  nilai: number;
  basis: BasisKoordinat;
  /** Porsi sudut 2D (1 = 2D, 0 = 3D); untuk metrik non-sudut 1 pada basis 2D, 0 pada 3D. */
  bobot2D: number;
}

/**
 * Nilai metrik satu sisi untuk satu frame, atau null bila frame harus diabaikan
 * (landmark yang dibutuhkan tidak terlihat, atau acuan belum tersedia untuk metrik relatif).
 *
 * - sudut: dot product di titik b menurut `sumber` (2D, 3D, atau hibrida berbobot pemendekan
 *   ruas); `ubah: 'fleksi'` = 180 - sudut, `ubah: 'selisih-90'` = sudut - 90; `aSisiLawan`
 *   mengambil titik a dari sisi berlawanan.
 * - kenaikan: (y acuan - y sekarang) / lebar bahu acuan * 100, dari GAMBAR. Landmark dunia
 *   berpusat di pinggul sehingga tidak bisa melihat seluruh badan naik (jinjit).
 * - jarak: |ke - dari| / lebar bahu * 100, 3D kecuali sumber '2d' (gerak menggapai mengarah ke kamera).
 * - rotasi-bahu: |atan2(dz, dx) - acuan| dari landmark dunia kecuali sumber '2d'; dengan 2D
 *   diperkirakan dari pemendekan lebar bahu pada gambar: acos(lebar / lebar acuan).
 */
export function ukurMetrik(
  metrik: MetrikDasar,
  frame: PoseFrame,
  sisi: Sisi,
  sumber: SumberSudut,
  baseline: Baseline | null,
  ambangVisibilitas = AMBANG_VISIBILITAS,
): HasilMetrik | null {
  if (!semuaTerlihat(frame.landmarks, indeksMetrik(metrik, sisi), ambangVisibilitas)) return null;
  const basis = basisFrame(frame, sumber);
  // Metrik non-sudut tidak punya ruas sendi untuk dibobot: hibrida berarti 3D.
  const ruang = basis === '2d' ? '2d' : '3d';
  switch (metrik.jenis) {
    case 'sudut': {
      const [ia, ib, ic] = indeksMetrik(metrik, sisi);
      const h = sudutBasis(frame, ia, ib, ic, basis);
      if (h === null) return null;
      const nilai = metrik.ubah === 'fleksi' ? 180 - h.sudut : metrik.ubah === 'selisih-90' ? h.sudut - 90 : h.sudut;
      return { nilai, basis, bobot2D: h.bobot2D };
    }
    case 'kenaikan': {
      const i = indeksTitik(metrik.titik, sisi);
      const y0 = baseline?.y[i];
      const lebar = baseline?.lebarBahu2D;
      if (y0 === undefined || !lebar) return null;
      return { nilai: ((y0 - frame.landmarks[i].y) / lebar) * 100, basis: '2d', bobot2D: 1 };
    }
    case 'jarak': {
      const dari = titikBasis(frame, indeksTitik(metrik.dari, sisi), ruang);
      const ke = titikBasis(frame, indeksTitik(metrik.ke, sisi), ruang);
      const lebar = jarak(titikBasis(frame, BAHU_KIRI, ruang), titikBasis(frame, BAHU_KANAN, ruang));
      if (!(lebar > 1e-9)) return null;
      return { nilai: (jarak(dari, ke) / lebar) * 100, basis: ruang, bobot2D: ruang === '2d' ? 1 : 0 };
    }
    case 'rotasi-bahu': {
      if (ruang === '3d') {
        const r = rotasiBahu3D(frame, ambangVisibilitas);
        if (r === null) return null;
        return { nilai: Math.abs(selisihSudut(r, baseline?.rotasiBahu3D ?? 0)), basis: '3d', bobot2D: 0 };
      }
      const lebar = lebarBahu2D(frame, ambangVisibilitas);
      const lebar0 = baseline?.lebarBahu2D;
      if (lebar === null || !lebar0) return null;
      return { nilai: Math.acos(Math.min(1, lebar / lebar0)) * RAD, basis: '2d', bobot2D: 1 };
    }
  }
}

/** Sendi yang ditampilkan di Mode Uji (kunci debug `sudut.<sendi>.<sisi>`). */
export const SENDI_DEBUG: ReadonlyArray<{
  sendi: 'bahu' | 'siku' | 'lutut' | 'pinggul';
  a: NamaTitik;
  b: NamaTitik;
  c: NamaTitik;
  fleksi: boolean;
}> = [
  // bahu: sudut batang tubuh-lengan atas (0 = lengan di sisi badan)
  { sendi: 'bahu', a: 'pinggul', b: 'bahu', c: 'siku', fleksi: false },
  // siku: fleksi (0 = lurus)
  { sendi: 'siku', a: 'bahu', b: 'siku', c: 'pergelangan', fleksi: true },
  // lutut & pinggul: sudut dalam (180 = lurus)
  { sendi: 'lutut', a: 'pinggul', b: 'lutut', c: 'pergelangan-kaki', fleksi: false },
  { sendi: 'pinggul', a: 'bahu', b: 'pinggul', c: 'lutut', fleksi: false },
];
