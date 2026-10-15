/**
 * Timeline video demo PULIHIN: SATU-SATUNYA sumber kebenaran.
 *
 * Dipakai oleh komposisi Remotion (src/PulihinDemo.tsx), generator narasi (scripts/narasi.mjs),
 * subtitle, naskah, dan daftar produksi (scripts/build-srt.mjs), pemindai (scripts/scan-footage.mjs),
 * dan perender still (scripts/stills.mjs).
 *
 * Produksi tanpa rekaman manusia: pemeran = karakter 3D (Blender) yang menggerakkan aplikasi ASLI lewat
 * kamera palsu Chrome; narasi = suara sintetis. Tanpa dokter.
 *
 * Waktu TIDAK ditulis tangan. Setiap adegan punya durasi minimal; panjang sebenarnya mengikuti durasi
 * audio narasi yang terukur (src/terukur.ts, ditulis `npm run scan`). Adegan sesi kamera ditempatkan
 * pada peristiwa aplikasi asli di `video/blender/out/sesi-meta.json` (hitungan 5 dari 10, koreksi bahu).
 * Alur: ubah teks di sini -> `npm run narasi` -> `npm run scan` -> `npm run srt`.
 *
 * Hanya mengimpor `src/config/identitas.ts` milik aplikasi dan berkas TS hasil pemindai, dan hanya
 * memakai sintaks TypeScript yang dapat dihapus, supaya Node 22+ dapat memuatnya langsung.
 */

import { HOST_PUBLIK, IDENTITAS } from '../../src/config/identitas.ts';
import type { SesiMeta } from './sesi-meta-tipe.ts';
import { DURASI_AUDIO, SESI_META } from './terukur.ts';

export const FPS = 30;
export const LEBAR = 1920;
export const TINGGI = 1080;

/** Durasi crossfade antar adegan (frame). Hanya fade lembut. */
export const FADE_FRAME = 14;

/**
 * Alamat yang ditampilkan dan diucapkan: domain final hanya bila `urlPublik` sudah mengarah ke sana,
 * selain itu host yang saat ini benar-benar aktif (src/config/identitas.ts).
 */
export const DOMAIN = HOST_PUBLIK;
export const DOMAIN_FINAL = IDENTITAS.domain;
export const NAMA_TIM: string | null = IDENTITAS.namaTim;
export const KATEGORI = '.id Developer Day Indonesia 2026';
export const SUBKATEGORI = 'Health and Wellbeing';
export const LABEL_KARAKTER = 'Peragaan dengan karakter 3D, bukan pasien sungguhan';
export const LABEL_KARAKTER_EN = '3D character demonstration, not a real patient';

/** Narasi per baris: public/audio/narasi/<id>.mp3; suara aplikasi yang disuarakan ulang: public/audio/aplikasi/<id>.mp3. */
export const audioBaris = (b: { id: string; pembicara: Pembicara }): string =>
  b.pembicara === 'Suara aplikasi (disuarakan ulang)' ? `audio/aplikasi/${b.id}.mp3` : `audio/narasi/${b.id}.mp3`;

/** SFX siap pakai (video/public/audio/sfx). `repetisi` tidak dipakai untuk peristiwa aplikasi (aplikasi tidak berbunyi). */
export const SFX = {
  ketuk: 'audio/sfx/ketuk.mp3',
  repetisi: 'audio/sfx/repetisi.mp3',
  berhasil: 'audio/sfx/berhasil.mp3',
  suasana: 'audio/sfx/suasana-rumah.mp3',
  transisi: 'audio/sfx/transisi.mp3',
} as const;
/** Volume relatif narasi (= 1). Suasana rumah hanya di bawah adegan 3D, sangat pelan. */
export const VOLUME_SFX = { ketuk: 0.32, repetisi: 0.16, berhasil: 0.22, suasana: 0.07, transisi: 0.16 } as const;

/** 'data' = tipografi data bersumber; 'judul' = b-roll 3D + judul; 'penutup-3d' = render 3D penutup + kartu domain. */
export type Tata = 'data' | 'judul' | 'broll' | 'ponsel' | 'desktop' | 'split' | 'penutup-3d' | 'penutup';

export type Pembicara = 'Narator (suara sintetis)' | 'Suara aplikasi (disuarakan ulang)';

export interface SlotRekaman {
  /** Nama berkas di video/public/footage/. */
  berkas: string;
  /** render3d = render Blender (karakter 3D); layar = rekaman layar ponsel; desktop = rekaman layar 1920x1080. */
  jenis: 'render3d' | 'layar' | 'desktop';
  /** Apa yang harus ada di berkas (daftar produksi dan kartu placeholder). */
  rekam: string;
  /** Detik di dalam berkas tempat adegan ini mulai diambil. */
  mulaiDi: number;
}

export interface BarisNarasi {
  id: string;
  pembicara: Pembicara;
  /** Teks Indonesia (naskah, subtitle ID). Angka boleh berupa angka. */
  teksId: string;
  teksEn: string;
  /** Teks yang diucapkan TTS bila berbeda (angka dieja, nama dibaca sebagai satu kata). */
  ucapan: string;
  /** Waktu bicara absolut (detik), dari durasi audio terukur. */
  mulai: number;
  selesai: number;
  /** true bila durasi berasal dari audio terukur, false bila masih perkiraan. */
  terukur: boolean;
}

export interface TeksLayar {
  utama: string;
  en: string;
  keterangan?: string;
  /** Detik sejak awal adegan sebelum teks tampil. */
  mulaiDi?: number;
}

export interface DataFakta {
  /** Nilai akhir untuk animasi hitung naik dan cara menulisnya. */
  nilai: number;
  desimal: number;
  akhiran: string;
  pemisahRibuan?: boolean;
  keterangan: string;
  keteranganEn: string;
  /** Baris pendukung kecil (opsional). */
  pendukung?: string;
  /** Label sumber singkat di layar. */
  sumber: string;
}

export interface Adegan {
  id: string;
  mulai: number;
  selesai: number;
  tata: Tata;
  tahap: string;
  judul: string;
  kamera?: SlotRekaman;
  layar?: SlotRekaman;
  teksLayar?: TeksLayar;
  data?: DataFakta;
  /** Label penunjuk di samping ponsel; `ke` = posisi vertikal 0..1 pada layar ponsel. */
  sorot?: { label: string; ke: number; mulaiDi?: number };
  narasi: BarisNarasi[];
  diLayar: string;
  momen?: { detik: number; deskripsi: string };
  /** Karakter 3D terlihat (di render 3D atau di kamera aplikasi): label wajib tampil. */
  karakter: boolean;
  catatan?: string;
}

