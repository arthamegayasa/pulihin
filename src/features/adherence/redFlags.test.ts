import { describe, expect, it } from 'vitest';
import { addDays } from '@/lib/date';
import { hitungRedFlag, type RedFlag } from './redFlags';
import { hariLengkap, sesi } from './testUtils';

const TODAY = '2026-10-13';
const ids = (f: RedFlag[]) => f.map((x) => x.id);

describe('red flag (a): 3 hari berturut-turut tanpa sesi', () => {
  it('jeda yang masih berjalan -> tingkat tinggi', () => {
    const s = hariLengkap(TODAY, [4, 5, 6, 7, 8, 9, 10]);
    const flags = hitungRedFlag(s, TODAY);
    expect(ids(flags)).toEqual(['tanpa-sesi-3-hari']);
    expect(flags[0]).toMatchObject({ tingkat: 'tinggi', judul: 'Sudah 3 hari belum latihan' });
  });

  it('dua hari kosong belum memicu penanda', () => {
    const s = hariLengkap(TODAY, [3, 4, 5, 6, 7, 8, 9]);
    expect(ids(hitungRedFlag(s, TODAY))).toEqual([]);
  });

  it('sudah berlatih lagi hari ini -> tetap ada penanda perhatian selama 7 hari', () => {
    const s = [...hariLengkap(TODAY, [0, 4, 5, 6, 7, 8, 9])];
    const flags = hitungRedFlag(s, TODAY);
    expect(ids(flags)).toEqual(['sempat-3-hari-kosong']);
    expect(flags[0].tingkat).toBe('perhatian');
    expect(flags[0].judul).toBe('Minggu ini sempat 3 hari berturut-turut tanpa latihan');
  });

  it('jeda di luar 7 hari terakhir tidak lagi ditandai', () => {
    const s = hariLengkap(TODAY, [0, 1, 2, 3, 4, 5, 6, 10, 11]);
    expect(ids(hitungRedFlag(s, TODAY))).toEqual([]);
  });

  it('hari sebelum program dimulai tidak dihitung sebagai jeda', () => {
    const s = hariLengkap(TODAY, [1]);
    expect(ids(hitungRedFlag(s, TODAY, { mulaiProgram: addDays(TODAY, -1) }))).toEqual([]);
  });
});

describe('red flag (b): skor 7 hari turun > 20%', () => {
  const base = (skorLama: number, skorBaru: number) => [
    ...hariLengkap(TODAY, [7, 8, 9, 10, 11, 12, 13], skorLama),
    ...hariLengkap(TODAY, [0, 1, 2, 3, 4, 5, 6], skorBaru),
  ];
  it('turun 25% -> muncul', () => {
    const flags = hitungRedFlag(base(80, 60), TODAY);
    expect(ids(flags)).toEqual(['skor-turun']);
    expect(flags[0].pesan).toContain('dari 80 menjadi 60');
  });
  it('turun tepat 20% -> tidak muncul', () => {
    expect(ids(hitungRedFlag(base(80, 64), TODAY))).toEqual([]);
  });
  it('hanya satu jenis turun -> tetap muncul dan menyebut jenisnya', () => {
    const s = [
      ...hariLengkap(TODAY, [7, 8, 9, 10, 11, 12, 13], 70),
      ...[0, 1, 2, 3, 4, 5, 6].flatMap((n) => [sesi(addDays(TODAY, -n), 'gerak', 70), sesi(addDays(TODAY, -n), 'afasia', 40, 16)]),
    ];
    const flags = hitungRedFlag(s, TODAY);
    expect(ids(flags)).toEqual(['skor-turun']);
    expect(flags[0].pesan).toContain('latihan bicara');
    expect(flags[0].pesan).not.toContain('latihan gerak');
  });
});

describe('red flag (c): kepatuhan mingguan < 40%', () => {
  it('5 dari 14 (36%) -> muncul', () => {
    const s = [...hariLengkap(TODAY, [0, 2]), sesi(addDays(TODAY, -4), 'gerak'), ...hariLengkap(TODAY, [7, 8])];
    const flags = hitungRedFlag(s, TODAY);
    expect(ids(flags)).toEqual(['kepatuhan-rendah']);
    expect(flags[0].pesan).toContain('5 dari 14');
  });
  it('6 dari 14 (43%) -> tidak muncul', () => {
    const s = [...hariLengkap(TODAY, [0, 2, 4]), ...hariLengkap(TODAY, [7, 8])];
    expect(ids(hitungRedFlag(s, TODAY))).toEqual([]);
  });
});

describe('teks penanda', () => {
  it('selalu menyarankan menghubungi terapis atau dokter dan tidak memakai istilah diagnosis', () => {
    const s = [...hariLengkap(TODAY, [7, 8, 9, 10, 11, 12, 13], 90), ...hariLengkap(TODAY, [5, 6], 40)];
    const flags = hitungRedFlag(s, TODAY);
    expect(ids(flags).sort()).toEqual(['kepatuhan-rendah', 'skor-turun', 'tanpa-sesi-3-hari']);
    expect(flags.map((f) => f.tingkat)).toEqual(['tinggi', 'tinggi', 'perhatian']);
    for (const f of flags) {
      expect(f.pesan).toContain('terapis atau dokter yang merawat');
      expect(`${f.judul} ${f.pesan}`).not.toMatch(/diagnos|penyakit|memburuk|kambuh/i);
    }
  });
});
