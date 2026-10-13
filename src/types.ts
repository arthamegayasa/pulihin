// Kontrak domain PULIHIN (Bab 10.3). Dipakai bersama oleh semua fitur.
// Ubah file ini hanya lewat project master agar semua modul tetap sejalan.

export type Role = 'pasien' | 'keluarga' | 'terapis';

/** Tanggal lokal berformat 'YYYY-MM-DD'. Lihat src/lib/date.ts. */
export type ISODate = string;

export type Sisi = 'kiri' | 'kanan';

export interface Profile {
  id: string;
  /** Nama samaran, contoh "Pak Budi". Tidak pernah nama orang asli. */
  namaSamaran: string;
  usia: number;
  /** Keterangan singkat non-medis, contoh "Stroke 3 bulan lalu". */
  keterangan: string;
  sisiLemah: Sisi;
  tanggalMulaiProgram: ISODate;
  isDemo: boolean;
}

export type JenisSesi = 'gerak' | 'afasia';

export interface SkorKomponen {
  /** 0..100, bobot 50% */
  repetisi: number;
  /** 0..100, bobot 30% */
  rentang: number;
  /** 0..100, bobot 20% */
  tempo: number;
}

export interface RingkasanAfasia {
  benar: number;
  hampir: number;
  belum: number;
  /** id kata yang disarankan diulang besok */
  kataUlang: string[];
}

export interface Session {
  id: string;
  patientId: string;
  tanggal: ISODate;
  mulaiAt: number;
  selesaiAt: number | null;
  jenis: JenisSesi;
  /** gerak: id latihan; afasia: null */
  latihanId: string | null;
  /** afasia: kategori yang dipilih, null bila "Latihan Hari Ini" campuran */
  kategoriKata: string | null;
  /** gerak: target repetisi; afasia: jumlah kata dalam sesi (10) */
  repetisiTarget: number;
  /** gerak: repetisi terhitung; afasia: jumlah kata dinilai Benar */
  repetisiTercapai: number;
  /** 0..100. Skor latihan untuk motivasi, bukan skor klinis. */
  skor: number;
  skorKomponen: SkorKomponen | null;
  ringkasanAfasia: RingkasanAfasia | null;
  durasiDetik: number;
  /** false selama sesi berjalan atau bila sesi terputus. Hanya sesi selesai dihitung kepatuhan. */
  selesai: boolean;
  /** Satu saran sederhana untuk sesi berikutnya. */
  saran: string | null;
  sisi: Sisi | null;
  /** Target rentang (persen ambang atas) yang dipakai sesi gerak ini; tidak ada = 100. */
  rentangPersen?: number;
  isDemo: boolean;
}

export interface RepLog {
  id?: number;
  sessionId: string;
  /** Urutan percobaan dalam sesi, mulai 1. */
  nomor: number;
  /** false bila siklus < 1 detik: dicatat sebagai percobaan, tidak dihitung repetisi. */
  dihitung: boolean;
  /** Nilai puncak metrik latihan (derajat untuk latihan berbasis sudut). */
  sudutPuncak: number;
  durasiSiklusDetik: number;
  /** id koreksi yang muncul selama siklus ini. */
  koreksi: string[];
}

export type HasilKata = 'benar' | 'hampir' | 'belum';

export interface SpeechAttempt {
  id?: number;
  sessionId: string;
  kataId: string;
  /** Transkrip Web Speech API; string kosong pada mode mandiri. */
  teksHasil: string;
  kategoriHasil: HasilKata;
  skor: number;
  /** 1..3 */
  nomorPercobaan: number;
  mode: 'suara' | 'mandiri';
  at: number;
}

export interface ProgramItem {
  latihanId: string;
  targetRepetisi: number;
  set: number;
  /**
   * Target rentang gerak yang ditetapkan terapis, persen dari ambang atas latihan (50..100, bawaan 100).
   * Untuk pasien dengan rentang terbatas: 80 berarti fase atas tercapai pada 80% ambang atas pustaka.
   */
  rentangPersen?: number;
}

export interface Program {
  patientId: string;
  items: ProgramItem[];
  /** Berapa hari per minggu program gerak dijalankan. */
  frekuensiPerMinggu: number;
  dibuatOleh: string;
  tanggalUbah: number;
}

export interface Schedule {
  patientId: string;
  /** 'HH:MM' */
  jamGerak: string;
  /** 'HH:MM' */
  jamAfasia: string;
  notifikasiAktif: boolean;
}

export type SkenarioDemo = 'stagnasi' | 'rajin';

export interface ExportBundle {
  app: 'pulihin';
  versi: 1;
  dieksporAt: number;
  profiles: Profile[];
  sessions: Session[];
  repLogs: RepLog[];
  speechAttempts: SpeechAttempt[];
  programs: Program[];
  schedules: Schedule[];
}
