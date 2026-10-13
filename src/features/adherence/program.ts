import type { ISODate, Program, ProgramItem, Session } from '@/types';
import { clamp } from '@/lib/score';

/**
 * Resep program latihan gerak (Bab 10.2) dan statusnya di "Latihan Hari Ini" (Bab 13).
 * Satu sesi gerak = satu set. Satu set dianggap tuntas bila sesi selesai itu mencapai minimal separuh target
 * repetisi (dibulatkan ke atas, `repetisiCukup`); sebuah latihan selesai hari ini bila set tuntas >= jumlah set.
 * Sesi yang dihentikan lebih awal tetap tercatat dan tetap dihitung kepatuhan/streak (adherence.ts), tetapi di
 * daftar hari ini hanya tampil sebagai "Sudah dicoba" dan tetap menjadi latihan berikutnya untuk dimulai.
 * Semua fungsi murni.
 */

export interface Batas {
  min: number;
  max: number;
}

export const BATAS_REPETISI: Batas = { min: 3, max: 30 };
export const BATAS_SET: Batas = { min: 1, max: 5 };
export const BATAS_FREKUENSI: Batas = { min: 1, max: 7 };
/** Daftar latihan hari ini harus muat tanpa menggulir di HP 6 inci (Bab 11), jadi resep dibatasi. */
export const MAKS_LATIHAN = 5;
export const DIBUAT_OLEH_DEMO = 'Terapis (demo)';

export interface StatusItemHariIni extends ProgramItem {
  /** Sesi gerak selesai untuk latihan ini hari ini, termasuk yang dihentikan lebih awal. */
  jumlahSesi: number;
  /** Set tuntas (sesi dengan repetisi >= repetisiCukup), dibatasi `set`. */
  setSelesai: number;
  selesai: boolean;
  /** Skor sesi tuntas terakhir latihan ini hari ini. */
  skorTerakhir: number | null;
  /** Repetisi terbanyak dari sesi yang belum tuntas hari ini; null bila tidak ada. */
  repetisiDicoba: number | null;
}

/** Repetisi minimal agar satu sesi dihitung sebagai satu set tuntas: separuh target, dibulatkan ke atas. */
export function repetisiCukup(targetRepetisi: number): number {
  return Math.max(1, Math.ceil(targetRepetisi / 2));
}

/** Status setiap butir program untuk satu tanggal. Hanya sesi gerak `selesai` yang dihitung. */
export function statusProgramHariIni(items: readonly ProgramItem[], sessions: readonly Session[], today: ISODate): StatusItemHariIni[] {
  const hariIni = sessions
    .filter((s) => s.selesai && s.jenis === 'gerak' && s.tanggal === today)
    .sort((a, b) => (a.selesaiAt ?? a.mulaiAt) - (b.selesaiAt ?? b.mulaiAt));
  return items.map((item) => {
    const milik = hariIni.filter((s) => s.latihanId === item.latihanId);
    const cukup = repetisiCukup(item.targetRepetisi);
    const tuntas = milik.filter((s) => s.repetisiTercapai >= cukup);
    const dicoba = milik.filter((s) => s.repetisiTercapai < cukup);
    const set = Math.max(1, item.set);
    return {
      ...item,
      jumlahSesi: milik.length,
      setSelesai: Math.min(tuntas.length, set),
      selesai: tuntas.length >= set,
      skorTerakhir: tuntas.at(-1)?.skor ?? null,
      repetisiDicoba: dicoba.length > 0 ? Math.max(...dicoba.map((s) => s.repetisiTercapai)) : null,
    };
  });
}

/** Latihan pertama (urutan resep) yang belum selesai; tombol "Mulai" memakai ini. */
export function latihanBerikutnya<T extends Pick<StatusItemHariIni, 'selesai'>>(status: readonly T[]): T | undefined {
  return status.find((s) => !s.selesai);
}

/** "10 kali" atau "10 kali x 2 set". */
export function teksTarget(item: Pick<ProgramItem, 'targetRepetisi' | 'set'>): string {
  return item.set > 1 ? `${item.targetRepetisi} kali x ${item.set} set` : `${item.targetRepetisi} kali`;
}

/** "1 dari 2 set" untuk latihan bersetelan banyak yang sudah dimulai tetapi belum lengkap; selain itu null. */
export function teksProgresSet(s: Pick<StatusItemHariIni, 'set' | 'setSelesai' | 'selesai'>): string | null {
  if (s.set <= 1 || s.selesai || s.setSelesai === 0) return null;
  return `${s.setSelesai} dari ${s.set} set`;
}

