import { describe, expect, it } from 'vitest';
import { JUMLAH_KATA_SESI, pilihKataSesi } from './pilihKata';
import { kataPerKategori } from './wordBank';

const kosong = { kataBenar: new Set<string>(), kataUlang: [] };

describe('pilihKataSesi', () => {
  it('Latihan Hari Ini berisi 10 kata unik, mudah lebih dulu, dan stabil untuk benih yang sama', () => {
    const a = pilihKataSesi({ kategori: null, riwayat: kosong, benih: '2026-10-13' });
    const b = pilihKataSesi({ kategori: null, riwayat: kosong, benih: '2026-10-13' });
    expect(a).toHaveLength(JUMLAH_KATA_SESI);
    expect(new Set(a.map((k) => k.id)).size).toBe(JUMLAH_KATA_SESI);
    expect(a.map((k) => k.id)).toEqual(b.map((k) => k.id));
    const tingkat = a.map((k) => k.tingkat);
    expect(tingkat).toEqual([...tingkat].sort((x, y) => x - y));
  });

  it('mendahulukan kata untuk diulang dari sesi terakhir', () => {
    const r = pilihKataSesi({
      kategori: null,
      riwayat: { kataBenar: new Set(), kataUlang: ['televisi', 'kacamata', 'tidak-ada'] },
      benih: 'x',
    });
    expect(r.map((k) => k.id)).toEqual(expect.arrayContaining(['televisi', 'kacamata']));
    expect(r).toHaveLength(JUMLAH_KATA_SESI);
  });

  it('lalu kata yang belum pernah Benar sebelum kata yang sudah lancar', () => {
    const benda = kataPerKategori('benda-rumah');
    const lancar = new Set(benda.slice(0, 25).map((k) => k.id));
    const r = pilihKataSesi({ kategori: 'benda-rumah', riwayat: { kataBenar: lancar, kataUlang: [] }, benih: 'y' });
    expect(r.every((k) => k.kategori === 'benda-rumah')).toBe(true);
    const belumLancar = benda.slice(25).map((k) => k.id);
    expect(r.map((k) => k.id)).toEqual(expect.arrayContaining(belumLancar));
  });

  it('kategori dengan kata kurang dari 10 tetap aman', () => {
    const r = pilihKataSesi({ kategori: 'anggota-tubuh', riwayat: kosong, benih: 'z', jumlah: 20 });
    expect(r).toHaveLength(15);
  });
});
