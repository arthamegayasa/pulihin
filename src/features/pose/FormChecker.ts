import { ATURAN_UMUM, KOREKSI_BAWAAN, PRIORITAS_KOREKSI } from './exerciseDefinitions';
import type { PeristiwaSiklus } from './RepCounter';
import type { ExerciseDefinition, IdKoreksi, KoreksiAktif, KoreksiDefinisi } from './types';

/**
 * Koreksi form (Bab 7.3) dalam dua lapis:
 * 1. Deteksi: kondisi kontinu (keluar-frame, badan-miring, bahu-terangkat) harus bertahan
 *    `tahanDetik` (0,5 s; keluar-frame 1 s) berturut-turut; kondisi peristiwa (rentang-kurang,
 *    tempo-cepat) muncul setelah dua siklus berturut-turut.
 * 2. Penjadwal tayang: maksimal satu pesan, tampil minimal 1,5 s, pesan sama tidak diulang
 *    dalam 4 s sejak terakhir selesai, prioritas keluar-frame > badan-miring > bahu-terangkat >
 *    rentang-kurang > tempo-cepat. Kondisi yang lolos deteksi langsung tampil pada frame yang
 *    sama bila slot kosong atau pesan yang tampil kurang penting (AC-F1-3: < 700 ms). Hanya
 *    penggantian oleh pesan yang LEBIH penting yang boleh memotong masa tampil 1,5 s: AC-F1-3
 *    didahulukan atas aturan tampil minimal (lihat docs/algoritma.md).
 * Hanya koreksi yang tercantum di `def.koreksiUmum` yang dievaluasi.
 */

export interface MasukanForm {
  /** ms */
  t: number;
  /** Landmark kunci terlihat pada frame ini. */
  tubuhTerlihat: boolean;
  /** Masa stabil awal sudah lewat dan acuan sudah direkam. */
  siap: boolean;
  /** Ada penghitung pada fase NAIK atau ATAS (syarat bahu-terangkat). */
  sedangNaik: boolean;
  /** Kemiringan garis bahu dari horizontal (derajat), null bila tak terukur. */
  kemiringanBahu: number | null;
  /** Penyusutan jarak tegak bahu-telinga dibanding acuan (persen, maksimum sisi dipantau), null bila tak terukur. */
  susutBahuTelinga: number | null;
  /** Siklus yang selesai pada frame ini. */
  siklus: readonly PeristiwaSiklus[];
}

export interface KeluaranForm {
  koreksi: KoreksiAktif | null;
  koreksiBaru: KoreksiAktif | null;
}

const KONTINU = ['keluar-frame', 'badan-miring', 'bahu-terangkat'] as const;
type IdKontinu = (typeof KONTINU)[number];

function prioritas(id: IdKoreksi): number {
  const i = (PRIORITAS_KOREKSI as readonly string[]).indexOf(id);
  return i === -1 ? PRIORITAS_KOREKSI.length : i;
}

/** Pesan yang layak tampil pada frame ini. */
export interface KandidatKoreksi {
  id: IdKoreksi;
  pesan: string;
  /** true untuk koreksi berbasis peristiwa (rentang-kurang, tempo-cepat): tampil durasi tetap. */
  peristiwa: boolean;
}

interface Tayang extends KoreksiAktif {
  peristiwa: boolean;
}

/** Penjadwal tayang pesan koreksi (aturan penayangan Bab 7.3). Terpisah agar mudah diuji. */
export class PenjadwalKoreksi {
  private tayang: Tayang | null = null;
  private readonly selesaiTerakhir: Partial<Record<IdKoreksi, number>> = {};
  readonly terhitung: Record<string, number> = {};
  private readonly aturan = ATURAN_UMUM.koreksi;

  /**
   * @param kandidat koreksi yang saat ini layak tampil.
   * @returns pesan yang tampil dan pesan yang baru mulai pada frame ini.
   */
  update(t: number, kandidat: readonly KandidatKoreksi[]): KeluaranForm {
    const tampilMin = this.aturan.tampilMinDetik * 1000;
    const jeda = this.aturan.jedaUlangDetik * 1000;
    const bolehMulai = (id: IdKoreksi) => {
      const akhir = this.selesaiTerakhir[id];
      return akhir === undefined || t - akhir >= jeda;
    };
    const urut = kandidat.filter((k) => bolehMulai(k.id)).sort((a, b) => prioritas(a.id) - prioritas(b.id));

    if (this.tayang) {
      const lama = t - this.tayang.sejak;
      const masihAktif = this.tayang.peristiwa
        ? lama < this.aturan.tampilPeristiwaDetik * 1000
        : kandidat.some((k) => k.id === this.tayang!.id);
      const adaLebihPenting = urut.some((k) => prioritas(k.id) < prioritas(this.tayang!.id));
      if (adaLebihPenting || (lama >= tampilMin && !masihAktif)) {
        this.selesaiTerakhir[this.tayang.id] = t;
        this.tayang = null;
      }
    }

    let koreksiBaru: KoreksiAktif | null = null;
    if (!this.tayang) {
      // Cek ulang: pesan yang baru diakhiri pada frame ini tidak boleh langsung tampil lagi.
      const pilih = urut.find((k) => bolehMulai(k.id));
      if (pilih) {
        this.tayang = { id: pilih.id, pesan: pilih.pesan, sejak: t, peristiwa: pilih.peristiwa };
        this.terhitung[pilih.id] = (this.terhitung[pilih.id] ?? 0) + 1;
        koreksiBaru = { id: pilih.id, pesan: pilih.pesan, sejak: t };
      }
    }
    const koreksi = this.tayang ? { id: this.tayang.id, pesan: this.tayang.pesan, sejak: this.tayang.sejak } : null;
    return { koreksi, koreksiBaru };
  }
}

