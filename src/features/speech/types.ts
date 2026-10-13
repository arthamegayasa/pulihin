/** KONTRAK modul afasia (Bab 8). */

export type KategoriKata =
  | 'benda-rumah'
  | 'makanan-minuman'
  | 'keluarga-orang'
  | 'anggota-tubuh'
  | 'kebutuhan-harian';

export interface Kata {
  /** id stabil, mis. 'kursi' */
  id: string;
  kata: string;
  kategori: KategoriKata;
  /** Emoji besar sebagai gambar. */
  emoji: string;
  tingkat: 1 | 2 | 3;
  kalimatContoh: string;
  /** Pemenggalan suku kata untuk petunjuk "Hampir", mis. ['kur', 'si']. */
  sukuKata: string[];
}
