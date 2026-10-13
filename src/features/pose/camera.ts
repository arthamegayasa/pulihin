/**
 * Akses kamera depan untuk sesi gerak. Video hanya ditampilkan & diproses di perangkat (AC-F1-5).
 * 640x480 sebagai bawaan agar ringan di HP kelas bawah (Bab 18.2).
 */

export type JenisGalatKamera = 'izin-ditolak' | 'tidak-ditemukan' | 'sedang-dipakai' | 'butuh-https' | 'tidak-didukung' | 'lainnya';

export class GalatKamera extends Error {
  readonly jenis: JenisGalatKamera;
  constructor(jenis: JenisGalatKamera, sebab?: unknown) {
    super(`Kamera: ${jenis}`, { cause: sebab });
    this.name = 'GalatKamera';
    this.jenis = jenis;
  }
}

export interface PenjelasanGalat {
  judul: string;
  isi: string;
  langkah?: string[];
}

/** Pesan ramah untuk tiap kendala kamera (Bab 5.1 langkah 3: bukan halaman error teknis). */
export const PENJELASAN_GALAT_KAMERA: Record<JenisGalatKamera, PenjelasanGalat> = {
  'izin-ditolak': {
    judul: 'Kamera belum diizinkan',
    isi: 'PULIHIN butuh kamera untuk melihat dan menghitung gerakan Anda. Gambar kamera hanya diproses di perangkat ini dan tidak dikirim ke mana pun.',
    langkah: [
      'Ketuk ikon di sebelah kiri alamat situs (ikon setelan situs), di bagian atas Chrome.',
      'Pilih Izin, lalu Kamera.',
      'Pilih Izinkan, lalu kembali ke sini dan ketuk Coba Lagi.',
    ],
  },
  'tidak-ditemukan': {
    judul: 'Kamera tidak ditemukan',
    isi: 'Perangkat ini sepertinya tidak punya kamera yang bisa dipakai. Coba buka PULIHIN di ponsel atau laptop lain yang memiliki kamera.',
  },
  'sedang-dipakai': {
    judul: 'Kamera sedang dipakai aplikasi lain',
    isi: 'Tutup aplikasi lain yang memakai kamera, misalnya panggilan video atau aplikasi foto, lalu ketuk Coba Lagi.',
  },
  'butuh-https': {
    judul: 'Kamera butuh alamat aman',
    isi: 'Kamera hanya bisa dipakai bila PULIHIN dibuka lewat alamat yang diawali https. Buka lagi dari alamat resmi aplikasi.',
  },
  'tidak-didukung': {
    judul: 'Browser ini belum mendukung kamera',
    isi: 'Coba buka PULIHIN dengan Google Chrome versi terbaru.',
  },
  lainnya: {
    judul: 'Kamera belum bisa dinyalakan',
    isi: 'Ada kendala kecil saat menyalakan kamera. Ketuk Coba Lagi. Bila masih belum bisa, tutup lalu buka lagi aplikasinya.',
  },
};

export function klasifikasiGalatKamera(e: unknown): JenisGalatKamera {
  if (e instanceof GalatKamera) return e.jenis;
  const nama = e instanceof DOMException || e instanceof Error ? e.name : '';
  switch (nama) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'izin-ditolak';
    case 'SecurityError':
      return typeof window !== 'undefined' && !window.isSecureContext ? 'butuh-https' : 'izin-ditolak';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'tidak-ditemukan';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'sedang-dipakai';
    default:
      return 'lainnya';
  }
}

export const BATASAN_VIDEO: MediaTrackConstraints = {
  facingMode: 'user',
  width: { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 30 },
};

/** Minta aliran kamera depan. Melempar GalatKamera. */
export async function mintaKamera(): Promise<MediaStream> {
  if (typeof window !== 'undefined' && !window.isSecureContext) throw new GalatKamera('butuh-https');
  if (!navigator.mediaDevices?.getUserMedia) throw new GalatKamera('tidak-didukung');
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: false, video: BATASAN_VIDEO });
  } catch (e) {
    throw new GalatKamera(klasifikasiGalatKamera(e), e);
  }
}

/**
 * Pasang aliran ke elemen video dan mulai memutar. Dipisah dari mintaKamera agar permintaan yang sudah
 * kedaluwarsa (mis. efek dibersihkan saat izin masih ditanyakan) tidak pernah menyentuh elemen video.
 */
export async function pasangKeVideo(video: HTMLVideoElement, stream: MediaStream): Promise<void> {
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  try {
    await video.play();
  } catch (e) {
    matikanKamera(stream, video);
    throw new GalatKamera('lainnya', e);
  }
}

/** Hentikan semua track secara sinkron: lampu kamera padam seketika (AC-F1-7). Video hanya dilepas bila memutar aliran ini. */
export function matikanKamera(stream: MediaStream | null, video?: HTMLVideoElement | null): void {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
  if (video && video.srcObject === stream) {
    video.pause();
    video.srcObject = null;
  }
}