export class FormChecker {
  private readonly koreksi: Partial<Record<IdKoreksi, KoreksiDefinisi>> = {};
  private readonly awalKondisiAktif: Partial<Record<IdKontinu, number>> = {};
  private readonly peristiwaTertunda: Partial<Record<IdKoreksi, number>> = {};
  private deretRentang = 0;
  private deretTempo = 0;
  readonly penjadwal = new PenjadwalKoreksi();

  constructor(private readonly def: ExerciseDefinition) {
    for (const k of def.koreksiUmum) this.koreksi[k.id] = k;
  }

  get terhitung(): Record<string, number> {
    return this.penjadwal.terhitung;
  }

  /** Awal (ms) kondisi kontinu yang sedang benar, untuk mengukur latensi AC-F1-3 di Mode Uji. */
  get awalKondisi(): Readonly<Partial<Record<IdKontinu, number>>> {
    return this.awalKondisiAktif;
  }

  /** Ambang koreksi dari definisi latihan, atau bawaan dari exerciseDefinitions.ts. */
  private ambang(id: Exclude<IdKontinu, 'keluar-frame'> | 'rentang-kurang'): number {
    return this.koreksi[id]?.ambang ?? KOREKSI_BAWAAN[id].ambang!;
  }

  private tahanMs(id: IdKontinu): number {
    const detik = this.koreksi[id]?.tahanDetik ?? KOREKSI_BAWAAN[id].tahanDetik ?? ATURAN_UMUM.koreksi.tahanBawaanDetik;
    return detik * 1000;
  }

  /** Kondisi mentah frame ini: true/false, atau null bila tidak dapat dinilai. */
  private kondisiMentah(m: MasukanForm): Record<IdKontinu, boolean | null> {
    return {
      'keluar-frame': !m.tubuhTerlihat,
      'badan-miring': !m.siap || m.kemiringanBahu === null ? null : m.kemiringanBahu > this.ambang('badan-miring'),
      'bahu-terangkat':
        !m.siap || !m.sedangNaik || m.susutBahuTelinga === null
          ? null
          : m.susutBahuTelinga > this.ambang('bahu-terangkat'),
    };
  }

  private catatSiklus(m: MasukanForm): void {
    const berturut = ATURAN_UMUM.koreksi.berturutTurut;
    for (const s of m.siklus) {
      if (this.koreksi['rentang-kurang']) {
        const rendah = s.puncak < this.def.ambangAtas - this.ambang('rentang-kurang');
        this.deretRentang = rendah ? this.deretRentang + 1 : 0;
        if (this.deretRentang >= berturut) {
          this.peristiwaTertunda['rentang-kurang'] = m.t;
          this.deretRentang = 0;
        }
      }
      if (this.koreksi['tempo-cepat'] && s.lengkap) {
        const cepat = s.durasiDetik < this.def.tempoTargetDetik.min;
        this.deretTempo = cepat ? this.deretTempo + 1 : 0;
        if (this.deretTempo >= berturut) {
          this.peristiwaTertunda['tempo-cepat'] = m.t;
          this.deretTempo = 0;
        }
      }
    }
  }

  update(m: MasukanForm): KeluaranForm {
    const kandidat: KandidatKoreksi[] = [];

    const mentah = this.kondisiMentah(m);
    for (const id of KONTINU) {
      const def = this.koreksi[id];
      if (!def) continue;
      if (mentah[id] === true) {
        const awal = (this.awalKondisiAktif[id] ??= m.t);
        if (m.t - awal >= this.tahanMs(id)) kandidat.push({ id, pesan: def.pesan, peristiwa: false });
      } else {
        delete this.awalKondisiAktif[id];
      }
    }

    this.catatSiklus(m);
    const kedaluwarsa = ATURAN_UMUM.koreksi.kedaluwarsaPeristiwaDetik * 1000;
    for (const [id, sejak] of Object.entries(this.peristiwaTertunda) as Array<[IdKoreksi, number]>) {
      if (m.t - sejak > kedaluwarsa) delete this.peristiwaTertunda[id];
      else kandidat.push({ id, pesan: this.koreksi[id]!.pesan, peristiwa: true });
    }

    const hasil = this.penjadwal.update(m.t, kandidat);
    if (hasil.koreksiBaru) delete this.peristiwaTertunda[hasil.koreksiBaru.id];
    return hasil;
  }
}
