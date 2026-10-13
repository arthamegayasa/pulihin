import type { FaseRepetisi } from './types';

/**
 * State machine repetisi skalar (Bab 7.2): BAWAH -> NAIK -> ATAS -> TURUN -> BAWAH.
 *
 *   BAWAH -> NAIK  : nilai > ambangBawah + h
 *   NAIK  -> ATAS  : nilai >= ambangAtas (puncak mulai dicatat sejak NAIK)
 *   NAIK  -> BAWAH : nilai <= ambangBawah tanpa pernah ATAS = percobaan rentang kurang (tidak dihitung)
 *   ATAS  -> TURUN : nilai < ambangAtas - h
 *   TURUN -> ATAS  : nilai >= ambangAtas lagi (memantul di atas; tidak menambah hitungan)
 *   TURUN -> BAWAH : nilai <= ambangBawah = siklus lengkap; dihitung bila durasi >= durasi minimum,
 *                    selain itu dicatat sebagai percobaan terlalu cepat.
 *
 * Nilai null (frame diabaikan) tidak pernah mengubah state. Penghitung baru "bersenjata" setelah
 * sekali melihat nilai <= ambangBawah, agar sesi yang dimulai dengan lengan sudah terangkat tidak
 * menghasilkan hitungan palsu. Durasi siklus diukur dari frame BAWAH terakhir sebelum NAIK sampai
 * frame kembali ke BAWAH.
 */

export interface KonfigRepetisi {
  ambangAtas: number;
  ambangBawah: number;
  histeresis: number;
  durasiMinDetik: number;
}

export type JenisSiklus = 'repetisi' | 'terlalu-cepat' | 'rentang-kurang';

export interface PeristiwaSiklus {
  jenis: JenisSiklus;
  /** true hanya untuk jenis 'repetisi'. */
  dihitung: boolean;
  /** true bila fase ATAS tercapai (repetisi atau terlalu cepat). */
  lengkap: boolean;
  puncak: number;
  durasiDetik: number;
  mulai: number;
  selesai: number;
}

export class RepCounter {
  fase: FaseRepetisi = 'BAWAH';
  repetisi = 0;
  percobaan = 0;
  bersenjata = false;
  private puncak = -Infinity;
  private mencapaiAtas = false;
  private tBawahTerakhir: number | null = null;
  private mulai = 0;

  constructor(readonly konfig: KonfigRepetisi) {
    const { ambangAtas, ambangBawah, histeresis } = konfig;
    if (!(ambangBawah + histeresis < ambangAtas - histeresis)) {
      throw new Error('Ambang tidak valid: ambangBawah + histeresis harus lebih kecil dari ambangAtas - histeresis');
    }
  }

  /** Puncak siklus yang sedang berjalan (null di BAWAH). */
  get puncakBerjalan(): number | null {
    return this.fase === 'BAWAH' ? null : this.puncak;
  }

  /** Proses satu nilai (sudah diratakan). t dalam ms. Mengembalikan peristiwa bila satu siklus selesai. */
  update(nilai: number | null, t: number): PeristiwaSiklus | null {
    if (nilai === null || !Number.isFinite(nilai)) return null;
    const { ambangAtas: atas, ambangBawah: bawah, histeresis: h } = this.konfig;

    if (!this.bersenjata) {
      if (nilai <= bawah) {
        this.bersenjata = true;
        this.tBawahTerakhir = t;
      }
      return null;
    }

    switch (this.fase) {
      case 'BAWAH':
        if (nilai > bawah + h) {
          this.fase = 'NAIK';
          this.mulai = this.tBawahTerakhir ?? t;
          this.puncak = nilai;
          this.mencapaiAtas = false;
        } else {
          this.tBawahTerakhir = t;
        }
        return null;
      case 'NAIK':
        this.puncak = Math.max(this.puncak, nilai);
        if (nilai >= atas) {
          this.fase = 'ATAS';
          this.mencapaiAtas = true;
        } else if (nilai <= bawah) {
          return this.tutupSiklus(t);
        }
        return null;
      case 'ATAS':
        this.puncak = Math.max(this.puncak, nilai);
        if (nilai < atas - h) this.fase = 'TURUN';
        return null;
      case 'TURUN':
        if (nilai >= atas) {
          this.puncak = Math.max(this.puncak, nilai);
          this.fase = 'ATAS';
        } else if (nilai <= bawah) {
          return this.tutupSiklus(t);
        }
        return null;
    }
  }

  private tutupSiklus(t: number): PeristiwaSiklus {
    const durasiDetik = (t - this.mulai) / 1000;
    const lengkap = this.mencapaiAtas;
    const jenis: JenisSiklus = !lengkap
      ? 'rentang-kurang'
      : durasiDetik >= this.konfig.durasiMinDetik
        ? 'repetisi'
        : 'terlalu-cepat';
    this.percobaan += 1;
    if (jenis === 'repetisi') this.repetisi += 1;
    const peristiwa: PeristiwaSiklus = {
      jenis,
      dihitung: jenis === 'repetisi',
      lengkap,
      puncak: this.puncak,
      durasiDetik,
      mulai: this.mulai,
      selesai: t,
    };
    this.fase = 'BAWAH';
    this.tBawahTerakhir = t;
    this.puncak = -Infinity;
    this.mencapaiAtas = false;
    return peristiwa;
  }
}

/** 0..1 posisi nilai di antara ambang bawah dan atas (bar progres gerak, skor rentang). */
export function progresNilai(nilai: number, ambangBawah: number, ambangAtas: number): number {
  return Math.min(1, Math.max(0, (nilai - ambangBawah) / (ambangAtas - ambangBawah)));
}
