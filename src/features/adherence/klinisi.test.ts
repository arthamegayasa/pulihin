import { describe, expect, it } from 'vitest';
import type { Profile } from '@/types';
import { hitungRedFlag } from './redFlags';
import { ringkasPasien, sesiTerbaru, urutkanPerluPerhatian, type DataPasienKlinisi } from './klinisi';
import { hariLengkap, sesi } from './testUtils';

const TODAY = '2026-10-13';

function profil(id: string, namaSamaran: string): Profile {
  return { id, namaSamaran, usia: 60, keterangan: 'Stroke', sisiLemah: 'kanan', tanggalMulaiProgram: '2026-09-29', isDemo: true };
}

function pasien(id: string, nama: string, hariLalu: number[], skor = 70): DataPasienKlinisi {
  return { profile: profil(id, nama), program: undefined, schedule: undefined, sessions: hariLengkap(TODAY, hariLalu, skor) };
}

describe('ringkasan pasien dashboard klinisi', () => {
  it('memakai red flag yang sama dengan tampilan keluarga', () => {
    const d = pasien('budi', 'Pak Budi', [4, 5, 6, 7, 8, 9]);
    const r = ringkasPasien(d, TODAY);
    expect(r.laporan.redFlags).toEqual(hitungRedFlag(d.sessions, TODAY, { target: r.laporan.target, mulaiProgram: d.profile.tanggalMulaiProgram }));
    expect(r.laporan.redFlags.map((f) => f.id)).toContain('tanpa-sesi-3-hari');
    expect(r.jumlahPenting).toBe(1);
    expect(r.sesiTerakhir?.tanggal).toBe('2026-10-09');
  });

  it('pasien rajin tanpa penanda', () => {
    const r = ringkasPasien(pasien('sari', 'Bu Sari', [0, 1, 2, 3, 4, 5, 6, 7]), TODAY);
    expect(r.laporan.redFlags).toEqual([]);
    expect(r.laporan.kepatuhan.persen).toBe(100);
    expect(r.sesiTerakhir?.tanggal).toBe(TODAY);
  });

  it('mengurutkan pasien yang perlu perhatian lebih dulu', () => {
    const rajin = ringkasPasien(pasien('sari', 'Bu Sari', [0, 1, 2, 3, 4, 5, 6]), TODAY);
    const jeda = ringkasPasien(pasien('budi', 'Pak Budi', [4, 5, 6, 7, 8, 9]), TODAY);
    const jarang = ringkasPasien(pasien('joko', 'Pak Joko', [0, 2, 6]), TODAY);
    const urut = urutkanPerluPerhatian([rajin, jarang, jeda]).map((r) => r.profile.id);
    expect(urut).toEqual(['budi', 'joko', 'sari']);
  });

  it('dengan penanda setara, kepatuhan lebih rendah lebih dulu', () => {
    const a = ringkasPasien(pasien('a', 'Bu A', [0, 1, 2, 3, 4, 5]), TODAY);
    const b = ringkasPasien(pasien('b', 'Pak B', [0, 1, 2, 3, 4, 5, 6]), TODAY);
    expect(urutkanPerluPerhatian([b, a]).map((r) => r.profile.id)).toEqual(['a', 'b']);
  });

  it('sesi terbaru lebih dulu, hanya yang selesai, paling banyak lima', () => {
    const s = [...hariLengkap(TODAY, [0, 1, 2, 3]), sesi(TODAY, 'gerak', 50, 20, false)];
    const terbaru = sesiTerbaru(s);
    expect(terbaru).toHaveLength(5);
    expect(terbaru.every((x) => x.selesai)).toBe(true);
    expect(terbaru.map((x) => `${x.tanggal} ${x.jenis}`)).toEqual([
      `${TODAY} afasia`,
      `${TODAY} gerak`,
      '2026-10-12 afasia',
      '2026-10-12 gerak',
      '2026-10-11 afasia',
    ]);
  });
});