/**
 * Kalimat hangat untuk latihan yang sudah dicoba tetapi belum tuntas: "Sudah dicoba: 3 dari 10".
 * Null bila latihan selesai, belum dicoba, atau sudah ada set tuntas (pakai teksProgresSet).
 */
export function teksSudahDicoba(s: Pick<StatusItemHariIni, 'selesai' | 'setSelesai' | 'repetisiDicoba' | 'targetRepetisi'>): string | null {
  if (s.selesai || s.setSelesai > 0 || s.repetisiDicoba === null) return null;
  return s.repetisiDicoba > 0 ? `Sudah dicoba: ${s.repetisiDicoba} dari ${s.targetRepetisi}` : 'Sudah dicoba';
}

/* ---------- penyunting resep (dashboard klinisi) ---------- */

/** Bagian resep yang dapat disunting terapis. */
export interface DraftProgram {
  items: ProgramItem[];
  frekuensiPerMinggu: number;
}

export const DRAFT_KOSONG: DraftProgram = { items: [], frekuensiPerMinggu: 7 };

export function draftDariProgram(p: Program | undefined | null): DraftProgram {
  if (!p) return DRAFT_KOSONG;
  return { items: p.items.map((i) => ({ ...i })), frekuensiPerMinggu: p.frekuensiPerMinggu };
}

export function programSama(a: DraftProgram, b: DraftProgram): boolean {
  return (
    a.frekuensiPerMinggu === b.frekuensiPerMinggu &&
    a.items.length === b.items.length &&
    a.items.every((x, i) => {
      const y = b.items[i];
      return x.latihanId === y.latihanId && x.targetRepetisi === y.targetRepetisi && x.set === y.set;
    })
  );
}

export const batasi = (nilai: number, b: Batas) => clamp(Math.round(nilai), b.min, b.max);

/** Tambah latihan di akhir daftar (tanpa duplikat, maksimal MAKS_LATIHAN). */
export function tambahLatihan(d: DraftProgram, latihanId: string, targetRepetisi: number): DraftProgram {
  if (d.items.length >= MAKS_LATIHAN || d.items.some((i) => i.latihanId === latihanId)) return d;
  return { ...d, items: [...d.items, { latihanId, targetRepetisi: batasi(targetRepetisi, BATAS_REPETISI), set: 1 }] };
}

export function hapusLatihan(d: DraftProgram, latihanId: string): DraftProgram {
  return { ...d, items: d.items.filter((i) => i.latihanId !== latihanId) };
}

/** Ubah target repetisi atau set satu latihan; nilai dibatasi ke rentang yang diizinkan. */
export function ubahLatihan(d: DraftProgram, latihanId: string, ubah: Partial<Pick<ProgramItem, 'targetRepetisi' | 'set'>>): DraftProgram {
  return {
    ...d,
    items: d.items.map((i) =>
      i.latihanId !== latihanId
        ? i
        : {
            ...i,
            targetRepetisi: batasi(ubah.targetRepetisi ?? i.targetRepetisi, BATAS_REPETISI),
            set: batasi(ubah.set ?? i.set, BATAS_SET),
          },
    ),
  };
}

/** Geser urutan satu latihan (-1 = naik, +1 = turun). Urutan menentukan latihan yang dimulai lebih dulu. */
export function geserLatihan(d: DraftProgram, latihanId: string, arah: -1 | 1): DraftProgram {
  const dari = d.items.findIndex((i) => i.latihanId === latihanId);
  const ke = dari + arah;
  if (dari < 0 || ke < 0 || ke >= d.items.length) return d;
  const items = [...d.items];
  [items[dari], items[ke]] = [items[ke], items[dari]];
  return { ...d, items };
}

export function ubahFrekuensi(d: DraftProgram, frekuensi: number): DraftProgram {
  return { ...d, frekuensiPerMinggu: batasi(frekuensi, BATAS_FREKUENSI) };
}

/** Program siap disimpan; resep tanpa latihan ditolak agar Latihan Hari Ini pasien tidak kosong tanpa sengaja. */
export function buatProgram(patientId: string, d: DraftProgram, now: number, dibuatOleh = DIBUAT_OLEH_DEMO): Program | null {
  if (d.items.length === 0) return null;
  return {
    patientId,
    items: d.items.map((i) => ({ latihanId: i.latihanId, targetRepetisi: batasi(i.targetRepetisi, BATAS_REPETISI), set: batasi(i.set, BATAS_SET) })),
    frekuensiPerMinggu: batasi(d.frekuensiPerMinggu, BATAS_FREKUENSI),
    dibuatOleh,
    tanggalUbah: now,
  };
}
