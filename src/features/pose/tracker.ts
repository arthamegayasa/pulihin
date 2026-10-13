import type { RepLog, Sisi } from '@/types';
import {
  basisFrame,
  jarakTelingaBahu,
  kemiringanBahu,
  PengumpulBaseline,
  RataBergerak,
  SENDI_DEBUG,
  sudutSendi,
  ukurMetrik,
  type Baseline,
  type BasisKoordinat,
  type MetrikDasar,
} from './AngleCalculator';
import { ATURAN_UMUM } from './exerciseDefinitions';
import { FormChecker } from './FormChecker';
import { indeksTitik, indeksTitikKunci, JUMLAH_LANDMARK, semuaTerlihat, sisiDipantau, sisiLawan } from './landmarks';
import { progresNilai, RepCounter, type PeristiwaSiklus } from './RepCounter';
import { hitungSkor } from './scoring';
import type {
  ExerciseDefinition,
  ExerciseTracker,
  PoseFrame,
  SumberSudut,
  TrackerOptions,
  TrackerResult,
  TrackerSnapshot,
} from './types';

/**
 * createTracker merangkai AngleCalculator, RepCounter, FormChecker, dan skor sesi.
 *
 * Saluran (kanal) hitung:
 * - sisi 'pilih'                : satu kanal untuk sisi pilihan pasien.
 * - sisi 'keduanya'             : satu kanal; nilai = rata-rata sisi kiri & kanan yang terlihat
 *                                 (rotasi-bahu tidak bersisi).
 * - metrik 'bergantian' (marching): dua kanal (kiri, kanan) dengan state machine masing-masing.
 *   Setiap angkatan yang lengkap di salah satu sisi = 1 repetisi; urutan kiri/kanan tidak
 *   diwajibkan, sehingga target 10 = total 10 angkatan lutut (sekitar 5 per sisi).
 */

type KunciKanal = Sisi | 'tunggal';

const LABEL_BASIS: Record<BasisKoordinat, string> = { '2d': '2D', '3d': '3D', hibrida: 'Hibrida' };

interface Kanal {
  kunci: KunciKanal;
  sisiUkur: Sisi[];
  rata: RataBergerak;
  counter: RepCounter;
  mentah: number | null;
  nilai: number | null;
  /** id koreksi yang tampil sejak siklus kanal ini sebelumnya selesai. */
  koreksiSiklus: Set<string>;
}

type LogTanpaId = Omit<RepLog, 'id' | 'sessionId'>;

const bulat = (n: number, desimal: number) => {
  const f = 10 ** desimal;
  return Math.round(n * f) / f;
};

/** Target rentang resep: tidak ada / tidak valid = 100; selain itu dibulatkan dan dibatasi 50..100. */
export function normalisasiRentang(rentangPersen?: number): number {
  const { minPersen, maksPersen } = ATURAN_UMUM.rentangPersonal;
  if (rentangPersen === undefined || !Number.isFinite(rentangPersen)) return maksPersen;
  return Math.min(maksPersen, Math.max(minPersen, Math.round(rentangPersen)));
}

/**
 * Ambang atas yang dipakai tracker untuk target rentang resep (docs/algoritma.md Bagian 8a):
 * ambangAtas x p / 100, tidak lebih rendah dari ambangBawah + 3 x histeresis dan tidak lebih tinggi
 * dari ambangAtas definisi. Ambang bawah, histeresis, dan durasi minimum tidak berubah.
 */
export function ambangAtasRentang(def: ExerciseDefinition, rentangPersen?: number): number {
  const { maksPersen, kelipatanHisteresisMin } = ATURAN_UMUM.rentangPersonal;
  const p = normalisasiRentang(rentangPersen);
  if (p === maksPersen) return def.ambangAtas;
  const histeresis = def.histeresis ?? ATURAN_UMUM.histeresisBawaan;
  const lantai = def.ambangBawah + kelipatanHisteresisMin * histeresis;
  return Math.min(def.ambangAtas, Math.max(bulat((def.ambangAtas * p) / 100, 1), lantai));
}

