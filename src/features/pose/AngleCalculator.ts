import type { Sisi } from '@/types';
import { AMBANG_VISIBILITAS, INDEKS_MEDIAPIPE, indeksMetrik, indeksTitik, semuaTerlihat } from './landmarks';
import type { Landmark, Metrik, NamaTitik, PoseFrame } from './types';

/**
 * Perhitungan sudut & metrik (Bab 7.1).
 *
 * Keputusan 2D/3D (lihat docs/algoritma.md): sudut sendi dihitung dari `worldLandmarks` (3D, meter)
 * bila tersedia, karena sudut 3D tidak berubah ketika tubuh berputar terhadap kamera. Dengan begitu
 * ponsel dapat diletakkan DI DEPAN pasien dan tetap mengukur gerak bidang sagital (fleksi siku,
 * fleksi bahu, ekstensi lutut), sementara koreksi bidang frontal (bahu miring, bahu terangkat)
 * diukur pada gambar 2D dari sudut pandang yang sama. Tanpa worldLandmarks, sudut dihitung dari
 * koordinat gambar yang dikoreksi rasio aspek (x * aspect, y).
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type BasisKoordinat = '3d' | '2d';
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

/** Basis koordinat untuk frame ini: 3D bila diizinkan dan worldLandmarks lengkap. */
export function basisFrame(frame: PoseFrame, izinkan3D: boolean): BasisKoordinat {
  return izinkan3D && frame.worldLandmarks !== undefined && frame.worldLandmarks.length >= 33 ? '3d' : '2d';
}

/** Titik ke-i dalam basis yang dipilih. Keterlihatan selalu dinilai dari landmark gambar. */
export function titikBasis(frame: PoseFrame, i: number, basis: BasisKoordinat): Vec3 {
  if (basis === '3d') {
    const w = frame.worldLandmarks![i];
    return { x: w.x, y: w.y, z: w.z };
  }
  return titik2D(frame.landmarks[i], frame.aspect);
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
  return sudutDi(titikBasis(frame, ia, basis), titikBasis(frame, ib, basis), titikBasis(frame, ic, basis));
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

/** Kemiringan garis bahu dari horizontal pada gambar, derajat 0..90 (koreksi badan-miring). */
export function kemiringanBahu(frame: PoseFrame, ambangVisibilitas = AMBANG_VISIBILITAS): number | null {
  if (!semuaTerlihat(frame.landmarks, [BAHU_KIRI, BAHU_KANAN], ambangVisibilitas)) return null;
  const l = titik2D(frame.landmarks[BAHU_KIRI], frame.aspect);
  const r = titik2D(frame.landmarks[BAHU_KANAN], frame.aspect);
  return Math.atan2(Math.abs(l.y - r.y), Math.abs(l.x - r.x)) * RAD;
}

/**
 * Sudut garis bahu terhadap bidang kamera dari landmark dunia: atan2(dz, dx), derajat.
 * 0 bila bahu sejajar bidang gambar. Null tanpa worldLandmarks atau bila bahu tidak terlihat.
 */
export function rotasiBahu3D(frame: PoseFrame, ambangVisibilitas = AMBANG_VISIBILITAS): number | null {
  if (basisFrame(frame, true) !== '3d') return null;
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
}

/**
 * Nilai metrik satu sisi untuk satu frame, atau null bila frame harus diabaikan
 * (landmark yang dibutuhkan tidak terlihat, atau acuan belum tersedia untuk metrik relatif).
 *
 * - sudut: dot product di titik b, 3D bila tersedia; `ubah: 'fleksi'` = 180 - sudut,
 *   `ubah: 'selisih-90'` = sudut - 90; `aSisiLawan` mengambil titik a dari sisi berlawanan.
 * - kenaikan: (y acuan - y sekarang) / lebar bahu acuan * 100, dari GAMBAR. Landmark dunia
 *   berpusat di pinggul sehingga tidak bisa melihat seluruh badan naik (jinjit).
 * - jarak: |ke - dari| / lebar bahu * 100, 3D bila tersedia (gerak menggapai mengarah ke kamera).
 * - rotasi-bahu: |atan2(dz, dx) - acuan| dari landmark dunia; tanpa 3D diperkirakan dari
 *   pemendekan lebar bahu pada gambar: acos(lebar / lebar acuan).
 */
export function ukurMetrik(
  metrik: MetrikDasar,
  frame: PoseFrame,
  sisi: Sisi,
  izinkan3D: boolean,
  baseline: Baseline | null,
  ambangVisibilitas = AMBANG_VISIBILITAS,
): HasilMetrik | null {
  if (!semuaTerlihat(frame.landmarks, indeksMetrik(metrik, sisi), ambangVisibilitas)) return null;
  const basis = basisFrame(frame, izinkan3D);
  switch (metrik.jenis) {
    case 'sudut': {
      const [ia, ib, ic] = indeksMetrik(metrik, sisi);
      const s = sudutDi(titikBasis(frame, ia, basis), titikBasis(frame, ib, basis), titikBasis(frame, ic, basis));
      if (s === null) return null;
      const nilai = metrik.ubah === 'fleksi' ? 180 - s : metrik.ubah === 'selisih-90' ? s - 90 : s;
      return { nilai, basis };
    }
    case 'kenaikan': {
      const i = indeksTitik(metrik.titik, sisi);
      const y0 = baseline?.y[i];
      const lebar = baseline?.lebarBahu2D;
      if (y0 === undefined || !lebar) return null;
      return { nilai: ((y0 - frame.landmarks[i].y) / lebar) * 100, basis: '2d' };
    }
    case 'jarak': {
      const dari = titikBasis(frame, indeksTitik(metrik.dari, sisi), basis);
      const ke = titikBasis(frame, indeksTitik(metrik.ke, sisi), basis);
      const lebar = jarak(titikBasis(frame, BAHU_KIRI, basis), titikBasis(frame, BAHU_KANAN, basis));
      if (!(lebar > 1e-9)) return null;
      return { nilai: (jarak(dari, ke) / lebar) * 100, basis };
    }
    case 'rotasi-bahu': {
      if (basis === '3d') {
        const r = rotasiBahu3D(frame, ambangVisibilitas);
        if (r === null) return null;
        return { nilai: Math.abs(selisihSudut(r, baseline?.rotasiBahu3D ?? 0)), basis };
      }
      const lebar = lebarBahu2D(frame, ambangVisibilitas);
      const lebar0 = baseline?.lebarBahu2D;
      if (lebar === null || !lebar0) return null;
      return { nilai: Math.acos(Math.min(1, lebar / lebar0)) * RAD, basis: '2d' };
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
