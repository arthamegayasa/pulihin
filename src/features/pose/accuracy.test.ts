import { describe, expect, it } from 'vitest';
import { hitungAkurasi } from './accuracy';
import { angkaKeKata } from './labels';

describe('hitungAkurasi', () => {
  it('semua cocok dalam jendela', () => {
    const r = hitungAkurasi([1000, 4000, 7000], [1200, 3900, 7400]);
    expect(r).toMatchObject({ benar: 3, ganda: 0, hilang: 0, akurasiPersen: 100 });
  });

  it('hitungan ganda dan yang hilang dipisahkan', () => {
    // repetisi nyata ke-2 terhitung dua kali, ke-3 tidak terhitung
    const r = hitungAkurasi([1000, 4000, 7000], [1100, 4100, 4600]);
    expect(r).toMatchObject({ manual: 3, otomatis: 3, benar: 2, ganda: 1, hilang: 1 });
    expect(r.akurasiPersen).toBe(50);
  });

  it('pasangan terdekat diutamakan, setiap ketukan dipakai sekali', () => {
    const r = hitungAkurasi([1000, 2000], [1900]);
    expect(r.pasangan).toEqual([{ manualMs: 2000, otomatisMs: 1900, selisihMs: -100 }]);
    expect(r.hilang).toBe(1);
  });

  it('tanpa data akurasi null', () => {
    expect(hitungAkurasi([], []).akurasiPersen).toBeNull();
  });
});

describe('angkaKeKata', () => {
  it('menghasilkan hitungan Bahasa Indonesia', () => {
    expect([1, 2, 10, 11, 12, 19, 20, 21, 100, 115].map(angkaKeKata)).toEqual([
      'Satu',
      'Dua',
      'Sepuluh',
      'Sebelas',
      'Dua belas',
      'Sembilan belas',
      'Dua puluh',
      'Dua puluh satu',
      'Seratus',
      'Seratus lima belas',
    ]);
  });
});
