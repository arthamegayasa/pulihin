/**
 * Tangkapan layar asli aplikasi dengan data contoh (Pak Budi, nama samaran), WebP kualitas 80.
 * Layar ponsel: 412x915 CSS px pada DPR 2 (824x1830). Dashboard Terapis: 1280x800 pada DPR 1.
 * Jangan ganti dengan mockup; tangkap ulang dari aplikasi yang berjalan bila tampilannya berubah.
 */
export interface TangkapanLayar {
  src: string;
  alt: string;
  lebar: number;
  tinggi: number;
}

const UKURAN = { lebar: 824, tinggi: 1830 } as const;

export const LAYAR = {
  beranda: {
    src: '/landing/beranda.webp',
    alt: 'Tangkapan layar Beranda pasien: sapaan untuk Pak Budi, pengingat latihan gerak, daftar Latihan Hari Ini dengan status tiap latihan, dan tombol besar Mulai: Tekuk Siku.',
    ...UKURAN,
  },
  ringkasan: {
    src: '/landing/ringkasan.webp',
    alt: 'Tangkapan layar Ringkasan Sesi: ucapan terima kasih, skor latihan 67 berlabel Baik, repetisi 7 dari 8, durasi, dan rincian skor.',
    ...UKURAN,
  },
  afasia: {
    src: '/landing/afasia-kata.webp',
    alt: 'Tangkapan layar Latihan Bicara: gambar dan tulisan kata "buku", tombol Dengar, dan tombol Sebutkan Kata.',
    ...UKURAN,
  },
  keluarga: {
    src: '/landing/keluarga.webp',
    alt: 'Tangkapan layar Untuk Keluarga: penanda "Sudah 3 hari belum latihan", status latihan hari ini, dan grafik sesi terjadwal 7 hari terakhir.',
    ...UKURAN,
  },
  detail: {
    src: '/landing/detail-latihan.webp',
    alt: 'Tangkapan layar Detail Latihan "Angkat Lengan ke Depan": gambar posisi mulai dan puncak, target 10 kali, pilihan sisi, dan tombol Mulai dengan Kamera.',
    ...UKURAN,
  },
  klinisi: {
    src: '/landing/klinisi.webp',
    alt: 'Tangkapan layar Dashboard Terapis di laptop: daftar pasien contoh dengan kepatuhan 7 hari, hari beruntun, latihan terakhir, rata-rata skor, dan penanda perlu perhatian.',
    lebar: 1280,
    tinggi: 800,
  },
} satisfies Record<string, TangkapanLayar>;
