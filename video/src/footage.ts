import manifest from './footage-manifest.json';

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
  /** Kunci relatif terhadap public/audio/, misalnya "narasi/N01.mp3". */
  audio: Record<string, InfoBerkas>;
}

const M = manifest as Manifest;

/** Info rekaman di public/footage/, atau undefined bila slot masih kosong. */
export const infoFootage = (berkas: string): InfoBerkas | undefined => M.footage[berkas];

/** `jalur` relatif terhadap public/, misalnya "audio/narasi/N05.mp3". */
export const adaAudio = (jalur: string): boolean => jalur.replace(/^audio\//, '') in M.audio;
