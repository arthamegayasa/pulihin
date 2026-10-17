import type { KategoriKata } from '@/features/speech/types';
import type { Role } from '@/types';

/**
 * Kontrak aset ilustrasi S2 "Flat editorial" di `public/ilustrasi/` (nama & ukuran tetap).
 * Satu ukuran per berkas: komponen memberi width/height intrinsik agar tidak ada pergeseran tata letak (CLS),
 * lalu gambar diskalakan dengan CSS (`w-full h-auto`).
 */
export type NamaMomen = 'beranda' | 'selebrasi' | 'keluarga' | 'terapis' | 'kosong' | 'luring' | 'privasi' | 'bicara';
export type NamaLanding = 'hero' | 'gerak' | 'bicara' | 'keluarga';

export type RefIlustrasi =
  | { jenis: 'kata'; nama: string }
  | { jenis: 'kategori'; nama: KategoriKata }
  | { jenis: 'peran'; nama: Role }
  | { jenis: 'momen'; nama: NamaMomen }
  | { jenis: 'landing'; nama: NamaLanding };

export type JenisIlustrasi = RefIlustrasi['jenis'];

interface Ukuran {
  w: number;
  h: number;
}

const PERSEGI_512: Ukuran = { w: 512, h: 512 };
const LEBAR_16_9: Ukuran = { w: 960, h: 540 };
const KARTU_4_3: Ukuran = { w: 640, h: 480 };

const UKURAN_MOMEN: Record<NamaMomen, Ukuran> = {
  beranda: LEBAR_16_9,
  keluarga: LEBAR_16_9,
  terapis: LEBAR_16_9,
  bicara: LEBAR_16_9,
  selebrasi: { w: 640, h: 640 },
  kosong: KARTU_4_3,
  luring: KARTU_4_3,
  privasi: KARTU_4_3,
};

const UKURAN_LANDING: Record<NamaLanding, Ukuran> = {
  hero: { w: 1600, h: 1200 },
  gerak: { w: 960, h: 720 },
  bicara: { w: 960, h: 720 },
  keluarga: { w: 960, h: 720 },
};

/** Ukuran intrinsik berkas (px) sesuai kontrak aset. */
export function ukuranIlustrasi(ref: RefIlustrasi): Ukuran {
  switch (ref.jenis) {
    case 'kata':
    case 'kategori':
      return PERSEGI_512;
    case 'peran':
      return { w: 480, h: 480 };
    case 'momen':
      return UKURAN_MOMEN[ref.nama];
    case 'landing':
      return UKURAN_LANDING[ref.nama];
  }
}

/** URL absolut berkas WebP, mis. `/ilustrasi/momen/beranda.webp`. */
export function srcIlustrasi(ref: RefIlustrasi): string {
  return `/ilustrasi/${ref.jenis}/${encodeURIComponent(ref.nama)}.webp`;
}

/** Warna latar semua ilustrasi (sama dengan token `--color-ilustrasi`); dipakai juga saat gambar belum/gagal dimuat. */
export const WARNA_LATAR_ILUSTRASI = '#EEF4F2';
