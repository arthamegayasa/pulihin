import { LEBAR, TINGGI } from './timeline.ts';

export const WARNA = {
  primer: '#0B4F4A',
  latar: '#EAF2F0',
  aksen: '#C46A1B',
  /** Aksen di atas footage gelap (oranye lebih terang agar kontras). */
  aksenTerang: '#E8954A',
  teks: '#1A2B2E',
  teksLembut: '#4B5D60',
  putih: '#FFFFFF',
  bezel: '#121A1C',
  /** Latar sinematik gelap (teal sangat tua) di bawah footage AI. */
  malam: '#0A1A19',
} as const;

export const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

/** Kolom kiri (teks) dan zona subtitle. */
export const KIRI = 120;
export const LEBAR_KOLOM = 840;
export const BAWAH_SUBTITLE = 60;

/**
 * Geometri ponsel. Layar 9:20 (1080x2400, rekaman layar Android); rekaman
 * dengan rasio lain di-letterbox (objectFit contain), tidak pernah ditarik.
 */
const BEZEL = 14;
const TINGGI_PONSEL = 960;
const LAYAR_TINGGI = TINGGI_PONSEL - BEZEL * 2;
const LAYAR_LEBAR = Math.round((LAYAR_TINGGI * 9) / 20);
const LEBAR_PONSEL = LAYAR_LEBAR + BEZEL * 2;

export const PONSEL = {
  bezel: BEZEL,
  tinggi: TINGGI_PONSEL,
  lebar: LEBAR_PONSEL,
  atas: (TINGGI - TINGGI_PONSEL) / 2,
  kiri: LEBAR - 190 - LEBAR_PONSEL,
  layarTinggi: LAYAR_TINGGI,
  layarLebar: LAYAR_LEBAR,
} as const;

/** Panel berwarna lembut di belakang ponsel (juga batas kanan footage pada tata split). */
export const PANEL_KIRI = 1130;

/**
 * Bingkai peramban untuk rekaman layar desktop terapis (1920x1080, 16:9) di sisi kanan.
 * Bawah bingkai (y 869) tetap di atas zona subtitle kiri bawah (mulai sekitar y 904).
 */
const PERAMBAN_LEBAR = 1200;
const PERAMBAN_BAR = 44;
export const PERAMBAN = {
  kiri: LEBAR - 100 - PERAMBAN_LEBAR,
  atas: 150,
  lebar: PERAMBAN_LEBAR,
  bar: PERAMBAN_BAR,
  layarTinggi: Math.round((PERAMBAN_LEBAR * 9) / 16),
} as const;
/** Lebar kolom teks kiri pada tata desktop. */
export const LEBAR_KOLOM_DESKTOP = PERAMBAN.kiri - KIRI - 60;

export const BAYANGAN = '0 24px 60px rgba(11, 79, 74, 0.16), 0 4px 14px rgba(26, 43, 46, 0.08)';
