import type { JenisSesi, Schedule } from '@/types';
import type { StatusHari } from './adherence';

/**
 * Pengingat jadwal (Bab 9.1).
 * - Di dalam aplikasi: banner hari ini dihitung dari jadwal + status hari ini.
 * - Notifikasi PWA: hanya selama aplikasi terbuka (tab aktif atau di latar belakang). Saat jam jadwal lewat dan
 *   sesinya belum selesai, aplikasi menampilkan notifikasi lewat service worker (cadangan: `new Notification`).
 *   Push terjadwal saat aplikasi tertutup membutuhkan server push dan berada di luar cakupan prototype ini.
 * Izin notifikasi yang ditolak atau tidak didukung tidak pernah menghalangi pemakaian aplikasi.
 */

export type StatusPengingat = 'nanti' | 'waktunya' | 'selesai';

export interface ItemPengingat {
  jenis: JenisSesi;
  /** 'HH:MM' */
  jam: string;
  status: StatusPengingat;
}

/** 'HH:MM' -> menit sejak tengah malam; null bila format tidak sah. */
export function jamKeMenit(jam: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(jam.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** "08:00" -> "08.00" (gaya penulisan jam Indonesia). */
export const jamTampil = (jam: string) => jam.replace(':', '.');

export function pengingatHariIni(schedule: Schedule | null | undefined, status: StatusHari, sekarang: Date): ItemPengingat[] {
  if (!schedule) return [];
  const menitSekarang = sekarang.getHours() * 60 + sekarang.getMinutes();
  const items: ItemPengingat[] = [];
  for (const [jenis, jam, selesai] of [
    ['gerak', schedule.jamGerak, status.gerakSelesai],
    ['afasia', schedule.jamAfasia, status.afasiaSelesai],
  ] as const) {
    const menit = jamKeMenit(jam);
    if (menit === null) continue;
    items.push({ jenis, jam, status: selesai ? 'selesai' : menitSekarang >= menit ? 'waktunya' : 'nanti' });
  }
  return items.sort((a, b) => (jamKeMenit(a.jam) ?? 0) - (jamKeMenit(b.jam) ?? 0));
}

/** Item yang baru berubah dari "nanti" menjadi "waktunya" sejak pemeriksaan sebelumnya. */
export function baruJatuhTempo(sebelum: readonly ItemPengingat[], sesudah: readonly ItemPengingat[]): ItemPengingat[] {
  return sesudah.filter(
    (n) => n.status === 'waktunya' && sebelum.some((p) => p.jenis === n.jenis && p.jam === n.jam && p.status === 'nanti'),
  );
}

export interface Banner {
  nada: 'aksen' | 'primer' | 'sukses';
  /** Satu kalimat pendek (muat satu baris di ponsel 360 px). */
  teks: string;
}

const NAMA: Record<JenisSesi, string> = { gerak: 'latihan gerak', afasia: 'latihan bicara' };

/** Setelah selang ini sejak jam jadwal, ajakan "Yuk ... (08.00)" diganti ajakan satu baris "Yuk, ... hari ini". */
export const SELANG_AJAKAN_MENIT = 60;

/** Kalimat banner pengingat yang hangat, tidak menyalahkan (Bab 12.4). */
export function bannerPengingat(items: readonly ItemPengingat[], sekarang: Date): Banner | null {
  if (items.length === 0) return null;
  const menitSekarang = sekarang.getHours() * 60 + sekarang.getMinutes();
  const jatuhTempo = items.filter((i) => i.status === 'waktunya');
  const baru = jatuhTempo.find((i) => menitSekarang - (jamKeMenit(i.jam) ?? 0) < SELANG_AJAKAN_MENIT);
  if (baru) return { nada: 'aksen', teks: `Yuk, ${NAMA[baru.jenis]} (${jamTampil(baru.jam)})` };
  if (jatuhTempo.length > 0) return { nada: 'aksen', teks: `Yuk, ${NAMA[jatuhTempo[0].jenis]} hari ini` };
  const berikut = items.find((i) => i.status === 'nanti');
  if (berikut) {
    const nama = NAMA[berikut.jenis];
    return { nada: 'primer', teks: `${nama[0].toUpperCase()}${nama.slice(1)} nanti pukul ${jamTampil(berikut.jam)}` };
  }
  return { nada: 'sukses', teks: 'Semua jadwal hari ini selesai' };
}

export function teksNotifikasi(item: ItemPengingat): { judul: string; isi: string } {
  return {
    judul: `Waktunya ${NAMA[item.jenis]}`,
    isi: `Jadwal pukul ${jamTampil(item.jam)}. Buka PULIHIN dan mulai dari satu latihan ringan.`,
  };
}

/* ---------- Notifikasi browser ---------- */

export type IzinNotifikasi = NotificationPermission | 'tidak-didukung';

export function izinNotifikasi(): IzinNotifikasi {
  return typeof Notification === 'undefined' ? 'tidak-didukung' : Notification.permission;
}

/** Minta izin; tidak pernah melempar galat. */
export async function mintaIzinNotifikasi(): Promise<IzinNotifikasi> {
  if (typeof Notification === 'undefined') return 'tidak-didukung';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Tampilkan notifikasi lewat service worker bila ada, cadangan `new Notification`. Mengembalikan true bila tampil. */
export async function tampilkanNotifikasi(judul: string, isi: string): Promise<boolean> {
  if (izinNotifikasi() !== 'granted') return false;
  const opsi: NotificationOptions = { body: isi, icon: '/icons/pwa-192x192.png', badge: '/icons/pwa-192x192.png', tag: `pulihin-${judul}` };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(judul, opsi);
      return true;
    }
    new Notification(judul, opsi);
    return true;
  } catch {
    return false;
  }
}
