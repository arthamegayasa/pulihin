/**
 * Pembungkus Web Speech API (SpeechRecognition / webkitSpeechRecognition) untuk latihan afasia.
 *
 * Catatan privasi (Bab 17.3): di Chrome, audio dikirim ke layanan pengenalan suara cloud milik
 * penyedia browser. PULIHIN sendiri tidak merekam atau menyimpan audio; hanya teks hasil yang disimpan
 * di perangkat. Bila layanan tidak tersedia, halaman menawarkan Mode Mandiri.
 *
 * AC-F3-3 (hasil < 1,5 detik setelah pasien berhenti bicara): hasil akhir diteruskan seketika. Bila
 * mesin lambat mengirim hasil akhir, transkrip sementara terakhir dipakai setelah jeda hening singkat.
 */

export interface KonfigPengenal {
  bahasa: string;
  maksAlternatif: number;
  /** Bila hasil akhir belum datang selama ini sejak transkrip sementara terakhir, pakai transkrip itu. */
  jedaHeningMs: number;
  /** Batas tunggu hasil akhir setelah browser menandai akhir bicara (speechend). */
  batasSetelahAkhirBicaraMs: number;
}

export const KONFIG_PENGENAL: KonfigPengenal = {
  bahasa: 'id-ID',
  maksAlternatif: 5,
  jedaHeningMs: 1000,
  batasSetelahAkhirBicaraMs: 800,
};

/* ---------- tipe minimal API browser (tidak semua versi lib.dom memuatnya) ---------- */

