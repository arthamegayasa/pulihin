import { LEBAR, TINGGI } from './timeline.ts';

export const WARNA = {
  primer: '#0B4F4A',
  latar: '#EAF2F0',
  aksen: '#C46A1B',
  teks: '#1A2B2E',
  putih: '#FFFFFF',
  bezel: '#121A1C',
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

export const BAYANGAN = '0 24px 60px rgba(11, 79, 74, 0.16), 0 4px 14px rgba(26, 43, 46, 0.08)';
