import type { Sisi } from '@/types';
import type { Vec3 } from './AngleCalculator';
import { createTracker } from './tracker';
import type { ExerciseDefinition, Landmark, PoseFrame, TrackerOptions, TrackerResult, TrackerSnapshot } from './types';

/**
 * Generator PoseFrame sintetis yang deterministik (PRNG ber-seed) untuk uji algoritma tanpa kamera.
 *
 * Model: kerangka tubuh kaku sederhana (ukuran orang dewasa) dibangun dalam koordinat adegan
 * (meter; x ke kanan gambar = sisi KIRI pasien yang menghadap kamera, y ke bawah, z menjauhi kamera),
 * lalu diproyeksikan perspektif ke kamera ponsel tegak 480x640 (fokus 500 px) dan diubah menjadi
 * worldLandmarks (berpusat di tengah pinggul, seperti MediaPipe). Derau sudut (derajat) diberikan
 * pada parameter sendi, derau piksel pada landmark gambar, dan derau dunia sebanding (z 3x lebih
 * besar karena kedalaman MediaPipe paling tidak akurat). Data ini SIMULASI, bukan hasil perangkat.
 */

export type GerakanSintetis =
  | 'fleksi-bahu'
  | 'fleksi-siku'
  | 'abduksi-bahu'
  | 'ekstensi-lutut'
  | 'menggapai'
  | 'putar-badan'
  | 'langkah-duduk'
  | 'abduksi-pinggul'
  | 'jinjit'
  | 'duduk-berdiri'
  | 'diam';

export type Rentang = number | readonly [number, number];

export interface JendelaWaktu {
  mulaiDetik: number;
  selesaiDetik: number;
}

export interface OpsiSintetis {
  gerakan: GerakanSintetis;
  /** Sisi yang dilatih (bawaan kanan). */
  sisi?: Sisi;
  jumlahRepetisi?: number;
  /** Durasi satu repetisi (naik + tahan + turun), detik; angka atau rentang acak [min, max]. */
  durasiRepetisiDetik?: Rentang;
  /** Istirahat di posisi bawah antar repetisi, detik. */
  jedaDetik?: Rentang;
  /** Tahan di posisi atas, detik. */
  tahanAtasDetik?: Rentang;
  /** Amplitudo relatif gerakan penuh (1 = penuh, 0,5 = setengah); angka atau rentang acak [min, max]. */
  amplitudo?: Rentang;
  /** Amplitudo per repetisi (indeks = urutan repetisi); menimpa `amplitudo` untuk repetisi yang terisi. */
  amplitudoPerRepetisi?: readonly number[];
  fps?: number;
  /** Simpangan baku derau sudut sendi, derajat. */
  derauSudut?: number;
  /** Simpangan baku derau posisi landmark gambar, piksel. */
  derauPx?: number;
  /** Peluang satu frame tanpa deteksi tubuh (null). */
  peluangHilang?: number;
  /** Peluang satu frame dengan 2 landmark kunci ber-visibility rendah dan posisi kacau. */
  peluangBuram?: number;
  /** Bahu sisi yang dilatih terangkat sejauh `meter` di dalam jendela waktu. */
  angkatBahu?: JendelaWaktu & { meter: number };
  /** Batang tubuh miring ke samping `derajat` di dalam jendela waktu. */
  miring?: JendelaWaktu & { derajat: number };
  /** Tubuh tidak terdeteksi (frame null) di dalam jendela waktu. */
  keluarFrame?: JendelaWaktu;
  /** Rotasi tubuh terhadap kamera pada sumbu tegak, derajat (0 = menghadap kamera). */
  yawDerajat?: number;
  awalDiamDetik?: number;
  akhirDiamDetik?: number;
  /** Paksa durasi total (mis. untuk gerakan 'diam'). */
  durasiTotalDetik?: number;
  seed?: number;
  /** Tanpa worldLandmarks (memaksa jalur 2D). */
  tanpaDunia?: boolean;
}

export interface RepetisiSintetis {
  /** ms */
  mulai: number;
  puncak: number;
  selesai: number;
  amplitudo: number;
}

export interface SesiSintetis {
  frames: Array<{ t: number; frame: PoseFrame | null }>;
  repetisi: RepetisiSintetis[];
  /** Waktu frame pertama dan terakhir, ms. */
  tAwal: number;
  tAkhir: number;
}

