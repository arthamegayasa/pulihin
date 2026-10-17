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
    alt: 'Tangkapan layar Beranda pasien: kartu sapaan "Selamat pagi, Pak Budi" dengan ilustrasi, daftar Latihan Hari Ini dengan gambar peraga 3D dan status tiap latihan, tombol Mulai: Tekuk Siku, dan tombol Untuk Keluarga.',
    ...UKURAN,
  },
  ringkasan: {
    src: '/landing/ringkasan.webp',
    alt: 'Tangkapan layar Ringkasan Sesi: skor latihan 67 berlabel Baik dengan ilustrasi selebrasi, repetisi 7 dari 8, durasi 38 detik, dan rincian skor.',
    ...UKURAN,
  },
  afasia: {
    src: '/landing/afasia-kata.webp',
    alt: 'Tangkapan layar Latihan Bicara: gambar ilustrasi dan tulisan kata "sabun", tombol Dengar, dan tombol Sebutkan Kata.',
    ...UKURAN,
  },
  keluarga: {
    src: '/landing/keluarga.webp',
    alt: 'Tangkapan layar Untuk Keluarga: penanda Penting "Sudah 3 hari belum latihan", kartu Pak Budi dengan status belum latihan hari ini, dan status latihan gerak serta bicara hari ini.',
    ...UKURAN,
  },
  detail: {
    src: '/landing/detail-latihan.webp',
    alt: 'Tangkapan layar Detail Latihan "Angkat Lengan ke Depan": pilihan sisi Kanan/Kiri, contoh gerakan peraga 3D dalam dua posisi (Mulai dan Puncak) dengan otot bahu ditandai oranye, dan tombol Mulai dengan Kamera.',
    ...UKURAN,
  },
  klinisi: {
    src: '/landing/klinisi.webp',
    alt: 'Tangkapan layar Dashboard Terapis di laptop: ringkasan minggu ini (3 pasien, 1 perlu perhatian, kepatuhan rata-rata), lalu daftar pasien contoh dengan kepatuhan 7 hari, hari beruntun, latihan terakhir, rata-rata skor, dan penanda perlu perhatian.',
    lebar: 1280,
    tinggi: 800,
  },
} satisfies Record<string, TangkapanLayar>;
