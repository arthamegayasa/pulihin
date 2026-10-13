import { describe, expect, it } from 'vitest';
import { pesanHangatAfasia, saranSesiAfasia } from './pesanAfasia';

const PUJIAN = /\b(bagus|hebat|luar biasa)\b/i;

describe('pesan ringkasan afasia', () => {
  it('saran tidak mengulang kata pujian dari pesan hangat di kartu yang sama', () => {
    for (let benar = 0; benar <= 10; benar++) {
      const kataUlang = Array.from({ length: 10 - benar }, (_, i) => `k${i}`);
      const saran = saranSesiAfasia({ benar, kataUlang });
      expect(saran).not.toMatch(PUJIAN);
    }
  });

  it('pesan hangat tidak pernah menyalahkan', () => {
    for (const skor of [0, 39, 40, 59, 60, 79, 80, 100]) {
      expect(pesanHangatAfasia(skor)).not.toMatch(/gagal|salah|buruk/i);
    }
  });
});
