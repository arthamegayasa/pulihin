import type { RepLog, Sisi, SkorKomponen } from '@/types';

/**
 * KONTRAK modul pose. Dipakai bersama oleh logika (PoseCore) dan tampilan kamera (PoseUI).
 * Definisi latihan adalah DATA (Bab 4.2): siap dipindah ke Flutter tanpa menulis ulang.
 */

/** Titik tubuh dalam Bahasa Indonesia; dipetakan ke indeks MediaPipe per sisi di landmarks.ts. */
export type NamaTitik =
  | 'hidung'
  | 'telinga'
  | 'bahu'
  | 'siku'
  | 'pergelangan'
  | 'pinggul'
  | 'lutut'
  | 'pergelangan-kaki'
  | 'tumit'
  | 'ujung-kaki';

export type Posisi = 'duduk' | 'berdiri-berpegangan' | 'duduk-ke-berdiri';

export type SendiTarget = 'bahu' | 'siku' | 'lutut' | 'pinggul' | 'pergelangan-kaki' | 'batang-tubuh';

/** Cara mengubah pose menjadi satu angka yang dihitung state machine repetisi. */
export type Metrik =
  /**
   * Sudut di titik b dari vektor b->a dan b->c, derajat. `fleksi` = 180 - sudut (0 saat lurus);
   * `selisih-90` = sudut - 90 (mis. abduksi pinggul terhadap garis panggul).
   * `aSisiLawan`: titik a diambil dari sisi berlawanan (mis. pinggul lawan untuk garis panggul).
   */
  | {
      jenis: 'sudut';
      a: NamaTitik;
      b: NamaTitik;
      c: NamaTitik;
      ubah?: 'fleksi' | 'selisih-90';
      aSisiLawan?: boolean;
    }
  /** Kenaikan titik relatif posisi awal, dalam persen lebar bahu. */
  | { jenis: 'kenaikan'; titik: NamaTitik }
  /** Jarak dua titik dalam persen lebar bahu (menggapai). */
  | { jenis: 'jarak'; dari: NamaTitik; ke: NamaTitik }
  /** Rotasi garis bahu terhadap bidang kamera, derajat. */
  | { jenis: 'rotasi-bahu' }
  /** Metrik dihitung terpisah untuk sisi kiri dan kanan bergantian (marching). */
  | { jenis: 'bergantian'; per: Exclude<Metrik, { jenis: 'bergantian' }> };

export type IdKoreksi =
  | 'bahu-terangkat'
  | 'badan-miring'
  | 'rentang-kurang'
  | 'tempo-cepat'
  | 'keluar-frame'
  | (string & {});

export interface KoreksiDefinisi {
  id: IdKoreksi;
  /** Penjelasan cara deteksi untuk pembaca kode / klinisi. */
  kondisi: string;
  /** Pesan ke pasien. Tidak pernah menyalahkan (Bab 12.4). */
  pesan: string;
  /** Ambang khusus koreksi, mis. derajat kemiringan bahu. */
  ambang?: number;
  /** Lama kondisi harus bertahan (detik) sebelum pesan boleh tampil; bawaan per id koreksi. */
  tahanDetik?: number;
}

export interface ExerciseDefinition {
  id: string;
  /** Nama ramah pasien, mis. "Tekuk Siku". */
  nama: string;
  /** Nama klinis umum untuk terapis, mis. "Fleksi siku". */
  namaKlinis: string;
  posisi: Posisi;
  sendiTarget: SendiTarget[];
  metrik: Metrik;
  /** Titik landmark yang disorot di overlay dan dicek keterlihatannya. */
  titikKunci: NamaTitik[];
  /** Fase atas tercapai bila nilai >= ambangAtas. */
  ambangAtas: number;
  /** Fase bawah bila nilai <= ambangBawah. */
  ambangBawah: number;
  /** Satuan nilai metrik untuk tampilan. */
  satuan: '°' | '%';
  /** Histeresis, default 5 (Bab 7.2). */
  histeresis?: number;
  targetRepetisiDefault: number;
  tempoTargetDetik: { min: number; max: number };
  /** 'pilih': pasien memilih sisi kiri/kanan; 'keduanya': metrik simetris/bergantian. */
  sisi: 'pilih' | 'keduanya';
  /** Latihan inti yang diuji penuh (Bab 18 tahap 4). */
  inti: boolean;
  panduanLangkah: string[];
  /** Posisi & jarak ponsel, contoh "Letakkan ponsel di meja setinggi dada, 1 meter di depan Anda." */
  posisiPonsel: string;
  peringatan: string;
  /** Latihan berdiri wajib menampilkan syarat berpegangan (Bab 17.2). */
  wajibBerpegangan: boolean;
  koreksiUmum: KoreksiDefinisi[];
  /**
   * Video peraga 3D: path dasar `'/peraga/<id>'` = tiga berkas di `public/peraga/`: `<id>.mp4` (720x720 H.264,
   * satu siklus mulus, sisi kanan anatomis, tanpa audio), `<id>-mulai.webp` dan `<id>-puncak.webp` (poster pose
   * mulai/puncak). Sisi kiri dicerminkan di aplikasi (VideoPeraga). Sumber render: `peraga3d/` (Blender).
   */
  animasiAtauVideo: `/peraga/${string}`;
  /**
   * Sumber koordinat sudut sendi (lihat docs/algoritma.md "Validasi dengan rekaman manusia nyata"):
   * '2d' = koordinat gambar; '3d' = worldLandmarks MediaPipe; 'hibrida' = rata-rata berbobot 2D/3D,
   * 2D saat kedua ruas sendi sejajar bidang gambar, 3D saat salah satu ruas mengarah ke kamera.
   * Bawaan '3d'.
   */
  sumberSudut?: SumberSudut;
  /** Arah ponsel terhadap pasien untuk gambar penempatan ponsel. Bawaan 'depan'. */
  arahKamera?: 'depan' | 'serong';
}