export const TAHAP = {
  masalah: 'Masalah klinis',
  tugasKecil: 'Satu gerakan kecil',
  sesiPenuh: 'Satu sesi utuh',
  keluarga: 'Keluarga dan afasia',
  penutup: 'Terapis dan penutup',
} as const;

// ---------------------------------------------------------------------------------------------
// Rekaman
// ---------------------------------------------------------------------------------------------

const F = {
  kertas: 'broll-kertas-program.mp4',
  ragu: 'broll-pemeran-ragu.mp4',
  berandaDetail: 'layar-01-beranda-detail.mp4',
  sesiLebar: 'kamera-sesi-lebar.mp4',
  sesiLayar: 'layar-02-sesi-tekuk-siku.mp4',
  ringkasan: 'layar-03-ringkasan-beranda.mp4',
  keluarga: 'layar-04-keluarga.mp4',
  afasiaLayar: 'layar-05-afasia.mp4',
  afasiaLebar: 'kamera-afasia-lebar.mp4',
  klinisi: 'layar-06-klinisi.mp4',
  penutup: 'penutup-3d.mp4',
} as const;

const REKAM: Record<keyof typeof F, string> = {
  kertas: 'Render 3D: tangan karakter meletakkan kertas program latihan di meja rumah (tanpa nama/data asli).',
  ragu: 'Render 3D: karakter duduk memegang kertas program, tampak ragu mencoba gerakan.',
  berandaDetail: 'Beranda Pak Budi sebelum latihan, ketuk Tekuk Siku, Detail Latihan, gulir ke Utamakan keselamatan.',
  sesiLebar: 'Render 3D lebar 16:9: karakter duduk di kursi, ponsel di meja ±1 m. Sinkron frame-ke-frame dengan layar-02.',
  sesiLayar:
    'Rekaman layar aplikasi ASLI saat render 3D diputar sebagai kamera Chrome: skeleton, hitungan sampai 10/10, satu koreksi "Rilekskan bahu, turunkan bahu Anda" yang muncul dari gerak karakter.',
  ringkasan: 'Ringkasan Sesi Tekuk Siku, Rincian skor, saran dan kalimat bukan diagnosis, Kembali ke Beranda (Tekuk Siku selesai).',
  keluarga: 'Untuk Keluarga: tanda perlu perhatian, grafik 7 hari, skor 14 hari, Salin Ringkasan Mingguan.',
  afasiaLayar: 'Latihan Bicara, Mode Latihan Mandiri, Benda di Rumah, Dengar, Sudah Benar, "Benar!", Kata Berikutnya.',
  afasiaLebar: 'Render 3D lebar: karakter mendengarkan contoh lalu menyebut kata ke arah ponsel (dipasangkan dengan layar-05 mulai detik 12).',
  klinisi: 'Desktop 1920x1080: Dashboard Terapis, Pak Budi, Tambah Luruskan Tungkai, Simpan Resep, Lihat sebagai pasien.',
  penutup: 'Render 3D penutup: ponsel PULIHIN di meja rumah yang tenang, karakter beristirahat; layar ponsel hanya berisi frame aplikasi asli atau mati.',
};

/** Slot yang dibuat `npm run rekam-layar` dari aplikasi produksi. */
export const OTOMATIS: Record<string, true> = {
  [F.berandaDetail]: true,
  [F.ringkasan]: true,
  [F.keluarga]: true,
  [F.afasiaLayar]: true,
  [F.klinisi]: true,
};
/** Slot yang dibuat agen Blender3D (video/blender, video/scripts/rekam-sesi-3d.mjs). */
export const DARI_BLENDER: Record<string, true> = {
  [F.kertas]: true,
  [F.ragu]: true,
  [F.sesiLebar]: true,
  [F.sesiLayar]: true,
  [F.afasiaLebar]: true,
  [F.penutup]: true,
};

/**
 * Bila sesi-meta.json belum ada: perkiraan rencana (hanya untuk draf dengan placeholder).
 * Draf dengan perkiraan ini tidak boleh menjadi versi final (build-srt memberi peringatan).
 */
const PERKIRAAN_SESI: SesiMeta = {
  fps: 30,
  durasiDetik: 66,
  berkas: { layar: F.sesiLayar, lebar: F.sesiLebar },
  siapDetik: 5,
  repetisiDetik: [9, 14, 19, 24, 29, 34, 41, 46, 51, 56],
  koreksi: [{ teks: 'Rilekskan bahu, turunkan bahu Anda', mulaiDetik: 37.5, selesaiDetik: 40 }],
  selesaiDetik: 56,
  ringkasanDetik: 59,
};
export const SESI: SesiMeta = SESI_META ?? PERKIRAAN_SESI;
export const SESI_TERUKUR = SESI_META !== null;
const KOREKSI = SESI.koreksi[0];

/**
 * Waktu ketukan (detik di dalam berkas) dari jadwal scripts/rekam-layar.mjs: ponsel = saat `ketuk`
 * dipanggil; desktop = setelah kursor bergerak (gerakMs + 120 ms); layar-02 = `ketukanDetik` di
 * sesi-meta.json (bila ada). Dipakai untuk bunyi ketukan.
 */
export const KETUKAN: Record<string, number[]> = {
  [F.berandaDetail]: [8.62],
  [F.ringkasan]: [33.62],
  [F.keluarga]: [24.82],
  [F.afasiaLayar]: [1.82, 4.22, 7.22, 13.02, 19.22, 27.62],
  [F.klinisi]: [2.52, 10.57, 13.97, 18.57],
  [F.sesiLayar]: SESI.ketukanDetik ?? [],
};

// ---------------------------------------------------------------------------------------------
// Definisi adegan (durasi minimal; panjang sebenarnya dihitung dari audio)
// ---------------------------------------------------------------------------------------------

interface DefSlot {
  kunci: keyof typeof F;
  jenis: SlotRekaman['jenis'];
  /** Angka = detik tetap; 'lanjut' = tepat setelah adegan sebelumnya yang memakai berkas sama. */
  mulaiDi: number | 'lanjut';
}

interface DefBaris {
  id: string;
  pembicara?: Pembicara;
  teksId: string;
  teksEn: string;
  ucapan?: string;
  /** Baris ini dimulai tepat pada jangkar adegan (peristiwa aplikasi). */
  padaJangkar?: boolean;
}

