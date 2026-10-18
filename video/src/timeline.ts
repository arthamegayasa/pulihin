/**
 * Timeline video demo PULIHIN: SATU-SATUNYA sumber kebenaran.
 *
 * Dipakai oleh komposisi Remotion (src/PulihinDemo.tsx, src/suara.ts), generator narasi (scripts/narasi.mjs),
 * subtitle, naskah, dan daftar produksi (scripts/build-srt.mjs), pemindai (scripts/scan-footage.mjs),
 * dan perender still (scripts/stills.mjs).
 *
 * Produksi: adegan pasien dan keluarga = video AI (HeyGen), diberi label setiap kali orang AI terlihat; layar
 * aplikasi = rekaman ASLI aplikasi produksi (sesi kamera: video POV AI diputar sebagai kamera Chrome, hitungan
 * dan koreksi dihasilkan aplikasi); suara aplikasi = klip asli aplikasi pada detik yang tercatat saat merekam;
 * narasi = ElevenLabs Eleven v4 (OpenRouter); musik = Google Lyria 3 Pro. Tanpa dokter, tanpa presenter AI.
 *
 * Waktu TIDAK ditulis tangan. Setiap adegan punya durasi minimal; panjang sebenarnya mengikuti durasi audio narasi
 * terukur (src/terukur.ts, ditulis `npm run scan`). Narasi tidak pernah menimpa suara aplikasi yang penting:
 * baris narasi digeser ke sesudah klip itu. Adegan sesi kamera dijangkarkan pada peristiwa aplikasi asli di
 * `video/data/sesi-meta.json` dan `video/data/suara-aplikasi.json`.
 * Alur: ubah teks di sini -> `npm run narasi` -> `npm run scan` -> `npm run srt`.
 *
 * Hanya mengimpor `src/config/identitas.ts` milik aplikasi dan berkas TS hasil pemindai, dan hanya memakai
 * sintaks TypeScript yang dapat dihapus, supaya Node 22+ dapat memuatnya langsung.
 */

import { HOST_PUBLIK, IDENTITAS } from '../../src/config/identitas.ts';
import type { KlipTercatat, SesiMeta } from './sesi-meta-tipe.ts';
import { DURASI_AUDIO, DURASI_FOOTAGE, KETUKAN, SESI_META, SUARA_APLIKASI } from './terukur.ts';

export const FPS = 30;
export const LEBAR = 1920;
export const TINGGI = 1080;

/** Durasi crossfade antar adegan (frame). */
export const FADE_FRAME = 18;

/**
 * Alamat yang ditampilkan dan diucapkan: domain final hanya bila `urlPublik` sudah mengarah ke sana,
 * selain itu host yang saat ini benar-benar aktif (src/config/identitas.ts).
 */
export const DOMAIN = HOST_PUBLIK;
export const DOMAIN_FINAL = IDENTITAS.domain;
export const NAMA_TIM: string | null = IDENTITAS.namaTim;
export const KATEGORI = '.id Developer Day Indonesia 2026';
export const SUBKATEGORI = 'Health and Wellbeing';
export const LABEL_AI = 'Adegan dibuat dengan AI, bukan pasien sungguhan';
export const LABEL_AI_EN = 'AI-generated scene, not a real patient';

/**
 * Suara narator Eleven v4 (OpenRouter). Dipilih lewat audisi banding 6 suara (george, brian, daniel, bill,
 * roger, callum) pada 3 baris naskah asli, juri audio merangking dalam beberapa urutan: daniel terbaik
 * gabungan. Suara pria, jelas berbeda dari suara aplikasi (Matilda, wanita).
 */
export const NARATOR_SUARA = 'daniel';

/** Narasi per baris: public/audio/narasi/<id>.mp3. */
export const audioBaris = (b: { id: string }): string => `audio/narasi/${b.id}.mp3`;

/** Klip suara aplikasi (salinan berwarna speaker ponsel dari public/suara/ aplikasi, dibuat `npm run scan`). */
export const audioAplikasi = (klip: string): string => `audio/aplikasi/${klip}`;

/** SFX siap pakai (video/public/audio/sfx). Tidak ada bunyi per repetisi: aplikasi menghitung dengan suaranya sendiri. */
export const SFX = {
  ketuk: 'audio/sfx/ketuk.mp3',
  suasana: 'audio/sfx/suasana-rumah.mp3',
  transisi: 'audio/sfx/transisi.mp3',
} as const;

/** 'data' = tipografi data bersumber di atas video AI tanpa orang; 'judul' = video AI + judul. */
export type Tata = 'data' | 'judul' | 'broll' | 'ponsel' | 'desktop' | 'split' | 'penutup-ai' | 'penutup';

export const NARATOR = 'Narator (suara sintetis)';

export interface SlotRekaman {
  /** Nama berkas di video/public/footage/. */
  berkas: string;
  /** ai = video AI (HeyGen); layar = rekaman layar ponsel; desktop = rekaman layar 1920x1080. */
  jenis: 'ai' | 'layar' | 'desktop';
  /** Apa yang harus ada di berkas (daftar produksi dan kartu placeholder). */
  rekam: string;
  /** Detik di dalam berkas tempat adegan ini mulai diambil. */
  mulaiDi: number;
  /** Laju putar (gerak lambat halus untuk video AI); 1 = normal. */
  laju: number;
}

export interface BarisNarasi {
  id: string;
  /** Teks Indonesia (naskah, subtitle ID). Angka boleh berupa angka. */
  teksId: string;
  teksEn: string;
  /** Teks yang diucapkan TTS bila berbeda (angka dieja, nama dibaca sebagai satu kata). */
  ucapan: string;
  /** Tag nada Eleven v4 (tanpa kurung), bawaan 'warmly'. */
  nada?: string;
  /** Waktu bicara absolut (detik), dari durasi audio terukur. */
  mulai: number;
  selesai: number;
  /** true bila durasi berasal dari audio terukur, false bila masih perkiraan. */
  terukur: boolean;
}

/**
 * Suara di dalam adegan selain narasi: klip aplikasi asli, atau suara video AI (diputar sepanjang adegan agar
 * sinkron bibir; `ucapan` = rentang kata yang diucapkan).
 */
export interface SuaraAdegan {
  /** Jalur relatif public/. */
  src: string;
  sumber: 'aplikasi' | 'ai';
  /** Detik absolut mulai diputar. */
  mulai: number;
  /** Lama diputar (detik); klip aplikasi yang disela aplikasi lebih pendek dari klipnya. */
  lama: number;
  /** Posisi awal di dalam berkas sumber (detik). */
  mulaiKlip: number;
  /** Rentang absolut isi yang diucapkan (subtitle, penghalang narasi). */
  ucapan: [number, number];
  teks: string;
  teksEn: string | null;
  /** Penting = narasi tidak boleh menimpa (semua selain hitungan repetisi). */
  penting: boolean;
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
  suara: SuaraAdegan[];
  diLayar: string;
  momen?: { detik: number; deskripsi: string };
  /** Orang buatan AI terlihat (video AI atau kamera aplikasi): label wajib tampil. */
  ai: boolean;
  catatan?: string;
}

export const TAHAP = {
  masalah: 'Masalah di rumah',
  tugasKecil: 'Satu gerakan kecil',
  sesiPenuh: 'Satu sesi utuh',
  keluarga: 'Keluarga dan bicara',
  penutup: 'Terapis dan penutup',
} as const;

// ---------------------------------------------------------------------------------------------
// Rekaman
// ---------------------------------------------------------------------------------------------

