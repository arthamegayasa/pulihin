import { ucapanKalimatContoh, ucapanKataContoh } from '@/features/suara/ucapan';
import { speak, type SpeakOptions, type TeksUcapan } from '@/lib/speak';
import type { Kata } from './types';

/**
 * Penjaga urutan ucapan tombol "Dengar" (kata lalu kalimat contoh). Setiap putaran memegang token; begitu
 * kata berganti, mikrofon dibuka, atau layar ditutup, token lama tidak berlaku dan kalimat contoh tidak
 * pernah terputar terlambat. Penting karena suara contoh yang tertangkap mikrofon bisa dinilai Benar.
 */
export interface PenjagaUcapan {
  /** Mulai putaran baru (membatalkan putaran sebelumnya). Fungsi hasil bernilai true selama putaran ini berlaku. */
  mulai(): () => boolean;
  /** Batalkan putaran yang sedang berjalan. */
  batalkan(): void;
}

export function buatPenjagaUcapan(): PenjagaUcapan {
  let token = 0;
  return {
    mulai() {
      const milik = ++token;
      return () => milik === token;
    },
    batalkan() {
      token++;
    },
  };
}

export type FungsiUcap = (teks: TeksUcapan, opts?: SpeakOptions) => void;

/** Ucapkan kata pelan-pelan, lalu kalimat contohnya, selama putaran masih berlaku. */
export function putarContohKata(
  kata: Pick<Kata, 'kata' | 'kalimatContoh'>,
  penjaga: PenjagaUcapan,
  ucap: FungsiUcap = speak,
): void {
  const berlaku = penjaga.mulai();
  ucap(ucapanKataContoh(kata), {
    force: true,
    rate: 0.8,
    onEnd: () => {
      if (berlaku()) ucap(ucapanKalimatContoh(kata), { force: true, interrupt: false });
    },
  });
}