interface DefAdegan {
  id: string;
  tata: Tata;
  tahap: string;
  judul: string;
  minimal: number;
  kamera?: DefSlot;
  layar?: DefSlot;
  teksLayar?: TeksLayar;
  data?: DataFakta;
  sorot?: { label: string; ke: number; mulaiDi?: number };
  narasi: DefBaris[];
  diLayar: string;
  karakter?: boolean;
  /**
   * Kunci adegan pada peristiwa aplikasi asli: detik `detikBerkas` di berkas layar tampil pada detik
   * relatif `padaRel` (angka, atau sesudah baris tertentu selesai + `tambah`).
   */
  jangkar?: { detikBerkas: number; padaRel: number | { setelahBaris: string; tambah: number } };
  /** Adegan berlangsung minimal sampai detik ini di berkas layar. */
  sampaiBerkas?: number;
  /** Boleh diperpanjang (maks. 8 dtk) supaya adegan berjangkar berikutnya bersambung tanpa lompatan. */
  elastis?: boolean;
  /** Momen screenshot: detik relatif adegan, atau relatif jangkar. Bawaan: tengah adegan. */
  momen?: { rel?: number; dariJangkar?: number; deskripsi: string };
  catatan?: string;
}

const N = 'Narator (suara sintetis)' as const;
const APLIKASI = 'Suara aplikasi (disuarakan ulang)' as const;
const ucapanDomain = DOMAIN.split('.').join(' titik ');