const F = {
  pagi: 'ai-01-pagi.mp4',
  kertas: 'ai-02-kertas.mp4',
  ragu: 'ai-03-ragu.mp4',
  pasang: 'ai-04-pasang-ponsel.mp4',
  latihanLebar: 'ai-05-latihan-lebar.mp4',
  rina: 'ai-06-rina.mp4',
  bicara: 'ai-07-bicara.mp4',
  penutup: 'ai-08-penutup.mp4',
  berandaDetail: 'layar-01-beranda-detail.mp4',
  sesiLayar: 'layar-02-sesi-tekuk-siku.mp4',
  ringkasan: 'layar-03-ringkasan-beranda.mp4',
  keluarga: 'layar-04-keluarga.mp4',
  afasiaLayar: 'layar-05-afasia.mp4',
  klinisi: 'layar-06-klinisi.mp4',
} as const;

/** Audio ucapan asli video AI ai-07 (Pak Budi menyebut kata latihan), dipakai pada adegan bicara. */
export const SUARA_AI07 = 'ai-07-bicara.wav';

const REKAM: Record<keyof typeof F, string> = {
  pagi: 'Video AI tanpa orang: ruang tamu Indonesia hangat di cahaya pagi, kursi kayu kosong, monstera, dorongan kamera pelan (latar tipografi data).',
  kertas: 'Video AI: tangan Pak Budi meletakkan lembar latihan rumah (diagram sederhana, tanpa teks terbaca) di meja jati.',
  ragu: 'Video AI: Pak Budi di sofa memegang lembar latihan, tampak ragu, mencoba mengangkat lengan.',
  pasang: 'Video AI: Pak Budi memasang ponsel di tripod kecil di meja (layar tidak terbaca), lalu duduk di kursi kayu menghadapnya.',
  latihanLebar: 'Video AI lebar tiga perempat: Pak Budi menekuk siku kanan pelan, ponsel di tripod di latar depan (layar tidak terbaca).',
  rina: 'Video AI: Rina (putrinya, berhijab) di tempat lain memeriksa ponsel dan tersenyum lega (layar tidak terlihat).',
  bicara: 'Video AI: meja makan, ponsel bersandar; Pak Budi mendengarkan lalu menyebut kata latihan dengan jelas, Rina tersenyum (audio di ai-07-bicara.wav).',
  penutup: 'Video AI: Pak Budi dan Rina santai di sofa, tersenyum, ponsel di meja, cahaya hangat, kamera mundur pelan.',
  berandaDetail: 'Beranda Pak Budi sebelum latihan, ketuk Tekuk Siku, Detail Latihan dengan contoh gerakan 3D, gulir ke Letak ponsel.',
  sesiLayar:
    'Rekaman layar aplikasi ASLI saat video POV AI diputar sebagai kamera Chrome: Siap, skeleton, hitungan sampai 10 kali, satu koreksi "Rilekskan bahu, turunkan bahu Anda" dari gerak bahu di video, suara aplikasi tercatat.',
  ringkasan: 'Ringkasan Sesi Tekuk Siku, Rincian skor, saran dan kalimat bukan diagnosis, Kembali ke Beranda (Tekuk Siku selesai).',
  keluarga: 'Untuk Keluarga: status hari ini, tanda perlu perhatian, sesi terjadwal 7 hari, tren skor 14 hari, Salin Ringkasan Mingguan.',
  afasiaLayar: 'Latihan Bicara, Mode Latihan Mandiri, Benda di Rumah, Dengar (suara aplikasi), Sudah Benar, "Benar!", Kata Berikutnya.',
  klinisi: 'Desktop 1920x1080: Dashboard Terapis, Pak Budi, Tambah Luruskan Tungkai, Simpan Resep, Lihat sebagai pasien.',
};

/** Slot yang dibuat `npm run rekam-layar` / `npm run rekam-sesi` dari aplikasi produksi. */
export const OTOMATIS: Record<string, true> = {
  [F.berandaDetail]: true,
  [F.sesiLayar]: true,
  [F.ringkasan]: true,
  [F.keluarga]: true,
  [F.afasiaLayar]: true,
  [F.klinisi]: true,
};

/**
 * Bila sesi-meta.json belum ada: perkiraan dari uji POV (hanya untuk draf).
 * Draf dengan perkiraan ini tidak boleh menjadi versi final (build-srt memberi peringatan).
 */
const PERKIRAAN_SESI: SesiMeta = {
  fps: 30,
  durasiDetik: 48,
  berkas: { layar: F.sesiLayar },
  kameraMulaiDetik: 5.4,
  siapDetik: 7.2,
  repetisiDetik: [9.3, 11.8, 15.1, 19.2, 22.7, 25.4, 31.2, 34.7, 39.4, 42.0],
  koreksi: [{ teks: 'Rilekskan bahu, turunkan bahu Anda', mulaiDetik: 28.8, selesaiDetik: 30.5 }],
  selesaiDetik: 42.0,
  ringkasanDetik: 43.9,
};
export const SESI: SesiMeta = SESI_META ?? PERKIRAAN_SESI;
export const SESI_TERUKUR = SESI_META !== null;
const KOREKSI = SESI.koreksi[0];
/**
 * Panjang video POV (D:/Temp/pulihin-video/pov/pov-tekuk-siku.y4m, 30,13 dtk). Kamera palsu Chrome mengulangnya
 * dari awal setelah itu; titik ulang di layar-02 (kameraMulaiDetik + DURASI_POV) tidak boleh terlihat.
 */
export const DURASI_POV = 30.13;

/** Klip suara aplikasi yang tercatat per rekaman (kosong bila rekaman belum dibuat ulang dengan pencatat). */
export const klipTercatat = (berkas: string): KlipTercatat[] => SUARA_APLIKASI[berkas] ?? [];

const HITUNGAN = /^(nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas)( (belas|puluh))?( \w+)?\.$/i;
/** Hitungan repetisi = tidak penting (boleh di bawah narasi, dikecilkan); selain itu narasi menunggu. */
export const klipPenting = (teks: string | null): boolean => teks !== null && !HITUNGAN.test(teks.trim());

/** Detik klip hitungan `n` di layar-02 (suara aplikasi), atau detik angka berubah bila suara belum tercatat. */
const detikHitungan = (n: number): number => {
  const kata = ['', 'Satu.', 'Dua.', 'Tiga.', 'Empat.', 'Lima.', 'Enam.', 'Tujuh.', 'Delapan.', 'Sembilan.', 'Sepuluh.'][n];
  return klipTercatat(F.sesiLayar).find((k) => k.teks === kata)?.detik ?? SESI.repetisiDetik[n - 1];
};
/** Detik suara koreksi bahu (atau detik pesan tampil). */
const detikKoreksi = (): number =>
  klipTercatat(F.sesiLayar).find((k) => k.teks?.startsWith('Rilekskan bahu'))?.detik ?? KOREKSI.mulaiDetik;

/**
 * Terjemahan subtitle untuk suara aplikasi yang penting dan ucapan di video AI. build-srt gagal bila ada klip
 * penting yang belum diterjemahkan.
 */
export const TERJEMAHAN_SUARA: Record<string, string> = {
  'Posisikan tubuh Anda di dalam bingkai.': 'Position your body inside the frame.',
  'Tubuh terdeteksi. Siap. Silakan mulai pelan-pelan.': 'Body detected. Ready. Start slowly.',
  'Tubuh terdeteksi. Ingat, berhenti bila terasa nyeri atau pusing. Silakan mulai pelan-pelan.':
    'Body detected. Remember, stop if you feel pain or dizziness. Start slowly.',
  'Rilekskan bahu, turunkan bahu Anda.': 'Relax your shoulder, lower your shoulder.',
  'Hebat! Target tercapai.': 'Great! Target reached.',
  'Benar! Bagus sekali.': 'Correct! Very good.',
  sabun: 'sabun (soap)',
  'Cuci tangan pakai sabun.': 'Wash your hands with soap.',
  Sabun: 'Sabun (soap).',
};