/** Parameter sendi kerangka (derajat / meter). */
export interface ParamPose {
  postur: 'duduk' | 'berdiri';
  /** Sudut lengan atas dari batang tubuh ke depan. */
  bahuFleksi: Record<Sisi, number>;
  /** Sudut lengan atas dari batang tubuh ke samping. */
  bahuAbduksi: Record<Sisi, number>;
  /** 180 - sudut dalam siku. */
  sikuFleksi: Record<Sisi, number>;
  /** Pelurusan lutut dari posisi duduk 90 derajat (sudut dalam lutut = 90 + nilai). */
  lututLurus: Record<Sisi, number>;
  /** Fleksi pinggul tambahan (mengangkat lutut saat duduk). */
  pinggulAngkat: Record<Sisi, number>;
  /** Abduksi pinggul (tungkai ke samping). */
  pinggulAbduksi: Record<Sisi, number>;
  /** Elevasi bahu (shrug), meter. */
  angkatBahu: Record<Sisi, number>;
  /** Rotasi batang tubuh terhadap panggul, derajat. */
  rotasiBatang: number;
  /** Kemiringan batang tubuh ke samping, derajat. */
  miringBatang: number;
  /** Condong batang tubuh ke depan, derajat. */
  condongDepan: number;
  /** Kenaikan tumit, meter. */
  jinjit: number;
  /** Elevasi paha untuk duduk ke berdiri: 0 = duduk, 90 = berdiri. */
  elevasiPaha: number;
}

export interface Kamera {
  lebar: number;
  tinggi: number;
  fokusPx: number;
  /** Jarak kamera ke pinggul saat istirahat, meter. */
  jarak: number;
  /** Tinggi kamera relatif pinggul saat istirahat (y ke bawah), meter. */
  tinggiY: number;
}

const RAD = Math.PI / 180;
const TANDA: Record<Sisi, number> = { kiri: 1, kanan: -1 };
const SISI: readonly Sisi[] = ['kiri', 'kanan'];

// Ukuran tubuh (meter)
const PAHA = 0.42;
const BETIS = 0.42;
const LENGAN_ATAS = 0.3;
const LENGAN_BAWAH = 0.27;
const SETENGAH_BAHU = 0.18;
const SETENGAH_PINGGUL = 0.1;
const BATANG = 0.5;

/** PRNG mulberry32: deterministik dan cepat. */
export function buatAcak(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(acak: () => number): number {
  const u = Math.max(acak(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * acak());
}

function ambil(r: Rentang, acak: () => number): number {
  return typeof r === 'number' ? r : r[0] + (r[1] - r[0]) * acak();
}

const tambah = (a: Vec3, b: Vec3, k = 1): Vec3 => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });

