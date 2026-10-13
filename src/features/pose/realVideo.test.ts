import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getExercise } from './exerciseDefinitions';
import { JUMLAH_LANDMARK } from './landmarks';
import { pilihPoseUtama, pusatOrang, type PusatOrang } from './PoseEngine';
import { createTracker } from './tracker';
import type { Landmark, PoseFrame, TrackerOptions, TrackerResult, TrackerSnapshot } from './types';
import type { Sisi } from '@/types';

/**
 * Uji regresi dengan landmark dari rekaman MANUSIA NYATA (bukan perangkat target).
 * Fixture = landmark MediaPipe Pose Landmarker lite (GPU, Chrome desktop) per frame dari video
 * Pexels, lihat src/features/pose/__fixtures__/README.md. Video tidak disimpan di repo.
 */

interface Fixture {
  video: string;
  lebar: number;
  tinggi: number;
  fps: number;
  framePerLoop: number;
  loop: number;
  indeks: number[];
  frames: Array<number[] | null>;
}

const TERSEMBUNYI: Landmark = { x: 0, y: 0, z: 0, visibility: 0 };

function muat(nama: string): { fixture: Fixture; frames: Array<{ t: number; frame: PoseFrame | null }> } {
  const fixture = JSON.parse(readFileSync(new URL(`./__fixtures__/${nama}.json`, import.meta.url), 'utf8')) as Fixture;
  const aspect = fixture.lebar / fixture.tinggi;
  const frames = fixture.frames.map((isi, k) => {
    const t = (k * 1000) / fixture.fps;
    if (!isi) return { t, frame: null };
    const landmarks: Landmark[] = Array.from({ length: JUMLAH_LANDMARK }, () => TERSEMBUNYI);
    const worldLandmarks: Landmark[] = Array.from({ length: JUMLAH_LANDMARK }, () => TERSEMBUNYI);
    fixture.indeks.forEach((i, n) => {
      const [x, y, v, wx, wy, wz] = isi.slice(n * 6, n * 6 + 6);
      landmarks[i] = { x, y, z: 0, visibility: v };
      worldLandmarks[i] = { x: wx, y: wy, z: wz, visibility: v };
    });
    return { t, frame: { landmarks, worldLandmarks, t, aspect } };
  });
  return { fixture, frames };
}

interface HasilVideo {
  fixture: Fixture;
  fps: number;
  hasil: TrackerResult;
  snapshot: TrackerSnapshot[];
  /** Repetisi terhitung per loop video. */
  perLoop: number[];
  /** Nilai metrik (sudah diratakan) tertinggi dan terendah per loop. */
  puncak: number[];
  istirahat: number[];
}

/** `langkah` = ambil tiap frame ke-n (2 -> 12 fps dari rekaman 24 fps, mendekati HP kelas bawah). */
function jalankan(nama: string, latihan: string, sisi: Sisi, opsi: Partial<TrackerOptions> = {}, langkah = 1): HasilVideo {
  const { fixture, frames } = muat(nama);
  const def = getExercise(latihan)!;
  const tracker = createTracker(def, { sisi, targetRepetisi: def.targetRepetisiDefault, ...opsi });
  const perLoop = Array.from({ length: fixture.loop }, () => 0);
  const puncak = Array.from({ length: fixture.loop }, () => -Infinity);
  const istirahat = Array.from({ length: fixture.loop }, () => Infinity);
  const snapshot: TrackerSnapshot[] = [];
  frames.forEach(({ t, frame }, k) => {
    if (k % langkah !== 0) return;
    const s = tracker.update(frame, t);
    const loop = Math.floor(k / fixture.framePerLoop);
    if (s.repetisiBaru) perLoop[loop] += 1;
    if (s.nilai !== null) {
      puncak[loop] = Math.max(puncak[loop], s.nilai);
      istirahat[loop] = Math.min(istirahat[loop], s.nilai);
    }
    snapshot.push(s);
  });
  const hasil = tracker.finish(frames.at(-1)!.t);
  return { fixture, fps: fixture.fps / langkah, hasil, snapshot, perLoop, puncak, istirahat };
}

/** Ganda = hitungan lebih dari satu dalam satu loop; hilang = loop tanpa hitungan. */
function cocok(perLoop: number[], diharapkanPerLoop: number) {
  return {
    ganda: perLoop.reduce((s, n) => s + Math.max(0, n - diharapkanPerLoop), 0),
    hilang: perLoop.reduce((s, n) => s + Math.max(0, diharapkanPerLoop - n), 0),
  };
}

function median(xs: number[]): string {
  const ok = xs.filter(Number.isFinite).sort((a, b) => a - b);
  return ok.length === 0 ? '-' : ok[Math.floor(ok.length / 2)].toFixed(0);
}

const tabel: Array<Record<string, string | number>> = [];

