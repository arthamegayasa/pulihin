import { describe, expect, it } from 'vitest';
import type { ProgramItem, Session } from '@/types';
import {
  BATAS_FREKUENSI,
  BATAS_REPETISI,
  BATAS_SET,
  buatProgram,
  DIBUAT_OLEH_DEMO,
  draftDariProgram,
  geserLatihan,
  hapusLatihan,
  latihanBerikutnya,
  PILIHAN_RENTANG,
  repetisiCukup,
  MAKS_LATIHAN,
  programSama,
  statusProgramHariIni,
  tambahLatihan,
  teksProgresSet,
  teksRentang,
  teksSudahDicoba,
  teksTarget,
  ubahFrekuensi,
  ubahLatihan,
  urlLatihanProgram,
  type DraftProgram,
} from './program';
import { sesi } from './testUtils';

const TODAY = '2026-10-13';
const KEMARIN = '2026-10-12';

function gerak(latihanId: string, tanggal = TODAY, jam = 9, selesai = true, skor = 70): Session {
  return { ...sesi(tanggal, 'gerak', skor, jam, selesai), id: `${latihanId}-${tanggal}-${jam}`, latihanId };
}

const ITEMS: ProgramItem[] = [
  { latihanId: 'fleksi-siku', targetRepetisi: 10, set: 2 },
  { latihanId: 'fleksi-bahu', targetRepetisi: 10, set: 1 },
];

describe('status set Latihan Hari Ini', () => {
  it('latihan dua set belum selesai setelah satu sesi, selesai setelah dua sesi', () => {
    const satu = statusProgramHariIni(ITEMS, [gerak('fleksi-siku', TODAY, 9, true, 60)], TODAY);
    expect(satu[0]).toMatchObject({ jumlahSesi: 1, setSelesai: 1, selesai: false, skorTerakhir: 60 });
    expect(teksProgresSet(satu[0])).toBe('1 dari 2 set');

    const dua = statusProgramHariIni(ITEMS, [gerak('fleksi-siku', TODAY, 9, true, 60), gerak('fleksi-siku', TODAY, 10, true, 75)], TODAY);
    expect(dua[0]).toMatchObject({ jumlahSesi: 2, setSelesai: 2, selesai: true, skorTerakhir: 75 });
    expect(teksProgresSet(dua[0])).toBeNull();
  });

  it('latihan satu set selesai setelah satu sesi; sesi berlebih tidak melebihi jumlah set', () => {
    const s = statusProgramHariIni(ITEMS, [gerak('fleksi-bahu', TODAY, 9), gerak('fleksi-bahu', TODAY, 10)], TODAY);
    expect(s[1]).toMatchObject({ jumlahSesi: 2, setSelesai: 1, selesai: true });
    expect(teksProgresSet(s[1])).toBeNull();
  });

  it('hanya menghitung sesi gerak selesai hari ini untuk latihan yang sama', () => {
    const sessions = [
      gerak('fleksi-siku', KEMARIN),
      gerak('fleksi-siku', TODAY, 9, false),
      gerak('fleksi-bahu', TODAY),
      { ...sesi(TODAY, 'afasia'), latihanId: 'fleksi-siku' },
    ];
    const s = statusProgramHariIni(ITEMS, sessions, TODAY);
    expect(s[0]).toMatchObject({ jumlahSesi: 0, setSelesai: 0, selesai: false, skorTerakhir: null });
    expect(teksProgresSet(s[0])).toBeNull();
  });

  it('latihan berikutnya = butir pertama yang belum lengkap setnya, mengikuti urutan resep', () => {
    expect(latihanBerikutnya(statusProgramHariIni(ITEMS, [], TODAY))?.latihanId).toBe('fleksi-siku');
    // Satu set Tekuk Siku belum cukup: tetap Tekuk Siku walau latihan kedua sudah selesai.
    const sebagian = statusProgramHariIni(ITEMS, [gerak('fleksi-siku'), gerak('fleksi-bahu')], TODAY);
    expect(latihanBerikutnya(sebagian)?.latihanId).toBe('fleksi-siku');
    const siku = statusProgramHariIni(ITEMS, [gerak('fleksi-siku', TODAY, 9), gerak('fleksi-siku', TODAY, 10)], TODAY);
    expect(latihanBerikutnya(siku)?.latihanId).toBe('fleksi-bahu');
    const semua = statusProgramHariIni(ITEMS, [gerak('fleksi-siku', TODAY, 9), gerak('fleksi-siku', TODAY, 10), gerak('fleksi-bahu')], TODAY);
    expect(latihanBerikutnya(semua)).toBeUndefined();
  });

  it('sesi yang dihentikan sebelum separuh target hanya "Sudah dicoba" dan tetap menjadi latihan berikutnya', () => {
    const coba = (rep: number, jam = 9) => ({ ...gerak('fleksi-bahu', TODAY, jam), repetisiTercapai: rep });
    const satu = statusProgramHariIni(ITEMS, [coba(1)], TODAY)[1];
    expect(satu).toMatchObject({ jumlahSesi: 1, setSelesai: 0, selesai: false, skorTerakhir: null, repetisiDicoba: 1 });
    expect(teksSudahDicoba(satu)).toBe('Sudah dicoba: 1 dari 10');
    // Percobaan terbanyak yang ditampilkan; 4 dari 10 masih di bawah separuh.
    const dua = statusProgramHariIni(ITEMS, [coba(3, 9), coba(4, 10)], TODAY)[1];
    expect(teksSudahDicoba(dua)).toBe('Sudah dicoba: 4 dari 10');
    const sesiSelesai = [gerak('fleksi-siku', TODAY, 7), gerak('fleksi-siku', TODAY, 8), coba(4, 10)];
    expect(latihanBerikutnya(statusProgramHariIni(ITEMS, sesiSelesai, TODAY))?.latihanId).toBe('fleksi-bahu');
    expect(teksSudahDicoba(statusProgramHariIni(ITEMS, [coba(0)], TODAY)[1])).toBe('Sudah dicoba');
  });

  it('separuh target (dibulatkan ke atas) atau lebih sudah dihitung selesai', () => {
    expect(repetisiCukup(10)).toBe(5);
    expect(repetisiCukup(7)).toBe(4);
    expect(repetisiCukup(1)).toBe(1);
    const lima = statusProgramHariIni(ITEMS, [{ ...gerak('fleksi-bahu'), repetisiTercapai: 5, skor: 48 }], TODAY)[1];
    expect(lima).toMatchObject({ selesai: true, setSelesai: 1, skorTerakhir: 48, repetisiDicoba: null });
    expect(teksSudahDicoba(lima)).toBeNull();
    // Percobaan pendek setelah sesi tuntas tidak membatalkan "Selesai" dan tidak mengganti skornya.
    const lalu = statusProgramHariIni(ITEMS, [{ ...gerak('fleksi-bahu', TODAY, 9), skor: 80 }, { ...gerak('fleksi-bahu', TODAY, 10), repetisiTercapai: 1, skor: 10 }], TODAY)[1];
    expect(lalu).toMatchObject({ selesai: true, skorTerakhir: 80 });
    expect(teksSudahDicoba(lalu)).toBeNull();
  });

  it('dua set: satu set tuntas + satu percobaan pendek tetap "1 dari 2 set"', () => {
    const s = statusProgramHariIni(ITEMS, [gerak('fleksi-siku', TODAY, 9), { ...gerak('fleksi-siku', TODAY, 10), repetisiTercapai: 2 }], TODAY)[0];
    expect(s).toMatchObject({ jumlahSesi: 2, setSelesai: 1, selesai: false });
    expect(teksProgresSet(s)).toBe('1 dari 2 set');
    expect(teksSudahDicoba(s)).toBeNull();
  });

  it('teks target menyebut set hanya bila lebih dari satu', () => {
    expect(teksTarget({ targetRepetisi: 10, set: 1 })).toBe('10 kali');
    expect(teksTarget({ targetRepetisi: 10, set: 2 })).toBe('10 kali x 2 set');
  });
});

