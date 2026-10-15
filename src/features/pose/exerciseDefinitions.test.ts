import { describe, expect, it } from 'vitest';
import { ATURAN_UMUM, EXERCISE_IDS, EXERCISES, getExercise, KOREKSI_BAWAAN } from './exerciseDefinitions';
import { indeksTitikKunci } from './landmarks';

describe('pustaka 10 latihan (Bab 6)', () => {
  it('10 latihan dengan id tetap dan urutan Bab 6', () => {
    expect(EXERCISES.map((e) => e.id)).toEqual([...EXERCISE_IDS]);
    for (const id of EXERCISE_IDS) expect(getExercise(id)?.id).toBe(id);
    expect(getExercise('tidak-ada')).toBeUndefined();
  });

  it('ambang atas/bawah persis tabel Bab 6', () => {
    const tabel: Record<string, [number, number]> = {
      'fleksi-bahu': [100, 30],
      'fleksi-siku': [120, 30],
      'abduksi-bahu': [90, 25],
      'ekstensi-lutut': [150, 100],
      'abduksi-pinggul': [25, 8],
      'duduk-berdiri': [160, 100],
      'putar-badan': [20, 8],
    };
    for (const [id, [atas, bawah]] of Object.entries(tabel)) {
      expect([getExercise(id)!.ambangAtas, getExercise(id)!.ambangBawah]).toEqual([atas, bawah]);
    }
  });

  it('inti, berpegangan, target bawaan, sisi', () => {
    expect(EXERCISES.filter((e) => e.inti).map((e) => e.id)).toEqual(['fleksi-bahu', 'fleksi-siku', 'abduksi-bahu']);
    expect(EXERCISES.filter((e) => e.wajibBerpegangan).map((e) => e.id).sort()).toEqual(
      ['abduksi-pinggul', 'duduk-berdiri', 'jinjit'].sort(),
    );
    for (const e of EXERCISES) {
      expect(e.targetRepetisiDefault).toBe(e.id === 'duduk-berdiri' ? 5 : 10);
      if (e.posisi !== 'duduk') expect(e.wajibBerpegangan).toBe(true);
      // Video peraga 3D dengan path dasar tetap per id (public/peraga/<id>.mp4 + dua poster).
      expect(e.animasiAtauVideo).toBe(`/peraga/${e.id}`);
    }
    expect(getExercise('fleksi-siku')!.metrik).toEqual({ jenis: 'sudut', a: 'bahu', b: 'siku', c: 'pergelangan', ubah: 'fleksi' });
    expect(getExercise('langkah-duduk')!.metrik.jenis).toBe('bergantian');
  });

  it('isi definisi lengkap dan konsisten', () => {
    for (const e of EXERCISES) {
      expect(e.nama.length).toBeGreaterThan(3);
      expect(e.namaKlinis.length).toBeGreaterThan(3);
      expect(e.panduanLangkah.length).toBeGreaterThanOrEqual(3);
      expect(e.panduanLangkah.length).toBeLessThanOrEqual(5);
      expect(e.posisiPonsel).toMatch(/meter/);
      expect(e.peringatan.length).toBeGreaterThan(10);
      expect(e.tempoTargetDetik.min).toBeGreaterThanOrEqual(ATURAN_UMUM.durasiRepetisiMinDetik);
      expect(e.tempoTargetDetik.max).toBeGreaterThan(e.tempoTargetDetik.min);
      expect(indeksTitikKunci(e, 'kiri').length).toBeGreaterThan(0);
      expect(e.koreksiUmum.map((k) => k.id)).toContain('keluar-frame');
      for (const k of e.koreksiUmum) {
        expect(k.kondisi).not.toContain('{ambang}');
        expect(k.pesan).toBe(KOREKSI_BAWAAN[k.id as keyof typeof KOREKSI_BAWAAN].pesan);
      }
    }
  });

  it('ambang dapat bekerja: pita histeresis tidak tumpang tindih dan rentang-kurang dapat terdeteksi', () => {
    for (const e of EXERCISES) {
      const h = e.histeresis ?? ATURAN_UMUM.histeresisBawaan;
      expect(e.ambangBawah + h, e.id).toBeLessThan(e.ambangAtas - h);
      const rentang = e.koreksiUmum.find((k) => k.id === 'rentang-kurang');
      if (rentang) {
        // Puncak "rendah" (< atas - margin) harus tetap di atas ambang NAIK agar percobaannya tercatat.
        expect(e.ambangAtas - rentang.ambang!, e.id).toBeGreaterThan(e.ambangBawah + h);
      }
    }
  });
});
