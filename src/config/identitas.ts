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
  domain: string;
  urlAplikasi: string;
  kategoriLomba: string;
}

export const IDENTITAS: Identitas = {
  namaTim: null,
  anggotaTim: [],
  narasumberKlinis: null,
  kontakPublik: null,
  domain: 'pulihinapp.id',
  urlAplikasi: 'https://pulihinapp.id/app',
  kategoriLomba: '.id Developer Day Indonesia 2026, kategori Inclusions and Community Services, subkategori Health and Wellbeing',
};