describe('penyunting resep program', () => {
  const awal: DraftProgram = { items: [{ latihanId: 'fleksi-siku', targetRepetisi: 10, set: 1 }], frekuensiPerMinggu: 5 };

  it('menambah latihan tanpa duplikat dan dibatasi MAKS_LATIHAN', () => {
    const d = tambahLatihan(awal, 'fleksi-bahu', 12);
    expect(d.items.map((i) => i.latihanId)).toEqual(['fleksi-siku', 'fleksi-bahu']);
    expect(d.items[1]).toEqual({ latihanId: 'fleksi-bahu', targetRepetisi: 12, set: 1 });
    expect(tambahLatihan(d, 'fleksi-bahu', 8)).toBe(d);

    let penuh = awal;
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) penuh = tambahLatihan(penuh, id, 10);
    expect(penuh.items).toHaveLength(MAKS_LATIHAN);
  });

  it('nilai repetisi, set, dan frekuensi selalu dalam rentang', () => {
    let d = ubahLatihan(awal, 'fleksi-siku', { targetRepetisi: 99, set: 0 });
    expect(d.items[0]).toMatchObject({ targetRepetisi: BATAS_REPETISI.max, set: BATAS_SET.min });
    d = ubahLatihan(d, 'fleksi-siku', { targetRepetisi: 1, set: 9 });
    expect(d.items[0]).toMatchObject({ targetRepetisi: BATAS_REPETISI.min, set: BATAS_SET.max });
    expect(ubahFrekuensi(d, 0).frekuensiPerMinggu).toBe(BATAS_FREKUENSI.min);
    expect(ubahFrekuensi(d, 8).frekuensiPerMinggu).toBe(BATAS_FREKUENSI.max);
  });

  it('menggeser dan menghapus latihan', () => {
    const d = tambahLatihan(tambahLatihan(awal, 'fleksi-bahu', 10), 'jinjit', 10);
    expect(geserLatihan(d, 'jinjit', -1).items.map((i) => i.latihanId)).toEqual(['fleksi-siku', 'jinjit', 'fleksi-bahu']);
    expect(geserLatihan(d, 'fleksi-siku', -1)).toBe(d);
    expect(geserLatihan(d, 'jinjit', 1)).toBe(d);
    expect(hapusLatihan(d, 'fleksi-bahu').items.map((i) => i.latihanId)).toEqual(['fleksi-siku', 'jinjit']);
  });

  it('mendeteksi perubahan belum tersimpan', () => {
    const tersimpan = draftDariProgram({ patientId: 'budi', ...awal, dibuatOleh: 'x', tanggalUbah: 1 });
    expect(programSama(tersimpan, awal)).toBe(true);
    expect(programSama(ubahLatihan(tersimpan, 'fleksi-siku', { set: 2 }), awal)).toBe(false);
    expect(programSama(ubahFrekuensi(tersimpan, 4), awal)).toBe(false);
    expect(programSama(geserLatihan(tambahLatihan(tersimpan, 'jinjit', 10), 'jinjit', -1), tambahLatihan(awal, 'jinjit', 10))).toBe(false);
    // Draft adalah salinan: mengubahnya tidak mengubah program asal.
    const program = { patientId: 'budi', ...awal, dibuatOleh: 'x', tanggalUbah: 1 };
    draftDariProgram(program).items[0].set = 4;
    expect(program.items[0].set).toBe(1);
  });

  it('membuat program siap simpan dengan penyusun demo dan tanggal ubah; resep kosong ditolak', () => {
    const d = ubahLatihan(awal, 'fleksi-siku', { set: 2 });
    expect(buatProgram('sari', d, 1234)).toEqual({
      patientId: 'sari',
      items: [{ latihanId: 'fleksi-siku', targetRepetisi: 10, set: 2 }],
      frekuensiPerMinggu: 5,
      dibuatOleh: DIBUAT_OLEH_DEMO,
      tanggalUbah: 1234,
    });
    expect(buatProgram('sari', { items: [], frekuensiPerMinggu: 7 }, 1)).toBeNull();
  });

  it('target rentang: disimpan hanya bila di bawah 100, dibatasi 50..100, ikut penjaga perubahan', () => {
    expect(PILIHAN_RENTANG).toEqual([100, 90, 80, 70]);
    const d80 = ubahLatihan(awal, 'fleksi-siku', { rentangPersen: 80 });
    expect(d80.items[0]).toEqual({ latihanId: 'fleksi-siku', targetRepetisi: 10, set: 1, rentangPersen: 80 });
    // Mengubah repetisi tidak membuang target rentang; kembali ke 100 menghapus field.
    expect(ubahLatihan(d80, 'fleksi-siku', { targetRepetisi: 12 }).items[0].rentangPersen).toBe(80);
    expect(ubahLatihan(d80, 'fleksi-siku', { rentangPersen: 100 }).items[0]).toEqual(awal.items[0]);
    expect(ubahLatihan(awal, 'fleksi-siku', { rentangPersen: 20 }).items[0].rentangPersen).toBe(50);

    expect(programSama(d80, awal)).toBe(false);
    expect(programSama(ubahLatihan(d80, 'fleksi-siku', { rentangPersen: 100 }), awal)).toBe(true);
    // Tidak diisi dan 100 setara.
    expect(programSama({ ...awal, items: [{ ...awal.items[0], rentangPersen: 100 }] }, awal)).toBe(true);

    expect(buatProgram('joko', d80, 1)?.items).toEqual([{ latihanId: 'fleksi-siku', targetRepetisi: 10, set: 1, rentangPersen: 80 }]);
    expect(buatProgram('joko', awal, 1)?.items[0]).not.toHaveProperty('rentangPersen');
  });

  it('teks dan tautan program membawa target rentang hanya bila di bawah 100', () => {
    expect(teksRentang({})).toBeNull();
    expect(teksRentang({ rentangPersen: 100 })).toBeNull();
    expect(teksRentang({ rentangPersen: 80 })).toBe('Rentang 80%');
    expect(urlLatihanProgram({ latihanId: 'abduksi-bahu', targetRepetisi: 10 })).toBe('/app/latihan/abduksi-bahu?target=10');
    expect(urlLatihanProgram({ latihanId: 'abduksi-bahu', targetRepetisi: 10, rentangPersen: 100 })).toBe(
      '/app/latihan/abduksi-bahu?target=10',
    );
    expect(urlLatihanProgram({ latihanId: 'abduksi-bahu', targetRepetisi: 8, rentangPersen: 80 })).toBe(
      '/app/latihan/abduksi-bahu?target=8&rentang=80',
    );
    // Nilai di luar batas dari data lama dibatasi, sehingga parameter URL selalu terbaca halaman sesi.
    expect(urlLatihanProgram({ latihanId: 'fleksi-siku', targetRepetisi: 10, rentangPersen: 30 })).toBe(
      '/app/latihan/fleksi-siku?target=10&rentang=50',
    );
  });
});
