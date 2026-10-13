import type { ExerciseDefinition } from './types';

/**
 * Pustaka 10 latihan (Bab 6). KONTRAK: id di bawah ini tetap; isi lengkap oleh agen PoseCore.
 * Urutan: 1 fleksi-bahu, 2 fleksi-siku, 3 abduksi-bahu, 4 ekstensi-lutut, 5 abduksi-pinggul,
 * 6 duduk-berdiri, 7 jinjit, 8 menggapai, 9 putar-badan, 10 langkah-duduk.
 */
export const EXERCISES: ExerciseDefinition[] = [];

export const EXERCISE_IDS = [
  'fleksi-bahu',
  'fleksi-siku',
  'abduksi-bahu',
  'ekstensi-lutut',
  'abduksi-pinggul',
  'duduk-berdiri',
  'jinjit',
  'menggapai',
  'putar-badan',
  'langkah-duduk',
] as const;

export type ExerciseId = (typeof EXERCISE_IDS)[number];

export function getExercise(id: string): ExerciseDefinition | undefined {
  return EXERCISES.find((e) => e.id === id);
}
