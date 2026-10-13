/**
 * Isian [DIISI] milik pemilik produk (spesifikasi Lampiran B), dikumpulkan di SATU tempat.
 * `null` / daftar kosong = belum diisi: tampilan menyembunyikan baris terkait, bukan menampilkan "[DIISI]" ke juri.
 */
export interface Identitas {
  namaTim: string | null;
  anggotaTim: string[];
  /** Nama lengkap, gelar, dan afiliasi narasumber klinis. */
  narasumberKlinis: string | null;
  /** Email/WhatsApp tim untuk dicantumkan publik (opsional). */
  kontakPublik: string | null;
  /** Domain produk final (spesifikasi): dipakai di video dan materi lomba. */
  domain: string;
  /**
   * Alamat yang SAAT INI aktif dan dapat dibuka juri. Ganti menjadi `https://pulihinapp.id` setelah DNS
   * domain final mengarah ke Vercel (lihat README, bagian Deploy).
   */
  urlPublik: string;
  kategoriLomba: string;
}

export const IDENTITAS: Identitas = {
  namaTim: null,
  anggotaTim: [],
  narasumberKlinis: null,
  kontakPublik: null,
  domain: 'pulihinapp.id',
  urlPublik: 'https://pulihin.vercel.app',
  kategoriLomba: '.id Developer Day Indonesia 2026, kategori Inclusions and Community Services, subkategori Health and Wellbeing',
};

/** Host yang ditampilkan untuk alamat publik saat ini, mis. "pulihin.vercel.app". */
export const HOST_PUBLIK = new URL(IDENTITAS.urlPublik).host;