/**
 * Ucapan Pak Budi di ai-07-bicara (detik di dalam klip, dari FootageAI): satu kata latihan. Narasi menunggu
 * ucapan ini, dan adegan bicara menempatkan klip agar kata itu terdengar sesudah contoh dari aplikasi.
 */
export const UCAPAN_AI07 = { detik: 5.02, lama: 1.4, teks: 'Sabun' };

// ---------------------------------------------------------------------------------------------
// Definisi adegan (durasi minimal; panjang sebenarnya dihitung dari audio)
// ---------------------------------------------------------------------------------------------

interface DefSlot {
  kunci: keyof typeof F;
  jenis: SlotRekaman['jenis'];
  /** Angka = detik tetap; 'lanjut' = tepat setelah adegan sebelumnya yang memakai berkas sama. */
  mulaiDi: number | 'lanjut';
  laju?: number;
}

interface DefBaris {
  id: string;
  teksId: string;
  teksEn: string;
  ucapan?: string;
  nada?: string;
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
  ai?: boolean;
  /** Narasi mulai paling cepat pada detik ini (relatif adegan). */
  narasiMulai?: number;
  /**
   * Kunci adegan pada peristiwa aplikasi asli: detik `detikBerkas` di berkas layar tampil pada detik relatif
   * `padaRel` (angka, atau sesudah baris tertentu selesai + `tambah`).
   */
  jangkar?: { detikBerkas: number; padaRel: number | { setelahBaris: string; tambah: number } };
  /** Adegan berlangsung minimal sampai detik ini di berkas layar. */
  sampaiBerkas?: number;
  /** Boleh diperpanjang (maks. 8 dtk) supaya adegan berjangkar berikutnya bersambung tanpa lompatan. */
  elastis?: boolean;
  /** Ucapan di video AI kamera: detik di klip (dipakai sebagai suara adegan dan penghalang narasi). */
  ucapanKamera?: { src: string; detik: number; lama: number; teks: string };
  /** Pilih titik mulai video AI agar ucapannya terdengar `jeda` detik sebelum ketukan ke-`ketukan` di rekaman layar. */
  kataSebelumKetukan?: { ketukan: number; jeda: number };
  /** Momen screenshot: detik relatif adegan, atau relatif jangkar. Bawaan: tengah adegan. */
  momen?: { rel?: number; dariJangkar?: number; deskripsi: string };
  catatan?: string;
}

const ucapanDomain = DOMAIN.split('.').join(' titik ');

