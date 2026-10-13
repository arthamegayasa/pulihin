import { describe, expect, it } from 'vitest';
import {
  hasilAkhirKata,
  jarakLevenshtein,
  KONFIG_PENILAIAN,
  nilaiUcapan,
  normalisasi,
  ringkasSesi,
  skorPercobaan,
  skorSesi,
  type PercobaanRingkas,
} from './SpeechScorer';
import { getKata } from './wordBank';

const kata = (id: string) => {
  const k = getKata(id);
  if (!k) throw new Error(`kata ${id} tidak ada`);
  return k;
};

describe('normalisasi', () => {
  it('huruf kecil, buang tanda baca, rapikan spasi', () => {
    expect(normalisasi('  Itu,   KURSI!!  ')).toBe('itu kursi');
    expect(normalisasi('buah-buahan.')).toBe('buah buahan');
    expect(normalisasi('Kopi?')).toBe('kopi');
  });
});

describe('jarakLevenshtein', () => {
  it('menghitung jarak edit', () => {
    expect(jarakLevenshtein('kursi', 'kursi')).toBe(0);
    expect(jarakLevenshtein('kursi', 'kursa')).toBe(1);
    expect(jarakLevenshtein('', 'abc')).toBe(3);
    expect(jarakLevenshtein('kurang', 'kursi')).toBe(3);
  });
});

describe('nilaiUcapan', () => {
  it('Benar bila persis sama', () => {
    expect(nilaiUcapan(kata('kursi'), ['kursi']).hasil).toBe('benar');
  });

  it('Benar walau beda huruf besar dan tanda baca', () => {
    expect(nilaiUcapan(kata('kursi'), ['Kursi!']).hasil).toBe('benar');
    expect(nilaiUcapan(kata('sikat-gigi'), ['Sikat, gigi.']).hasil).toBe('benar');
  });

  it('Benar bila target muncul utuh di dalam frasa', () => {
    expect(nilaiUcapan(kata('kursi'), ['itu kursi']).hasil).toBe('benar');
    expect(nilaiUcapan(kata('sikat-gigi'), ['ini sikat gigi saya']).hasil).toBe('benar');
    // token harus utuh: "tehnya" bukan "teh" (cukup suku kata awal → Hampir)
    expect(nilaiUcapan(kata('teh'), ['tehnya']).hasil).toBe('hampir');
  });

  it('Benar untuk salah satu huruf pada kata panjang (≥ 6 huruf)', () => {
    expect(nilaiUcapan(kata('televisi'), ['televise']).hasil).toBe('benar');
    expect(nilaiUcapan(kata('jendela'), ['buka jendala']).hasil).toBe('benar');
  });

  it('salah satu huruf pada kata pendek tidak dihitung Benar', () => {
    expect(nilaiUcapan(kata('kursi'), ['kursa']).hasil).toBe('hampir');
    expect(nilaiUcapan(kata('meja'), ['meje']).hasil).toBe('hampir');
  });

  it('Hampir karena suku kata awal benar', () => {
    const h = nilaiUcapan(kata('kursi'), ['kurang']);
    expect(h.kemiripan).toBeLessThan(KONFIG_PENILAIAN.ambangHampir);
    expect(h.hasil).toBe('hampir');
  });

  it('suku kata awal satu huruf diperpanjang agar tidak terlalu longgar', () => {
    expect(nilaiUcapan(kata('ayam'), ['apa']).hasil).toBe('belum');
    expect(nilaiUcapan(kata('ayam'), ['ayah']).hasil).toBe('hampir');
  });

  it('Hampir karena kemiripan di atas ambang menengah', () => {
    const h = nilaiUcapan(kata('kursi'), ['ursi']);
    expect(h.hasil).toBe('hampir');
    expect(h.kemiripan).toBeGreaterThanOrEqual(KONFIG_PENILAIAN.ambangHampir);
  });

  it('Belum bila jauh berbeda atau tidak ada yang terdengar', () => {
    expect(nilaiUcapan(kata('kursi'), ['meja']).hasil).toBe('belum');
    expect(nilaiUcapan(kata('kursi'), []).hasil).toBe('belum');
    expect(nilaiUcapan(kata('kursi'), ['  ', '...']).hasil).toBe('belum');
  });

  it('alternatif terbaik yang menang', () => {
    const benar = nilaiUcapan(kata('kursi'), ['kurang', 'meja', 'Kursi']);
    expect(benar.hasil).toBe('benar');
    expect(benar.teks).toBe('Kursi');
    const hampir = nilaiUcapan(kata('kursi'), ['meja', 'kursa']);
    expect(hampir.hasil).toBe('hampir');
    expect(hampir.teks).toBe('kursa');
  });

  it('varian ejaan diterima sebagai Benar', () => {
    expect(nilaiUcapan(kata('mi'), ['mie']).hasil).toBe('benar');
    expect(nilaiUcapan(kata('televisi'), ['TV']).hasil).toBe('benar');
  });

  it('ambang dapat dikonfigurasi', () => {
    const ketat = { ...KONFIG_PENILAIAN, ambangHampir: 0.9 };
    expect(nilaiUcapan(kata('kursi'), ['ursi'], ketat).hasil).toBe('belum');
    const tanpaToleransi = { ...KONFIG_PENILAIAN, jarakEditMaks: 0 };
    expect(nilaiUcapan(kata('televisi'), ['televise'], tanpaToleransi).hasil).toBe('hampir');
  });
});

