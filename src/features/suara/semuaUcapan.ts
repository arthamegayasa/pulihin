/**
 * Daftar SEMUA segmen yang bisa diucapkan aplikasi, dari pembangun yang sama dengan yang dipakai halaman
 * (ucapan.ts). Dipakai generator klip (`scripts/suara/buat-suara.mjs`), uji kelengkapan katalog, dan
 * prefetch luring sesi kamera.
 */

import { EXERCISES } from '@/features/pose/exerciseDefinitions';
import { TARGET_MAKS } from '@/features/pose/sesiParams';
import { JUMLAH_KATA_SESI } from '@/features/speech/pilihKata';
import { KATA } from '@/features/speech/wordBank';
import { segmenRingkasanAfasia, segmenSesiAfasia, segmenSesiKamera, type SegmenUcapan, unik } from './ucapan';

/** Semua segmen sesi kamera: 10 latihan, hitungan 1..TARGET_MAKS, semua koreksi, kedua sisi. */
export function segmenSemuaSesiKamera(): readonly SegmenUcapan[] {
  return unik(EXERCISES.flatMap((def) => segmenSesiKamera(def, TARGET_MAKS)));
}

/** Setiap segmen yang bisa diucapkan aplikasi: semua sesi kamera + 100 kata + ringkasan sesi 10 kata. */
export function semuaUcapan(): readonly SegmenUcapan[] {
  return unik([...segmenSemuaSesiKamera(), ...segmenSesiAfasia(KATA), ...segmenRingkasanAfasia(JUMLAH_KATA_SESI)]);
}