/** `diharapkan` null = kebenaran dasar per loop tidak tegas (hanya dicatat, tidak dicocokkan). */
function catat(nama: string, latihan: string, sisi: Sisi, mode: string, r: HasilVideo, diharapkan: number | null) {
  const { ganda, hilang } = diharapkan === null ? { ganda: NaN, hilang: NaN } : cocok(r.perLoop, diharapkan / r.fixture.loop);
  tabel.push({
    video: nama,
    latihan,
    sisi,
    mode,
    fps: r.fps,
    diharapkan: diharapkan ?? '-',
    terhitung: r.hasil.repetisi,
    ganda: Number.isNaN(ganda) ? '-' : ganda,
    hilang: Number.isNaN(hilang) ? '-' : hilang,
    'puncak/loop': median(r.puncak),
    'istirahat/loop': median(r.istirahat),
    koreksi:
      Object.entries(r.hasil.koreksiTerhitung)
        .map(([id, n]) => `${id} ${n}x`)
        .join(', ') || '-',
  });
  return { ganda, hilang };
}

describe('REKAMAN NYATA: Tekuk Siku (fleksi-siku)', () => {
  // curl2: 8 loop, 1 repetisi per loop, lengan kiri pasien dekat kamera. Repetisi loop pertama
  // dimulai 0,25 s, sebelum status siap (1 s), sehingga paling banyak 1 repetisi boleh hilang.
  it('curl2 sisi kiri (serong ~45-60°): 1 per loop, tanpa ganda, tanpa "badan miring" palsu', () => {
    const r = jalankan('curl2', 'fleksi-siku', 'kiri');
    const { ganda, hilang } = catat('curl2', 'fleksi-siku', 'kiri', 'otomatis (hibrida)', r, 8);
    expect(ganda).toBe(0);
    expect(hilang).toBeLessThanOrEqual(1);
    expect(r.perLoop.slice(1)).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(r.hasil.koreksiTerhitung['badan-miring'] ?? 0).toBe(0);
    expect(r.snapshot.some((s) => s.koreksi?.id === 'badan-miring')).toBe(false);
  });

  it('curl2 sisi kanan (lengan jauh tertutup badan): tidak siap, tetapi memberi tahu sisi lain terlihat', () => {
    const r = jalankan('curl2', 'fleksi-siku', 'kanan');
    catat('curl2', 'fleksi-siku', 'kanan', 'otomatis (hibrida)', r, 0);
    expect(r.hasil.repetisi).toBe(0);
    const setelah1s = r.snapshot.slice(r.fixture.fps * 2);
    expect(setelah1s.every((s) => s.sisiTerlihat?.kiri === true)).toBe(true);
    // Sisi kanan sesekali terdeteksi sesaat; pesan hanya butuh keadaan dominan.
    expect(setelah1s.filter((s) => s.sisiLainTerlihat).length / setelah1s.length).toBeGreaterThan(0.8);
    // Saran "Mundur sedikit" tidak tepat bila hanya sisi lawan yang terlihat.
    expect(r.hasil.koreksiTerhitung['keluar-frame'] ?? 0).toBe(0);
  });

  // seated: 4 loop, tiap lengan 1 repetisi per loop (bergantian). Repetisi kiri loop pertama
  // dimulai 0,33 s (sebelum siap), jadi kiri boleh hilang 1; kanan mulai 4 s sehingga lengkap.
  for (const [sisi, hilangMaks] of [['kiri', 1], ['kanan', 0]] as const) {
    it(`seated sisi ${sisi} (menghadap kamera): 1 per loop, tanpa ganda`, () => {
      const r = jalankan('seated', 'fleksi-siku', sisi);
      const { ganda, hilang } = catat('seated', 'fleksi-siku', sisi, 'otomatis (hibrida)', r, 4);
      expect(ganda).toBe(0);
      expect(hilang).toBeLessThanOrEqual(hilangMaks);
      expect(r.hasil.koreksiTerhitung['badan-miring'] ?? 0).toBe(0);
    });
  }

  it('12 fps (tiap frame ke-2, mendekati HP kelas bawah): hitungan tetap sama', () => {
    const c = jalankan('curl2', 'fleksi-siku', 'kiri', {}, 2);
    expect(catat('curl2', 'fleksi-siku', 'kiri', 'otomatis (hibrida)', c, 8)).toEqual({ ganda: 0, hilang: 1 });
    for (const [sisi, hilangMaks] of [['kiri', 1], ['kanan', 0]] as const) {
      const r = jalankan('seated', 'fleksi-siku', sisi, {}, 2);
      const { ganda, hilang } = catat('seated', 'fleksi-siku', sisi, 'otomatis (hibrida)', r, 4);
      expect(ganda).toBe(0);
      expect(hilang).toBeLessThanOrEqual(hilangMaks);
    }
  });

  it('pembanding: sudut 3D saja tidak menghitung seated maupun curl2 (rentang termampatkan)', () => {
    for (const sisi of ['kiri', 'kanan'] as const) {
      const r = jalankan('seated', 'fleksi-siku', sisi, { modeSudut: '3d' });
      catat('seated', 'fleksi-siku', sisi, '3D saja', r, 4);
      expect(r.hasil.repetisi).toBe(0);
      const r2 = jalankan('seated', 'fleksi-siku', sisi, { modeSudut: '2d' });
      catat('seated', 'fleksi-siku', sisi, '2D saja', r2, 4);
    }
    const c3 = jalankan('curl2', 'fleksi-siku', 'kiri', { modeSudut: '3d' });
    catat('curl2', 'fleksi-siku', 'kiri', '3D saja', c3, 8);
    expect(c3.hasil.repetisi).toBe(0);
    const c2 = jalankan('curl2', 'fleksi-siku', 'kiri', { modeSudut: '2d' });
    catat('curl2', 'fleksi-siku', 'kiri', '2D saja', c2, 8);
  });
});

