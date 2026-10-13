import { labelSkor, type LabelSkor } from '@/lib/score';
import type { RepLog, SkorKomponen } from '@/types';
import { ATURAN_UMUM } from './exerciseDefinitions';
import { progresNilai } from './RepCounter';

/**
 * Skor sesi 0..100 (Bab 5.3) = 50% ketercapaian repetisi + 30% ketepatan rentang + 20% tempo stabil.
 * Dihitung hanya dari repLogs + ambang latihan, sehingga dapat dihitung ulang dari data tersimpan.
 *
 * - repetisi: min(1, repetisi terhitung / target).
 * - rentang : rata-rata progres puncak tiap PERCOBAAN, progres = (puncak - ambangBawah) /
 *             (ambangAtas - ambangBawah) dibatasi 0..1. Repetisi terhitung selalu mencapai ambang
 *             atas (nilai 1), jadi rata-rata atas repetisi terhitung saja selalu 100; memasukkan
 *             percobaan setengah gerak membuat komponen ini bermakna. 0 bila tidak ada percobaan.
 * - tempo   : untuk siklus lengkap (mencapai ambang atas), 70% porsi siklus yang durasinya di dalam
 *             tempoTargetDetik + 30% kestabilan = 1 - (koefisien variasi durasi / 0,5), dibatasi 0..1.
 *             0 bila tidak ada siklus lengkap.
 */

type LogSkor = Pick<RepLog, 'dihitung' | 'sudutPuncak' | 'durasiSiklusDetik'>;

export interface MasukanSkor {
  repLogs: readonly LogSkor[];
  targetRepetisi: number;
  ambangAtas: number;
  ambangBawah: number;
  tempoTargetDetik: { min: number; max: number };
}

export interface HasilSkor {
  skor: number;
  skorKomponen: SkorKomponen;
  label: LabelSkor;
  saran: string;
}

export const SARAN = {
  kosong: 'Hari ini belum ada gerakan yang tercatat. Besok kita mulai pelan-pelan, satu gerakan dulu sudah bagus.',
  pujian: 'Bagus sekali. Pertahankan latihan rutin seperti hari ini.',
  repetisi: 'Besok kita coba tambah beberapa gerakan lagi, sedikit demi sedikit.',
  rentang: 'Besok coba gerakkan sedikit lebih jauh, sebatas yang nyaman.',
  tempoCepat: 'Besok coba bergerak lebih pelan dan teratur, sambil bernapas biasa.',
  tempoTidakTeratur: 'Gerakan sudah hati-hati. Besok coba jaga irama yang sama di setiap gerakan.',
} as const;

function median(nilai: readonly number[]): number {
  const urut = [...nilai].sort((a, b) => a - b);
  const tengah = Math.floor(urut.length / 2);
  return urut.length % 2 ? urut[tengah] : (urut[tengah - 1] + urut[tengah]) / 2;
}

export function hitungSkor(m: MasukanSkor): HasilSkor {
  const aturan = ATURAN_UMUM.skor;
  const dihitung = m.repLogs.filter((l) => l.dihitung).length;
  const repetisi = m.targetRepetisi > 0 ? Math.min(1, dihitung / m.targetRepetisi) : 0;

  const rentang =
    m.repLogs.length === 0
      ? 0
      : m.repLogs.reduce((s, l) => s + progresNilai(l.sudutPuncak, m.ambangBawah, m.ambangAtas), 0) / m.repLogs.length;

  const durasiLengkap = m.repLogs.filter((l) => l.sudutPuncak >= m.ambangAtas).map((l) => l.durasiSiklusDetik);
  let tempo = 0;
  if (durasiLengkap.length > 0) {
    const { min, max } = m.tempoTargetDetik;
    const dalamTarget = durasiLengkap.filter((d) => d >= min && d <= max).length / durasiLengkap.length;
    const rata = durasiLengkap.reduce((s, d) => s + d, 0) / durasiLengkap.length;
    const sd = Math.sqrt(durasiLengkap.reduce((s, d) => s + (d - rata) ** 2, 0) / durasiLengkap.length);
    const kv = rata > 0 ? sd / rata : 0;
    const stabil = Math.min(1, Math.max(0, 1 - kv / aturan.koefisienVariasiMaks));
    tempo = aturan.porsiTempoDalamTarget * dalamTarget + (1 - aturan.porsiTempoDalamTarget) * stabil;
  }

  const total =
    100 * (aturan.bobotRepetisi * repetisi + aturan.bobotRentang * rentang + aturan.bobotTempo * tempo);
  const skorKomponen: SkorKomponen = {
    repetisi: Math.round(repetisi * 100),
    rentang: Math.round(rentang * 100),
    tempo: Math.round(tempo * 100),
  };
  const skor = Math.round(total);

  let saran: string;
  if (m.repLogs.length === 0) {
    saran = SARAN.kosong;
  } else if (Math.min(skorKomponen.repetisi, skorKomponen.rentang, skorKomponen.tempo) >= aturan.ambangPujian) {
    saran = SARAN.pujian;
  } else if (durasiLengkap.length === 0) {
    // Belum ada gerakan yang mencapai ambang atas: rentang adalah langkah berikutnya.
    saran = SARAN.rentang;
  } else {
    // Komponen dengan nilai terendah; bila seri, urutan repetisi, rentang, tempo.
    const terlemah = (['repetisi', 'rentang', 'tempo'] as const).reduce((a, b) =>
      skorKomponen[b] < skorKomponen[a] ? b : a,
    );
    if (terlemah === 'tempo') {
      saran = median(durasiLengkap) < m.tempoTargetDetik.min ? SARAN.tempoCepat : SARAN.tempoTidakTeratur;
    } else {
      saran = SARAN[terlemah];
    }
  }

  return { skor, skorKomponen, label: labelSkor(skor), saran };
}
