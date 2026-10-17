import { describe, expect, it } from 'vitest';
import { srcIlustrasi, ukuranIlustrasi } from '@/components/premium/asetIlustrasi';
import { KATEGORI } from '@/features/speech/wordBank';

describe('kontrak aset ilustrasi', () => {
  it('membentuk path WebP sesuai folder kontrak', () => {
    expect(srcIlustrasi({ jenis: 'momen', nama: 'beranda' })).toBe('/ilustrasi/momen/beranda.webp');
    expect(srcIlustrasi({ jenis: 'peran', nama: 'terapis' })).toBe('/ilustrasi/peran/terapis.webp');
    expect(srcIlustrasi({ jenis: 'kategori', nama: 'anggota-tubuh' })).toBe('/ilustrasi/kategori/anggota-tubuh.webp');
    expect(srcIlustrasi({ jenis: 'landing', nama: 'hero' })).toBe('/ilustrasi/landing/hero.webp');
    expect(srcIlustrasi({ jenis: 'kata', nama: 'kursi' })).toBe('/ilustrasi/kata/kursi.webp');
  });

  it('memberi ukuran intrinsik sesuai tabel kontrak', () => {
    expect(ukuranIlustrasi({ jenis: 'kata', nama: 'kursi' })).toEqual({ w: 512, h: 512 });
    expect(ukuranIlustrasi({ jenis: 'kategori', nama: 'benda-rumah' })).toEqual({ w: 512, h: 512 });
    expect(ukuranIlustrasi({ jenis: 'peran', nama: 'pasien' })).toEqual({ w: 480, h: 480 });
    for (const nama of ['beranda', 'keluarga', 'terapis', 'bicara'] as const) {
      expect(ukuranIlustrasi({ jenis: 'momen', nama })).toEqual({ w: 960, h: 540 });
    }
    expect(ukuranIlustrasi({ jenis: 'momen', nama: 'selebrasi' })).toEqual({ w: 640, h: 640 });
    for (const nama of ['kosong', 'luring', 'privasi'] as const) {
      expect(ukuranIlustrasi({ jenis: 'momen', nama })).toEqual({ w: 640, h: 480 });
    }
    expect(ukuranIlustrasi({ jenis: 'landing', nama: 'hero' })).toEqual({ w: 1600, h: 1200 });
    expect(ukuranIlustrasi({ jenis: 'landing', nama: 'gerak' })).toEqual({ w: 960, h: 720 });
  });

  it('mencakup setiap kategori bank kata', () => {
    for (const k of KATEGORI) {
      expect(srcIlustrasi({ jenis: 'kategori', nama: k.id })).toBe(`/ilustrasi/kategori/${k.id}.webp`);
    }
  });
});
