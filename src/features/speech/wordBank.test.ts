import { describe, expect, it } from 'vitest';
import type { KategoriKata } from './types';
import { getKata, KATA, KATEGORI, kataPerKategori, petunjukSukuKata } from './wordBank';

// Contoh kata wajib dari tabel Bab 8.1.
const CONTOH_SPEC: Record<KategoriKata, string[]> = {
  'benda-rumah': ['kursi', 'meja', 'pintu', 'kunci', 'gelas', 'piring', 'sendok', 'handuk', 'bantal', 'lampu', 'kipas', 'sapu', 'ember', 'sabun', 'sikat gigi'],
  'makanan-minuman': ['nasi', 'roti', 'telur', 'ayam', 'ikan', 'sayur', 'buah', 'pisang', 'air', 'teh', 'kopi', 'susu', 'gula', 'garam'],
  'keluarga-orang': ['ibu', 'bapak', 'anak', 'istri', 'suami', 'kakak', 'adik', 'nenek', 'dokter', 'perawat'],
  'anggota-tubuh': ['tangan', 'kaki', 'kepala', 'mata', 'mulut', 'bahu', 'siku', 'lutut', 'jari'],
  'kebutuhan-harian': ['makan', 'minum', 'tidur', 'bangun', 'duduk', 'berdiri', 'tolong', 'sakit', 'lelah', 'pulang'],
};

const DISTRIBUSI: Record<KategoriKata, number> = {
  'benda-rumah': 30,
  'makanan-minuman': 25,
  'keluarga-orang': 15,
  'anggota-tubuh': 15,
  'kebutuhan-harian': 15,
};

describe('Bank kata (AC-F3-1)', () => {
  it('berisi tepat 100 kata dengan id dan kata unik', () => {
    expect(KATA).toHaveLength(100);
    expect(new Set(KATA.map((k) => k.id)).size).toBe(100);
    expect(new Set(KATA.map((k) => k.kata)).size).toBe(100);
  });

  it('terdistribusi sesuai tabel kategori Bab 8.1', () => {
    for (const [kategori, jumlah] of Object.entries(DISTRIBUSI) as [KategoriKata, number][]) {
      expect(kataPerKategori(kategori), kategori).toHaveLength(jumlah);
    }
    expect(KATEGORI.map((k) => k.id).sort()).toEqual(Object.keys(DISTRIBUSI).sort());
    for (const k of KATEGORI) expect(k.jumlah).toBe(DISTRIBUSI[k.id]);
  });

  it('memuat semua contoh kata dari spesifikasi pada kategori yang benar', () => {
    for (const [kategori, contoh] of Object.entries(CONTOH_SPEC) as [KategoriKata, string[]][]) {
      const kataKategori = kataPerKategori(kategori).map((k) => k.kata);
      for (const c of contoh) expect(kataKategori, `${c} di ${kategori}`).toContain(c);
    }
  });

  it('setiap kata punya bidang yang valid', () => {
    for (const k of KATA) {
      expect(k.id, k.kata).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(k.id).toBe(k.kata.replace(/ /g, '-'));
      expect(k.kata).toMatch(/^[a-z]+( [a-z]+)*$/);
      expect([1, 2, 3]).toContain(k.tingkat);
      expect(k.emoji.trim().length, k.kata).toBeGreaterThan(0);
      expect(k.emoji, k.kata).not.toMatch(/[A-Za-z0-9]/);
      expect(k.kalimatContoh, k.kata).toMatch(/^[A-Z].*[.?!]$/);
      expect(k.kalimatContoh.toLowerCase(), k.kata).toContain(k.kata);
      expect(k.kalimatContoh.split(' ').length, k.kata).toBeLessThanOrEqual(8);
      for (const v of k.varian ?? []) expect(v).not.toBe(k.kata);
      expect(getKata(k.id)).toBe(k);
    }
  });

  it('suku kata tersambung kembali menjadi kata dan masing-masing punya vokal', () => {
    for (const k of KATA) {
      expect(k.sukuKata.join(''), k.kata).toBe(k.kata.replace(/ /g, ''));
      for (const s of k.sukuKata) expect(s, `${k.kata}: ${s}`).toMatch(/^[a-z]*[aiueo][a-z]*$/);
    }
  });

  it('petunjuk suku kata memakai tanda hubung dan spasi antarkata', () => {
    expect(petunjukSukuKata(getKata('kursi')!)).toBe('kur-si');
    expect(petunjukSukuKata(getKata('sikat-gigi')!)).toBe('si-kat gi-gi');
    expect(petunjukSukuKata(getKata('teh')!)).toBe('teh');
  });
});
