import type { ISODate } from '@/types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Tanggal lokal 'YYYY-MM-DD' dari Date atau epoch ms. */
export function toISODate(d: Date | number = new Date()): ISODate {
  const x = typeof d === 'number' ? new Date(d) : d;
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

/** Date lokal tengah hari agar aman dari pergeseran DST. */
export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Selisih hari kalender b - a. */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86_400_000);
}

/** n tanggal terakhir berakhir di `end` (inklusif), urut lama ke baru. */
export function lastNDays(n: number, end: ISODate = todayISO()): ISODate[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const namaHari = (iso: ISODate) => HARI[fromISODate(iso).getDay()];
export const namaHariPendek = (iso: ISODate) => HARI_PENDEK[fromISODate(iso).getDay()];

/** "Senin, 13 Oktober 2026" */
export function formatTanggalPanjang(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** "13 Okt" */
export function formatTanggalPendek(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)}`;
}

/** "08.30" gaya Indonesia dari epoch ms. */
export function formatJam(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`;
}

/** "2 menit 5 detik" */
export function formatDurasi(detik: number): string {
  const s = Math.max(0, Math.round(detik));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r} detik`;
  if (r === 0) return `${m} menit`;
  return `${m} menit ${r} detik`;
}
