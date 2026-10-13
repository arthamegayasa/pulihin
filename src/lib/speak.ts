import { getPrefs } from '@/lib/prefs';

/**
 * Petunjuk suara Bahasa Indonesia lewat speechSynthesis (Bab 7.3, 12.3).
 * Tidak pernah melempar error: bila suara tidak tersedia, teks besar tetap tampil di layar.
 */
let voice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (voice !== undefined) return voice;
  if (!isTtsAvailable()) return (voice = null);
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // daftar suara belum siap, coba lagi di panggilan berikutnya
  voice =
    voices.find((v) => v.lang === 'id-ID' && /google/i.test(v.name)) ??
    voices.find((v) => v.lang === 'id-ID') ??
    voices.find((v) => v.lang.toLowerCase().startsWith('id')) ??
    null;
  return voice;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    voice = undefined;
    pickVoice();
  });
}

export function isTtsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/** Apakah perangkat punya suara Bahasa Indonesia. */
export function hasIndonesianVoice(): boolean {
  return pickVoice() !== null;
}

export interface SpeakOptions {
  /** Hentikan ucapan yang sedang berjalan dulu. Default true. */
  interrupt?: boolean;
  rate?: number;
  /** Abaikan pengaturan suaraAktif (mis. tombol Dengar yang ditekan sendiri). */
  force?: boolean;
  onEnd?: () => void;
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  const { interrupt = true, rate = 0.92, force = false, onEnd } = opts;
  if (!isTtsAvailable() || (!force && !getPrefs().suaraAktif)) {
    onEnd?.();
    return;
  }
  try {
    const synth = window.speechSynthesis;
    if (interrupt) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID';
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = rate;
    u.pitch = 1;
    if (onEnd) {
      u.onend = () => onEnd();
      // Ucapan yang sengaja dihentikan (cancel/disela) TIDAK memicu lanjutan: mencegah kalimat contoh terputar
      // saat mikrofon sudah mendengarkan (bisa memberi nilai Benar palsu di latihan bicara).
      u.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') onEnd();
      };
    }
    synth.speak(u);
  } catch {
    onEnd?.();
  }
}

export function cancelSpeech(): void {
  if (isTtsAvailable()) window.speechSynthesis.cancel();
}