const DEF: DefAdegan[] = [
  {
    id: 's01-fakta-kematian',
    tata: 'data',
    tahap: TAHAP.masalah,
    judul: 'Data: stroke dan kematian',
    minimal: 6.5,
    data: {
      nilai: 18.5,
      desimal: 1,
      akhiran: '%',
      keterangan: 'kematian di Indonesia disebabkan stroke',
      keteranganEn: 'of deaths in Indonesia are caused by stroke',
      pendukung: 'dan 11,2% dari total kecacatan',
      sumber: 'Sumber: Kemenkes, rilis 25 Okt 2024',
    },
    narasi: [
      {
        id: 'N01',
        teksId: 'Menurut Kementerian Kesehatan, stroke menyebabkan 18,5 persen kematian di Indonesia.',
        ucapan: 'Menurut Kementerian Kesehatan, stroke menyebabkan delapan belas koma lima persen kematian di Indonesia.',
        teksEn: 'According to the Ministry of Health, stroke causes 18.5 percent of deaths in Indonesia.',
      },
    ],
    diLayar: 'Angka besar 18,5% menghitung naik, "kematian di Indonesia disebabkan stroke", "dan 11,2% dari total kecacatan", label sumber Kemenkes.',
    momen: { rel: 4, deskripsi: 'Angka 18,5% dengan label sumber Kemenkes' },
  },
  {
    id: 's02-fakta-kontrol',
    tata: 'data',
    tahap: TAHAP.masalah,
    judul: 'Data: kontrol rutin',
    minimal: 5.5,
    data: {
      nilai: 49.2,
      desimal: 1,
      akhiran: '%',
      keterangan: 'penyandang stroke yang kontrol rutin',
      keteranganEn: 'of people with stroke have regular check-ups',
      pendukung: 'Perdesaan 39,6% · Perkotaan 53,7%',
      sumber: 'Sumber: SKI 2023, Kemenkes (Tabel 7.48)',
    },
    narasi: [
      {
        id: 'N02',
        teksId: 'Namun hanya 49,2 persen penyandang stroke yang kontrol rutin.',
        ucapan: 'Namun, hanya empat puluh sembilan koma dua persen penyandang stroke yang kontrol rutin.',
        teksEn: 'Yet only 49.2 percent of people with stroke have regular check-ups.',
      },
    ],
    diLayar: 'Angka besar 49,2% "penyandang stroke yang kontrol rutin", perdesaan 39,6% dan perkotaan 53,7%, label sumber SKI 2023.',
  },
  {
    id: 's03-fakta-terapis',
    tata: 'data',
    tahap: TAHAP.masalah,
    judul: 'Data: tenaga terapi di puskesmas',
    minimal: 6,
    data: {
      nilai: 926,
      desimal: 0,
      akhiran: '',
      keterangan: 'tenaga keterapian fisik di 10.180 puskesmas',
      keteranganEn: 'physical therapy staff across 10,180 community health centres',
      pendukung: 'Fisioterapis, okupasi terapis, terapis wicara, akupunktur',
      sumber: 'Sumber: Profil Kesehatan Indonesia 2023, Kemenkes',
    },
    narasi: [
      {
        id: 'N03',
        teksId: 'Tenaga terapi pun terbatas: hanya 926 tenaga keterapian fisik di lebih dari 10.000 puskesmas.',
        ucapan: 'Tenaga terapi pun terbatas: hanya sembilan ratus dua puluh enam tenaga keterapian fisik, di lebih dari sepuluh ribu puskesmas.',
        teksEn: 'Therapists are scarce too: only 926 physical therapy staff across more than 10,000 community health centres.',
      },
    ],
    diLayar: 'Angka besar 926 "tenaga keterapian fisik di 10.180 puskesmas", label sumber Profil Kesehatan Indonesia 2023.',
    momen: { rel: 4.5, deskripsi: 'Angka 926 tenaga keterapian fisik di 10.180 puskesmas, dengan label sumber' },
  },
  {
    id: 's04-judul',
    tata: 'judul',
    tahap: TAHAP.masalah,
    judul: 'B-roll 3D: kertas program, judul PULIHIN',
    minimal: 4.4,
    kamera: { kunci: 'kertas', jenis: 'render3d', mulaiDi: 0 },
    karakter: true,
    narasi: [
      {
        id: 'N04',
        teksId: 'Pasien pulang membawa program latihan di atas kertas.',
        teksEn: 'Patients go home with an exercise programme on paper.',
      },
    ],
    diLayar: 'Render 3D kertas program diletakkan di meja; judul PULIHIN, Pendamping Rehabilitasi Stroke di Rumah.',
  },
  {
    id: 's05-ragu',
    tata: 'broll',
    tahap: TAHAP.masalah,
    judul: 'B-roll 3D: karakter ragu, kalimat masalah',
    minimal: 6,
    kamera: { kunci: 'ragu', jenis: 'render3d', mulaiDi: 0 },
    karakter: true,
    teksLayar: { utama: 'Di rumah, pendampingan terputus', en: 'At home, guidance breaks off', mulaiDi: 1.2 },
    narasi: [
      {
        id: 'N05',
        teksId: 'Di rumah, mereka ragu apakah gerakannya sudah benar. Di situlah pendampingan terputus.',
        teksEn: 'At home, they are unsure whether they are moving correctly. That is where guidance breaks off.',
      },
    ],
    diLayar: 'Karakter 3D ragu memegang kertas program; kalimat masalah tampil besar.',
    momen: { rel: 4, deskripsi: 'Kalimat masalah "Di rumah, pendampingan terputus" di atas render 3D' },
  },
  {
    id: 's06-beranda',
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Beranda: Latihan Hari Ini',
    minimal: 8,
    layar: { kunci: 'berandaDetail', jenis: 'layar', mulaiDi: 0 },
    teksLayar: { utama: 'Ponsel biasa menjadi pendamping latihan', en: 'An ordinary phone as a home exercise companion' },
    sorot: { label: 'Latihan Hari Ini', ke: 0.29 },
    narasi: [
      {
        id: 'N06',
        teksId: 'PULIHIN mengubah ponsel biasa menjadi pendamping latihan. Begitu dibuka, Latihan Hari Ini langsung tampil dalam huruf besar.',
        ucapan: 'Pulihin mengubah ponsel biasa menjadi pendamping latihan. Begitu dibuka, Latihan Hari Ini langsung tampil dalam huruf besar.',
        teksEn: "PULIHIN turns an ordinary phone into an exercise companion. Once opened, Today's Exercises appear right away, in large type.",
      },
    ],
    diLayar: 'Beranda Pak Budi (Demo): "Selamat pagi, Pak Budi", Latihan Hari Ini berhuruf besar (0 dari 4 latihan selesai), tombol Mulai: Tekuk Siku.',
    momen: { rel: 4, deskripsi: 'Beranda: Latihan Hari Ini berhuruf besar' },
  },
  {
    id: 's07-detail',
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Detail Latihan: Tekuk Siku',
    minimal: 10,
    layar: { kunci: 'berandaDetail', jenis: 'layar', mulaiDi: 'lanjut' },
    teksLayar: { utama: 'Mulai dari satu gerakan kecil', en: 'Start with one small movement' },
    sorot: { label: 'Mulai dengan Kamera', ke: 0.92, mulaiDi: 1.5 },
    narasi: [
      {
        id: 'N07',
        teksId: 'Kita mulai dari satu gerakan kecil: Tekuk Siku. Ada contoh gerakan, pesan keselamatan, lalu satu tombol besar: Mulai dengan Kamera.',
        teksEn: 'We start with one small movement: Elbow Flexion. There is a movement demo, a safety notice, then one big button: Start with Camera.',
      },
    ],
    diLayar: 'Ketuk Tekuk Siku; Detail Latihan dengan contoh gerakan, pesan "Berhenti bila nyeri, pusing, atau sesak" di atas tombol Mulai dengan Kamera, lalu gulir ke Utamakan keselamatan.',
  },
  {
    id: 's08-posisi',
    tata: 'split',
    tahap: TAHAP.tugasKecil,
    judul: 'Render 3D lebar: ponsel di meja, karakter duduk',
    minimal: 8,
    kamera: { kunci: 'sesiLebar', jenis: 'render3d', mulaiDi: Math.max(0, SESI.siapDetik - 3) },
    layar: { kunci: 'sesiLayar', jenis: 'layar', mulaiDi: Math.max(0, SESI.siapDetik - 3) },
    karakter: true,
    teksLayar: { utama: 'Ponsel di meja, ± 1 meter', en: 'Phone on a table, about 1 metre away' },
    narasi: [
      {
        id: 'N08',
        teksId: 'Ponsel cukup diletakkan di meja, sekitar satu meter dari kursi. Ini peragaan dengan karakter 3D, bukan pasien sungguhan.',
        ucapan: 'Ponsel cukup diletakkan di meja, sekitar satu meter dari kursi. Ini peragaan dengan karakter tiga dimensi, bukan pasien sungguhan.',
        teksEn: 'The phone simply sits on a table, about one metre from the chair. This is a demonstration with a 3D character, not a real patient.',
      },
    ],
    diLayar: 'Karakter 3D duduk di depan ponsel di meja; di bingkai ponsel, Mulai dengan Kamera diketuk, lalu aplikasi asli mendeteksi tubuh dan menampilkan skeleton.',
    momen: { rel: 6, deskripsi: 'Skeleton di layar ponsel, karakter 3D duduk di depan ponsel' },
  },
  {
    id: 's09-sudut',
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Sesi kamera: sudut siku dan skeleton',
    minimal: 8,
    layar: { kunci: 'sesiLayar', jenis: 'layar', mulaiDi: 'lanjut' },
    karakter: true,
    elastis: true,
    teksLayar: {
      utama: 'Repetisi dihitung dari sudut siku',
      en: 'Repetitions counted from the elbow angle',
      keterangan: 'Diproses di perangkat · video tidak diunggah',
    },
    sorot: { label: 'Sudut siku', ke: 0.45 },
    narasi: [
      {
        id: 'N09',
        teksId:
          'Aplikasi asli membaca titik-titik tubuh langsung di perangkat, tanpa mengunggah video. Repetisi dihitung dari sudut siku: tekuk penuh, lalu luruskan lagi.',
        teksEn:
          'The real app reads body landmarks right on the device, without uploading any video. Repetitions are counted from the elbow angle: a full bend, then straighten again.',
      },
    ],
    diLayar: 'Skeleton mengikuti lengan karakter 3D di kamera aplikasi, hitungan bertambah setelah satu siklus tekuk-luruskan.',
  },
  {
    id: 's10-lima',
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Sesi kamera: 5 / 10',
    minimal: 4,
    layar: { kunci: 'sesiLayar', jenis: 'layar', mulaiDi: 'lanjut' },
    karakter: true,
    elastis: true,
    jangkar: { detikBerkas: SESI.repetisiDetik[4], padaRel: 1.5 },
    teksLayar: { utama: 'Hitungan naik setiap repetisi lengkap', en: 'The count rises with every complete repetition' },
    sorot: { label: 'Hitungan repetisi', ke: 0.86 },
    narasi: [
      {
        id: 'N10',
        teksId: 'Lihat angkanya: lima dari sepuluh.',
        teksEn: 'Look at the count: five out of ten.',
      },
    ],
    diLayar: 'Aplikasi asli menaikkan hitungan menjadi 5 / 10 (detik sesi-meta repetisiDetik[4]) dengan skeleton di atas video kamera.',
    momen: { dariJangkar: 1.2, deskripsi: 'Hitungan "5 / 10" dengan skeleton' },
  },
  {
    id: 's11-koreksi',
    tata: 'split',
    tahap: TAHAP.sesiPenuh,
    judul: 'Koreksi form: bahu terangkat',
    minimal: 9,
    kamera: { kunci: 'sesiLebar', jenis: 'render3d', mulaiDi: 'lanjut' },
    layar: { kunci: 'sesiLayar', jenis: 'layar', mulaiDi: 'lanjut' },
    karakter: true,
    jangkar: { detikBerkas: KOREKSI.mulaiDetik, padaRel: { setelahBaris: 'N11a', tambah: 0.35 } },
    teksLayar: { utama: 'Koreksi form saat bahu terangkat', en: 'Form correction when the shoulder rises' },
    sorot: { label: 'Koreksi form', ke: 0.73 },
    narasi: [
      { id: 'N11a', teksId: 'Sekarang bahunya ikut terangkat.', teksEn: 'Now the shoulder hikes up.' },
      {
        id: 'N11-app',
        pembicara: APLIKASI,
        teksId: KOREKSI.teks.endsWith('.') ? KOREKSI.teks : `${KOREKSI.teks}.`,
        teksEn: '[App voice] Relax your shoulder, lower your shoulder.',
        padaJangkar: true,
      },
      {
        id: 'N11b',
        teksId: 'Aplikasi langsung mengoreksi, dengan suara dan teks besar dalam Bahasa Indonesia.',
        teksEn: 'The app corrects right away, by voice and in large text, in Indonesian.',
      },
    ],
    diLayar: `Karakter 3D mengangkat bahu; pesan koreksi "${KOREKSI.teks}" muncul di atas skeleton pada frame sesi-meta koreksi[0].mulaiDetik, bersama suara aplikasi yang disuarakan ulang (kata dan frame persis).`,
    momen: { dariJangkar: 1.2, deskripsi: `Pesan koreksi "${KOREKSI.teks}" di atas skeleton` },
    catatan:
      'Adegan terpenting. Koreksi muncul karena aplikasi asli memproses render 3D (kamera palsu Chrome); tidak ada teks koreksi yang ditempel saat menyunting. Suara aplikasi disuarakan ulang dengan kata persis dan pada detik persis dari sesi-meta.json, diberi warna speaker ponsel.',
  },
  {
    id: 's13-sepuluh',
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Sesi berlanjut sampai 10 / 10, Ringkasan aplikasi',
    minimal: 6,
    layar: { kunci: 'sesiLayar', jenis: 'layar', mulaiDi: 'lanjut' },
    karakter: true,
    sampaiBerkas: SESI.ringkasanDetik + 2.8,
    teksLayar: { utama: 'Bukan sekadar menghitung', en: 'Not just counting: form correction' },
    sorot: { label: 'Hitungan repetisi', ke: 0.86 },
    narasi: [
      {
        id: 'N13',
        teksId: 'Jadi bukan sekadar menghitung, melainkan menjaga cara geraknya, sampai repetisi kesepuluh.',
        teksEn: 'So it is not just counting: it guards how each movement is done, all the way to the tenth repetition.',
      },
    ],
    diLayar: 'Hitungan naik sampai 10 / 10 (sesi-meta selesaiDetik), lalu aplikasi asli menampilkan Ringkasan sesi ini (ringkasanDetik).',
  },
  {
    id: 's14-ringkasan',
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Ringkasan Sesi: skor',
    minimal: 13.5,
    layar: { kunci: 'ringkasan', jenis: 'layar', mulaiDi: 0 },
    teksLayar: {
      utama: 'Skor dan ringkasan sederhana',
      en: 'A score and a simple summary',
      keterangan: 'Perlu Pendampingan · Berkembang · Baik · Sangat Baik',
    },
    sorot: { label: 'Skor sesi', ke: 0.39 },
    narasi: [
      {
        id: 'N14',
        teksId:
          'Di akhir sesi ada skor dan ringkasan sederhana: jumlah repetisi dan durasi. Labelnya mudah dipahami, dari Perlu Pendampingan sampai Sangat Baik.',
        teksEn:
          'At the end of the session there is a score and a simple summary: repetitions and duration. The labels are easy to read, from Needs Support to Very Good.',
      },
    ],
    diLayar: 'Ringkasan Sesi "Hebat, target latihan tercapai!": skor dengan label, Repetisi 10 / 10, Durasi; lalu Rincian skor.',
    momen: { rel: 6, deskripsi: 'Skor sesi dengan label, repetisi, dan durasi' },
  },
  {
    id: 's15-batasan',
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Ringkasan Sesi: saran dan kalimat bukan diagnosis',
    minimal: 9,
    layar: { kunci: 'ringkasan', jenis: 'layar', mulaiDi: 20 },
    teksLayar: { utama: 'Satu saran, bukan diagnosis', en: 'One tip, not a diagnosis' },
    sorot: { label: 'Kalimat bukan diagnosis', ke: 0.7, mulaiDi: 2.6 },
    narasi: [
      {
        id: 'N15',
        teksId: 'Ada satu saran untuk sesi berikutnya. Ringkasan ini bukan diagnosis, dan kalimat batasan itu selalu tampil.',
        teksEn: 'There is one tip for the next session. This summary is not a diagnosis, and that disclaimer always appears.',
      },
    ],
    diLayar: 'Kartu Saran untuk sesi berikutnya dan kalimat "Skor ini adalah skor latihan untuk motivasi dan pemantauan, bukan skor klinis dan bukan alat ukur diagnosis".',
  },
  {
    id: 's16-tercatat',
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Kembali ke Beranda: latihan selesai',
    minimal: 10,
    layar: { kunci: 'ringkasan', jenis: 'layar', mulaiDi: 32 },
    teksLayar: { utama: 'Latihan hari ini tercatat', en: "Today's exercise is recorded" },
    sorot: { label: 'Tekuk Siku selesai', ke: 0.38, mulaiDi: 5.4 },
    narasi: [
      {
        id: 'N16',
        teksId: 'Kembali ke Beranda, Tekuk Siku sudah bertanda selesai beserta skornya. Latihannya tercatat, dan keluarga bisa melihatnya.',
        teksEn: 'Back on the home screen, Elbow Flexion is marked done, with its score. The exercise is recorded, and the family can see it.',
      },
    ],
    diLayar: 'Ketuk Kembali ke Beranda; Tekuk Siku bertanda "Selesai" beserta skor, 1 dari 4 latihan selesai.',
    momen: { rel: 7.5, deskripsi: 'Beranda: Tekuk Siku "Selesai" beserta angka skornya' },
  },
  {
    id: 's17-keluarga',
    tata: 'ponsel',
    tahap: TAHAP.keluarga,
    judul: 'Untuk Keluarga: tanda, status, grafik 7 hari',
    minimal: 14.5,
    layar: { kunci: 'keluarga', jenis: 'layar', mulaiDi: 0 },
    teksLayar: { utama: 'Keluarga tidak lagi menebak', en: 'Caregivers no longer have to guess' },
    sorot: { label: 'Sesi terjadwal 7 hari', ke: 0.46, mulaiDi: 7.8 },
    narasi: [
      {
        id: 'N17',
        teksId:
          'Keluarga tidak lagi menebak. Halaman Untuk Keluarga menunjukkan tanda bila latihan sempat terhenti, status hari ini, dan grafik tujuh hari terakhir.',
        teksEn:
          "The family no longer has to guess. The For Family page shows a flag when exercise has stopped, today's status, and a chart of the last seven days.",
      },
    ],
    diLayar: 'Kartu "Perlu perhatian: Minggu ini sempat 3 hari berturut-turut tanpa latihan", status "Sudah latihan hari ini", lalu grafik Sesi terjadwal 7 hari terakhir.',
    momen: { rel: 10, deskripsi: 'Grafik Sesi terjadwal 7 hari terakhir di halaman Untuk Keluarga' },
  },
  {
    id: 's18-salin',
    tata: 'ponsel',
    tahap: TAHAP.keluarga,
    judul: 'Untuk Keluarga: tren skor dan salin ringkasan',
    minimal: 12.5,
    layar: { kunci: 'keluarga', jenis: 'layar', mulaiDi: 'lanjut' },
    sampaiBerkas: 27.5,
    teksLayar: { utama: 'Ringkasan mingguan untuk terapis', en: 'A weekly summary for the therapist' },
    sorot: { label: 'Salin Ringkasan Mingguan', ke: 0.59, mulaiDi: 8.6 },
    narasi: [
      {
        id: 'N18',
        teksId: 'Tren skor empat belas hari juga terlihat. Ringkasan mingguan bisa disalin dengan satu ketukan, siap dikirim ke terapis.',
        teksEn: 'The 14-day score trend is there too. The weekly summary can be copied with one tap, ready to send to the therapist.',
      },
    ],
    diLayar: 'Grafik Skor latihan 14 hari, lalu ketuk Salin Ringkasan Mingguan; pesan "Ringkasan disalin. Tempel di WhatsApp untuk terapis." tampil.',
    momen: { rel: 11, deskripsi: 'Pesan "Ringkasan disalin" setelah Salin Ringkasan Mingguan diketuk' },
  },
  {
    id: 's19-afasia',
    tata: 'ponsel',
    tahap: TAHAP.keluarga,
    judul: 'Latihan Bicara: kata dan gambar',
    minimal: 12,
    layar: { kunci: 'afasiaLayar', jenis: 'layar', mulaiDi: 0 },
    teksLayar: { utama: 'Latihan bicara berbahasa Indonesia', en: 'Aphasia practice in Indonesian' },
    sorot: { label: 'Gambar dan kata', ke: 0.44, mulaiDi: 5 },
    narasi: [
      {
        id: 'N19',
        teksId:
          'Untuk pasien dengan gangguan bicara atau afasia, ada Latihan Bicara berbahasa Indonesia, dengan kata yang dipakai di rumah setiap hari.',
        teksEn: 'For patients with speech difficulties, or aphasia, there is Speech Practice in Indonesian, with words used at home every day.',
      },
    ],
    diLayar: 'Latihan Bicara: pilih Mode Latihan Mandiri dan kategori Benda di Rumah; satu kata dengan gambar besar dan tombol Dengar.',
  },
  {
    id: 's20-sebut',
    tata: 'split',
    tahap: TAHAP.keluarga,
    judul: 'Karakter menyebut kata, hasil Benar',
    minimal: 17.5,
    kamera: { kunci: 'afasiaLebar', jenis: 'render3d', mulaiDi: 0 },
    layar: { kunci: 'afasiaLayar', jenis: 'layar', mulaiDi: 12 },
    karakter: true,
    teksLayar: { utama: 'Setiap kata dinilai', en: 'Every word attempt is scored' },
    sorot: { label: 'Hasil penilaian kata', ke: 0.57, mulaiDi: 7.6 },
    narasi: [
      {
        id: 'N20a',
        teksId: 'Contoh kata bisa didengar lebih dulu, lalu katanya diucapkan.',
        teksEn: 'The example word can be heard first, then the word is spoken.',
      },
      {
        id: 'N20b',
        teksId: 'Di Mode Latihan Mandiri, pendamping menilai dengan satu ketukan: Sudah Benar, atau Ulangi. Hasilnya tercatat.',
        teksEn: 'In Self-Practice Mode, the companion scores with one tap: Correct, or Repeat. The result is saved.',
      },
    ],
    diLayar: 'Karakter 3D menyebut kata ke arah ponsel; di layar, Sudah Benar diketuk dan "Benar! Hebat, langsung tepat." tampil, lalu Kata Berikutnya.',
    momen: { rel: 10, deskripsi: 'Kata yang dinilai "Benar!" di Latihan Bicara' },
    catatan: 'Rekaman layar memakai Mode Latihan Mandiri (pengenal suara Chrome tidak tersedia di peramban otomatis), maka narasi menyebut penilaian oleh pendamping, bukan pengenalan suara.',
  },
  {
    id: 's21-terapis',
    tata: 'desktop',
    tahap: TAHAP.penutup,
    judul: 'Dashboard Terapis: progres pasien',
    minimal: 11,
    layar: { kunci: 'klinisi', jenis: 'desktop', mulaiDi: 0 },
    teksLayar: { utama: 'Terapis menyusun program', en: 'Therapists set the home programme' },
    narasi: [
      {
        id: 'N21',
        teksId: 'Di Dashboard Terapis, terapis dapat menyusun program dan mengikuti kemajuan tanpa menunggu kunjungan berikutnya.',
        teksEn: 'On the Therapist Dashboard, the therapist can set the programme and follow progress without waiting for the next visit.',
      },
    ],
    diLayar: 'Dashboard Terapis (Prototype, Demo), halaman Pak Budi: grafik Kepatuhan 7 hari terakhir dan Resep Program; Tambah Luruskan Tungkai.',
    momen: { rel: 6, deskripsi: 'Grafik Kepatuhan 7 hari terakhir pada halaman Pak Budi di Dashboard Terapis' },
  },
  {
    id: 's22-program',
    tata: 'desktop',
    tahap: TAHAP.penutup,
    judul: 'Resep program menjadi Latihan Hari Ini',
    minimal: 12,
    layar: { kunci: 'klinisi', jenis: 'desktop', mulaiDi: 'lanjut' },
    sampaiBerkas: 25.5,
    teksLayar: { utama: 'Program terapis menjadi Latihan Hari Ini', en: "The therapist's programme becomes today's exercises" },
    narasi: [
      {
        id: 'N22',
        teksId: 'Di prototype ini, program yang disimpan terapis menjadi Latihan Hari Ini pada profil pasien tersebut.',
        ucapan: 'Di prototipe ini, program yang disimpan terapis menjadi Latihan Hari Ini pada profil pasien tersebut.',
        teksEn: "In this prototype, the programme the therapist saves becomes Today's Exercises on that patient's profile.",
      },
    ],
    diLayar: 'Simpan Resep dan pesan "Resep Pak Budi tersimpan"; Lihat sebagai pasien membuka Beranda Pak Budi yang kini memuat Luruskan Tungkai.',
    momen: { rel: 10, deskripsi: 'Beranda Pak Budi memuat Luruskan Tungkai setelah terapis menyimpan resep' },
  },
  {
    id: 's23-penutup',
    tata: 'penutup-3d',
    tahap: TAHAP.penutup,
    judul: 'Render 3D penutup: PULIHIN tidak menggantikan terapis',
    minimal: 23,
    kamera: { kunci: 'penutup', jenis: 'render3d', mulaiDi: 0 },
    karakter: true,
    teksLayar: {
      utama: 'Pendamping latihan di rumah, bukan pengganti terapis',
      en: 'A home exercise companion, not a replacement for the therapist',
      mulaiDi: 1,
    },
    narasi: [
      {
        id: 'N23a',
        teksId: 'PULIHIN tidak menggantikan terapis. PULIHIN membantu memastikan yang diajarkan terapis benar-benar dilatih di rumah.',
        ucapan: 'Pulihin tidak menggantikan terapis. Pulihin membantu memastikan, yang diajarkan terapis benar-benar dilatih di rumah.',
        teksEn: 'PULIHIN does not replace the therapist. It helps make sure that what the therapist teaches is truly practised at home.',
      },
      {
        id: 'N23b',
        teksId: `Ini masih prototype kompetisi, bukan alat kesehatan teregulasi. Coba sekarang di ${DOMAIN}.`,
        ucapan: `Ini masih prototipe kompetisi, bukan alat kesehatan teregulasi. Coba sekarang di ${ucapanDomain}.`,
        teksEn: `This is still a competition prototype, not a regulated medical device. Try it now at ${DOMAIN}.`,
      },
    ],
    diLayar: `Render 3D penutup; kalimat "Pendamping latihan di rumah, bukan pengganti terapis", lalu kartu ${DOMAIN} dan penafian prototype.`,
    momen: { rel: 14, deskripsi: `Render 3D penutup dengan kartu ${DOMAIN} dan penafian prototype` },
  },
  {
    id: 's24-layar-penutup',
    tata: 'penutup',
    tahap: TAHAP.penutup,
    judul: 'Layar penutup',
    minimal: 7,
    narasi: [],
    diLayar: `PULIHIN · ${DOMAIN} · ${SUBKATEGORI}, ${KATEGORI}${NAMA_TIM ? ` · Tim: ${NAMA_TIM}` : ''}`,
    momen: { rel: 4.5, deskripsi: `Layar penutup: PULIHIN, ${DOMAIN}, ${SUBKATEGORI}, ${KATEGORI}` },
  },
];