function rotX(v: Vec3, sudut: number): Vec3 {
  const c = Math.cos(sudut);
  const s = Math.sin(sudut);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

function rotY(v: Vec3, sudut: number): Vec3 {
  const c = Math.cos(sudut);
  const s = Math.sin(sudut);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

function rotZ(v: Vec3, sudut: number): Vec3 {
  const c = Math.cos(sudut);
  const s = Math.sin(sudut);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
}

function normal(v: Vec3): Vec3 | null {
  const n = Math.hypot(v.x, v.y, v.z);
  return n < 1e-9 ? null : { x: v.x / n, y: v.y / n, z: v.z / n };
}

export function paramAwal(postur: ParamPose['postur'] = 'duduk'): ParamPose {
  const dua = (n: number): Record<Sisi, number> => ({ kiri: n, kanan: n });
  return {
    postur,
    bahuFleksi: dua(5),
    bahuAbduksi: dua(6),
    sikuFleksi: dua(10),
    lututLurus: dua(0),
    pinggulAngkat: dua(0),
    pinggulAbduksi: dua(2),
    angkatBahu: dua(0),
    rotasiBatang: 0,
    miringBatang: 0,
    condongDepan: 0,
    jinjit: 0,
    elevasiPaha: postur === 'berdiri' ? 90 : 0,
  };
}

/** Bangun 33 titik dalam koordinat adegan (asal = tengah pinggul saat istirahat). */
export function bangunAdegan(p: ParamPose): Vec3[] {
  const titik: Vec3[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0 }));
  const g = p.elevasiPaha * RAD;
  // Lutut tetap di tempat; panggul bergerak saat duduk ke berdiri.
  const panggul: Vec3 = { x: 0, y: -PAHA * Math.sin(g), z: -PAHA + PAHA * Math.cos(g) };
  const naik: Vec3 = { x: 0, y: -p.jinjit, z: 0 };

  for (const s of SISI) {
    const k = TANDA[s];
    const abd = -k * p.pinggulAbduksi[s] * RAD;
    const pinggul = tambah(panggul, { x: k * SETENGAH_PINGGUL, y: 0, z: 0 });
    const a = g - p.pinggulAngkat[s] * RAD;
    const paha = rotZ({ x: 0, y: Math.sin(a), z: -Math.cos(a) }, abd);
    const lutut = tambah(pinggul, paha, PAHA);
    const e = p.lututLurus[s] * RAD;
    const betis = rotZ({ x: 0, y: Math.cos(e), z: -Math.sin(e) }, abd);
    const pergelanganKaki = tambah(lutut, betis, BETIS);
    const depan: Vec3 = { x: 0, y: betis.z, z: -betis.y };
    const tumit = tambah(tambah(pergelanganKaki, betis, 0.05), depan, -0.06);
    const ujung = tambah(tambah(pergelanganKaki, betis, 0.07), depan, 0.15);
    const i = s === 'kiri' ? 0 : 1;
    titik[23 + i] = tambah(pinggul, naik);
    titik[25 + i] = tambah(lutut, naik);
    titik[27 + i] = tambah(pergelanganKaki, naik);
    titik[29 + i] = tambah(tumit, naik);
    titik[31 + i] = ujung; // ujung kaki tetap menapak saat jinjit
  }

  // Batang tubuh atas dalam koordinat lokal panggul.
  const lokal: Array<[number, Vec3]> = [
    [0, { x: 0, y: -0.66, z: -0.09 }],
    [1, { x: 0.02, y: -0.7, z: -0.07 }],
    [2, { x: 0.035, y: -0.7, z: -0.07 }],
    [3, { x: 0.05, y: -0.7, z: -0.06 }],
    [4, { x: -0.02, y: -0.7, z: -0.07 }],
    [5, { x: -0.035, y: -0.7, z: -0.07 }],
    [6, { x: -0.05, y: -0.7, z: -0.06 }],
    [7, { x: 0.075, y: -0.68, z: 0.02 }],
    [8, { x: -0.075, y: -0.68, z: 0.02 }],
    [9, { x: 0.025, y: -0.62, z: -0.08 }],
    [10, { x: -0.025, y: -0.62, z: -0.08 }],
  ];
  for (const s of SISI) {
    const k = TANDA[s];
    const i = s === 'kiri' ? 0 : 1;
    const bahu: Vec3 = { x: k * SETENGAH_BAHU, y: -BATANG - p.angkatBahu[s], z: 0 };
    const phi = p.bahuAbduksi[s] * RAD;
    const atas = rotX({ x: k * Math.sin(phi), y: Math.cos(phi), z: 0 }, -p.bahuFleksi[s] * RAD);
    const siku = tambah(bahu, atas, LENGAN_ATAS);
    const maju = { x: 0, y: 0, z: -1 };
    const dot = maju.z * atas.z;
    const tegak = normal(tambah(maju, atas, -dot)) ?? { x: 0, y: -1, z: 0 };
    const b = p.sikuFleksi[s] * RAD;
    const cb = Math.cos(b);
    const bawah = tambah({ x: atas.x * cb, y: atas.y * cb, z: atas.z * cb }, tegak, Math.sin(b));
    const pergelangan = tambah(siku, bawah, LENGAN_BAWAH);
    const ujungTangan = tambah(pergelangan, bawah, 0.07);
    lokal.push(
      [11 + i, bahu],
      [13 + i, siku],
      [15 + i, pergelangan],
      [17 + i, tambah(ujungTangan, { x: k * 0.02, y: 0, z: 0 })],
      [19 + i, ujungTangan],
      [21 + i, tambah(ujungTangan, { x: -k * 0.02, y: 0, z: -0.02 })],
    );
  }
  for (const [i, v] of lokal) {
    let r = rotY(v, p.rotasiBatang * RAD);
    r = rotX(r, p.condongDepan * RAD);
    r = rotZ(r, p.miringBatang * RAD);
    titik[i] = tambah(tambah(r, panggul), naik);
  }

  const asal: Vec3 = p.postur === 'berdiri' ? { x: 0, y: -PAHA, z: -PAHA } : { x: 0, y: 0, z: 0 };
  return titik.map((v) => tambah(v, asal, -1));
}

