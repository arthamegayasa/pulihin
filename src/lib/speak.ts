import { klipSuara, type KlipSuara } from '@/features/suara/katalog';
import { getPrefs } from '@/lib/prefs';

/**
 * Petunjuk suara Bahasa Indonesia (Bab 7.3, 12.3). Tidak pernah melempar error: bila suara tidak tersedia,
 * teks besar tetap tampil di layar.
 *
 * Sumber suara: klip pra-rekam ElevenLabs Eleven v4 (suara Matilda) di `public/suara/` yang diputar lewat
 * HTMLAudioElement. Satu ucapan = urutan segmen (lihat src/features/suara/ucapan.ts), satu segmen = satu klip.
 * Bila ada segmen tanpa klip, atau klip gagal sebelum mulai berbunyi (mis. luring sebelum tersimpan, autoplay
 * ditolak), sisa ucapan dibacakan speechSynthesis id-ID seperti sebelumnya.
 *
 * Semantik antrean (sama untuk klip maupun speechSynthesis):
 * - `interrupt` (bawaan true) menghentikan ucapan yang sedang berjalan DAN mengosongkan antrean;
 *   `interrupt: false` mengantre di belakang ucapan yang sedang/akan berjalan.
 * - `onEnd` dipanggil hanya setelah segmen TERAKHIR selesai secara wajar. Ucapan yang dihentikan
 *   (`cancelSpeech`, disela ucapan lain) TIDAK memicu `onEnd`: mencegah kalimat contoh terputar saat mikrofon
 *   sudah mendengarkan (bisa memberi nilai Benar palsu di latihan bicara).
 */

export interface SpeakOptions {
  /** Hentikan ucapan yang sedang berjalan (dan antreannya) dulu. Default true. */
  interrupt?: boolean;
  /** Kecepatan speechSynthesis cadangan; klip pra-rekam sudah diucapkan dengan tempo yang sesuai. */
  rate?: number;
  /** Abaikan pengaturan suaraAktif (mis. tombol Dengar yang ditekan sendiri). */
  force?: boolean;
  onEnd?: () => void;
}

/** Satu kalimat, atau urutan segmen dari pembangun ucapan.ts. */
export type TeksUcapan = string | readonly string[];

/** Klip yang belum berbunyi dalam waktu ini dianggap gagal: sisa ucapan dibacakan speechSynthesis. */
const BATAS_MULAI_KLIP_MS = 3000;
/** Elemen audio yang disimpan siap putar (dibatasi: Chrome Android membatasi jumlah pemutar media per halaman). */
const MAKS_KOLAM = 48;

// ---------------------------------------------------------------------------------------------------------
// speechSynthesis (cadangan)

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

/** Apakah perangkat punya suara Bahasa Indonesia untuk speechSynthesis. */
export function hasIndonesianVoice(): boolean {
  return pickVoice() !== null;
}

function audioTersedia(): boolean {
  return typeof Audio !== 'undefined';
}

// ---------------------------------------------------------------------------------------------------------
// Kolam elemen audio: klip sesi dimuat lebih dulu agar hitungan berbunyi tanpa jeda.

const kolam = new Map<string, HTMLAudioElement>();

function lepasElemen(el: HTMLAudioElement): void {
  el.onplaying = el.onended = el.onerror = null;
  el.removeAttribute('src');
  el.load();
}

/** Elemen siap putar untuk `url` (dibuat bila belum ada); urutan Map = urutan pemakaian terakhir. */
function elemen(url: string): HTMLAudioElement {
  let el = kolam.get(url);
  kolam.delete(url);
  // Elemen yang pernah gagal (mis. dimuat saat luring) dibuat ulang agar dicoba lagi.
  if (!el || el.error) {
    el = new Audio(url);
    el.preload = 'auto';
  }
  kolam.set(url, el);
  for (const [u, lama] of kolam) {
    if (kolam.size <= MAKS_KOLAM) break;
    if (lama === elemenAktif) continue;
    kolam.delete(u);
    lepasElemen(lama);
  }
  return el;
}

/**
 * Muat klip ucapan-ucapan ini ke memori lebih dulu (awal sesi kamera/latihan bicara) agar langsung berbunyi.
 * Segmen tanpa klip dilewati. Tidak memutar apa pun.
 */
export function pramuatSuara(segmen: Iterable<string>): void {
  if (!audioTersedia()) return;
  try {
    for (const s of segmen) {
      const klip = klipSuara(s);
      if (klip) elemen(klip.url);
    }
  } catch {
    /* pramuat hanya mempercepat; pemutaran tetap memuat klip saat dibutuhkan */
  }
}

// ---------------------------------------------------------------------------------------------------------
// Antrean ucapan

interface Putaran {
  segmen: readonly string[];
  rate: number;
  onEnd?: () => void;
}

const antrean: Putaran[] = [];
/** Naik setiap kali ucapan dihentikan: callback dari ucapan lama tidak berlaku lagi. */
let generasi = 0;
/** Ada ucapan yang sedang berjalan (klip atau speechSynthesis). */
let berjalan = false;
let elemenAktif: HTMLAudioElement | null = null;
let ttsAktif = false;
let pengatur: number | undefined;

function aturWaktu(ms: number, fn: () => void): void {
  window.clearTimeout(pengatur);
  pengatur = window.setTimeout(fn, ms);
}

