// Menyiapkan aset MediaPipe agar disajikan dari domain sendiri (Bab 4.3):
// - menyalin runtime WASM dari paket @mediapipe/tasks-vision yang versinya dikunci di package.json
// - mengunduh model Pose Landmarker Lite (float16, versi 1) dari penyimpanan resmi MediaPipe
//   dan memverifikasi SHA-256 agar model yang dipakai selalu sama persis.
// Idempoten: file yang sudah ada dan cocok tidak diunduh ulang.
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wasmSrc = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const wasmDest = join(root, 'public', 'mediapipe', 'wasm');
const modelDest = join(root, 'public', 'mediapipe', 'models');

const WASM_FILES = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
];

const MODELS = [
  {
    file: 'pose_landmarker_lite.task',
    url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    sha256: process.env.PULIHIN_POSE_MODEL_SHA256 ?? null,
  },
];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function copyWasm() {
  await mkdir(wasmDest, { recursive: true });
  for (const name of WASM_FILES) {
    const src = join(wasmSrc, name);
    const dest = join(wasmDest, name);
    const [a, b] = await Promise.all([stat(src), exists(dest).then((ok) => (ok ? stat(dest) : null))]);
    if (b && b.size === a.size) continue;
    await copyFile(src, dest);
    console.log(`[mediapipe] salin ${name}`);
  }
}

async function fetchModels() {
  await mkdir(modelDest, { recursive: true });
  const lockPath = join(root, 'scripts', 'mediapipe-models.lock.json');
  const lock = (await exists(lockPath)) ? JSON.parse(await readFile(lockPath, 'utf8')) : {};
  for (const model of MODELS) {
    const dest = join(modelDest, model.file);
    const expected = model.sha256 ?? lock[model.file]?.sha256 ?? null;
    if (await exists(dest)) {
      const digest = sha256(await readFile(dest));
      if (!expected || digest === expected) {
        if (!expected) lock[model.file] = { url: model.url, sha256: digest };
        continue;
      }
      console.warn(`[mediapipe] hash ${model.file} tidak cocok, unduh ulang`);
    }
    console.log(`[mediapipe] unduh ${model.url}`);
    const res = await fetch(model.url);
    if (!res.ok) throw new Error(`Gagal mengunduh ${model.url}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const digest = sha256(buf);
    if (expected && digest !== expected) {
      throw new Error(`SHA-256 ${model.file} = ${digest}, diharapkan ${expected}`);
    }
    await writeFile(dest, buf);
    lock[model.file] = { url: model.url, sha256: digest };
    console.log(`[mediapipe] ${model.file} ${(buf.length / 1e6).toFixed(1)} MB sha256=${digest}`);
  }
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

await copyWasm();
await fetchModels();