export function kameraBawaan(gerakan: GerakanSintetis): Kamera {
  const dasar = { lebar: 480, tinggi: 640, fokusPx: 500 };
  switch (gerakan) {
    case 'abduksi-pinggul':
    case 'jinjit':
      return { ...dasar, jarak: 2.3, tinggiY: -0.1 };
    case 'duduk-berdiri':
      return { ...dasar, jarak: 2.3, tinggiY: -0.35 };
    case 'ekstensi-lutut':
    case 'langkah-duduk':
      return { ...dasar, jarak: 1.5, tinggiY: -0.15 };
    default:
      return { ...dasar, jarak: 1.3, tinggiY: -0.25 };
  }
}

export interface OpsiProyeksi {
  yawDerajat?: number;
  derauPx?: number;
  tanpaDunia?: boolean;
  acak?: () => number;
}

/** Proyeksikan titik adegan menjadi PoseFrame (landmark gambar + dunia). */
export function proyeksikan(adegan: readonly Vec3[], kamera: Kamera, t: number, o: OpsiProyeksi = {}): PoseFrame {
  const acak = o.acak ?? buatAcak(1);
  const derauPx = o.derauPx ?? 0;
  const yaw = (o.yawDerajat ?? 0) * RAD;
  const titik = adegan.map((v) => rotY(v, yaw));
  const tengah = { x: (titik[23].x + titik[24].x) / 2, y: (titik[23].y + titik[24].y) / 2, z: (titik[23].z + titik[24].z) / 2 };
  const sigmaDunia = (derauPx * kamera.jarak) / kamera.fokusPx;

  const landmarks: Landmark[] = [];
  const worldLandmarks: Landmark[] = [];
  for (const v of titik) {
    const zc = v.z + kamera.jarak;
    const x = (kamera.lebar / 2 + (kamera.fokusPx * v.x) / zc + gauss(acak) * derauPx) / kamera.lebar;
    const y = (kamera.tinggi / 2 + (kamera.fokusPx * (v.y - kamera.tinggiY)) / zc + gauss(acak) * derauPx) / kamera.tinggi;
    const dalam = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    const visibility = dalam ? 0.9 + 0.09 * acak() : 0.05;
    landmarks.push({ x, y, z: (v.z * kamera.fokusPx) / (kamera.jarak * kamera.lebar), visibility });
    worldLandmarks.push({
      x: v.x - tengah.x + gauss(acak) * sigmaDunia,
      y: v.y - tengah.y + gauss(acak) * sigmaDunia,
      z: v.z - tengah.z + gauss(acak) * sigmaDunia * 3,
      visibility,
    });
  }
  return {
    landmarks,
    worldLandmarks: o.tanpaDunia ? undefined : worldLandmarks,
    t,
    aspect: kamera.lebar / kamera.tinggi,
  };
}

/** Postur dan parameter gerak pada fase q (0 = istirahat, 1 = puncak penuh). */
function terapkanGerakan(p: ParamPose, g: GerakanSintetis, sisi: Sisi, q: number, ke: number): void {
  switch (g) {
    case 'fleksi-bahu':
      p.bahuFleksi[sisi] = 8 + 117 * q;
      return;
    case 'fleksi-siku':
      p.bahuFleksi[sisi] = 5;
      p.sikuFleksi[sisi] = 10 + 130 * q;
      return;
    case 'abduksi-bahu':
      p.bahuAbduksi[sisi] = 8 + 102 * q;
      return;
    case 'ekstensi-lutut':
      p.lututLurus[sisi] = 82 * q;
      return;
    case 'menggapai':
      p.bahuFleksi[sisi] = 55 + 35 * q;
      p.sikuFleksi[sisi] = 125 - 120 * q;
      p.condongDepan = 10 * q;
      return;
    case 'putar-badan':
      p.rotasiBatang = (ke % 2 === 0 ? 1 : -1) * 32 * q;
      return;
    case 'langkah-duduk':
      p.pinggulAngkat[ke % 2 === 0 ? sisi : sisi === 'kiri' ? 'kanan' : 'kiri'] = 20 * q;
      return;
    case 'abduksi-pinggul':
      p.pinggulAbduksi[sisi] = 2 + 33 * q;
      return;
    case 'jinjit':
      p.jinjit = 0.06 * q;
      return;
    case 'duduk-berdiri':
      p.elevasiPaha = 85 * q;
      p.condongDepan = 35 * Math.sin(Math.PI * Math.min(1, q));
      return;
    case 'diam':
      return;
  }
}