const DEF: DefAdegan[] = [
  {
    id: 's01-fakta-kematian',
    tata: 'data',
    tahap: TAHAP.masalah,
    judul: 'Data: stroke dan kematian',
    minimal: 7,
    kamera: { kunci: 'pagi', jenis: 'ai', mulaiDi: 0, laju: 0.9 },
    narasiMulai: 1.2,
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
        nada: 'calmly',
        teksId: 'Menurut Kementerian Kesehatan, stroke menyebabkan 18,5 persen kematian di Indonesia.',
        ucapan: 'Menurut Kementerian Kesehatan, stroke menyebabkan delapan belas koma lima persen kematian di Indonesia.',
        teksEn: 'According to the Ministry of Health, stroke causes 18.5 percent of deaths in Indonesia.',
      },
    ],
    diLayar: 'Ruang tamu pagi (video AI tanpa orang); angka besar 18,5% menghitung naik, "kematian di Indonesia disebabkan stroke", "dan 11,2% dari total kecacatan", label sumber Kemenkes.',
    momen: { rel: 5, deskripsi: 'Angka 18,5% dengan label sumber Kemenkes' },
  },
  {
    id: 's02-fakta-kontrol',
    tata: 'data',
    tahap: TAHAP.masalah,
    judul: 'Data: kontrol rutin',
    minimal: 6,
    kamera: { kunci: 'pagi', jenis: 'ai', mulaiDi: 'lanjut', laju: 0.9 },
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
        nada: 'calmly',
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
    minimal: 7,
    kamera: { kunci: 'pagi', jenis: 'ai', mulaiDi: 'lanjut', laju: 0.9 },
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
        nada: 'calmly',
        teksId: 'Tenaga terapi pun terbatas: hanya 926 tenaga keterapian fisik di lebih dari 10.000 puskesmas.',
        ucapan: 'Tenaga terapi pun terbatas: hanya sembilan ratus dua puluh enam tenaga keterapian fisik, di lebih dari sepuluh ribu puskesmas.',
        teksEn: 'Therapists are scarce too: only 926 physical therapy staff across more than 10,000 community health centres.',
      },
    ],
    diLayar: 'Angka besar 926 "tenaga keterapian fisik di 10.180 puskesmas", label sumber Profil Kesehatan Indonesia 2023.',
    momen: { rel: 5, deskripsi: 'Angka 926 tenaga keterapian fisik di 10.180 puskesmas, dengan label sumber' },
  },
  {
    id: 's04-kertas',
    tata: 'judul',
    tahap: TAHAP.masalah,
    judul: 'Video AI: lembar latihan di meja, judul PULIHIN',
    minimal: 6,
    kamera: { kunci: 'kertas', jenis: 'ai', mulaiDi: 0, laju: 0.85 },
    ai: true,
    narasi: [
      {
        id: 'N04',
        nada: 'thoughtfully',
        teksId: 'Sepulang dari rumah sakit, program latihan sering hanya berupa selembar kertas.',
        teksEn: 'After leaving hospital, the exercise programme is often just a sheet of paper.',
      },
    ],
    diLayar: 'Video AI: tangan meletakkan lembar latihan di meja jati; judul PULIHIN, Pendamping Rehabilitasi Stroke di Rumah.',
  },
  {
    id: 's05-ragu',
    tata: 'broll',
    tahap: TAHAP.masalah,
    judul: 'Video AI: Pak Budi ragu, kalimat masalah',
    minimal: 8,
    kamera: { kunci: 'ragu', jenis: 'ai', mulaiDi: 0, laju: 0.9 },
    ai: true,
    teksLayar: { utama: 'Di rumah, pendampingan terputus', en: 'At home, guidance breaks off', mulaiDi: 1.4 },
    narasi: [
      {
        id: 'N05',
        nada: 'thoughtfully',
        teksId: 'Di rumah, pertanyaannya sederhana tetapi berat: apakah gerakannya sudah benar? Di situlah pendampingan sering terputus.',
        teksEn: 'At home, the question is simple but heavy: am I doing this right? That is where guidance often breaks off.',
      },
    ],
    diLayar: 'Video AI: Pak Budi di sofa memegang lembar latihan, ragu mencoba mengangkat lengan; kalimat masalah tampil besar.',
    momen: { rel: 5, deskripsi: 'Kalimat masalah "Di rumah, pendampingan terputus" di atas video AI berlabel' },
  },
  {
    id: 's06-beranda',
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Beranda: Latihan Hari Ini',
    minimal: 9,
    layar: { kunci: 'berandaDetail', jenis: 'layar', mulaiDi: 0 },
    teksLayar: { utama: 'Ponsel biasa menjadi pendamping latihan', en: 'An ordinary phone becomes an exercise companion' },
    sorot: { label: 'Latihan Hari Ini', ke: 0.34 },
    narasi: [
      {
        id: 'N06',
        teksId: 'Dengan PULIHIN, ponsel biasa menjadi pendamping latihan di rumah. Begitu dibuka, Latihan Hari Ini langsung terlihat, berhuruf besar.',
        ucapan: 'Dengan Pulihin, ponsel biasa menjadi pendamping latihan di rumah. Begitu dibuka, Latihan Hari Ini langsung terlihat, berhuruf besar.',
        teksEn: "With PULIHIN, an ordinary phone becomes a home exercise companion. Open it, and Today's Exercises are right there, in large type.",
      },
    ],
    diLayar: 'Beranda Pak Budi (Demo): "Selamat pagi, Pak Budi", Latihan Hari Ini berhuruf besar (0 dari 4 latihan selesai), tombol Mulai: Tekuk Siku.',
    momen: { rel: 5, deskripsi: 'Beranda: Latihan Hari Ini berhuruf besar' },
  },
  {
    id: 's07-detail',
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Detail Latihan: contoh gerakan 3D',
    minimal: 10,
    layar: { kunci: 'berandaDetail', jenis: 'layar', mulaiDi: 'lanjut' },
    teksLayar: { utama: 'Mulai dari satu gerakan kecil', en: 'Start with one small movement' },
    sorot: { label: 'Contoh gerakan 3D', ke: 0.3, mulaiDi: 1.2 },
    narasi: [
      {
        id: 'N07',
        teksId: 'Kita mulai dari satu gerakan kecil: Tekuk Siku. Contoh gerakan tiga dimensi memperlihatkan iramanya, lengkap dengan pesan keselamatan.',
        teksEn: 'We start with one small movement: Elbow Flexion. A 3D demonstration shows its rhythm, together with a safety notice.',
      },
    ],
    diLayar: 'Ketuk Tekuk Siku; Detail Latihan dengan contoh gerakan 3D yang bergerak, irama "sekitar 3 detik tiap gerakan", pesan "Berhenti bila nyeri, pusing, atau sesak" di atas tombol Mulai dengan Kamera.',
    momen: { rel: 6, deskripsi: 'Detail Latihan: contoh gerakan 3D Tekuk Siku dan pesan keselamatan' },
  },
  {
    id: 's08-pasang',
    tata: 'split',
    tahap: TAHAP.tugasKecil,
    judul: 'Video AI: memasang ponsel; Letak ponsel di aplikasi',
    minimal: 9,
    kamera: { kunci: 'pasang', jenis: 'ai', mulaiDi: 0, laju: 0.85 },
    layar: { kunci: 'berandaDetail', jenis: 'layar', mulaiDi: 'lanjut' },
    ai: true,
    teksLayar: { utama: 'Ponsel tegak di meja, ± 1 meter', en: 'Phone upright on a table, about 1 metre away' },
    sorot: { label: 'Letak ponsel', ke: 0.4, mulaiDi: 1.6 },
    narasi: [
      {
        id: 'N08',
        teksId: 'Aplikasi menunjukkan letak ponsel: tegak di meja, sekitar satu meter di depan kursi. Pak Budi di video ini adalah adegan buatan AI.',
        teksEn: 'The app shows where the phone goes: upright on a table, about one metre from the chair. Pak Budi in this video is an AI-generated scene.',
      },
    ],
    diLayar: 'Kiri: video AI Pak Budi memasang ponsel di tripod lalu duduk (berlabel AI). Kanan: Detail Latihan digulir ke Letak ponsel (1 m, ponsel tepat di depan).',
    momen: { rel: 6, deskripsi: 'Letak ponsel di aplikasi berdampingan dengan video AI berlabel' },
  },
  {
    id: 's09-mulai',
    tata: 'split',
    tahap: TAHAP.tugasKecil,
    judul: 'Sesi kamera: mulai, Siap, skeleton',
    minimal: 10,
    kamera: { kunci: 'latihanLebar', jenis: 'ai', mulaiDi: 0 },
    layar: { kunci: 'sesiLayar', jenis: 'layar', mulaiDi: Math.max(0, (KETUKAN[F.sesiLayar]?.[0] ?? 5) - 4.2) },
    ai: true,
    elastis: true,
    teksLayar: { utama: 'Diproses di perangkat', en: 'Processed on the device · camera video is not uploaded' },
    sorot: { label: 'Titik tubuh', ke: 0.42, mulaiDi: 4 },
    narasi: [
      {
        id: 'N09a',
        teksId: 'Video kamera ini pun buatan AI, diputar ke aplikasi yang asli.',
        teksEn: 'This camera video is AI-generated too, played into the real app.',
      },
      {
        id: 'N09b',
        teksId: 'Titik-titik tubuh dibaca langsung di perangkat, tanpa mengunggah video.',
        teksEn: 'Body landmarks are read right on the device, without uploading video.',
      },
    ],
    diLayar: 'Kiri: video AI lebar Pak Budi berlatih (berlabel AI). Kanan: Mulai dengan Kamera diketuk, aplikasi asli mendeteksi tubuh dari video POV AI, skeleton tampil, suara aplikasi "Tubuh terdeteksi. Siap."',
    momen: { rel: 8, deskripsi: 'Skeleton di layar ponsel dengan video kamera AI berlabel' },
    catatan: 'Narasi menunggu suara aplikasi "Tubuh terdeteksi..." selesai (tidak menimpa).',
  },
  {
    id: 's10-lima',
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Sesi kamera: hitungan lima',
    minimal: 5,
    layar: { kunci: 'sesiLayar', jenis: 'layar', mulaiDi: 'lanjut' },
    ai: true,
    elastis: true,
    jangkar: { detikBerkas: detikHitungan(5), padaRel: { setelahBaris: 'N10', tambah: 0.15 } },
    teksLayar: { utama: 'Setiap repetisi lengkap dihitung', en: 'Every complete repetition is counted' },
    sorot: { label: 'Hitungan repetisi', ke: 0.86 },
    narasi: [{ id: 'N10', teksId: 'Dengarkan, aplikasinya menghitung.', teksEn: 'Listen: the app is counting.' }],
    diLayar: 'Aplikasi asli menaikkan hitungan menjadi 5 dan mengucapkan "Lima" dengan suaranya sendiri.',
    momen: { dariJangkar: 1.0, deskripsi: 'Hitungan 5 dengan skeleton, suara aplikasi "Lima"' },
  },
  {
    id: 's11-koreksi',
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Koreksi form: bahu terangkat',
    minimal: 4,
    layar: { kunci: 'sesiLayar', jenis: 'layar', mulaiDi: 'lanjut' },
    ai: true,
    jangkar: { detikBerkas: detikKoreksi(), padaRel: { setelahBaris: 'N11a', tambah: 0.4 } },
    // Pesan dan suara koreksi tampil utuh di ponsel.
    sampaiBerkas: detikKoreksi() + 3.4,
    teksLayar: { utama: 'Koreksi saat bahu terangkat', en: 'A correction when the shoulder rises' },
    sorot: { label: 'Koreksi form', ke: 0.73 },
    narasi: [{ id: 'N11a', nada: 'calmly', teksId: 'Sekarang bahunya ikut terangkat.', teksEn: 'Now the shoulder hikes up.' }],
    diLayar: `Pak Budi (video kamera AI) mengangkat bahu; pesan koreksi "${KOREKSI.teks}" muncul di atas skeleton dan aplikasi mengucapkannya dengan klip suaranya sendiri.`,
    momen: { dariJangkar: 1.2, deskripsi: `Pesan koreksi "${KOREKSI.teks}" di atas skeleton` },
    catatan:
      'Adegan terpenting. Koreksi muncul karena aplikasi asli memproses video POV AI (kamera palsu Chrome); tidak ada teks atau suara yang ditempel saat menyunting. Suara = klip aplikasi pada detik yang tercatat.',
  },
  {
    id: 's12-lebar',
    tata: 'broll',
    tahap: TAHAP.sesiPenuh,
    judul: 'Video AI lebar: latihan berlanjut (melewati titik ulang video kamera)',
    minimal: 4,
    kamera: { kunci: 'latihanLebar', jenis: 'ai', mulaiDi: 2.5 },
    // Rekaman layar tetap berjalan (tidak tampil) agar suara aplikasi tetap pada detiknya; adegan ini menutupi
    // titik ulang video POV di layar-02 sehingga lompatan gambar kamera tidak pernah terlihat.
    layar: { kunci: 'sesiLayar', jenis: 'layar', mulaiDi: 'lanjut' },
    sampaiBerkas: SESI.kameraMulaiDetik + DURASI_POV + 1.0,
    ai: true,
    teksLayar: { utama: 'Diingatkan langsung, dalam Bahasa Indonesia', en: 'Reminded right away, in Indonesian', mulaiDi: 0.6 },
    narasi: [
      {
        id: 'N11b',
        teksId: 'Aplikasi langsung mengingatkan, dengan suara dan teks besar.',
        teksEn: 'The app reminds him right away, by voice and in large text.',
      },
    ],
    diLayar: 'Video AI lebar Pak Budi melanjutkan latihan (berlabel AI); suara hitungan aplikasi tetap terdengar pada detik aslinya.',
  },
  {
    id: 's13-sepuluh',
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Sesi berlanjut sampai 10 kali, target tercapai',
    minimal: 3,
    layar: { kunci: 'sesiLayar', jenis: 'layar', mulaiDi: 'lanjut' },
    ai: true,
    sampaiBerkas: SESI.ringkasanDetik + 2.4,
    teksLayar: { utama: 'Sampai repetisi kesepuluh', en: 'All the way to the tenth repetition' },
    sorot: { label: 'Hitungan repetisi', ke: 0.86 },
    narasi: [],
    diLayar: 'Hitungan 9 dan 10 dengan suara aplikasi, "Hebat! Target tercapai.", lalu Ringkasan sesi. Tanpa narasi.',
  },
  {
    id: 's14-ringkasan',
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Ringkasan Sesi: skor',
    minimal: 11,
    layar: { kunci: 'ringkasan', jenis: 'layar', mulaiDi: 0 },
    teksLayar: {
      utama: 'Skor dan ringkasan sederhana',
      en: 'A score and a simple summary',
      keterangan: 'Perlu Pendampingan · Berkembang · Baik · Sangat Baik',
    },
    sorot: { label: 'Skor sesi', ke: 0.36 },
    narasi: [
      {
        id: 'N14',
        teksId: 'Di akhir sesi ada skor dan ringkasan sederhana: jumlah repetisi dan durasi, dengan label yang mudah dipahami.',
        teksEn: 'At the end of the session there is a score and a simple summary: repetitions and duration, with labels that are easy to understand.',
      },
    ],
    diLayar: 'Ringkasan Sesi: cincin skor dengan label, Repetisi 10 / 10, Durasi; lalu Rincian skor.',
    momen: { rel: 5, deskripsi: 'Skor sesi dengan label, repetisi, dan durasi' },
  },
  {
    id: 's15-batasan',
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Ringkasan Sesi: saran dan kalimat bukan diagnosis',
    minimal: 9,
    layar: { kunci: 'ringkasan', jenis: 'layar', mulaiDi: 'lanjut' },
    teksLayar: { utama: 'Satu saran, bukan diagnosis', en: 'One tip, not a diagnosis' },
    sorot: { label: 'Bukan skor klinis', ke: 0.72, mulaiDi: 3 },
    narasi: [
      {
        id: 'N15',
        teksId: 'Ada satu saran untuk sesi berikutnya, dan kalimat batasan yang selalu tampil: ini skor latihan, bukan diagnosis.',
        teksEn: 'There is one tip for the next session, and a disclaimer that always appears: this is an exercise score, not a diagnosis.',
      },
    ],
    diLayar: 'Saran untuk sesi berikutnya dan kalimat "Skor ini adalah skor latihan untuk motivasi dan pemantauan, bukan skor klinis dan bukan alat ukur diagnosis".',
  },
  {
    id: 's16-tercatat',
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Kembali ke Beranda: latihan selesai',
    minimal: 9,
    layar: { kunci: 'ringkasan', jenis: 'layar', mulaiDi: 'lanjut' },
    teksLayar: { utama: 'Latihan hari ini tercatat', en: "Today's exercise is recorded" },
    sorot: { label: 'Tekuk Siku selesai', ke: 0.42, mulaiDi: 4 },
    narasi: [
      {
        id: 'N16',
        teksId: 'Kembali ke Beranda, Tekuk Siku sudah bertanda selesai. Latihannya tercatat, dan keluarga bisa ikut melihat.',
        teksEn: 'Back on the home screen, Elbow Flexion is marked done. The exercise is recorded, and the family can see it too.',
      },
    ],
    diLayar: 'Ketuk Kembali ke Beranda; Tekuk Siku bertanda selesai beserta skor, 1 dari 4 latihan selesai.',
    momen: { rel: 6.5, deskripsi: 'Beranda: Tekuk Siku selesai beserta skornya' },
  },
  {
    id: 's17-rina',
    tata: 'broll',
    tahap: TAHAP.keluarga,
    judul: 'Video AI: Rina memeriksa ponsel',
    minimal: 7,
    kamera: { kunci: 'rina', jenis: 'ai', mulaiDi: 0, laju: 0.9 },
    ai: true,
    teksLayar: { utama: 'Keluarga tidak lagi menebak', en: 'The family no longer has to guess', mulaiDi: 1.2 },
    narasi: [
      {
        id: 'N17',
        teksId: 'Di tempat lain, Rina, putrinya, tidak perlu lagi menebak apakah ayahnya sudah berlatih.',
        teksEn: 'Elsewhere, Rina, his daughter, no longer has to guess whether her father has exercised.',
      },
    ],
    diLayar: 'Video AI: Rina (berhijab) memeriksa ponsel dan tersenyum lega (layar tidak terlihat), berlabel AI.',
    momen: { rel: 4, deskripsi: 'Video AI Rina berlabel, kalimat "Keluarga tidak lagi menebak"' },
  },
  {
    id: 's18-keluarga',
    tata: 'ponsel',
    tahap: TAHAP.keluarga,
    judul: 'Untuk Keluarga: status, tanda, grafik 7 hari',
    minimal: 12,
    layar: { kunci: 'keluarga', jenis: 'layar', mulaiDi: 0 },
    teksLayar: { utama: 'Status hari ini dan tanda perlu perhatian', en: "Today's status and attention flags" },
    sorot: { label: 'Sesi terjadwal 7 hari', ke: 0.5, mulaiDi: 7 },
    narasi: [
      {
        id: 'N18',
        teksId: 'Halaman Untuk Keluarga menunjukkan status hari ini, tanda bila latihan sempat terhenti, dan grafik tujuh hari terakhir.',
        teksEn: "The For Family page shows today's status, a flag when exercise has stopped, and a chart of the last seven days.",
      },
    ],
    diLayar: 'Untuk Keluarga: status Pak Budi hari ini, kartu tanda perlu perhatian (sempat beberapa hari tanpa latihan), lalu grafik Sesi terjadwal 7 hari.',
    momen: { rel: 9, deskripsi: 'Grafik Sesi terjadwal 7 hari di halaman Untuk Keluarga' },
  },
  {
    id: 's19-salin',
    tata: 'ponsel',
    tahap: TAHAP.keluarga,
    judul: 'Untuk Keluarga: tren skor dan salin ringkasan',
    minimal: 11,
    layar: { kunci: 'keluarga', jenis: 'layar', mulaiDi: 'lanjut' },
    teksLayar: { utama: 'Ringkasan mingguan untuk terapis', en: 'A weekly summary for the therapist' },
    sorot: { label: 'Salin Ringkasan Mingguan', ke: 0.62, mulaiDi: 6.5 },
    narasi: [
      {
        id: 'N19',
        teksId: 'Tren skor empat belas hari juga terlihat, dan ringkasan mingguan bisa disalin dengan satu ketukan untuk terapis.',
        teksEn: 'The 14-day score trend is there too, and the weekly summary can be copied with one tap for the therapist.',
      },
    ],
    diLayar: 'Tren skor 14 hari, lalu ketuk Salin Ringkasan Mingguan; konfirmasi bahwa ringkasan disalin tampil.',
    momen: { rel: 9.5, deskripsi: 'Konfirmasi setelah Salin Ringkasan Mingguan diketuk' },
  },
  {
    id: 's20-bicara',
    tata: 'ponsel',
    tahap: TAHAP.keluarga,
    judul: 'Latihan Bicara: kata, gambar, Dengar',
    minimal: 14.5,
    layar: { kunci: 'afasiaLayar', jenis: 'layar', mulaiDi: 0 },
    teksLayar: { utama: 'Latihan bicara berbahasa Indonesia', en: 'Speech practice in Indonesian' },
    sorot: { label: 'Dengar', ke: 0.62, mulaiDi: 6 },
    narasi: [
      {
        id: 'N20a',
        teksId: 'Untuk gangguan bicara atau afasia, ada Latihan Bicara berbahasa Indonesia, dengan kata-kata sehari-hari.',
        teksEn: 'For speech difficulties, or aphasia, there is Speech Practice in Indonesian, with everyday words.',
      },
      {
        id: 'N20b',
        teksId: 'Tombol Dengar memutar contohnya.',
        teksEn: 'The Listen button plays an example.',
      },
    ],
    diLayar: 'Latihan Bicara: Mode Latihan Mandiri, kategori Benda di Rumah; gambar kata besar; Dengar diketuk dan aplikasi mengucapkan kata serta kalimat contohnya.',
    momen: { rel: 8, deskripsi: 'Latihan Bicara: gambar kata besar dan tombol Dengar' },
  },
  {
    id: 's21-sebut',
    tata: 'split',
    tahap: TAHAP.keluarga,
    judul: 'Video AI: Pak Budi menyebut kata, hasil Benar',
    minimal: 7,
    kamera: { kunci: 'bicara', jenis: 'ai', mulaiDi: 0 },
    layar: { kunci: 'afasiaLayar', jenis: 'layar', mulaiDi: 'lanjut' },
    ucapanKamera: { src: `footage/${SUARA_AI07}`, ...UCAPAN_AI07 },
    // Kata di video AI terdengar 1,7 dtk sebelum ketukan kedua (Sudah Benar) di layar-05.
    kataSebelumKetukan: { ketukan: 1, jeda: 1.6 },
    ai: true,
    teksLayar: { utama: 'Diucapkan, lalu dinilai', en: 'Spoken, then scored' },
    sorot: { label: 'Benar!', ke: 0.55, mulaiDi: 5 },
    narasi: [],
    diLayar: 'Kiri: video AI Pak Budi menyebut kata latihan, Rina tersenyum (berlabel AI), suaranya terdengar. Kanan: Sudah Benar diketuk, aplikasi menampilkan dan mengucapkan "Benar!". Tanpa narasi.',
    momen: { rel: 6, deskripsi: 'Hasil "Benar!" di Latihan Bicara di samping video AI berlabel' },
  },
  {
    id: 's21b-nilai',
    tata: 'ponsel',
    tahap: TAHAP.keluarga,
    judul: 'Latihan Bicara: penilaian pendamping',
    minimal: 7,
    layar: { kunci: 'afasiaLayar', jenis: 'layar', mulaiDi: 'lanjut' },
    teksLayar: { utama: 'Pendamping menilai dengan satu ketukan', en: 'The companion scores with one tap' },
    sorot: { label: 'Hasil: Benar!', ke: 0.42, mulaiDi: 0.8 },
    narasi: [
      {
        id: 'N21',
        teksId: 'Dalam Mode Latihan Mandiri, pendamping menilai dengan satu ketukan: Sudah Benar, atau Ulangi.',
        teksEn: 'In Self-Practice Mode, the companion scores with one tap: Correct, or Repeat.',
      },
    ],
    diLayar: 'Hasil "Benar!" di Latihan Bicara, lalu Kata Berikutnya diketuk dan kata baru tampil.',
    catatan:
      'Rekaman layar memakai Mode Latihan Mandiri (pengenal suara Chrome tidak tersedia di peramban otomatis), maka narasi menyebut penilaian oleh pendamping, bukan pengenalan suara.',
  },
  {
    id: 's22-terapis',
    tata: 'desktop',
    tahap: TAHAP.penutup,
    judul: 'Dashboard Terapis: progres pasien',
    minimal: 10,
    layar: { kunci: 'klinisi', jenis: 'desktop', mulaiDi: 0 },
    teksLayar: { utama: 'Terapis menyusun program', en: 'The therapist sets the home programme' },
    narasi: [
      {
        id: 'N22',
        teksId: 'Di Dashboard Terapis, terapis menyusun program dan mengikuti kemajuan, tanpa menunggu kunjungan berikutnya.',
        teksEn: 'On the Therapist Dashboard, the therapist sets the programme and follows progress, without waiting for the next visit.',
      },
    ],
    diLayar: 'Dashboard Terapis (Prototype, Demo), halaman Pak Budi: Kepatuhan 7 hari terakhir dan Resep Program; Tambah Luruskan Tungkai.',
    momen: { rel: 6, deskripsi: 'Kepatuhan 7 hari terakhir pada halaman Pak Budi di Dashboard Terapis' },
  },
  {
    id: 's23-program',
    tata: 'desktop',
    tahap: TAHAP.penutup,
    judul: 'Resep program menjadi Latihan Hari Ini',
    minimal: 11,
    layar: { kunci: 'klinisi', jenis: 'desktop', mulaiDi: 'lanjut' },
    teksLayar: { utama: 'Program terapis menjadi Latihan Hari Ini', en: "The therapist's programme becomes today's exercises" },
    narasi: [
      {
        id: 'N23',
        teksId: 'Di prototype ini, program yang disimpan terapis langsung menjadi Latihan Hari Ini di profil pasien.',
        ucapan: 'Di prototipe ini, program yang disimpan terapis langsung menjadi Latihan Hari Ini di profil pasien.',
        teksEn: "In this prototype, the programme the therapist saves becomes Today's Exercises on the patient's profile right away.",
      },
    ],
    diLayar: 'Simpan Resep dan pesan tersimpan; Lihat sebagai pasien membuka Beranda Pak Budi yang kini memuat Luruskan Tungkai.',
    momen: { rel: 9, deskripsi: 'Beranda Pak Budi memuat Luruskan Tungkai setelah terapis menyimpan resep' },
  },
  {
    id: 's24-penutup',
    tata: 'penutup-ai',
    tahap: TAHAP.penutup,
    judul: 'Video AI penutup: PULIHIN tidak menggantikan terapis',
    minimal: 19,
    kamera: { kunci: 'penutup', jenis: 'ai', mulaiDi: 0, laju: 0.9 },
    ai: true,
    teksLayar: {
      utama: 'Pendamping latihan di rumah, bukan pengganti terapis',
      en: 'A home exercise companion, not a replacement for the therapist',
      mulaiDi: 1,
    },
    narasi: [
      {
        id: 'N24a',
        teksId: 'PULIHIN tidak menggantikan terapis. PULIHIN membantu agar yang diajarkan terapis benar-benar dilatih di rumah, bersama keluarga.',
        ucapan: 'Pulihin tidak menggantikan terapis. Pulihin membantu, agar yang diajarkan terapis benar-benar dilatih di rumah, bersama keluarga.',
        teksEn: 'PULIHIN does not replace the therapist. It helps make sure that what the therapist teaches is truly practised at home, with the family.',
      },
      {
        id: 'N24b',
        teksId: `Ini prototype kompetisi, bukan alat kesehatan teregulasi. Coba sekarang di ${DOMAIN}.`,
        ucapan: `Ini prototipe kompetisi, bukan alat kesehatan teregulasi. Coba sekarang di ${ucapanDomain}.`,
        teksEn: `This is a competition prototype, not a regulated medical device. Try it now at ${DOMAIN}.`,
      },
    ],
    diLayar: `Video AI Pak Budi dan Rina di sofa (berlabel AI); kalimat "Pendamping latihan di rumah, bukan pengganti terapis", lalu kartu ${DOMAIN} dan penafian prototype.`,
    momen: { rel: 14, deskripsi: `Video AI penutup berlabel dengan kartu ${DOMAIN} dan penafian prototype` },
  },
  {
    id: 's25-layar-penutup',
    tata: 'penutup',
    tahap: TAHAP.penutup,
    judul: 'Layar penutup dan pengungkapan',
    minimal: 8,
    narasi: [],
    diLayar: `PULIHIN · ${DOMAIN} · ${SUBKATEGORI}, ${KATEGORI}${NAMA_TIM ? ` · Tim: ${NAMA_TIM}` : ''} · pengungkapan AI (HeyGen, Eleven v4, Lyria 3) dan rekaman layar asli`,
    momen: { rel: 5, deskripsi: `Layar penutup: PULIHIN, ${DOMAIN}, kategori, pengungkapan AI` },
  },
];