interface AlternatifNatif {
  readonly transcript: string;
}
interface HasilNatif {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [i: number]: AlternatifNatif;
}
interface EventHasilNatif {
  readonly results: { readonly length: number; readonly [i: number]: HasilNatif };
}
interface EventGalatNatif {
  readonly error: string;
}
interface PengenalNatif {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: EventHasilNatif) => void) | null;
  onerror: ((e: EventGalatNatif) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
  onaudiostart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type KonstruktorPengenal = new () => PengenalNatif;

function konstruktorPengenal(): KonstruktorPengenal | null {
  if (typeof window === 'undefined') return null;
  // Konstruktor ini tidak ada di lib.dom semua versi TypeScript; bentuknya didefinisikan di atas.
  const w = window as unknown as { SpeechRecognition?: KonstruktorPengenal; webkitSpeechRecognition?: KonstruktorPengenal };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return konstruktorPengenal() !== null;
}

/* ---------- galat → pesan ramah ---------- */

export type KodeGalat = 'izin' | 'tidak-terdengar' | 'jaringan' | 'mikrofon' | 'bahasa' | 'tidak-didukung' | 'lainnya';

export interface GalatPengenalan {
  kode: KodeGalat;
  pesan: string;
  /** true bila Mode Mandiri layak ditawarkan sebagai jalan keluar. */
  sarankanMandiri: boolean;
}

const GALAT: Record<KodeGalat, Omit<GalatPengenalan, 'kode'>> = {
  izin: {
    pesan:
      'Mikrofon belum diizinkan. Ketuk ikon gembok di samping alamat situs, izinkan Mikrofon, lalu tekan Coba Lagi.',
    sarankanMandiri: true,
  },
  'tidak-terdengar': { pesan: 'Belum terdengar. Coba dekatkan ponsel dan ucapkan lagi.', sarankanMandiri: false },
  jaringan: {
    pesan:
      'Pengenalan suara perlu internet, karena browser ini memakai layanan cloud penyedianya. Coba lagi saat tersambung, atau pakai Mode Mandiri.',
    sarankanMandiri: true,
  },
  mikrofon: {
    pesan: 'Mikrofon tidak terdeteksi atau sedang dipakai aplikasi lain. Tutup aplikasi lain, lalu coba lagi.',
    sarankanMandiri: true,
  },
  bahasa: { pesan: 'Browser ini belum bisa mengenali Bahasa Indonesia. Silakan pakai Mode Mandiri.', sarankanMandiri: true },
  'tidak-didukung': { pesan: 'Browser ini belum mendukung pengenalan suara. Silakan pakai Mode Mandiri.', sarankanMandiri: true },
  lainnya: { pesan: 'Pengenalan suara sedang terganggu. Coba lagi, atau pakai Mode Mandiri.', sarankanMandiri: true },
};

const KODE_BROWSER: Record<string, KodeGalat> = {
  'not-allowed': 'izin',
  'service-not-allowed': 'izin',
  'no-speech': 'tidak-terdengar',
  network: 'jaringan',
  'audio-capture': 'mikrofon',
  'language-not-supported': 'bahasa',
};

/** Terjemahkan kode galat SpeechRecognition ke pesan Bahasa Indonesia. `aborted` → null (bukan galat bagi pengguna). */
export function terjemahkanGalat(kodeBrowser: string): GalatPengenalan | null {
  if (kodeBrowser === 'aborted') return null;
  const kode = KODE_BROWSER[kodeBrowser] ?? 'lainnya';
  return { kode, ...GALAT[kode] };
}

/* ---------- sesi mendengar ---------- */

export interface HasilPengenalan {
  /** Transkrip kandidat, terbaik lebih dulu, tanpa duplikat. */
  alternatif: string[];
  /** Milidetik dari akhir bicara (speechend, atau transkrip sementara terakhir) sampai hasil siap. */
  latensiMs: number | null;
  /** 'akhir' = hasil akhir mesin; 'jeda' = transkrip sementara dipakai setelah jeda hening. */
  sumber: 'akhir' | 'jeda';
}

export interface PendengarPengenalan {
  /** Mikrofon mulai menangkap suara. */
  onMulai?: () => void;
  /** Transkrip sementara untuk ditampilkan langsung. */
  onSementara?: (teks: string) => void;
  /** Dipanggil paling banyak sekali per sesi, bergantian dengan onGalat. */
  onHasil: (h: HasilPengenalan) => void;
  onGalat?: (g: GalatPengenalan) => void;
  /** Mesin benar-benar berhenti (selalu dipanggil sekali). */
  onSelesai?: () => void;
}

export interface SesiDengar {
  /** Akhiri dengar dan nilai yang sudah terdengar. */
  stop(): void;
  /** Batalkan tanpa hasil dan tanpa galat. */
  abort(): void;
}

/** Mulai satu sesi dengar untuk satu ucapan. Setiap panggilan memakai instance baru. */
export function mulaiDengar(p: PendengarPengenalan, k: KonfigPengenal = KONFIG_PENGENAL): SesiDengar {
  const Pengenal = konstruktorPengenal();
  let tuntas = false; // hasil/galat sudah dikirim atau dibatalkan
  let berhenti = false; // onSelesai sudah dipanggil
  let timer: ReturnType<typeof setTimeout> | undefined;
  let teksSementara = '';
  let akhirBicaraAt: number | null = null;
  let sementaraTerakhirAt: number | null = null;

  const selesai = () => {
    if (berhenti) return;
    berhenti = true;
    p.onSelesai?.();
  };
  const kirimHasil = (alternatif: string[], sumber: HasilPengenalan['sumber']) => {
    if (tuntas) return;
    tuntas = true;
    clearTimeout(timer);
    const acuan = akhirBicaraAt ?? sementaraTerakhirAt;
    p.onHasil({ alternatif, latensiMs: acuan === null ? null : Math.round(performance.now() - acuan), sumber });
  };
  const kirimGalat = (g: GalatPengenalan | null) => {
    if (tuntas || !g) return;
    tuntas = true;
    clearTimeout(timer);
    p.onGalat?.(g);
  };

  if (!Pengenal) {
    queueMicrotask(() => {
      kirimGalat(terjemahkanGalat('tidak-didukung'));
      selesai();
    });
    return { stop() {}, abort() {} };
  }

  const rec = new Pengenal();
  rec.lang = k.bahasa;
  rec.interimResults = true;
  rec.maxAlternatives = k.maksAlternatif;
  rec.continuous = false;

  const pakaiSementaraSetelah = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!teksSementara) return;
      kirimHasil([teksSementara], 'jeda');
      try {
        rec.abort();
      } catch {
        /* mesin sudah berhenti */
      }
    }, ms);
  };

  rec.onaudiostart = () => p.onMulai?.();

  rec.onresult = (e) => {
    let sementara = '';
    for (let i = 0; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) {
        const alternatif: string[] = [];
        for (let j = 0; j < r.length; j++) {
          const t = r[j].transcript.trim();
          if (t && !alternatif.includes(t)) alternatif.push(t);
        }
        // Transkrip sementara terakhir ikut dinilai: kadang lebih dekat dengan kata target.
        if (teksSementara && !alternatif.includes(teksSementara)) alternatif.push(teksSementara);
        kirimHasil(alternatif, 'akhir');
        return;
      }
      sementara += r[0]?.transcript ?? '';
    }
    teksSementara = sementara.trim();
    if (teksSementara && !tuntas) {
      sementaraTerakhirAt = performance.now();
      p.onSementara?.(teksSementara);
      pakaiSementaraSetelah(k.jedaHeningMs);
    }
  };

  rec.onspeechend = () => {
    akhirBicaraAt = performance.now();
    if (teksSementara) pakaiSementaraSetelah(k.batasSetelahAkhirBicaraMs);
  };

  rec.onerror = (e) => kirimGalat(terjemahkanGalat(e.error));

  rec.onend = () => {
    clearTimeout(timer);
    if (!tuntas) {
      if (teksSementara) kirimHasil([teksSementara], 'jeda');
      else kirimGalat(terjemahkanGalat('no-speech'));
    }
    selesai();
  };

  try {
    rec.start();
  } catch {
    queueMicrotask(() => {
      kirimGalat(terjemahkanGalat('lainnya'));
      selesai();
    });
  }

  return {
    stop() {
      try {
        rec.stop();
      } catch {
        /* sudah berhenti */
      }
    },
    abort() {
      tuntas = true;
      clearTimeout(timer);
      try {
        rec.abort();
      } catch {
        /* sudah berhenti */
      }
    },
  };
}