function posturGerakan(g: GerakanSintetis): ParamPose['postur'] {
  return g === 'abduksi-pinggul' || g === 'jinjit' ? 'berdiri' : 'duduk';
}

function dalamJendela(detik: number, j: JendelaWaktu | undefined): number {
  if (!j || detik < j.mulaiDetik || detik >= j.selesaiDetik) return 0;
  // Naik dalam 0,1 detik (perubahan tubuh nyata tidak seketika).
  return Math.min(1, (detik - j.mulaiDetik) / 0.1);
}

const INDEKS_KACAU = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

export function buatSesiSintetis(o: OpsiSintetis): SesiSintetis {
  const acak = buatAcak(o.seed ?? 1);
  const sisi = o.sisi ?? 'kanan';
  const fps = o.fps ?? 30;
  const n = o.gerakan === 'diam' ? 0 : (o.jumlahRepetisi ?? 10);
  const kamera = kameraBawaan(o.gerakan);
  const tAwal = 1000;

  const repetisi: RepetisiSintetis[] = [];
  const tahapan: Array<{ mulai: number; naik: number; tahan: number; selesai: number; amp: number }> = [];
  let kursor = tAwal + (o.awalDiamDetik ?? 2) * 1000;
  for (let r = 0; r < n; r++) {
    const durasi = ambil(o.durasiRepetisiDetik ?? [2.5, 3.5], acak) * 1000;
    const tahan = Math.min(durasi * 0.5, ambil(o.tahanAtasDetik ?? 0.3, acak) * 1000);
    const amp = o.amplitudoPerRepetisi?.[r] ?? ambil(o.amplitudo ?? 1, acak);
    const naik = (durasi - tahan) / 2;
    tahapan.push({ mulai: kursor, naik, tahan, selesai: kursor + durasi, amp });
    repetisi.push({ mulai: kursor, puncak: kursor + naik + tahan / 2, selesai: kursor + durasi, amplitudo: amp });
    kursor += durasi + ambil(o.jedaDetik ?? [0.8, 1.2], acak) * 1000;
  }
  const tAkhir = o.durasiTotalDetik !== undefined ? tAwal + o.durasiTotalDetik * 1000 : kursor + (o.akhirDiamDetik ?? 1.5) * 1000;

  const frames: SesiSintetis['frames'] = [];
  const langkah = 1000 / fps;
  let iTahap = 0;
  const postur = posturGerakan(o.gerakan);
  for (let i = 0; tAwal + i * langkah <= tAkhir; i++) {
    const t = tAwal + i * langkah;
    const detik = (t - tAwal) / 1000;
    while (iTahap < tahapan.length - 1 && t >= tahapan[iTahap].selesai) iTahap++;
    let q = 0;
    const th = tahapan[iTahap];
    if (th && t >= th.mulai && t < th.selesai) {
      const dt = t - th.mulai;
      if (dt < th.naik) q = (1 - Math.cos((Math.PI * dt) / th.naik)) / 2;
      else if (dt < th.naik + th.tahan) q = 1;
      else q = (1 + Math.cos((Math.PI * (dt - th.naik - th.tahan)) / th.naik)) / 2;
      q *= th.amp;
    }

    const p = paramAwal(postur);
    terapkanGerakan(p, o.gerakan, sisi, q, iTahap);
    p.angkatBahu[sisi] += (o.angkatBahu?.meter ?? 0) * dalamJendela(detik, o.angkatBahu);
    p.miringBatang += (o.miring?.derajat ?? 0) * dalamJendela(detik, o.miring);
    const ds = o.derauSudut ?? 0;
    if (ds > 0) {
      for (const s of SISI) {
        p.bahuFleksi[s] += gauss(acak) * ds;
        p.bahuAbduksi[s] += gauss(acak) * ds;
        p.sikuFleksi[s] += gauss(acak) * ds;
        p.lututLurus[s] += gauss(acak) * ds;
        p.pinggulAngkat[s] += gauss(acak) * ds;
        p.pinggulAbduksi[s] += gauss(acak) * ds;
      }
      p.rotasiBatang += gauss(acak) * ds;
      p.miringBatang += gauss(acak) * ds * 0.5;
      p.elevasiPaha += gauss(acak) * ds;
    }

    const ko = o.keluarFrame;
    const hilang = acak() < (o.peluangHilang ?? 0) || (ko !== undefined && detik >= ko.mulaiDetik && detik < ko.selesaiDetik);
    if (hilang) {
      frames.push({ t, frame: null });
      continue;
    }
    const frame = proyeksikan(bangunAdegan(p), kamera, t, {
      yawDerajat: o.yawDerajat,
      derauPx: o.derauPx,
      tanpaDunia: o.tanpaDunia,
      acak,
    });
    if (acak() < (o.peluangBuram ?? 0)) {
      for (let j = 0; j < 2; j++) {
        const idx = INDEKS_KACAU[Math.floor(acak() * INDEKS_KACAU.length)];
        const lm = frame.landmarks[idx];
        lm.visibility = 0.2 + 0.25 * acak();
        lm.x += (acak() - 0.5) * 0.4;
        lm.y += (acak() - 0.5) * 0.4;
        const w = frame.worldLandmarks?.[idx];
        if (w) {
          w.visibility = lm.visibility;
          w.x += (acak() - 0.5) * 0.6;
          w.y += (acak() - 0.5) * 0.6;
          w.z += (acak() - 0.5) * 0.6;
        }
      }
    }
    frames.push({ t, frame });
  }
  return { frames, repetisi, tAwal, tAkhir };
}