describe('skor', () => {
  it('100 Benar percobaan pertama, 70 Benar percobaan 2-3, 40 Hampir, 0 Belum', () => {
    expect(skorPercobaan('benar', 1)).toBe(100);
    expect(skorPercobaan('benar', 2)).toBe(70);
    expect(skorPercobaan('benar', 3)).toBe(70);
    expect(skorPercobaan('hampir', 1)).toBe(40);
    expect(skorPercobaan('hampir', 3)).toBe(40);
    expect(skorPercobaan('belum', 1)).toBe(0);
  });

  it('skor sesi adalah rata-rata dibulatkan', () => {
    expect(skorSesi([100, 70, 40, 0])).toBe(53);
    expect(skorSesi([])).toBe(0);
  });

  it('hasil akhir kata memakai percobaan terbaik', () => {
    const p: PercobaanRingkas[] = [
      { kataId: 'kursi', kategoriHasil: 'hampir', nomorPercobaan: 1 },
      { kataId: 'kursi', kategoriHasil: 'belum', nomorPercobaan: 2 },
      { kataId: 'kursi', kategoriHasil: 'belum', nomorPercobaan: 3 },
      { kataId: 'meja', kategoriHasil: 'belum', nomorPercobaan: 1 },
      { kataId: 'meja', kategoriHasil: 'benar', nomorPercobaan: 2 },
    ];
    expect(hasilAkhirKata('kursi', p)).toEqual({ kataId: 'kursi', hasil: 'hampir', skor: 40 });
    expect(hasilAkhirKata('meja', p)).toEqual({ kataId: 'meja', hasil: 'benar', skor: 70 });
    expect(hasilAkhirKata('pintu', p)).toEqual({ kataId: 'pintu', hasil: 'belum', skor: 0 });
  });

  it('ringkasan sesi 10 kata: hitungan, kata ulang, dan rata-rata', () => {
    const ids = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9', 'k10'];
    const p: PercobaanRingkas[] = [
      ...['k1', 'k2', 'k3', 'k4'].map((kataId) => ({ kataId, kategoriHasil: 'benar' as const, nomorPercobaan: 1 })),
      { kataId: 'k5', kategoriHasil: 'belum', nomorPercobaan: 1 },
      { kataId: 'k5', kategoriHasil: 'benar', nomorPercobaan: 2 },
      { kataId: 'k6', kategoriHasil: 'hampir', nomorPercobaan: 1 },
      { kataId: 'k6', kategoriHasil: 'benar', nomorPercobaan: 3 },
      { kataId: 'k7', kategoriHasil: 'hampir', nomorPercobaan: 1 },
      { kataId: 'k8', kategoriHasil: 'belum', nomorPercobaan: 1 },
      { kataId: 'k8', kategoriHasil: 'hampir', nomorPercobaan: 2 },
      { kataId: 'k9', kategoriHasil: 'belum', nomorPercobaan: 1 },
      // k10 dilewati tanpa percobaan
    ];
    const r = ringkasSesi(ids, p);
    expect(r.benar).toBe(6);
    expect(r.hampir).toBe(2);
    expect(r.belum).toBe(2);
    expect(r.kataUlang).toEqual(['k7', 'k8', 'k9', 'k10']);
    // (4×100 + 2×70 + 2×40 + 2×0) / 10 = 62
    expect(r.skor).toBe(62);
  });
});