function hentikanSemua(): void {
  generasi++;
  antrean.length = 0;
  clearTimeout(pengatur);
  if (elemenAktif) {
    const el = elemenAktif;
    elemenAktif = null;
    el.onplaying = el.onended = el.onerror = null;
    try {
      el.pause();
    } catch {
      /* elemen sudah tidak bisa dikendalikan */
    }
  }
  if (ttsAktif) {
    ttsAktif = false;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* abaikan */
    }
  }
  berjalan = false;
}

/** Ucapan selesai wajar: panggil onEnd, lalu lanjutkan antrean (onEnd boleh mengantre ucapan baru). */
function selesai(gen: number, p: Putaran): void {
  if (gen !== generasi) return;
  clearTimeout(pengatur);
  elemenAktif = null;
  ttsAktif = false;
  berjalan = false;
  try {
    p.onEnd?.();
  } finally {
    if (!berjalan) lanjut();
  }
}

function lanjut(): void {
  const p = antrean.shift();
  if (!p) return;
  berjalan = true;
  const gen = generasi;
  const klip = p.segmen.map(klipSuara);
  if (audioTersedia() && klip.every((k): k is KlipSuara => k !== null)) putarKlip(gen, p, klip, 0);
  else ucapTts(gen, p, p.segmen.join(' '));
}

function putarKlip(gen: number, p: Putaran, klip: readonly KlipSuara[], i: number): void {
  let el: HTMLAudioElement;
  try {
    el = elemen(klip[i].url);
  } catch {
    ucapTts(gen, p, p.segmen.slice(i).join(' '));
    return;
  }
  elemenAktif = el;
  let mulai = false;
  /** Segmen ini sudah selesai atau sudah dialihkan ke speechSynthesis: callback berikutnya diabaikan. */
  let habis = false;
  const berlaku = () => gen === generasi && !habis;
  const lepas = () => {
    habis = true;
    el.onplaying = el.onended = el.onerror = null;
  };
  const gagalSebelumMulai = () => {
    if (!berlaku() || mulai) return;
    lepas();
    try {
      el.pause();
    } catch {
      /* abaikan */
    }
    elemenAktif = null;
    ucapTts(gen, p, p.segmen.slice(i).join(' '));
  };
  const segmenSelesai = () => {
    if (!berlaku()) return;
    lepas();
    if (i + 1 < klip.length) putarKlip(gen, p, klip, i + 1);
    else selesai(gen, p);
  };
  const tandaiMulai = () => {
    if (!berlaku() || mulai) return;
    mulai = true;
    // Pengaman bila 'ended' tidak pernah datang (pemutaran macet): lanjut setelah durasi klip + kelonggaran.
    aturWaktu(klip[i].ms * 1.5 + 2000, segmenSelesai);
  };
  el.onplaying = tandaiMulai;
  el.onended = segmenSelesai;
  // Galat setelah mulai berbunyi: segmen dianggap selesai (seperti galat speechSynthesis selain 'interrupted').
  el.onerror = () => (mulai ? segmenSelesai() : gagalSebelumMulai());
  aturWaktu(BATAS_MULAI_KLIP_MS, gagalSebelumMulai);
  try {
    el.currentTime = 0;
    const janji = el.play() as Promise<void> | undefined;
    janji?.then(tandaiMulai, gagalSebelumMulai);
  } catch {
    gagalSebelumMulai();
  }
}

function ucapTts(gen: number, p: Putaran, teks: string): void {
  if (gen !== generasi) return;
  if (!isTtsAvailable()) {
    selesai(gen, p);
    return;
  }
  // onend dan pengaman waktu bisa sama-sama datang: hanya yang pertama berlaku.
  let habis = false;
  const akhiri = () => {
    if (habis) return;
    habis = true;
    selesai(gen, p);
  };
  try {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(teks);
    u.lang = 'id-ID';
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = p.rate;
    u.pitch = 1;
    u.onend = akhiri;
    u.onerror = (e) => {
      if (gen !== generasi || habis) return;
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        akhiri();
        return;
      }
      // Dihentikan dari luar antrean ini: tanpa onEnd, lanjut ke ucapan berikutnya.
      habis = true;
      ttsAktif = false;
      berjalan = false;
      clearTimeout(pengatur);
      lanjut();
    };
    ttsAktif = true;
    // Pengaman bila onend tidak pernah datang (bug sebagian mesin TTS): antrean tidak boleh macet selamanya.
    aturWaktu(4000 + (teks.length * 180) / p.rate, akhiri);
    synth.speak(u);
  } catch {
    akhiri();
  }
}

/**
 * Ucapkan satu kalimat atau urutan segmen. Klip pra-rekam dipakai bila SEMUA segmen punya klip; selain itu
 * speechSynthesis membacakan gabungan teksnya.
 */
export function speak(teks: TeksUcapan, opts: SpeakOptions = {}): void {
  const { interrupt = true, rate = 0.92, force = false, onEnd } = opts;
  const segmen = (typeof teks === 'string' ? [teks] : teks).filter((s) => s.trim() !== '');
  const adaSuara = audioTersedia() || isTtsAvailable();
  if (segmen.length === 0 || !adaSuara || (!force && !getPrefs().suaraAktif)) {
    onEnd?.();
    return;
  }
  if (interrupt) hentikanSemua();
  antrean.push({ segmen, rate, onEnd });
  if (!berjalan) lanjut();
}

/** Hentikan ucapan yang sedang berjalan dan kosongkan antrean, tanpa memanggil onEnd. */
export function cancelSpeech(): void {
  hentikanSemua();
  if (isTtsAvailable()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* abaikan */
    }
  }
}