export interface HasilJalan {
  snapshot: Array<{ t: number; s: TrackerSnapshot }>;
  hasil: TrackerResult;
  /** Waktu (ms) setiap frame dengan repetisiBaru. */
  waktuHitung: number[];
}

/** Jalankan sesi sintetis melalui createTracker, seperti halaman sesi kamera memanggilnya. */
export function jalankanSintetis(
  def: ExerciseDefinition,
  sesi: SesiSintetis,
  opsi: Partial<TrackerOptions> = {},
): HasilJalan {
  const tracker = createTracker(def, { sisi: 'kanan', targetRepetisi: def.targetRepetisiDefault, ...opsi });
  const snapshot: HasilJalan['snapshot'] = [];
  const waktuHitung: number[] = [];
  for (const { t, frame } of sesi.frames) {
    const s = tracker.update(frame, t);
    snapshot.push({ t, s });
    if (s.repetisiBaru) waktuHitung.push(t);
  }
  return { snapshot, hasil: tracker.finish(sesi.tAkhir), waktuHitung };
}

export interface HasilAkurasi {
  /** Repetisi nyata yang terhitung (tepat satu kali atau lebih). */
  benar: number;
  /** Hitungan tambahan: lebih dari satu hitungan pada satu repetisi, atau hitungan di luar repetisi. */
  ganda: number;
  /** Repetisi nyata yang tidak terhitung. */
  hilang: number;
  /** benar / jumlah repetisi nyata, dikurangi hitungan ganda (0..1). */
  akurasi: number;
}

/**
 * Cocokkan waktu hitungan dengan jendela repetisi nyata [mulai, selesai + toleransi] (dipotong di
 * awal repetisi berikutnya). Akurasi = (benar - ganda) / jumlah repetisi, dibatasi 0..1, agar
 * hitungan ganda menurunkan akurasi sama seperti hitungan yang hilang.
 */
export function cocokkanRepetisi(
  nyata: readonly RepetisiSintetis[],
  waktuHitung: readonly number[],
  toleransiMs = 1500,
): HasilAkurasi {
  const cacah = nyata.map(() => 0);
  let ganda = 0;
  for (const t of waktuHitung) {
    const i = nyata.findIndex(
      (r, j) => t >= r.mulai && t <= Math.min(r.selesai + toleransiMs, nyata[j + 1]?.mulai ?? Infinity),
    );
    if (i === -1) ganda += 1;
    else cacah[i] += 1;
  }
  const benar = cacah.filter((c) => c > 0).length;
  ganda += cacah.reduce((s, c) => s + Math.max(0, c - 1), 0);
  const hilang = cacah.filter((c) => c === 0).length;
  const akurasi = nyata.length === 0 ? 1 : Math.max(0, (benar - ganda) / nyata.length);
  return { benar, ganda, hilang, akurasi };
}