// ---------------------------------------------------------------------------------------------
// Perakitan: durasi dari audio terukur, jangkar dari sesi-meta, narasi menunggu suara penting
// ---------------------------------------------------------------------------------------------

const JEDA_AWAL = 0.7;
const JARAK_BARIS = 0.55;
const JEDA_AKHIR = 1.0;
/** Jarak narasi sebelum/sesudah suara penting (detik). */
const JARAK_SUARA = 0.35;
const MAKS_ELASTIS = 8;
/** Perkiraan tempo suara sintetis bila audio belum dibuat (karakter per detik). */
const KARAKTER_PER_DETIK = 14;

const bulat = (n: number): number => Math.round(n * 1000) / 1000;

const durasiBaris = (b: DefBaris): { d: number; terukur: boolean } => {
  const d = DURASI_AUDIO[audioBaris(b)];
  return d !== undefined ? { d, terukur: true } : { d: Math.max(1.2, b.teksId.length / KARAKTER_PER_DETIK), terukur: false };
};

interface TataLetak {
  baris: { def: DefBaris; mulai: number; selesai: number; terukur: boolean }[];
  jangkarRel: number | null;
  durasi: number;
}

/**
 * Susun baris narasi relatif terhadap awal adegan; `jangkarMin` memaksa jangkar tidak lebih awal; `blokir` =
 * rentang (relatif adegan) suara penting yang tidak boleh ditimpa narasi.
 */