describe('REKAMAN NYATA: badan berputar tanpa miring (elder)', () => {
  it('elder: memutar badan hingga ~80° tidak memunculkan "badan miring"', () => {
    for (const sisi of ['kiri', 'kanan'] as const) {
      const r = jalankan('elder', 'abduksi-bahu', sisi);
      catat('elder', 'abduksi-bahu', sisi, 'otomatis (hibrida)', r, 0);
      expect(r.hasil.koreksiTerhitung['badan-miring'] ?? 0).toBe(0);
      // Abduksi hanya sampai hampir horizontal (puncak < 90°): tidak boleh terhitung ganda.
      expect(Math.max(...r.perLoop)).toBeLessThanOrEqual(1);
      for (const modeSudut of ['2d', '3d'] as const) {
        catat('elder', 'abduksi-bahu', sisi, `${modeSudut.toUpperCase()} saja`, jalankan('elder', 'abduksi-bahu', sisi, { modeSudut }), 0);
      }
    }
  });
});

describe('REKAMAN NYATA: orang lain di latar (curl gym)', () => {
  interface DuaOrang {
    aspect: number;
    frames: Array<{ t: number; kandidat: number[][] }>;
  }
  const data = JSON.parse(
    readFileSync(new URL('./__fixtures__/curl-dua-orang.json', import.meta.url), 'utf8'),
  ) as DuaOrang;
  const keTitik = (k: number[]) => {
    const lm: Array<{ x: number; y: number }> = Array.from({ length: JUMLAH_LANDMARK }, () => ({ x: 0, y: 0 }));
    [11, 12, 23, 24].forEach((i, n) => (lm[i] = { x: k[n * 2], y: k[n * 2 + 1] }));
    return lm;
  };

  it('pilihPoseUtama selalu memilih pria yang berlatih (x 0,5-0,95), bukan manekin di latar', () => {
    let utama: PusatOrang | null = null;
    let duaKandidat = 0;
    let manekinPertama = 0;
    for (const f of data.frames) {
      const kandidat = f.kandidat.map(keTitik);
      if (kandidat.length > 1) duaKandidat++;
      if (pusatOrang(kandidat[0], data.aspect).x < 0.45) manekinPertama++;
      const i = kandidat.length === 1 ? 0 : pilihPoseUtama(kandidat, data.aspect, utama);
      utama = pusatOrang(kandidat[i], data.aspect);
      expect(utama.x).toBeGreaterThan(0.5);
      expect(utama.x).toBeLessThan(0.95);
    }
    console.log(
      `curl-dua-orang: ${data.frames.length} frame, ${duaKandidat} dengan 2 kandidat, ` +
        `kandidat pertama MediaPipe = manekin pada ${manekinPertama} frame`,
    );
    // Bukti bahwa urutan MediaPipe saja tidak cukup.
    expect(manekinPertama).toBeGreaterThan(data.frames.length * 0.3);
  });

  it('curl gym sisi kiri: hanya dicatat (curl bergantian setengah rentang, kebenaran dasar per loop tidak tegas)', () => {
    const r = jalankan('curl', 'fleksi-siku', 'kiri');
    catat('curl', 'fleksi-siku', 'kiri', 'otomatis (hibrida)', r, null);
    expect(r.snapshot.filter((s) => s.siap).length).toBeGreaterThan(r.snapshot.length * 0.9);
    // Badan hampir menyamping (lebar bahu ~0,39 x batang tubuh): miring ke samping tidak dinilai.
    expect(r.hasil.koreksiTerhitung['badan-miring'] ?? 0).toBe(0);
  });

  it('cetak tabel hasil rekaman nyata', () => {
    console.log('\nREKAMAN NYATA (Chrome desktop, MediaPipe lite GPU, 24 fps) - bukan perangkat target');
    console.table(tabel);
    expect(tabel.length).toBeGreaterThan(0);
  });
});
