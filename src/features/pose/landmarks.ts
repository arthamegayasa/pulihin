import type { Sisi } from '@/types';
import type { ExerciseDefinition, Landmark, Metrik, NamaTitik } from './types';

/**
 * Peta 33 landmark MediaPipe Pose Landmarker ke nama titik Bahasa Indonesia.
 *
 * Sisi kiri/kanan = sisi ANATOMIS pasien (bukan sisi gambar). MediaPipe memakai konvensi
 * yang sama: indeks 11 "left_shoulder" adalah bahu kiri orang itu. Pada kamera depan yang
 * tidak dicerminkan, pasien yang menghadap kamera tampak dengan bahu kirinya di sisi KANAN
 * gambar. Karena itu `opts.sisi = 'kiri'` selalu berarti lengan/tungkai kiri pasien, apa pun
 * pencerminan tampilan di layar.
 */
export const INDEKS_MEDIAPIPE: Readonly<Record<NamaTitik, Readonly<Record<Sisi, number>>>> = {
  hidung: { kiri: 0, kanan: 0 },
  telinga: { kiri: 7, kanan: 8 },
  bahu: { kiri: 11, kanan: 12 },
  siku: { kiri: 13, kanan: 14 },
  pergelangan: { kiri: 15, kanan: 16 },
  pinggul: { kiri: 23, kanan: 24 },
  lutut: { kiri: 25, kanan: 26 },
  'pergelangan-kaki': { kiri: 27, kanan: 28 },
  tumit: { kiri: 29, kanan: 30 },
  'ujung-kaki': { kiri: 31, kanan: 32 },
};

export const JUMLAH_LANDMARK = 33;

/** Ambang keterlihatan landmark (Bab 7.1): di bawah ini frame diabaikan. */
export const AMBANG_VISIBILITAS = 0.5;

export function indeksTitik(titik: NamaTitik, sisi: Sisi): number {
  return INDEKS_MEDIAPIPE[titik][sisi];
}

export function sisiLawan(sisi: Sisi): Sisi {
  return sisi === 'kiri' ? 'kanan' : 'kiri';
}

/** Sisi yang dipantau sebuah latihan: sisi pilihan pasien, atau keduanya untuk latihan simetris/bergantian. */
export function sisiDipantau(def: ExerciseDefinition, sisi: Sisi): Sisi[] {
  return def.sisi === 'keduanya' ? ['kiri', 'kanan'] : [sisi];
}

/** Indeks unik landmark kunci latihan (overlay + syarat keterlihatan), urut naik. */
export function indeksTitikKunci(def: ExerciseDefinition, sisi: Sisi): number[] {
  const hasil = new Set<number>();
  for (const s of sisiDipantau(def, sisi)) {
    for (const t of def.titikKunci) hasil.add(indeksTitik(t, s));
  }
  return [...hasil].sort((a, b) => a - b);
}

/** Indeks landmark yang wajib terlihat agar metrik dapat dihitung untuk satu sisi. */
export function indeksMetrik(metrik: Exclude<Metrik, { jenis: 'bergantian' }>, sisi: Sisi): number[] {
  const bahuKedua = [INDEKS_MEDIAPIPE.bahu.kiri, INDEKS_MEDIAPIPE.bahu.kanan];
  switch (metrik.jenis) {
    case 'sudut':
      return [
        indeksTitik(metrik.a, metrik.aSisiLawan ? sisiLawan(sisi) : sisi),
        indeksTitik(metrik.b, sisi),
        indeksTitik(metrik.c, sisi),
      ];
    case 'kenaikan':
      return [indeksTitik(metrik.titik, sisi)];
    case 'jarak':
      return [indeksTitik(metrik.dari, sisi), indeksTitik(metrik.ke, sisi), ...bahuKedua];
    case 'rotasi-bahu':
      return bahuKedua;
  }
}

/**
 * Landmark terlihat bila koordinatnya hingga dan visibility >= ambang.
 * visibility yang tidak diisi dianggap terlihat (sumber data tanpa skor keyakinan).
 */
export function terlihat(lm: Landmark | undefined, ambang = AMBANG_VISIBILITAS): boolean {
  if (!lm || !Number.isFinite(lm.x) || !Number.isFinite(lm.y)) return false;
  return lm.visibility === undefined || lm.visibility >= ambang;
}

export function semuaTerlihat(
  landmarks: readonly Landmark[] | undefined,
  indeks: readonly number[],
  ambang = AMBANG_VISIBILITAS,
): boolean {
  if (!landmarks) return false;
  for (const i of indeks) if (!terlihat(landmarks[i], ambang)) return false;
  return true;
}

/**
 * Garis kerangka tubuh untuk overlay (pasangan indeks MediaPipe). Hanya badan dan anggota gerak;
 * detail wajah dan jari sengaja dilewati agar overlay ringan dan mudah dibaca.
 */
export const POSE_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  // bahu & lengan
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  // batang tubuh
  [11, 23],
  [12, 24],
  [23, 24],
  // tungkai
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  // kaki
  [27, 29],
  [29, 31],
  [27, 31],
  [28, 30],
  [30, 32],
  [28, 32],
];