const susun = (a: DefAdegan, jangkarMin = 0, blokir: [number, number][] = []): TataLetak => {
  let kursor = Math.max(JEDA_AWAL, a.narasiMulai ?? 0);
  let jangkarRel: number | null = typeof a.jangkar?.padaRel === 'number' ? Math.max(a.jangkar.padaRel, jangkarMin) : null;
  const baris: TataLetak['baris'] = [];
  for (const b of a.narasi) {
    const { d, terukur } = durasiBaris(b);
    let mulai = kursor;
    for (let geser = true; geser; ) {
      geser = false;
      for (const [x, y] of blokir) {
        if (mulai < y + JARAK_SUARA && mulai + d > x - JARAK_SUARA) {
          mulai = y + JARAK_SUARA;
          geser = true;
        }
      }
    }
    baris.push({ def: b, mulai, selesai: mulai + d, terukur });
    kursor = mulai + d + JARAK_BARIS;
    const p = a.jangkar?.padaRel;
    if (p && typeof p !== 'number' && p.setelahBaris === b.id) jangkarRel = Math.max(mulai + d + p.tambah, jangkarMin);
  }
  const akhirNarasi = baris.length ? baris[baris.length - 1].selesai : 0;
  // Suara penting hanya menggeser narasi; tidak memperpanjang adegan (klip boleh berlanjut ke adegan berikut).
  return { baris, jangkarRel, durasi: Math.max(a.minimal, akhirNarasi + JEDA_AKHIR) };
};

