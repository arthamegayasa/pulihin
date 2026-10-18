import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buatPenjagaUcapan, putarContohKata } from '@/features/speech/contohKata';
import { cancelSpeech, pramuatSuara, speak } from './speak';

/**
 * Pemutar suara (speak.ts) dengan Audio dan speechSynthesis palsu: urutan segmen, sela, antrean, onEnd,
 * cadangan speechSynthesis, dan invarian penjaga kalimat contoh tombol Dengar.
 */

const { KLIP, prefs, log, ditolak, macet, AudioPalsu, ucapanTts, synth } = vi.hoisted(() => {
  /** Peristiwa pemutaran berurutan: 'putar /suara/a.mp3', 'jeda /suara/a.mp3', 'tts <teks>'. */
  const log: string[] = [];
  /** URL yang play()-nya ditolak (mis. autoplay diblokir). */
  const ditolak = new Set<string>();
  /** URL yang play()-nya tidak pernah selesai (pemuatan macet). */
  const macet = new Set<string>();

  class AudioPalsu {
    static dibuat: AudioPalsu[] = [];
    src: string;
    preload = '';
    currentTime = 0;
    error: unknown = null;
    onplaying: (() => void) | null = null;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(src: string) {
      this.src = src;
      AudioPalsu.dibuat.push(this);
    }
    play(): Promise<void> {
      log.push(`putar ${this.src}`);
      if (ditolak.has(this.src)) return Promise.reject(new Error('NotAllowedError'));
      if (macet.has(this.src)) return new Promise(() => {});
      return Promise.resolve();
    }
    pause() {
      log.push(`jeda ${this.src}`);
    }
    removeAttribute() {}
    load() {}
  }

  class UtterancePalsu {
    lang = '';
    rate = 1;
    pitch = 1;
    voice: unknown = null;
    onend: (() => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    constructor(public text: string) {}
  }

  const ucapanTts: UtterancePalsu[] = [];
  const synth = {
    speak: (u: UtterancePalsu) => {
      log.push(`tts ${u.text}`);
      ucapanTts.push(u);
    },
    cancel: vi.fn(),
    getVoices: () => [],
    addEventListener: () => {},
  };

  // Dipasang sebelum speak.ts dimuat: modul itu mendaftar 'voiceschanged' saat dimuat.
  vi.stubGlobal('window', {
    speechSynthesis: synth,
    SpeechSynthesisUtterance: UtterancePalsu,
    // Diteruskan saat dipanggil agar vi.useFakeTimers() ikut berlaku.
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: number) => clearTimeout(id),
  });
  vi.stubGlobal('SpeechSynthesisUtterance', UtterancePalsu);
  vi.stubGlobal('Audio', AudioPalsu);

  return {
    KLIP: {
      A: 'a.mp3',
      B: 'b.mp3',
      C: 'c.mp3',
      gelas: 'gelas.mp3',
      'Saya minum dari gelas.': 'kalimat-gelas.mp3',
    } as Record<string, string>,
    prefs: { suaraAktif: true },
    log,
    ditolak,
    macet,
    AudioPalsu,
    ucapanTts,
    synth,
  };
});

vi.mock('@/features/suara/katalog', () => ({
  klipSuara: (teks: string) => (KLIP[teks] ? { url: `/suara/${KLIP[teks]}`, ms: 500 } : null),
}));
vi.mock('@/lib/prefs', () => ({ getPrefs: () => prefs }));

/** Elemen audio terakhir untuk URL klip ini. */
const el = (berkas: string) => AudioPalsu.dibuat.filter((a) => a.src === `/suara/${berkas}`).at(-1)!;
/** Selesaikan antrean microtask (janji play()). */
async function alir() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

