import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type GalatPengenalan,
  type HasilPengenalan,
  isSpeechRecognitionSupported,
  KONFIG_PENGENAL,
  mulaiDengar,
  terjemahkanGalat,
} from './recognizer';

/** Pengenal suara palsu yang meniru urutan event Chrome. */
class PengenalPalsu {
  static terakhir: PengenalPalsu | null = null;
  lang = '';
  interimResults = false;
  maxAlternatives = 1;
  continuous = true;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  onspeechend: (() => void) | null = null;
  onaudiostart: (() => void) | null = null;
  dimulai = false;
  dibatalkan = false;
  constructor() {
    PengenalPalsu.terakhir = this;
  }
  start() {
    this.dimulai = true;
  }
  stop() {
    this.onend?.();
  }
  abort() {
    this.dibatalkan = true;
    this.onend?.();
  }
  kirim(transkrip: string[], isFinal: boolean) {
    const hasil = Object.assign(
      transkrip.map((transcript) => ({ transcript })),
      { isFinal },
    );
    this.onresult?.({ results: [hasil] });
  }
}

const pasangWindow = () => vi.stubGlobal('window', { webkitSpeechRecognition: PengenalPalsu });

function rekam() {
  const hasil: HasilPengenalan[] = [];
  const galat: GalatPengenalan[] = [];
  const sementara: string[] = [];
  let selesai = 0;
  const sesi = mulaiDengar({
    onHasil: (h) => hasil.push(h),
    onGalat: (g) => galat.push(g),
    onSementara: (t) => sementara.push(t),
    onSelesai: () => selesai++,
  });
  return { sesi, hasil, galat, sementara, selesai: () => selesai, rec: PengenalPalsu.terakhir! };
}

describe('recognizer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    PengenalPalsu.terakhir = null;
  });

  it('mendeteksi dukungan Web Speech API', () => {
    expect(isSpeechRecognitionSupported()).toBe(false);
    pasangWindow();
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it('memakai id-ID, hasil sementara, 5 alternatif, tidak terus-menerus', () => {
    pasangWindow();
    const { rec } = rekam();
    expect(rec.lang).toBe('id-ID');
    expect(rec.interimResults).toBe(true);
    expect(rec.maxAlternatives).toBe(5);
    expect(rec.continuous).toBe(false);
    expect(rec.dimulai).toBe(true);
  });

  it('meneruskan semua alternatif hasil akhir seketika, tanpa duplikat, sekali saja', () => {
    pasangWindow();
    const r = rekam();
    r.rec.kirim(['kur'], false);
    r.rec.onspeechend?.();
    r.rec.kirim(['kursi', 'kursi', 'kurasi', 'kur'], true);
    r.rec.onend?.();
    expect(r.sementara).toEqual(['kur']);
    expect(r.hasil).toHaveLength(1);
    expect(r.hasil[0].alternatif).toEqual(['kursi', 'kurasi', 'kur']);
    expect(r.hasil[0].sumber).toBe('akhir');
    expect(r.hasil[0].latensiMs).not.toBeNull();
    expect(r.galat).toHaveLength(0);
    expect(r.selesai()).toBe(1);
  });

  it('memakai transkrip sementara bila hasil akhir terlambat (AC-F3-3)', () => {
    pasangWindow();
    const r = rekam();
    r.rec.kirim(['kursi'], false);
    vi.advanceTimersByTime(KONFIG_PENGENAL.jedaHeningMs - 1);
    expect(r.hasil).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(r.hasil).toHaveLength(1);
    expect(r.hasil[0]).toMatchObject({ alternatif: ['kursi'], sumber: 'jeda' });
    expect(r.rec.dibatalkan).toBe(true);
    // hasil akhir yang datang belakangan diabaikan
    r.rec.kirim(['kursi'], true);
    expect(r.hasil).toHaveLength(1);
  });

  it('setelah akhir bicara, batas tunggu hasil akhir lebih pendek dari 1,5 detik', () => {
    pasangWindow();
    const r = rekam();
    r.rec.kirim(['meja'], false);
    r.rec.onspeechend?.();
    vi.advanceTimersByTime(KONFIG_PENGENAL.batasSetelahAkhirBicaraMs);
    expect(r.hasil).toHaveLength(1);
    expect(KONFIG_PENGENAL.batasSetelahAkhirBicaraMs).toBeLessThan(1500);
  });

  it('hasil akhir kosong dianggap belum terdengar, bukan jawaban salah', () => {
    pasangWindow();
    const r = rekam();
    r.rec.onspeechend?.();
    r.rec.kirim(['', '  '], true);
    r.rec.onend?.();
    expect(r.hasil).toHaveLength(0);
    expect(r.galat.map((g) => g.kode)).toEqual(['tidak-terdengar']);
    expect(r.selesai()).toBe(1);
  });

  it('memetakan galat ke pesan Bahasa Indonesia', () => {
    expect(terjemahkanGalat('not-allowed')?.kode).toBe('izin');
    expect(terjemahkanGalat('service-not-allowed')?.kode).toBe('izin');
    expect(terjemahkanGalat('no-speech')?.pesan).toBe('Belum terdengar. Coba dekatkan ponsel dan ucapkan lagi.');
    expect(terjemahkanGalat('network')).toMatchObject({ kode: 'jaringan', sarankanMandiri: true });
    expect(terjemahkanGalat('audio-capture')?.kode).toBe('mikrofon');
    expect(terjemahkanGalat('sesuatu-baru')?.kode).toBe('lainnya');
    expect(terjemahkanGalat('aborted')).toBeNull();
  });

  it('galat izin diteruskan sekali, lalu sesi selesai', () => {
    pasangWindow();
    const r = rekam();
    r.rec.onerror?.({ error: 'not-allowed' });
    r.rec.onend?.();
    expect(r.galat.map((g) => g.kode)).toEqual(['izin']);
    expect(r.hasil).toHaveLength(0);
    expect(r.selesai()).toBe(1);
  });

  it('berhenti tanpa suara memberi pesan "belum terdengar"', () => {
    pasangWindow();
    const r = rekam();
    r.sesi.stop();
    expect(r.galat.map((g) => g.kode)).toEqual(['tidak-terdengar']);
  });

  it('dibatalkan tidak memberi hasil maupun galat', () => {
    pasangWindow();
    const r = rekam();
    r.rec.kirim(['kur'], false);
    r.sesi.abort();
    vi.advanceTimersByTime(5000);
    expect(r.hasil).toHaveLength(0);
    expect(r.galat).toHaveLength(0);
    expect(r.selesai()).toBe(1);
  });
});
