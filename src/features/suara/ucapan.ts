/**
 * Satu-satunya sumber kalimat yang DIUCAPKAN aplikasi (petunjuk suara sesi kamera dan latihan bicara).
 *
 * Setiap pembangun mengembalikan urutan segmen; satu segmen = satu klip suara pra-rekam di `public/suara/`
 * (katalog `katalogSuara.json`, dibuat `scripts/suara/buat-suara.mjs`). `speak()` memutar klip-klip itu
 * berurutan dan jatuh ke speechSynthesis bila ada segmen yang belum punya klip. Karena itu kalimat yang
 * diucapkan JANGAN dirakit di halaman: tambahkan pembangun di sini agar `semuaUcapan()` ikut mendaftarnya dan
 * generator membuat klipnya. Teks di layar boleh berbeda (mis. tanpa tanda baca) dan tetap diatur halaman.
 *
 * Gaya (`GayaSuara`) menentukan tag ekspresi Eleven v4 yang dipakai generator untuk segmen itu.
 */

import { angkaKeKata } from '@/features/pose/labels';
import { sisiLawan } from '@/features/pose/landmarks';
import type { ExerciseDefinition } from '@/features/pose/types';
import { pesanHangatAfasia } from '@/features/speech/pesanAfasia';
import type { Kata } from '@/features/speech/types';
import type { Sisi } from '@/types';

/** Urutan segmen yang diucapkan; satu segmen = satu klip. */
export type Ucapan = readonly string[];

export type GayaSuara =
  /** Hitungan repetisi: singkat, tegas, cepat. */
  | 'hitung'
  /** Petunjuk posisi dan keselamatan: hangat dan tenang. */
  | 'arahan'
  /** Koreksi gerakan: ramah, tidak menyalahkan. */
  | 'koreksi'
  /** Pujian: ceria. */
  | 'pujian'
  /** Penyemangat saat belum berhasil: lembut. */
  | 'lembut'
  /** Kata latihan bicara: pelan dan sangat jelas. */
  | 'kata'
  /** Suku kata lalu kata utuh: sangat pelan, berjeda. */
  | 'sukuKata'
  /** Kalimat contoh: jelas dan wajar. */
  | 'kalimat';

export interface SegmenUcapan {
  teks: string;
  gaya: GayaSuara;
}

const seg = (teks: string, gaya: GayaSuara): SegmenUcapan => ({ teks, gaya });
const teksSaja = (segmen: readonly SegmenUcapan[]): Ucapan => segmen.map((s) => s.teks);