/** Klip aplikasi berkas `berkas` yang tampil bila adegan memutar berkas itu mulai `m` selama `durasi` detik. */
const klipDalam = (berkas: string, m: number, durasi: number): KlipTercatat[] =>
  klipTercatat(berkas).filter((k) => k.detik >= m - 0.01 && k.detik < m + durasi);

/** Rentang suara penting (relatif adegan) dari klip aplikasi dan ucapan di video AI. */
const rentangPenting = (def: DefAdegan, m: number | undefined, durasi: number, mKamera: number | undefined, laju: number): [number, number][] => {
  const r: [number, number][] = [];
  if (def.layar && m !== undefined) {
    // Termasuk klip yang mulai di adegan sebelumnya dan masih berbunyi.
    for (const k of klipTercatat(F[def.layar.kunci])) {
      if (k.detik < m + durasi && k.detik + k.lama > m + 0.01 && klipPenting(k.teks)) r.push([k.detik - m, k.detik - m + k.lama]);
    }
  }
  if (def.ucapanKamera && mKamera !== undefined) {
    const t = (def.ucapanKamera.detik - mKamera) / laju;
    r.push([t, t + def.ucapanKamera.lama]);
  }
  return r;
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
  const lajuDari = (s?: DefSlot) => s?.laju ?? 1;

  for (const def of DEF) {
    const berkasLayar = def.layar ? F[def.layar.kunci] : undefined;
    const berkasKamera = def.kamera ? F[def.kamera.kunci] : undefined;
    const lajuKamera = lajuDari(def.kamera);
    const sebelum = berkasLayar ? (akhirBerkas.get(berkasLayar) ?? 0) : 0;
    let mulaiLayar: number | undefined = def.layar ? (def.layar.mulaiDi === 'lanjut' ? sebelum : def.layar.mulaiDi) : undefined;
    let mulaiKamera = def.kamera
      ? def.kamera.mulaiDi === 'lanjut'
        ? (akhirBerkas.get(berkasKamera!) ?? 0)
        : def.kamera.mulaiDi
      : undefined;
    // Kata di video AI ditempatkan `jeda` detik sebelum ketukan tercatat di rekaman layar.
    const tapAcuan = def.kataSebelumKetukan && berkasLayar ? KETUKAN[berkasLayar]?.[def.kataSebelumKetukan.ketukan] : undefined;
    if (tapAcuan !== undefined && def.ucapanKamera && mulaiLayar !== undefined) {
      const kataRel = tapAcuan - def.kataSebelumKetukan!.jeda - mulaiLayar;
      mulaiKamera = Math.max(0, def.ucapanKamera.detik - kataRel * lajuKamera);
    }

    // Putaran 1: tanpa penghalang, untuk menentukan jangkar dan perkiraan durasi.
    let tata = susun(def);
    if (def.jangkar && tata.jangkarRel !== null && berkasLayar) {
      let m = def.jangkar.detikBerkas - tata.jangkarRel;
      if (m < sebelum) {
        // Peristiwa terjadi lebih cepat daripada narasi sebelumnya selesai: jangan memutar mundur rekaman,
        // geser jangkar ke belakang di dalam adegan ini.
        tata = susun(def, def.jangkar.detikBerkas - sebelum);
        m = sebelum;
      }
      mulaiLayar = m;
    }
    // Putaran 2: narasi menunggu suara penting di jendela adegan (klip aplikasi, ucapan video AI).
    const jendela = Math.max(tata.durasi, def.sampaiBerkas !== undefined && mulaiLayar !== undefined ? def.sampaiBerkas - mulaiLayar : 0) + 0.5;
    const blokir = rentangPenting(def, mulaiLayar, jendela, mulaiKamera, lajuKamera);
    if (blokir.length) {
      const jangkarMin = def.jangkar && mulaiLayar !== undefined ? def.jangkar.detikBerkas - mulaiLayar : 0;
      tata = susun(def, jangkarMin, blokir);
      if (def.jangkar && tata.jangkarRel !== null) mulaiLayar = Math.max(sebelum, def.jangkar.detikBerkas - tata.jangkarRel);
    }
    if (def.jangkar && berkasLayar && mulaiLayar !== undefined) {
      const lentur = elastisTerakhir.get(berkasLayar);
      const celah = mulaiLayar - sebelum;
      if (lentur && celah > 0 && celah <= MAKS_ELASTIS && hasil[hasil.length - 1] === lentur) lentur.durasi += celah;
    }
    let durasi = tata.durasi;
    if (def.sampaiBerkas !== undefined && mulaiLayar !== undefined) durasi = Math.max(durasi, def.sampaiBerkas - mulaiLayar);
    const r: Rakitan = { def, tata, durasi, mulaiLayar, mulaiKamera };
    hasil.push(r);
    // Durasi bisa bertambah (elastis) setelah ini; akhir berkas dihitung ulang dari dua adegan terakhir.
    for (const x of hasil.slice(-2)) {
      if (x.def.layar && x.mulaiLayar !== undefined) akhirBerkas.set(F[x.def.layar.kunci], x.mulaiLayar + x.durasi * lajuDari(x.def.layar));
      if (x.def.kamera && x.mulaiKamera !== undefined) akhirBerkas.set(F[x.def.kamera.kunci], x.mulaiKamera + x.durasi * lajuDari(x.def.kamera));
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
    // Video AI yang lebih pendek dari adegannya diperlambat halus (min. 0,6x), kecuali yang bersambung atau bersuara.
    const slot = (s: DefSlot | undefined, m: number | undefined): SlotRekaman | undefined => {
      if (!s || m === undefined) return undefined;
      const sumber = DURASI_FOOTAGE[F[s.kunci]];
      const otomatis = s.jenis === 'ai' && s.mulaiDi !== 'lanjut' && !def.ucapanKamera && sumber !== undefined;
      const laju = otomatis ? Math.max(0.6, Math.min(s.laju ?? 1, (sumber - m) / (durasi + FADE_FRAME / FPS))) : (s.laju ?? 1);
      return { berkas: F[s.kunci], jenis: s.jenis, rekam: REKAM[s.kunci], mulaiDi: bulat(m), laju: Math.round(laju * 1000) / 1000 };
    };
    const momenRel =
      def.momen?.dariJangkar !== undefined && tata.jangkarRel !== null
        ? tata.jangkarRel + def.momen.dariJangkar
        : (def.momen?.rel ?? durasi / 2);
    const suara: SuaraAdegan[] = [];
    if (def.layar && mulaiLayar !== undefined) {
      for (const k of klipDalam(F[def.layar.kunci], mulaiLayar, durasi)) {
        const teks = k.teks ?? k.klip;
        const m = bulat(mulai + k.detik - mulaiLayar);
        suara.push({
          src: audioAplikasi(k.klip),
          sumber: 'aplikasi',
          mulai: m,
          lama: k.lama,
          mulaiKlip: k.mulaiKlip,
          ucapan: [m, bulat(m + k.lama)],
          teks,
          teksEn: TERJEMAHAN_SUARA[teks] ?? null,
          penting: klipPenting(k.teks),
        });
      }
    }
    if (def.ucapanKamera && mulaiKamera !== undefined) {
      const laju = def.kamera?.laju ?? 1;
      const kata = bulat(mulai + (def.ucapanKamera.detik - mulaiKamera) / laju);
      suara.push({
        src: def.ucapanKamera.src,
        sumber: 'ai',
        mulai,
        lama: bulat(durasi + FADE_FRAME / FPS),
        mulaiKlip: mulaiKamera,
        ucapan: [kata, bulat(kata + def.ucapanKamera.lama)],
        teks: def.ucapanKamera.teks,
        teksEn: TERJEMAHAN_SUARA[def.ucapanKamera.teks] ?? null,
        penting: true,
      });
    }
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
        teksId: b.def.teksId,
        teksEn: b.def.teksEn,
        ucapan: b.def.ucapan ?? b.def.teksId,
        nada: b.def.nada,
        mulai: bulat(mulai + b.mulai),
        selesai: bulat(mulai + b.selesai),
        terukur: b.terukur,
      })),
      suara,
      diLayar: def.diLayar,
      momen: def.momen ? { detik: bulat(mulai + Math.min(momenRel, durasi - 0.2)), deskripsi: def.momen.deskripsi } : undefined,
      ai: def.ai === true,
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