// ---------------------------------------------------------------------------------------------
// Perakitan: durasi dari audio terukur, jangkar dari sesi-meta, waktu absolut
// ---------------------------------------------------------------------------------------------

const JEDA_AWAL = 0.6;
const JARAK_BARIS = 0.5;
const JEDA_AKHIR = 0.9;
const MAKS_ELASTIS = 8;
/** Perkiraan tempo suara sintetis bila audio belum dibuat (karakter per detik). */
const KARAKTER_PER_DETIK = 13;

const bulat = (n: number): number => Math.round(n * 1000) / 1000;

const durasiBaris = (b: DefBaris, pembicara: Pembicara): { d: number; terukur: boolean } => {
  const d = DURASI_AUDIO[audioBaris({ id: b.id, pembicara })];
  return d !== undefined ? { d, terukur: true } : { d: Math.max(1.2, b.teksId.length / KARAKTER_PER_DETIK), terukur: false };
};

interface TataLetak {
  baris: { def: DefBaris; pembicara: Pembicara; mulai: number; selesai: number; terukur: boolean }[];
  jangkarRel: number | null;
  durasi: number;
}

/** Susun baris narasi relatif terhadap awal adegan; `jangkarMin` memaksa jangkar tidak lebih awal. */
const susun = (a: DefAdegan, jangkarMin = 0): TataLetak => {
  let kursor = JEDA_AWAL;
  let jangkarRel: number | null = typeof a.jangkar?.padaRel === 'number' ? Math.max(a.jangkar.padaRel, jangkarMin) : null;
  const baris: TataLetak['baris'] = [];
  for (const b of a.narasi) {
    const pembicara = b.pembicara ?? N;
    const { d, terukur } = durasiBaris(b, pembicara);
    let mulai = kursor;
    if (b.padaJangkar) {
      if (jangkarRel === null) throw new Error(`${a.id}: baris ${b.id} padaJangkar tanpa jangkar`);
      mulai = jangkarRel;
    }
    baris.push({ def: b, pembicara, mulai, selesai: mulai + d, terukur });
    kursor = mulai + d + JARAK_BARIS;
    const p = a.jangkar?.padaRel;
    if (p && typeof p !== 'number' && p.setelahBaris === b.id) jangkarRel = Math.max(mulai + d + p.tambah, jangkarMin);
  }
  const akhirNarasi = baris.length ? baris[baris.length - 1].selesai : 0;
  return { baris, jangkarRel, durasi: Math.max(a.minimal, akhirNarasi + JEDA_AKHIR) };
};