export type SumberSudut = '2d' | '3d' | 'hibrida';

/** Satu landmark ternormalisasi MediaPipe. */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseFrame {
  /** 33 landmark ternormalisasi 0..1 (x ke kanan gambar, y ke bawah). */
  landmarks: Landmark[];
  /** Landmark dunia 3D (meter, pusat pinggul) bila tersedia. */
  worldLandmarks?: Landmark[];
  /** performance.now() dalam ms. */
  t: number;
  /** lebar/tinggi gambar kamera, agar sudut dari koordinat ternormalisasi tidak terdistorsi. */
  aspect: number;
}

export type FaseRepetisi = 'BAWAH' | 'NAIK' | 'ATAS' | 'TURUN';

export interface KoreksiAktif {
  id: IdKoreksi;
  pesan: string;
  /** ms (waktu frame) saat pesan mulai tampil */
  sejak: number;
}

export interface TrackerSnapshot {
  fase: FaseRepetisi;
  /** Repetisi terhitung. */
  repetisi: number;
  /** Semua siklus termasuk yang terlalu cepat (< 1 detik). */
  percobaan: number;
  /** Nilai metrik yang sudah diratakan, null bila frame diabaikan. */
  nilai: number | null;
  satuan: '°' | '%';
  /** 0..1 posisi nilai di antara ambang bawah dan atas, untuk bar progres gerak. */
  progres: number;
  tubuhTerlihat: boolean;
  /** Tubuh terdeteksi stabil >= 1 detik; sebelum itu repetisi tidak dihitung. */
  siap: boolean;
  /** Pesan koreksi yang sedang tampil (sudah mematuhi aturan penayangan Bab 7.3). */
  koreksi: KoreksiAktif | null;
  /** Non-null hanya pada frame ketika pesan koreksi baru mulai tampil (UI mengucapkannya). */
  koreksiBaru: KoreksiAktif | null;
  /** true pada frame ketika repetisi bertambah. */
  repetisiBaru: boolean;
  /** true pada frame ketika siklus terlalu cepat tercatat sebagai percobaan. */
  percobaanTidakDihitung: boolean;
  /** Indeks landmark MediaPipe yang disorot di overlay. */
  titikAktif: number[];
  /** Nilai mentah untuk Mode Uji: sudut per sendi, state, dsb. */
  debug: Record<string, number | string | boolean>;
  /** Alasan percobaan tidak dihitung pada frame `percobaanTidakDihitung`; null pada frame lain. */
  alasanTidakDihitung?: 'terlalu-cepat' | 'rentang-kurang' | null;
  /** Titik kunci latihan sisi kiri / kanan pasien terlihat pada frame ini. */
  sisiTerlihat?: { kiri: boolean; kanan: boolean };
  /**
   * true bila latihan satu sisi, sisi pilihan TIDAK terlihat tetapi sisi lawan terlihat, bertahan
   * >= 1 detik (UI menyarankan hadap kamera atau ganti sisi).
   */
  sisiLainTerlihat?: boolean;
}

export interface TrackerResult {
  repetisi: number;
  percobaan: number;
  durasiDetik: number;
  repLogs: Omit<RepLog, 'id' | 'sessionId'>[];
  /** 0..100 = 50% repetisi + 30% rentang + 20% tempo (Bab 5.3). */
  skor: number;
  skorKomponen: SkorKomponen;
  /** Satu saran sederhana untuk sesi berikutnya. */
  saran: string;
  /** Berapa kali tiap koreksi tampil. */
  koreksiTerhitung: Record<string, number>;
}

export interface TrackerOptions {
  sisi: Sisi;
  targetRepetisi: number;
  /**
   * 'otomatis' (bawaan) = sumber sudut per latihan (`def.sumberSudut`); bila worldLandmarks tidak
   * ada, 2D. '2d' / '3d' = paksa satu sumber (perbandingan di Mode Uji).
   */
  modeSudut?: 'otomatis' | '2d' | '3d';
  /** Jendela moving average dalam frame (3..5, bawaan 4). */
  jendelaRata?: number;
  /**
   * Target rentang dari resep terapis, persen ambang atas (50..100, bawaan 100). Hanya menskalakan ambang
   * atas (dan batas "rentang kurang"); ambang bawah, histeresis, dan durasi minimum tetap.
   */
  rentangPersen?: number;
}

export interface ExerciseTracker {
  /** Panggil tiap frame. `null` = tidak ada tubuh terdeteksi pada frame itu. */
  update(frame: PoseFrame | null, t: number): TrackerSnapshot;
  /** Akhiri sesi dan hitung hasil. */
  finish(t: number): TrackerResult;
}
