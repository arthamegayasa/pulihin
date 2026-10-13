import { describe, expect, it } from 'vitest';
import { buatLaporan, FOOTER_RINGKASAN, kataTren, teksRingkasanMingguan } from './laporan';
import { hariLengkap } from './testUtils';

const TODAY = '2026-10-13';

describe('ringkasan mingguan untuk WhatsApp', () => {
  it('memuat nama samaran, periode, angka kepatuhan, streak, skor, penanda, dan kalimat penutup', () => {
    const s = [...hariLengkap(TODAY, [7, 8, 9, 10], 60), ...hariLengkap(TODAY, [4, 5, 6], 70)];
    const lap = buatLaporan(s, TODAY);
    const teks = teksRingkasanMingguan({ namaSamaran: 'Pak Budi', isDemo: true }, lap);
    expect(teks).toContain('Pak Budi (data contoh Demo)');
    expect(teks).toContain('Periode: 7 Okt sampai 13 Okt 2026');
    expect(teks).toContain('Sesi terjadwal dikerjakan: 6 dari 14 (43%; target harian 1 sesi gerak + 1 sesi bicara)');
    expect(teks).toContain('Hari berturut-turut berlatih: 0 hari (terpanjang 7 hari)');
    expect(teks).toContain('Skor latihan gerak: rata-rata 70 (naik dari 60 minggu lalu)');
    expect(teks).toContain('Skor latihan bicara: rata-rata 70 (naik dari 60 minggu lalu)');
    expect(teks).toContain('- Sudah 3 hari belum latihan.');
    expect(teks.trim().endsWith(FOOTER_RINGKASAN)).toBe(true);
  });

  it('tanpa penanda menulis "tidak ada"', () => {
    const lap = buatLaporan(hariLengkap(TODAY, [0, 1, 2, 3, 4, 5, 6]), TODAY);
    const teks = teksRingkasanMingguan({ namaSamaran: 'Bu Sari', isDemo: false }, lap);
    expect(teks).toContain('Tanda perlu perhatian: tidak ada.');
    expect(teks).toContain('14 dari 14 (100%');
    expect(teks).not.toContain('Demo');
  });

  it('penanda "sempat kosong" ditulis dengan kalimat utuh', () => {
    const lap = buatLaporan(hariLengkap(TODAY, [0, 4, 5, 6, 7, 8, 9]), TODAY);
    const teks = teksRingkasanMingguan({ namaSamaran: 'Pak Budi', isDemo: true }, lap);
    expect(teks).toContain(
      '- Minggu ini sempat 3 hari berturut-turut tanpa latihan. Latihan sudah berjalan lagi, bagus. Ceritakan jeda ini kepada terapis atau dokter yang merawat pada kesempatan berikutnya.',
    );
    expect(teks).not.toMatch(/saat hubungi/);
  });
});

describe('kataTren', () => {
  it('naik / turun / stabil / tanpa pembanding', () => {
    expect(kataTren({ jenis: 'gerak', sekarang: 70, sebelum: 60 })).toBe('naik dari 60 minggu lalu');
    expect(kataTren({ jenis: 'gerak', sekarang: 50, sebelum: 60 })).toBe('turun dari 60 minggu lalu');
    expect(kataTren({ jenis: 'gerak', sekarang: 61, sebelum: 60 })).toBe('stabil, minggu lalu 60');
    expect(kataTren({ jenis: 'gerak', sekarang: 61, sebelum: null })).toBe('belum ada pembanding minggu lalu');
  });
});
