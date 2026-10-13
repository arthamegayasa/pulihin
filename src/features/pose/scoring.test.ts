import { describe, expect, it } from 'vitest';
import { getExercise } from './exerciseDefinitions';
import { hitungSkor, SARAN } from './scoring';

const BAHU = getExercise('fleksi-bahu')!; // atas 100, bawah 30, tempo 2..6 s
const SIKU = getExercise('fleksi-siku')!; // atas 120, bawah 30, tempo 1,5..4 s

const dasar = (d: typeof BAHU, target = 10) => ({
  targetRepetisi: target,
  ambangAtas: d.ambangAtas,
  ambangBawah: d.ambangBawah,
  tempoTargetDetik: d.tempoTargetDetik,
});
const rep = (sudutPuncak: number, durasiSiklusDetik: number, dihitung = true) => ({ dihitung, sudutPuncak, durasiSiklusDetik });

describe('skor sesi (Bab 5.3): contoh hitung', () => {
  it('A. 10/10 penuh, tempo 3 s seragam -> 100, Sangat Baik, pujian', () => {
    const h = hitungSkor({ ...dasar(BAHU), repLogs: Array.from({ length: 10 }, () => rep(115, 3)) });
    expect(h.skorKomponen).toEqual({ repetisi: 100, rentang: 100, tempo: 100 });
    expect(h.skor).toBe(100);
    expect(h.label).toBe('Sangat Baik');
    expect(h.saran).toBe(SARAN.pujian);
  });

  it('B. 8 penuh + 2 setengah gerak, tempo bervariasi -> 83', () => {
    // repetisi = 8/10 = 0,8
    // rentang  = (8 x 1 + 2 x (65-30)/(100-30)) / 10 = (8 + 2 x 0,5) / 10 = 0,9
    // tempo    : 8 siklus lengkap 2,2,3,3,4,4,5,5 s semua dalam 2..6 -> 1,0;
    //            rata 3,5, sd 1,118, kv 0,3194 -> kestabilan 1 - 0,3194/0,5 = 0,3612
    //            tempo = 0,7 x 1 + 0,3 x 0,3612 = 0,8084
    // total    = 50 x 0,8 + 30 x 0,9 + 20 x 0,8084 = 40 + 27 + 16,17 = 83,17 -> 83
    const logs = [2, 2, 3, 3, 4, 4, 5, 5].map((d) => rep(110, d));
    logs.push(rep(65, 2.5, false), rep(65, 2.5, false));
    const h = hitungSkor({ ...dasar(BAHU), repLogs: logs });
    expect(h.skorKomponen).toEqual({ repetisi: 80, rentang: 90, tempo: 81 });
    expect(h.skor).toBe(83);
    expect(h.label).toBe('Sangat Baik');
    expect(h.saran).toBe(SARAN.repetisi);
  });

  it('C. tanpa gerakan tercatat -> 0, Perlu Pendampingan, saran mulai pelan-pelan', () => {
    const h = hitungSkor({ ...dasar(BAHU), repLogs: [] });
    expect(h.skor).toBe(0);
    expect(h.skorKomponen).toEqual({ repetisi: 0, rentang: 0, tempo: 0 });
    expect(h.label).toBe('Perlu Pendampingan');
    expect(h.saran).toBe(SARAN.kosong);
  });

  it('D. 10/10 tetapi semua siklus 1,2 s (di bawah tempo minimum 1,5 s) -> 86, saran pelan', () => {
    // tempo = 0,7 x 0 + 0,3 x 1 = 0,3 -> total 50 + 30 + 6 = 86
    const h = hitungSkor({ ...dasar(SIKU), repLogs: Array.from({ length: 10 }, () => rep(130, 1.2)) });
    expect(h.skorKomponen).toEqual({ repetisi: 100, rentang: 100, tempo: 30 });
    expect(h.skor).toBe(86);
    expect(h.saran).toBe(SARAN.tempoCepat);
  });

  it('E. hanya setengah gerak -> rentang parsial, saran rentang', () => {
    // 3 percobaan puncak 75: progres (75-30)/(120-30) = 0,5 -> rentang 50; total 30 x 0,5 = 15
    const h = hitungSkor({ ...dasar(SIKU), repLogs: [rep(75, 3, false), rep(75, 3, false), rep(75, 3, false)] });
    expect(h.skorKomponen).toEqual({ repetisi: 0, rentang: 50, tempo: 0 });
    expect(h.skor).toBe(15);
    expect(h.label).toBe('Perlu Pendampingan');
    expect(h.saran).toBe(SARAN.rentang);
  });

  it('F. repetisi melebihi target dibatasi 100', () => {
    const h = hitungSkor({ ...dasar(BAHU, 5), repLogs: Array.from({ length: 8 }, () => rep(110, 3)) });
    expect(h.skorKomponen.repetisi).toBe(100);
  });

  it('saran tidak pernah menyalahkan', () => {
    for (const s of Object.values(SARAN)) expect(s).not.toMatch(/gagal|salah|buruk|tidak valid/i);
  });
});