interface Rakitan {
  def: DefAdegan;
  tata: TataLetak;
  durasi: number;
  mulaiKamera?: number;
  mulaiLayar?: number;
}

const rakit = (): Adegan[] => {
  const akhirBerkas = new Map<string, number>();
  /** Adegan elastis terakhir per berkas (boleh diperpanjang agar adegan berjangkar bersambung). */
  const elastisTerakhir = new Map<string, Rakitan>();
  const hasil: Rakitan[] = [];

  for (const def of DEF) {
    let tata = susun(def);
    const berkasLayar = def.layar ? F[def.layar.kunci] : undefined;
    let mulaiLayar: number | undefined;
    if (def.layar && berkasLayar) {
      const sebelum = akhirBerkas.get(berkasLayar) ?? 0;
      mulaiLayar = def.layar.mulaiDi === 'lanjut' ? sebelum : def.layar.mulaiDi;
      if (def.jangkar && tata.jangkarRel !== null) {
        let m = def.jangkar.detikBerkas - tata.jangkarRel;
        if (m < sebelum) {
          // Peristiwa terjadi lebih cepat daripada narasi sebelumnya selesai: jangan memutar mundur rekaman,
          // geser jangkar ke belakang di dalam adegan ini.
          tata = susun(def, def.jangkar.detikBerkas - sebelum);
          m = sebelum;
        }
        const lentur = elastisTerakhir.get(berkasLayar);
        const celah = m - sebelum;
        if (lentur && celah > 0 && celah <= MAKS_ELASTIS && hasil[hasil.length - 1] === lentur) {
          lentur.durasi += celah;
        }
        mulaiLayar = m;
      }
    }
    let durasi = tata.durasi;
    if (def.sampaiBerkas !== undefined && mulaiLayar !== undefined) durasi = Math.max(durasi, def.sampaiBerkas - mulaiLayar);
    const r: Rakitan = { def, tata, durasi, mulaiLayar };
    if (def.kamera) {
      const bk = F[def.kamera.kunci];
      // Shot lebar sesi sinkron frame-ke-frame dengan layar-02: pakai detik yang sama.
      r.mulaiKamera =
        bk === F.sesiLebar && mulaiLayar !== undefined
          ? mulaiLayar
          : def.kamera.mulaiDi === 'lanjut'
            ? (akhirBerkas.get(bk) ?? 0)
            : def.kamera.mulaiDi;
    }
    hasil.push(r);
    // Durasi bisa bertambah (elastis) setelah ini; akhir berkas dihitung ulang pada iterasi berikut.
    for (const x of hasil.slice(-2)) {
      if (x.def.layar && x.mulaiLayar !== undefined) akhirBerkas.set(F[x.def.layar.kunci], x.mulaiLayar + x.durasi);
      if (x.def.kamera && x.mulaiKamera !== undefined) akhirBerkas.set(F[x.def.kamera.kunci], x.mulaiKamera + x.durasi);
    }
    if (berkasLayar) {
      if (def.elastis) elastisTerakhir.set(berkasLayar, r);
      else elastisTerakhir.delete(berkasLayar);
    }
  }

  let t = 0;
  return hasil.map(({ def, tata, durasi, mulaiKamera, mulaiLayar }) => {
    const mulai = bulat(t);
    const selesai = bulat(t + durasi);
    t = selesai;
    const slot = (s: DefSlot | undefined, m: number | undefined): SlotRekaman | undefined =>
      s && m !== undefined ? { berkas: F[s.kunci], jenis: s.jenis, rekam: REKAM[s.kunci], mulaiDi: bulat(m) } : undefined;
    const momenRel =
      def.momen?.dariJangkar !== undefined && tata.jangkarRel !== null
        ? tata.jangkarRel + def.momen.dariJangkar
        : (def.momen?.rel ?? durasi / 2);
    return {
      id: def.id,
      mulai,
      selesai,
      tata: def.tata,
      tahap: def.tahap,
      judul: def.judul,
      kamera: slot(def.kamera, mulaiKamera),
      layar: slot(def.layar, mulaiLayar),
      teksLayar: def.teksLayar,
      data: def.data,
      sorot: def.sorot,
      narasi: tata.baris.map((b) => ({
        id: b.def.id,
        pembicara: b.pembicara,
        teksId: b.def.teksId,
        teksEn: b.def.teksEn,
        ucapan: b.def.ucapan ?? b.def.teksId,
        mulai: bulat(mulai + b.mulai),
        selesai: bulat(mulai + b.selesai),
        terukur: b.terukur,
      })),
      diLayar: def.diLayar,
      momen: def.momen ? { detik: bulat(mulai + Math.min(momenRel, durasi - 0.2)), deskripsi: def.momen.deskripsi } : undefined,
      karakter: def.karakter === true,
      catatan: def.catatan,
    };
  });
};