/** Detik terakhir berkas yang dibutuhkan slot pada adegan `a` (termasuk overlap crossfade). */
export const butuhSampai = (a: Adegan, s: SlotRekaman): number => s.mulaiDi + (a.selesai - a.mulai + FADE_FRAME / FPS) * s.laju;

/** Adegan yang tampil pada detik tertentu. */
export const adeganPada = (detik: number): Adegan =>
  ADEGAN.find((a) => detik >= a.mulai && detik < a.selesai) ?? ADEGAN[ADEGAN.length - 1];

/** Nama berkas still untuk audit jeda: out/stills/t080-s10-lima.png. */
export const namaStill = (detik: number): string =>
  `t${String(Math.floor(detik)).padStart(3, '0')}-${adeganPada(detik).id}.png`;

/** Semua baris narasi beserta adegannya, untuk generator audio. */
export const semuaBaris = (): BarisNarasi[] => ADEGAN.flatMap((a) => a.narasi);

/** Semua suara penting (klip aplikasi + ucapan video AI) berurutan waktu, untuk subtitle dan pemeriksaan. */
export const semuaSuaraPenting = (): (SuaraAdegan & { adeganId: string })[] =>
  ADEGAN.flatMap((a) => a.suara.filter((s) => s.penting).map((s) => ({ ...s, adeganId: a.id }))).sort((x, y) => x.mulai - y.mulai);