export function createTracker(def: ExerciseDefinition, opts: TrackerOptions): ExerciseTracker {
  const vis = ATURAN_UMUM.ambangVisibilitas;
  const jendela = Math.round(
    Math.min(
      ATURAN_UMUM.jendelaRataMaks,
      Math.max(ATURAN_UMUM.jendelaRataMin, opts.jendelaRata ?? ATURAN_UMUM.jendelaRataBawaan),
    ),
  );
  const sumber: SumberSudut =
    opts.modeSudut === '2d' || opts.modeSudut === '3d' ? opts.modeSudut : (def.sumberSudut ?? '3d');
  const bergantian = def.metrik.jenis === 'bergantian';
  const metrik: MetrikDasar = def.metrik.jenis === 'bergantian' ? def.metrik.per : def.metrik;
  // Target rentang resep: ambang atas (hitungan, bar progres, koreksi "rentang kurang", skor rentang)
  // diskalakan; sisanya tetap dari definisi latihan.
  const ambangAtas = ambangAtasRentang(def, opts.rentangPersen);
  const defEfektif: ExerciseDefinition = ambangAtas === def.ambangAtas ? def : { ...def, ambangAtas };
  const konfig = {
    ambangAtas,
    ambangBawah: def.ambangBawah,
    histeresis: def.histeresis ?? ATURAN_UMUM.histeresisBawaan,
    durasiMinDetik: ATURAN_UMUM.durasiRepetisiMinDetik,
  };
  const sisiPantau = sisiDipantau(def, opts.sisi);
  const titikAktif = indeksTitikKunci(def, opts.sisi);
  const titikSisi: Record<Sisi, number[]> = {
    kiri: def.titikKunci.map((t) => indeksTitik(t, 'kiri')),
    kanan: def.titikKunci.map((t) => indeksTitik(t, 'kanan')),
  };

  const buatKanal = (kunci: KunciKanal, sisiUkur: Sisi[]): Kanal => ({
    kunci,
    sisiUkur,
    rata: new RataBergerak(jendela),
    counter: new RepCounter(konfig),
    mentah: null,
    nilai: null,
    koreksiSiklus: new Set(),
  });
  const kanal: Kanal[] = bergantian
    ? [buatKanal('kiri', ['kiri']), buatKanal('kanan', ['kanan'])]
    : [buatKanal('tunggal', metrik.jenis === 'rotasi-bahu' ? [opts.sisi] : sisiPantau)];

  const indeksY = metrik.jenis === 'kenaikan' ? sisiPantau.map((s) => indeksTitik(metrik.titik, s)) : [];
  const pengumpul = new PengumpulBaseline(indeksY, vis);
  const form = new FormChecker(defEfektif);
  const rataMiring = new RataBergerak(jendela);
  const rataSusut = new RataBergerak(jendela);
  const rataDebug: Record<string, RataBergerak> = {};

  let tMulai: number | null = null;
  let siap = false;
  let stabilSejak: number | null = null;
  let terakhirTerlihat: number | null = null;
  let baseline: Baseline | null = null;
  let progresTerakhir = 0;
  let sisiLainSejak: number | null = null;
  const repLogs: LogTanpaId[] = [];

  const ratakanDebug = (kunci: string, nilai: number | null): number | string => {
    if (nilai === null) return '-';
    rataDebug[kunci] ??= new RataBergerak(jendela);
    return bulat(rataDebug[kunci].tambah(nilai), 1);
  };

  function perbaruiSiap(frame: PoseFrame | null, t: number, tubuhTerlihat: boolean): void {
    if (siap) return;
    if (tubuhTerlihat && frame) {
      if (stabilSejak === null) {
        stabilSejak = t;
        pengumpul.reset();
      }
      terakhirTerlihat = t;
      pengumpul.tambah(frame);
      if (t - stabilSejak >= ATURAN_UMUM.stabilSiapDetik * 1000) {
        siap = true;
        baseline = pengumpul.hasil();
      }
    } else if (
      stabilSejak !== null &&
      (terakhirTerlihat === null || t - terakhirTerlihat > ATURAN_UMUM.toleransiCelahDetik * 1000)
    ) {
      stabilSejak = null;
    }
  }

  function susutBahuTelinga(frame: PoseFrame): number | null {
    if (!baseline) return null;
    let maks: number | null = null;
    for (const s of sisiPantau) {
      const awal = baseline.telingaBahu[s];
      const kini = jarakTelingaBahu(frame, s, vis);
      if (awal === null || kini === null || !(awal > 0)) continue;
      const susut = ((awal - kini) / awal) * 100;
      maks = maks === null ? susut : Math.max(maks, susut);
    }
    return maks;
  }

  function update(frame: PoseFrame | null, t: number): TrackerSnapshot {
    tMulai ??= t;
    const f = frame !== null && frame.landmarks.length >= JUMLAH_LANDMARK ? frame : null;
    const tubuhTerlihat = f !== null && semuaTerlihat(f.landmarks, titikAktif, vis);
    perbaruiSiap(f, t, tubuhTerlihat);

    const sisiTerlihat = {
      kiri: f !== null && semuaTerlihat(f.landmarks, titikSisi.kiri, vis),
      kanan: f !== null && semuaTerlihat(f.landmarks, titikSisi.kanan, vis),
    };
    const sisiLainSaatIni =
      def.sisi === 'pilih' && !sisiTerlihat[opts.sisi] && sisiTerlihat[sisiLawan(opts.sisi)];
    if (!sisiLainSaatIni) sisiLainSejak = null;
    else sisiLainSejak ??= t;
    const sisiLainTerlihat = sisiLainSejak !== null && t - sisiLainSejak >= ATURAN_UMUM.sisiLainTahanDetik * 1000;

    let basis: BasisKoordinat | null = f ? basisFrame(f, sumber) : null;
    let bobot2D: number | null = null;
    const siklus: Array<{ kanal: Kanal; p: PeristiwaSiklus }> = [];
    for (const k of kanal) {
      k.mentah = null;
      k.nilai = null;
      if (!f) continue;
      let jumlah = 0;
      let jumlahBobot = 0;
      let n = 0;
      for (const s of k.sisiUkur) {
        const h = ukurMetrik(metrik, f, s, sumber, baseline, vis);
        if (!h) continue;
        jumlah += h.nilai;
        jumlahBobot += h.bobot2D;
        n += 1;
        basis = h.basis;
      }
      if (n === 0) continue;
      k.mentah = jumlah / n;
      k.nilai = k.rata.tambah(k.mentah);
      bobot2D = jumlahBobot / n;
      if (siap) {
        const p = k.counter.update(k.nilai, t);
        if (p) siklus.push({ kanal: k, p });
      }
    }

    // Kanal yang ditampilkan: yang sedang bergerak, selain itu yang nilainya paling tinggi.
    const aktif =
      kanal.find((k) => k.counter.fase !== 'BAWAH') ??
      kanal.reduce((a, b) => ((b.nilai ?? -Infinity) > (a.nilai ?? -Infinity) ? b : a));
    if (aktif.nilai !== null) progresTerakhir = progresNilai(aktif.nilai, def.ambangBawah, ambangAtas);

    const miringMentah = f ? kemiringanBahu(f, vis) : null;
    const miring = miringMentah === null ? null : rataMiring.tambah(miringMentah);
    const susutMentah = f && siap ? susutBahuTelinga(f) : null;
    const susut = susutMentah === null ? null : rataSusut.tambah(susutMentah);

    const hasilForm = form.update({
      t,
      // Hanya sisi lawan yang terlihat: "Mundur sedikit" bukan saran yang tepat; UI memakai
      // `sisiLainTerlihat` untuk menyarankan hadap kamera atau ganti sisi.
      tubuhTerlihat: tubuhTerlihat || sisiLainSaatIni,
      siap,
      sedangNaik: kanal.some((k) => k.counter.fase === 'NAIK' || k.counter.fase === 'ATAS'),
      kemiringanBahu: miring,
      susutBahuTelinga: susut,
      siklus: siklus.map((s) => s.p),
    });
    const koreksiTampil = hasilForm.koreksi;
    if (koreksiTampil) for (const k of kanal) k.koreksiSiklus.add(koreksiTampil.id);

    let alasanTidakDihitung: TrackerSnapshot['alasanTidakDihitung'] = null;
    for (const { kanal: k, p } of siklus) {
      repLogs.push({
        nomor: repLogs.length + 1,
        dihitung: p.dihitung,
        sudutPuncak: bulat(p.puncak, 1),
        durasiSiklusDetik: bulat(p.durasiDetik, 2),
        koreksi: [...k.koreksiSiklus],
      });
      k.koreksiSiklus.clear();
      if (!p.dihitung && alasanTidakDihitung === null) {
        alasanTidakDihitung = p.jenis === 'terlalu-cepat' ? 'terlalu-cepat' : 'rentang-kurang';
      }
    }

    const debug: Record<string, number | string | boolean> = {
      fase: aktif.counter.fase,
      siap,
      bersenjata: aktif.counter.bersenjata,
      'ambang.atas': ambangAtas,
      mode: basis === null ? '-' : LABEL_BASIS[basis],
      'bobot.2d': bobot2D === null ? '-' : bulat(bobot2D, 2),
      'nilai.mentah': aktif.mentah === null ? '-' : bulat(aktif.mentah, 1),
      'nilai.rata': aktif.nilai === null ? '-' : bulat(aktif.nilai, 1),
      'miring.bahu': miring === null ? '-' : bulat(miring, 1),
      'susut.bahuTelinga': susut === null ? '-' : bulat(susut, 1),
    };
    // Awal kondisi koreksi kontinu (ms, waktu frame): Mode Uji mengukur latensi AC-F1-3 darinya.
    for (const [id, awal] of Object.entries(form.awalKondisi)) debug[`awal.${id}`] = awal;
    if (bergantian) {
      for (const k of kanal) {
        debug[`fase.${k.kunci}`] = k.counter.fase;
        debug[`nilai.${k.kunci}`] = k.nilai === null ? '-' : bulat(k.nilai, 1);
      }
    }
    const basisDebug = f ? basisFrame(f, sumber) : '2d';
    for (const sendi of SENDI_DEBUG) {
      for (const s of ['kiri', 'kanan'] as const) {
        const kunci = `sudut.${sendi.sendi}.${s}`;
        const [ia, ib, ic] = [indeksTitik(sendi.a, s), indeksTitik(sendi.b, s), indeksTitik(sendi.c, s)];
        // Kunci utama memakai sumber latihan; `.2d` / `.3d` = perbandingan mentah untuk Mode Uji.
        for (const [akhiran, b] of [['', basisDebug], ['.2d', '2d'], ['.3d', '3d']] as const) {
          const sudut = f && basisFrame(f, b) === b ? sudutSendi(f, ia, ib, ic, b, vis) : null;
          const nilai = sudut === null ? null : sendi.fleksi ? 180 - sudut : sudut;
          debug[kunci + akhiran] = nilai === null ? '-' : bulat(nilai, 1);
          if (akhiran === '') debug[`${kunci}.rata`] = ratakanDebug(kunci, nilai);
        }
      }
    }

    return {
      fase: aktif.counter.fase,
      repetisi: kanal.reduce((s, k) => s + k.counter.repetisi, 0),
      percobaan: kanal.reduce((s, k) => s + k.counter.percobaan, 0),
      nilai: aktif.nilai,
      satuan: def.satuan,
      progres: progresTerakhir,
      tubuhTerlihat,
      siap,
      koreksi: koreksiTampil,
      koreksiBaru: hasilForm.koreksiBaru,
      repetisiBaru: siklus.some((s) => s.p.dihitung),
      percobaanTidakDihitung: alasanTidakDihitung !== null,
      alasanTidakDihitung,
      titikAktif,
      debug,
      sisiTerlihat,
      sisiLainTerlihat,
    };
  }

  function finish(t: number): TrackerResult {
    const { skor, skorKomponen, saran } = hitungSkor({
      repLogs,
      targetRepetisi: opts.targetRepetisi,
      ambangAtas,
      ambangBawah: def.ambangBawah,
      tempoTargetDetik: def.tempoTargetDetik,
    });
    return {
      repetisi: kanal.reduce((s, k) => s + k.counter.repetisi, 0),
      percobaan: kanal.reduce((s, k) => s + k.counter.percobaan, 0),
      durasiDetik: Math.max(0, Math.round((t - (tMulai ?? t)) / 1000)),
      repLogs: repLogs.map((l) => ({ ...l, koreksi: [...l.koreksi] })),
      skor,
      skorKomponen,
      saran,
      koreksiTerhitung: { ...form.terhitung },
    };
  }

  return { update, finish };
}
