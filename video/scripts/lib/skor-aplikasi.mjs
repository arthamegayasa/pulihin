// Memuat fungsi skor ASLI aplikasi (src/features/pose/scoring.ts) dari repo root, supaya sesi
// demo yang disiapkan untuk rekaman layar memakai rumus yang sama persis dengan aplikasi
// (Bab 5.3). Hook kecil ini menerjemahkan alias Vite `@/` dan impor tanpa ekstensi menjadi
// berkas .ts, lalu mengubah TypeScript menjadi JavaScript dengan transformasi bawaan Node
// (`stripTypeScriptTypes` mode transform; RepCounter.ts memakai parameter property).
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC_APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'src');

const keBerkasTs = (dasar) => {
  for (const calon of [`${dasar}.ts`, join(dasar, 'index.ts')]) {
    if (existsSync(calon)) return pathToFileURL(calon).href;
  }
  return null;
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const url = keBerkasTs(join(SRC_APP, specifier.slice(2)));
      if (url) return { url, shortCircuit: true, format: 'module-typescript' };
    }
    const dariApp = context.parentURL?.startsWith(pathToFileURL(SRC_APP).href);
    if (dariApp && specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const url = keBerkasTs(join(dirname(fileURLToPath(context.parentURL)), specifier));
      if (url) return { url, shortCircuit: true, format: 'module-typescript' };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(pathToFileURL(SRC_APP).href) && url.endsWith('.ts')) {
      const kode = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', source: stripTypeScriptTypes(kode, { mode: 'transform' }), shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const scoring = await import(pathToFileURL(join(SRC_APP, 'features', 'pose', 'scoring.ts')).href);
const definisi = await import(pathToFileURL(join(SRC_APP, 'features', 'pose', 'exerciseDefinitions.ts')).href);

/** `hitungSkor` milik aplikasi (scoring.ts). */
export const hitungSkor = scoring.hitungSkor;
/** `getExercise` milik aplikasi (exerciseDefinitions.ts). */
export const getExercise = definisi.getExercise;