beforeEach(() => {
  cancelSpeech();
  log.length = 0;
  ucapanTts.length = 0;
  ditolak.clear();
  macet.clear();
  prefs.suaraAktif = true;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('speak: klip pra-rekam', () => {
  it('memutar segmen berurutan; onEnd hanya setelah segmen terakhir selesai', async () => {
    const onEnd = vi.fn();
    speak(['A', 'B'], { onEnd });
    await alir();
    expect(log).toEqual(['putar /suara/a.mp3']);
    el('a.mp3').onended!();
    await alir();
    expect(log).toEqual(['putar /suara/a.mp3', 'putar /suara/b.mp3']);
    expect(onEnd).not.toHaveBeenCalled();
    el('b.mp3').onended!();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(ucapanTts).toHaveLength(0);
  });

  it('bawaan menyela: ucapan berjalan dihentikan, antreannya dibuang, onEnd lama tidak pernah dipanggil', async () => {
    const onEndLama = vi.fn();
    const onEndAntre = vi.fn();
    speak(['A', 'B'], { onEnd: onEndLama });
    speak('B', { interrupt: false, onEnd: onEndAntre });
    await alir();
    const a = el('a.mp3');
    const handlerLama = a.onended;
    speak('C');
    await alir();
    expect(log).toEqual(['putar /suara/a.mp3', 'jeda /suara/a.mp3', 'putar /suara/c.mp3']);
    // 'ended' terlambat dari klip yang disela tidak berpengaruh.
    handlerLama?.();
    el('c.mp3').onended!();
    await alir();
    expect(onEndLama).not.toHaveBeenCalled();
    expect(onEndAntre).not.toHaveBeenCalled();
    expect(log).toEqual(['putar /suara/a.mp3', 'jeda /suara/a.mp3', 'putar /suara/c.mp3']);
  });

  it('interrupt:false mengantre di belakang ucapan yang sedang berjalan', async () => {
    const onEnd = vi.fn();
    speak('A');
    speak('B', { interrupt: false, onEnd });
    await alir();
    expect(log).toEqual(['putar /suara/a.mp3']);
    el('a.mp3').onended!();
    await alir();
    expect(log).toEqual(['putar /suara/a.mp3', 'putar /suara/b.mp3']);
    el('b.mp3').onended!();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('cancelSpeech menghentikan klip dan antrean tanpa onEnd', async () => {
    const onEnd = vi.fn();
    speak(['A', 'B'], { onEnd });
    speak('C', { interrupt: false, onEnd });
    await alir();
    const handler = el('a.mp3').onended;
    cancelSpeech();
    handler?.();
    await alir();
    expect(onEnd).not.toHaveBeenCalled();
    expect(log).toEqual(['putar /suara/a.mp3', 'jeda /suara/a.mp3']);
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('galat setelah klip mulai berbunyi: lanjut ke segmen berikutnya', async () => {
    const onEnd = vi.fn();
    speak(['A', 'B'], { onEnd });
    await alir();
    el('a.mp3').onerror!();
    await alir();
    expect(log).toEqual(['putar /suara/a.mp3', 'putar /suara/b.mp3']);
    el('b.mp3').onended!();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('pramuatSuara menyiapkan elemen yang kemudian dipakai ulang saat diputar', async () => {
    pramuatSuara(['C', 'tanpa klip']);
    const siap = el('c.mp3');
    expect(siap.preload).toBe('auto');
    const jumlah = AudioPalsu.dibuat.length;
    speak('C');
    await alir();
    expect(AudioPalsu.dibuat.length).toBe(jumlah);
    expect(log).toEqual(['putar /suara/c.mp3']);
  });

  it('pengaturan suara mati: tidak berbunyi dan onEnd langsung; force tetap berbunyi', async () => {
    prefs.suaraAktif = false;
    const onEnd = vi.fn();
    speak('A', { onEnd });
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(log).toEqual([]);
    speak('A', { force: true });
    await alir();
    expect(log).toEqual(['putar /suara/a.mp3']);
  });
});

describe('speak: cadangan speechSynthesis', () => {
  it('segmen tanpa klip: seluruh ucapan dibacakan speechSynthesis', () => {
    const onEnd = vi.fn();
    speak(['A', 'Belum ada klipnya.'], { onEnd, rate: 0.8 });
    expect(log).toEqual(['tts A Belum ada klipnya.']);
    expect(ucapanTts[0].rate).toBe(0.8);
    expect(ucapanTts[0].lang).toBe('id-ID');
    ucapanTts[0].onend!();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('klip gagal sebelum berbunyi (autoplay ditolak): sisa ucapan dibacakan speechSynthesis', async () => {
    ditolak.add('/suara/a.mp3');
    const onEnd = vi.fn();
    speak(['A', 'B'], { onEnd });
    await alir();
    expect(log).toEqual(['putar /suara/a.mp3', 'jeda /suara/a.mp3', 'tts A B']);
    ucapanTts[0].onend!();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('segmen kedua gagal sebelum berbunyi: hanya segmen itu yang dibacakan speechSynthesis', async () => {
    ditolak.add('/suara/b.mp3');
    speak(['A', 'B']);
    await alir();
    el('a.mp3').onended!();
    await alir();
    expect(log).toEqual(['putar /suara/a.mp3', 'putar /suara/b.mp3', 'jeda /suara/b.mp3', 'tts B']);
  });

  it('klip yang tidak kunjung berbunyi dalam 3 detik dialihkan ke speechSynthesis', async () => {
    vi.useFakeTimers();
    macet.add('/suara/c.mp3');
    speak('C');
    await alir();
    expect(log).toEqual(['putar /suara/c.mp3']);
    vi.advanceTimersByTime(3000);
    expect(log).toEqual(['putar /suara/c.mp3', 'jeda /suara/c.mp3', 'tts C']);
  });

  it('ucapan speechSynthesis yang disela tidak memanggil onEnd, dan antrean campuran tetap berurutan', async () => {
    const onEnd = vi.fn();
    speak('Tanpa klip.', { onEnd });
    speak('A', { interrupt: false });
    expect(log).toEqual(['tts Tanpa klip.']);
    ucapanTts[0].onend!();
    await alir();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(log).toEqual(['tts Tanpa klip.', 'putar /suara/a.mp3']);

    const onEnd2 = vi.fn();
    speak('Tanpa klip lagi.', { onEnd: onEnd2 });
    const u = ucapanTts.at(-1)!;
    speak('B');
    u.onerror!({ error: 'interrupted' });
    expect(onEnd2).not.toHaveBeenCalled();
  });
});

describe('Dengar: kalimat contoh tidak pernah terputar setelah mikrofon dibuka', () => {
  const KATA = { kata: 'gelas', kalimatContoh: 'Saya minum dari gelas.' };

  it('kata selesai wajar: kalimat contoh menyusul', async () => {
    putarContohKata(KATA, buatPenjagaUcapan());
    await alir();
    el('gelas.mp3').onended!();
    await alir();
    expect(log).toEqual(['putar /suara/gelas.mp3', 'putar /suara/kalimat-gelas.mp3']);
  });

  it('mikrofon dibuka saat kata berbunyi (penjaga dibatalkan + suara dihentikan): kalimat tidak pernah terputar', async () => {
    const penjaga = buatPenjagaUcapan();
    putarContohKata(KATA, penjaga);
    await alir();
    const ended = el('gelas.mp3').onended;
    penjaga.batalkan();
    cancelSpeech();
    ended?.();
    await alir();
    expect(log).toEqual(['putar /suara/gelas.mp3', 'jeda /suara/gelas.mp3']);
  });

  it('penjaga dibatalkan tetapi kata tetap selesai wajar: kalimat tidak terputar', async () => {
    const penjaga = buatPenjagaUcapan();
    putarContohKata(KATA, penjaga);
    await alir();
    penjaga.batalkan();
    el('gelas.mp3').onended!();
    await alir();
    expect(log).toEqual(['putar /suara/gelas.mp3']);
  });

  it('cadangan speechSynthesis: kata yang dihentikan (interrupted) tidak memicu kalimat contoh', () => {
    const penjaga = buatPenjagaUcapan();
    putarContohKata({ kata: 'meja', kalimatContoh: 'Gelas ada di atas meja.' }, penjaga);
    expect(log).toEqual(['tts meja']);
    const u = ucapanTts[0];
    penjaga.batalkan();
    cancelSpeech();
    u.onerror!({ error: 'interrupted' });
    u.onend?.();
    expect(log).toEqual(['tts meja']);
  });
});
