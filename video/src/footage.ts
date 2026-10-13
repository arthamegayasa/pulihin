import manifest from './footage-manifest.json';
import { AUDIO_MUSIK, AUDIO_NARASI_LENGKAP, audioAdegan } from './timeline.ts';

export interface InfoBerkas {
  bytes: number;
  /** Durasi (detik) dari ffprobe; null bila ffprobe tidak tersedia. */
  durasi: number | null;
  lebar: number | null;
  tinggi: number | null;
}

export interface Manifest {
  dipindai: string;
  footage: Record<string, InfoBerkas>;
  audio: Record<string, InfoBerkas>;
}

const M = manifest as Manifest;

/** Info rekaman di public/footage/, atau undefined bila slot masih kosong. */
export const infoFootage = (berkas: string): InfoBerkas | undefined => M.footage[berkas];

/** `jalur` relatif terhadap public/, misalnya "audio/s05-beranda.mp3". */
export const adaAudio = (jalur: string): boolean => jalur.replace(/^audio\//, '') in M.audio;

export const ADA_NARASI_LENGKAP = adaAudio(AUDIO_NARASI_LENGKAP);
export const ADA_MUSIK = adaAudio(AUDIO_MUSIK);

/** Adegan ini punya rekaman narasi terpisah (per adegan atau berkas lengkap). */
export const adaNarasiUntuk = (idAdegan: string): boolean => ADA_NARASI_LENGKAP || adaAudio(audioAdegan(idAdegan));