export const ADEGAN: Adegan[] = rakit();

export const TOTAL_DETIK = ADEGAN[ADEGAN.length - 1].selesai;
export const TOTAL_FRAME = Math.round(TOTAL_DETIK * FPS);

export const keFrame = (detik: number): number => Math.round(detik * FPS);

/** Semua slot rekaman unik (berkas) beserta adegan yang memakainya. */
export const daftarSlot = (): { berkas: string; slot: SlotRekaman; adegan: Adegan[] }[] => {
  const peta = new Map<string, { berkas: string; slot: SlotRekaman; adegan: Adegan[] }>();
  for (const a of ADEGAN) {
    for (const s of [a.kamera, a.layar]) {
      if (!s) continue;
      const ada = peta.get(s.berkas);
      if (ada) ada.adegan.push(a);
      else peta.set(s.berkas, { berkas: s.berkas, slot: s, adegan: [a] });
    }
  }
  return [...peta.values()];
};

/** Adegan yang tampil pada detik tertentu. */
export const adeganPada = (detik: number): Adegan =>
  ADEGAN.find((a) => detik >= a.mulai && detik < a.selesai) ?? ADEGAN[ADEGAN.length - 1];

/** Nama berkas still untuk audit jeda: out/stills/t080-s10-lima.png. */
export const namaStill = (detik: number): string =>
  `t${String(Math.floor(detik)).padStart(3, '0')}-${adeganPada(detik).id}.png`;

/** Baris narasi yang dibacakan narator (suara aplikasi tidak dihitung dalam batas kata). */
export const dibacakan = (b: BarisNarasi): boolean => b.pembicara === 'Narator (suara sintetis)';

/** Semua baris narasi beserta adegannya, untuk generator audio. */
export const semuaBaris = (): BarisNarasi[] => ADEGAN.flatMap((a) => a.narasi);
