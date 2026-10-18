/**
 * Katalog klip suara pra-rekam (ElevenLabs Eleven v4, suara Matilda) di `public/suara/`. Dibuat dan
 * diperbarui oleh `scripts/suara/buat-suara.mjs`; jangan disunting tangan. Kunci = teks segmen persis seperti
 * dibangun ucapan.ts. Nama berkas memuat hash isinya, jadi klip yang diganti selalu ber-URL baru.
 */

import katalog from './katalogSuara.json';

export interface KlipSuara {
  url: string;
  /** Durasi klip (ms). */
  ms: number;
}

const KATALOG: Readonly<Record<string, { berkas: string; ms: number } | undefined>> = katalog;

/** Klip untuk satu segmen, atau null bila belum ada (pemutar lalu memakai speechSynthesis). */
export function klipSuara(teks: string): KlipSuara | null {
  const e = Object.hasOwn(KATALOG, teks) ? KATALOG[teks] : undefined;
  return e ? { url: `/suara/${e.berkas}`, ms: e.ms } : null;
}
