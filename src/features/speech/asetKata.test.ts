import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { srcIlustrasi } from '@/components/premium/asetIlustrasi';
import { KATA, KATEGORI } from './wordBank';

const PUBLIC = fileURLToPath(new URL('../../../public', import.meta.url));

/** Lebar x tinggi dari header WebP (VP8, VP8L, atau VP8X); null bila bukan WebP. */
function ukuranWebp(b: Buffer): { w: number; h: number } | null {
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  switch (b.toString('ascii', 12, 16)) {
    case 'VP8X':
      return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
    case 'VP8L': {
      const bits = b.readUInt32LE(21);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
    case 'VP8 ':
      return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    default:
      return null;
  }
}

describe('gambar kata afasia', () => {
  it('setiap kata di bank kata punya ilustrasi WebP 512x512 <= 40 KB', () => {
    const salah: string[] = [];
    for (const k of KATA) {
      const berkas = `${PUBLIC}${decodeURIComponent(srcIlustrasi({ jenis: 'kata', nama: k.id }))}`;
      let ukuran: { w: number; h: number } | null = null;
      try {
        ukuran = ukuranWebp(readFileSync(berkas));
      } catch {
        salah.push(`${k.id}: berkas tidak ada`);
        continue;
      }
      if (ukuran?.w !== 512 || ukuran.h !== 512) salah.push(`${k.id}: ${ukuran ? `${ukuran.w}x${ukuran.h}` : 'bukan WebP'}`);
      else if (statSync(berkas).size > 40 * 1024) salah.push(`${k.id}: lebih dari 40 KB`);
    }
    expect(salah).toEqual([]);
  });

  it('setiap kategori punya ilustrasi 512x512', () => {
    for (const kat of KATEGORI) {
      expect(ukuranWebp(readFileSync(`${PUBLIC}${srcIlustrasi({ jenis: 'kategori', nama: kat.id })}`))).toEqual({ w: 512, h: 512 });
    }
  });

  it('setiap kata tetap punya emoji cadangan bila ilustrasi gagal dimuat', () => {
    expect(KATA.filter((k) => k.emoji.trim() === '').map((k) => k.id)).toEqual([]);
  });
});