/** Akhiri dengan titik bila belum bertanda baca akhir (pesan koreksi di layar ditulis tanpa titik). */
function kalimat(teks: string): string {
  const t = teks.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

// ---------------------------------------------------------------------------------------------------------
// Sesi kamera

/** Pesan lembut saat percobaan belum terhitung (tampil di layar sebagai judul + sub, diucapkan utuh). */
export interface PesanLembut {
  judul: string;
  sub: string;
}

export const PESAN_TERLALU_CEPAT: PesanLembut = { judul: 'Gerakan tadi belum terhitung.', sub: 'Coba sekali lagi, pelan pelan.' };
export const PESAN_RENTANG_KURANG: PesanLembut = { judul: 'Gerakan tadi belum terhitung.', sub: 'Coba angkat sedikit lebih jauh bila mampu.' };
/** Setelah beberapa percobaan kurang jauh: tidak lagi meminta lebih, tetapi menyemangati. */
export const PESAN_SEMAMPUNYA: PesanLembut = { judul: 'Tidak apa-apa, angkat semampu Anda.', sub: 'Setiap percobaan tetap tercatat.' };
const SEMUA_PESAN_LEMBUT = [PESAN_TERLALU_CEPAT, PESAN_RENTANG_KURANG, PESAN_SEMAMPUNYA] as const;

const POSISIKAN = 'Posisikan tubuh Anda di dalam bingkai.';

const posisikan = () => [seg(POSISIKAN, 'arahan')];

/**
 * Tubuh siap. Siap pertama per sesi memuat pengingat keselamatan (Bab 17.2; latihan berdiri ditambah
 * berpegangan), diucapkan sebelum "Silakan mulai" agar terdengar utuh sebelum hitungan pertama.
 */
const siap = (pertama: boolean, wajibBerpegangan: boolean) => [
  seg(
    pertama
      ? `Tubuh terdeteksi. Ingat, berhenti bila terasa nyeri atau pusing.${wajibBerpegangan ? ' Tetap berpegangan.' : ''} Silakan mulai pelan-pelan.`
      : 'Tubuh terdeteksi. Siap. Silakan mulai pelan-pelan.',
    'arahan',
  ),
];

const hitungan = (n: number) => [seg(`${angkaKeKata(n)}.`, 'hitung')];
const koreksi = (pesan: string) => [seg(kalimat(pesan), 'koreksi')];
const pesanLembut = (p: PesanLembut) => [seg(`${p.judul} ${p.sub}`, 'lembut')];
const tawarSisi = (sisi: Sisi) => [
  seg(`Sisi ${sisi} belum terlihat. Hadapkan badan ke kamera, atau latih sisi ${sisiLawan(sisi)}.`, 'arahan'),
];
const targetTercapai = () => [seg('Hebat! Target tercapai.', 'pujian')];
const gantiSisi = (sisi: Sisi) => [seg(`Baik, sekarang sisi ${sisi}.`, 'arahan'), ...posisikan()];

export const ucapanPosisikan = (): Ucapan => teksSaja(posisikan());
export const ucapanSiap = (pertama: boolean, wajibBerpegangan: boolean): Ucapan => teksSaja(siap(pertama, wajibBerpegangan));
export const ucapanHitungan = (n: number): Ucapan => teksSaja(hitungan(n));
export const ucapanKoreksi = (pesan: string): Ucapan => teksSaja(koreksi(pesan));
export const ucapanPesanLembut = (p: PesanLembut): Ucapan => teksSaja(pesanLembut(p));
export const ucapanTawarSisi = (sisi: Sisi): Ucapan => teksSaja(tawarSisi(sisi));
export const ucapanTargetTercapai = (): Ucapan => teksSaja(targetTercapai());
export const ucapanGantiSisi = (sisi: Sisi): Ucapan => teksSaja(gantiSisi(sisi));

type DefSuara = Pick<ExerciseDefinition, 'wajibBerpegangan' | 'koreksiUmum' | 'sisi'>;

/** Semua segmen yang bisa diucapkan satu sesi kamera latihan `def` dengan target `target` repetisi. */
export function segmenSesiKamera(def: DefSuara, target: number): readonly SegmenUcapan[] {
  const hasil: SegmenUcapan[] = [...posisikan(), ...siap(true, def.wajibBerpegangan), ...siap(false, def.wajibBerpegangan)];
  for (let n = 1; n <= target; n++) hasil.push(...hitungan(n));
  hasil.push(...targetTercapai());
  for (const k of def.koreksiUmum) hasil.push(...koreksi(k.pesan));
  for (const p of SEMUA_PESAN_LEMBUT) hasil.push(...pesanLembut(p));
  if (def.sisi === 'pilih') {
    for (const s of ['kanan', 'kiri'] as const) hasil.push(...tawarSisi(s), ...gantiSisi(s));
  }
  return unik(hasil);
}

// ---------------------------------------------------------------------------------------------------------
// Latihan bicara (afasia)

type KataSuara = Pick<Kata, 'kata' | 'sukuKata' | 'kalimatContoh'>;

/** "kur. si. kursi." — suku kata satu per satu, lalu kata utuh. */
const barisSukuKata = (k: Pick<Kata, 'kata' | 'sukuKata'>) => `${k.sukuKata.join('. ')}. ${k.kata}.`;

/** Jumlah 0..999 sebagai kata berhuruf awal kapital ('Nol', 'Tujuh'). */
const jumlahKata = (n: number) => (n === 0 ? 'Nol' : angkaKeKata(n));

const benar = () => [seg('Benar! Bagus sekali.', 'pujian')];
const ulangBesok = () => [seg('Tidak apa-apa. Kata ini kita ulang besok.', 'lembut')];
const hampir = (k: Pick<Kata, 'kata' | 'sukuKata'>) => [seg('Hampir. Coba lagi.', 'lembut'), seg(barisSukuKata(k), 'sukuKata')];
const cobaLagi = () => [seg('Coba sekali lagi, pelan-pelan.', 'lembut')];
const kataContoh = (k: Pick<Kata, 'kata'>) => [seg(k.kata, 'kata')];
const kalimatContoh = (k: Pick<Kata, 'kalimatContoh'>) => [seg(k.kalimatContoh, 'kalimat')];
/** Ringkasan sesi: pesan hangat sesuai skor (pesanAfasia.ts), ceria hanya bila latihan berjalan baik. */
const ringkasanAfasia = (jumlahBenar: number, skor: number) => [
  seg('Latihan bicara selesai.', 'arahan'),
  // Netral-hangat, bukan ceria: jumlahnya bisa nol.
  seg(`${jumlahKata(jumlahBenar)} kata benar.`, 'arahan'),
  seg(pesanHangatAfasia(skor), skor >= 60 ? 'pujian' : 'lembut'),
];

export const ucapanBenar = (): Ucapan => teksSaja(benar());
export const ucapanUlangBesok = (): Ucapan => teksSaja(ulangBesok());
export const ucapanHampir = (k: Pick<Kata, 'kata' | 'sukuKata'>): Ucapan => teksSaja(hampir(k));
export const ucapanCobaLagi = (): Ucapan => teksSaja(cobaLagi());
/** Tombol Dengar, bagian 1: kata pelan-pelan. */
export const ucapanKataContoh = (k: Pick<Kata, 'kata'>): Ucapan => teksSaja(kataContoh(k));
/** Tombol Dengar, bagian 2: kalimat contoh (hanya setelah kata selesai, lihat contohKata.ts). */
export const ucapanKalimatContoh = (k: Pick<Kata, 'kalimatContoh'>): Ucapan => teksSaja(kalimatContoh(k));
export const ucapanRingkasanAfasia = (jumlahBenar: number, skor: number): Ucapan => teksSaja(ringkasanAfasia(jumlahBenar, skor));

/** Semua segmen umpan balik dan contoh yang bisa diucapkan satu sesi latihan bicara berisi `daftar`. */
export function segmenSesiAfasia(daftar: readonly KataSuara[]): readonly SegmenUcapan[] {
  const hasil: SegmenUcapan[] = [...benar(), ...ulangBesok(), ...cobaLagi()];
  for (const k of daftar) hasil.push(...kataContoh(k), ...kalimatContoh(k), ...hampir(k));
  return unik(hasil);
}

/** Semua segmen layar ringkasan sesi `jumlahSesi` kata: "N kata benar" (N = 0..jumlahSesi), pesan hangat skor 0..100. */
export function segmenRingkasanAfasia(jumlahSesi: number): readonly SegmenUcapan[] {
  const hasil: SegmenUcapan[] = [];
  for (let n = 0; n <= jumlahSesi; n++) hasil.push(...ringkasanAfasia(n, 0));
  for (let skor = 0; skor <= 100; skor++) hasil.push(...ringkasanAfasia(0, skor));
  return unik(hasil);
}

/**
 * Buang segmen ganda (teks sama). Katalog suara berkunci teks, jadi satu teks hanya boleh punya satu gaya:
 * dua gaya untuk teks yang sama adalah galat penulisan pembangun di atas.
 */
export function unik(segmen: readonly SegmenUcapan[]): SegmenUcapan[] {
  const peta = new Map<string, SegmenUcapan>();
  for (const s of segmen) {
    const ada = peta.get(s.teks);
    if (ada && ada.gaya !== s.gaya) throw new Error(`Ucapan "${s.teks}" punya dua gaya: ${ada.gaya} dan ${s.gaya}`);
    peta.set(s.teks, s);
  }
  return [...peta.values()];
}
