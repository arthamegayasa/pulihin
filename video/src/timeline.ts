/**
 * Timeline video demo PULIHIN: SATU-SATUNYA sumber kebenaran.
 *
 * Dipakai oleh komposisi Remotion (src/PulihinDemo.tsx), generator subtitle,
 * naskah, dan tabel shot (scripts/build-srt.mjs), pemindai rekaman
 * (scripts/scan-footage.mjs), dan perender still (scripts/stills.mjs).
 *
 * Berkas ini sengaja tanpa import dan hanya memakai sintaks TypeScript yang
 * dapat dihapus (type stripping), supaya Node 22+ dapat memuatnya langsung.
 *
 * Semua waktu dalam DETIK sejak awal video. Ubah potongan di sini, lalu
 * jalankan `npm run srt` agar SRT, naskah, dan daftar shot mengikuti.
 */

export const FPS = 30;
export const LEBAR = 1920;
export const TINGGI = 1080;

/** Durasi crossfade antar adegan (frame). Hanya fade lembut. */
export const FADE_FRAME = 10;

/**
 * Adegan 4:00-4:25 (Bab 16). 'klinisi' bila dashboard klinisi P1 selesai,
 * 'streak' bila belum (diganti streak dan kalender kepatuhan).
 */
export const ADEGAN_TERAPIS: 'klinisi' | 'streak' = 'klinisi';

export const DOKTER_NAMA = '[DIISI: nama dan gelar dokter]';
export const DOKTER_PERAN = 'Dokter spesialis saraf · [DIISI: afiliasi]';
export const NAMA_TIM = '[DIISI]';
export const DOMAIN = 'pulihinapp.id';
export const URL_APLIKASI = 'pulihinapp.id/app';
export const KATEGORI = '.id Developer Day Indonesia 2026';
export const SUBKATEGORI = 'Health and Wellbeing';
export const LABEL_PEMERAN = 'Peragaan oleh pemeran';

/** Berkas narasi tunggal (opsional). Bila ada, narasi per adegan diabaikan. */
export const AUDIO_NARASI_LENGKAP = 'audio/narasi-lengkap.mp3';
/** Musik latar opsional. Tidak ada aset musik bawaan. */
export const AUDIO_MUSIK = 'audio/musik.mp3';
/** Volume musik relatif terhadap narasi (narasi = 1). Bab 14.3: maks 15%. */
export const VOLUME_MUSIK = 0.12;
/** Jeda dari awal adegan sampai narasi per adegan mulai diputar (detik). */
export const JEDA_AUDIO_ADEGAN = 0.4;

export const audioAdegan = (idAdegan: string): string => `audio/${idAdegan}.mp3`;

export type Tata = 'judul-dokter' | 'dokter' | 'broll' | 'ponsel' | 'split' | 'penutup';

export type Pembicara =
  | 'Dokter (di kamera)'
  | 'Dokter (suara, di atas b-roll)'
  | 'Narator (voice-over)'
  | 'Suara aplikasi (dari rekaman layar)';

export interface SlotRekaman {
  /** Nama berkas di video/public/footage/. */
  berkas: string;
  jenis: 'kamera' | 'layar';
  /** Apa yang harus direkam (untuk daftar shot dan kartu placeholder). */
  rekam: string;
  /** Detik di dalam berkas tempat adegan ini mulai diambil. */
  mulaiDi: number;
  /** Volume suara asli rekaman (0 = bisu). */
  volume: number;
}

export interface BarisNarasi {
  /** ID baris narasi, dipakai di naskah dan SRT. */
  id: string;
  pembicara: Pembicara;
  teksId: string;
  teksEn: string;
  /** Waktu bicara absolut (detik). Bila kosong, diperkirakan dari panjang teks. */
  mulai?: number;
  selesai?: number;
}

export interface TeksLayar {
  /** Kalimat kunci Bahasa Indonesia (besar). */
  utama: string;
  /** Terjemahan Inggris (kecil). */
  en: string;
  /** Keterangan kecil tambahan Bahasa Indonesia. */
  keterangan?: string;
  /** Detik sejak awal adegan sebelum teks tampil. */
  mulaiDi?: number;
}

export interface Adegan {
  id: string;
  mulai: number;
  selesai: number;
  tata: Tata;
  /** Tahap trust fall Bab 14.1. */
  tahap: string;
  judul: string;
  kamera?: SlotRekaman;
  layar?: SlotRekaman;
  teksLayar?: TeksLayar;
  /** Label penunjuk di samping ponsel; `ke` = posisi vertikal 0..1 pada layar ponsel. */
  sorot?: { label: string; ke: number };
  narasi: BarisNarasi[];
  /** Apa yang dilihat penonton sebagai bukti klaim narasi. */
  diLayar: string;
  /** Momen screenshot Bab 14.2 (detik absolut). */
  momen?: { detik: number; deskripsi: string };
  /** Tampilkan label "Peragaan oleh pemeran". */
  pemeran?: boolean;
  /** Tampilkan lower third nama dokter. */
  namaDokter?: boolean;
  /** Catatan penyutradaraan/perekaman. */
  catatan?: string;
}

export const TAHAP = {
  masalah: 'Masalah klinis',
  tugasKecil: 'Satu gerakan kecil',
  sesiPenuh: 'Satu sesi utuh',
  keluarga: 'Keluarga dan afasia',
  penutup: 'Penutup',
} as const;

const slot = (
  berkas: string,
  jenis: SlotRekaman['jenis'],
  rekam: string,
  mulaiDi = 0,
  volume = 0,
): SlotRekaman => ({ berkas, jenis, rekam, mulaiDi, volume });

// Berkas rekaman. Satu berkas dapat dipakai beberapa adegan dengan mulaiDi berbeda.
const F = {
  dokterPembuka: 'dokter-pembuka.mp4',
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
  streak: 'layar-06-streak.mp4',
  dokterPenutup: 'dokter-penutup.mp4',
} as const;

const REKAM = {
  dokterPembuka:
    'Talking head dokter, ruang terang, cahaya dari depan. Dokter duduk sedikit kanan dari tengah, sepertiga kiri bingkai kosong untuk judul. Ucapkan baris N01 lalu N02 dalam satu pengambilan.',
  kertas: 'Close-up tangan pemeran meletakkan kertas program latihan di meja rumah. Tanpa nama atau data asli di kertas.',
  ragu: 'Pemeran duduk di kursi memegang kertas program, tampak ragu mencoba gerakan. Wajah boleh tampak, tanpa dialog.',
  berandaDetail:
    'Rekaman layar: Beranda Pak Budi (Latihan Hari Ini) sekitar 8 detik, ketuk Tekuk Siku, layar Detail Latihan sampai tombol Mulai dengan Kamera terlihat jelas.',
  sesiLebar:
    'Shot lebar 16:9: pemeran duduk di kursi, ponsel di tripod di meja 0,8-1,2 m. Rekam bersamaan dengan layar-02, awali dengan tepukan tangan untuk sinkron.',
  sesiLayar:
    'Rekaman layar satu sesi Tekuk Siku utuh, tempo pelan ±6 dtk per repetisi (5/10 sekitar detik ke-30): skeleton, hitungan naik sampai 10/10, satu koreksi bahu alami sekitar repetisi ke-7. Suara internal aplikasi ikut direkam.',
  ringkasan:
    'Rekaman layar Ringkasan Sesi: skor dan label, repetisi, durasi, saran; gulir pelan ke kalimat bukan diagnosis; ketuk Kembali ke Beranda, status hari ini selesai.',
  keluarga:
    'Rekaman layar Untuk Keluarga: status hari ini, grafik 7 hari, tren skor, red flag; ketuk Salin Ringkasan Mingguan sampai konfirmasi tampil.',
  afasiaLayar:
    'Rekaman layar Latihan Bicara: pilih kategori, kata dan emoji besar, ketuk Dengar, sebutkan kata, hasil Benar dan skor tampil. Ulangi untuk 3 kata.',
  afasiaLebar:
    'Shot lebar 16:9: pemeran menyebutkan kata ke arah ponsel. Rekam bersamaan dengan layar-05, awali tepukan tangan.',
  klinisi:
    'Rekaman layar Dashboard Klinisi: buka pasien Pak Budi, halaman progres (grafik kepatuhan), ubah resep program, Simpan Program, lalu Beranda pasien menampilkan latihan baru.',
  streak:
    'Rekaman layar streak dan kalender kepatuhan di Beranda/halaman kepatuhan Pak Budi, termasuk hari ini yang sudah selesai.',
  dokterPenutup:
    'Talking head dokter memegang ponsel dengan aplikasi PULIHIN terbuka di Beranda. Ucapkan N22a dan N22b. Tiga kali pengambilan.',
} as const;

const ADEGAN_TERAPIS_KLINISI: Adegan[] = [
  {
    id: 's20-terapis',
    mulai: 240,
    selesai: 252,
    tata: 'ponsel',
    tahap: TAHAP.penutup,
    judul: 'Dashboard klinisi: progres pasien',
    layar: slot(F.klinisi, 'layar', REKAM.klinisi, 0),
    teksLayar: { utama: 'Terapis menyusun program', en: 'Therapists set the home programme' },
    sorot: { label: 'Grafik kepatuhan', ke: 0.45 },
    narasi: [
      {
        id: 'N20',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Di dashboard klinisi, terapis dapat menyusun program dan mengikuti kemajuan tanpa menunggu kunjungan berikutnya.',
        teksEn:
          'On the clinician dashboard, the therapist can set the programme and follow progress without waiting for the next visit.',
      },
    ],
    diLayar: 'Halaman progres Pak Budi di dashboard klinisi (label Prototype) dengan grafik kepatuhan dan tren skor, lalu form resep program.',
    momen: { detik: 246, deskripsi: 'Grafik kepatuhan pada halaman progres pasien di dashboard klinisi' },
  },
  {
    id: 's21-program',
    mulai: 252,
    selesai: 265,
    tata: 'ponsel',
    tahap: TAHAP.penutup,
    judul: 'Resep program menjadi Latihan Hari Ini',
    layar: slot(F.klinisi, 'layar', REKAM.klinisi, 12),
    teksLayar: { utama: 'Program terapis menjadi Latihan Hari Ini', en: "The therapist's programme becomes today's exercises" },
    sorot: { label: 'Latihan Hari Ini', ke: 0.4 },
    narasi: [
      {
        id: 'N21',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Di prototype ini, program yang disimpan terapis menjadi Latihan Hari Ini pada profil pasien tersebut.',
        teksEn:
          "In this prototype, the programme the therapist saves becomes Today's Exercises on that patient's profile.",
      },
    ],
    diLayar: 'Tombol Simpan Program diketuk, lalu Beranda pasien yang sama menampilkan daftar Latihan Hari Ini yang baru.',
  },
];

const ADEGAN_TERAPIS_STREAK: Adegan[] = [
  {
    id: 's20-terapis',
    mulai: 240,
    selesai: 252,
    tata: 'ponsel',
    tahap: TAHAP.penutup,
    judul: 'Kalender kepatuhan dan streak',
    layar: slot(F.streak, 'layar', REKAM.streak, 0),
    teksLayar: { utama: 'Latihan tetap rutin', en: 'Keeping home exercise routine' },
    sorot: { label: 'Kalender kepatuhan', ke: 0.45 },
    narasi: [
      {
        id: 'N20',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Pengingat jadwal dan streak membantu latihan tetap rutin. Kalender kepatuhan menunjukkan hari mana saja latihan benar-benar dilakukan.',
        teksEn:
          'Schedule reminders and a streak help keep exercise routine. The adherence calendar shows which days exercise really happened.',
      },
    ],
    diLayar: 'Kalender kepatuhan 14 hari Pak Budi dan jumlah streak.',
    momen: { detik: 246, deskripsi: 'Kalender kepatuhan dan streak Pak Budi' },
  },
  {
    id: 's21-program',
    mulai: 252,
    selesai: 265,
    tata: 'ponsel',
    tahap: TAHAP.penutup,
    judul: 'Sesi selesai menandai kalender',
    layar: slot(F.streak, 'layar', REKAM.streak, 12),
    teksLayar: { utama: 'Sesi selesai tercatat di kalender', en: 'Completed sessions show on the calendar' },
    sorot: { label: 'Streak', ke: 0.25 },
    narasi: [
      {
        id: 'N21',
        pembicara: 'Narator (voice-over)',
        teksId: 'Setiap sesi yang selesai menandai kalender hari itu, dan streak bertambah satu.',
        teksEn: 'Every completed session marks that day on the calendar, and the streak grows by one.',
      },
    ],
    diLayar: 'Hari ini pada kalender tertandai selesai dan angka streak bertambah setelah sesi Tekuk Siku.',
  },
];

export const ADEGAN: Adegan[] = [
  {
    id: 's01-pembuka',
    mulai: 0,
    selesai: 12,
    tata: 'judul-dokter',
    tahap: TAHAP.masalah,
    judul: 'Pembuka dokter dan judul',
    kamera: slot(F.dokterPembuka, 'kamera', REKAM.dokterPembuka, 0, 1),
    namaDokter: true,
    narasi: [
      {
        id: 'N01',
        pembicara: 'Dokter (di kamera)',
        teksId: 'Saya dokter spesialis saraf. Setiap minggu, saya melepas pasien stroke pulang ke rumah.',
        teksEn: 'I am a neurologist. Every week, I discharge stroke patients to go home.',
      },
    ],
    diLayar: 'Wajah dokter, lower third nama dan gelar, judul PULIHIN: Pendamping Rehabilitasi Stroke di Rumah.',
    momen: { detik: 6, deskripsi: 'Wajah dokter dengan judul PULIHIN dan nama dokter' },
  },
  {
    id: 's02-kertas',
    mulai: 12,
    selesai: 19,
    tata: 'dokter',
    tahap: TAHAP.masalah,
    judul: 'Dokter: program di atas kertas',
    kamera: slot(F.dokterPembuka, 'kamera', REKAM.dokterPembuka, 12, 1),
    narasi: [
      {
        id: 'N02',
        pembicara: 'Dokter (di kamera)',
        teksId: 'Mereka pulang membawa program latihan di atas kertas.',
        teksEn: 'They go home with an exercise programme on paper.',
      },
    ],
    diLayar: 'Wajah dokter yang melanjutkan penjelasan.',
  },
  {
    id: 's03-ragu',
    mulai: 19,
    selesai: 24,
    tata: 'broll',
    tahap: TAHAP.masalah,
    judul: 'B-roll: kertas program di meja',
    kamera: slot(F.kertas, 'kamera', REKAM.kertas, 0),
    pemeran: true,
    teksLayar: { utama: 'Lupa jadwal, ragu gerakannya benar', en: 'Missed sessions, unsure about the movement' },
    narasi: [
      {
        id: 'N03',
        pembicara: 'Dokter (suara, di atas b-roll)',
        teksId: 'Di rumah, mereka sering lupa dan ragu apakah gerakannya sudah benar.',
        teksEn: 'At home, they often forget, and are unsure whether they move correctly.',
      },
    ],
    diLayar: 'Kertas program latihan diletakkan di meja rumah, dengan kalimat kunci di sampingnya.',
  },
  {
    id: 's04-masalah',
    mulai: 24,
    selesai: 30,
    tata: 'broll',
    tahap: TAHAP.masalah,
    judul: 'B-roll: pemeran kebingungan, kalimat masalah',
    kamera: slot(F.ragu, 'kamera', REKAM.ragu, 0),
    pemeran: true,
    teksLayar: { utama: 'Di rumah, pendampingan terputus', en: 'At home, guidance breaks off' },
    narasi: [
      {
        id: 'N04',
        pembicara: 'Dokter (suara, di atas b-roll)',
        teksId: 'Padahal pemulihan ditentukan oleh latihan harian di rumah, dan di situlah pendampingan terputus.',
        teksEn: 'Yet recovery depends on daily exercise at home, and that is exactly where guidance breaks off.',
      },
    ],
    diLayar: 'Pemeran tampak ragu memegang kertas program; kalimat masalah tampil besar.',
    momen: { detik: 28, deskripsi: 'Kalimat masalah "Di rumah, pendampingan terputus" di layar' },
  },
  {
    id: 's05-beranda',
    mulai: 30,
    selesai: 40,
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Beranda: Latihan Hari Ini',
    layar: slot(F.berandaDetail, 'layar', REKAM.berandaDetail, 0),
    teksLayar: { utama: 'Ponsel biasa menjadi pendamping latihan', en: 'An ordinary phone as a home exercise companion' },
    sorot: { label: 'Latihan Hari Ini', ke: 0.4 },
    narasi: [
      {
        id: 'N05',
        pembicara: 'Narator (voice-over)',
        teksId:
          'PULIHIN mengubah ponsel biasa menjadi pendamping latihan. Begitu dibuka, Latihan Hari Ini langsung tampil dalam huruf besar.',
        teksEn:
          "PULIHIN turns an ordinary phone into an exercise companion. Once opened, Today's Exercises appear right away, in large type.",
      },
    ],
    diLayar: 'Beranda Pak Budi, 58 tahun (Demo): salam, status hari ini, kartu Latihan Hari Ini berhuruf besar.',
  },
  {
    id: 's06-detail',
    mulai: 40,
    selesai: 50,
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Detail Latihan: Tekuk Siku',
    layar: slot(F.berandaDetail, 'layar', REKAM.berandaDetail, 10),
    teksLayar: { utama: 'Mulai dari satu gerakan kecil', en: 'Start with one small movement' },
    sorot: { label: 'Mulai dengan Kamera', ke: 0.86 },
    narasi: [
      {
        id: 'N06',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Kita mulai dari satu gerakan kecil: Tekuk Siku. Ada contoh gerakan, pesan keselamatan, lalu satu tombol besar: Mulai dengan Kamera.',
        teksEn:
          'We start with one small movement: Elbow Flexion. There is a movement demo, a safety notice, then one big button: Start with Camera.',
      },
    ],
    diLayar: 'Ketuk Tekuk Siku; layar detail dengan contoh gerakan, peringatan keselamatan, dan tombol Mulai dengan Kamera.',
  },
  {
    id: 's07-posisi',
    mulai: 50,
    selesai: 62,
    tata: 'split',
    tahap: TAHAP.tugasKecil,
    judul: 'Shot lebar: ponsel di meja, pemeran duduk',
    kamera: slot(F.sesiLebar, 'kamera', REKAM.sesiLebar, 0),
    layar: slot(F.sesiLayar, 'layar', REKAM.sesiLayar, 0),
    pemeran: true,
    teksLayar: { utama: 'Ponsel di meja, ± 1 meter', en: 'Phone on a table, about 1 metre away' },
    narasi: [
      {
        id: 'N07',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Ponsel cukup diletakkan di meja, sekitar satu meter dari kursi. Yang tampil di sini adalah peragaan oleh pemeran, bukan pasien sungguhan.',
        teksEn:
          'The phone simply sits on a table, about one metre from the chair. What you see here is a demonstration by a performer, not a real patient.',
      },
    ],
    diLayar: 'Pemeran duduk di depan ponsel bertripod; di bingkai ponsel tampil skeleton dan hitungan awal sesi.',
    momen: { detik: 57, deskripsi: 'Skeleton dan hitungan awal di layar ponsel, pemeran duduk di depan ponsel' },
  },
  {
    id: 's08-sudut',
    mulai: 62,
    selesai: 76,
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Sesi kamera: sudut siku dan skeleton',
    layar: slot(F.sesiLayar, 'layar', REKAM.sesiLayar, 12),
    teksLayar: {
      utama: 'Repetisi dihitung dari sudut siku',
      en: 'Repetitions counted from the elbow angle',
      keterangan: 'Diproses di ponsel · video tidak diunggah',
    },
    sorot: { label: 'Sudut siku', ke: 0.5 },
    narasi: [
      {
        id: 'N08',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Kamera membaca titik-titik tubuh langsung di ponsel ini, tanpa mengunggah video. Repetisi dihitung dari sudut siku: tekuk penuh, luruskan lagi, baru terhitung satu.',
        teksEn:
          'The camera reads body landmarks right on this phone, without uploading any video. Each repetition is counted from the elbow angle: a full bend, straighten again, and only then does it count.',
      },
    ],
    diLayar: 'Skeleton mengikuti lengan pemeran, sudut siku tampil, hitungan bertambah setelah satu siklus tekuk-luruskan.',
  },
  {
    id: 's09-lima',
    mulai: 76,
    selesai: 90,
    tata: 'ponsel',
    tahap: TAHAP.tugasKecil,
    judul: 'Sesi kamera: 5 / 10',
    layar: slot(F.sesiLayar, 'layar', REKAM.sesiLayar, 26),
    teksLayar: { utama: 'Hitungan naik setiap repetisi lengkap', en: 'The count rises with every complete repetition' },
    sorot: { label: 'Hitungan repetisi', ke: 0.22 },
    narasi: [
      {
        id: 'N09',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Lihat angkanya: lima dari sepuluh. Hitungan hanya naik bila gerakannya lengkap, dan aplikasi memberi tahu bila gerakannya belum tepat.',
        teksEn:
          'Look at the count: five out of ten. It only rises when a movement is complete, and the app speaks up when the movement is not quite right.',
      },
    ],
    diLayar: 'Hitungan besar 5 / 10 dengan skeleton di atas video kamera.',
    momen: { detik: 80, deskripsi: 'Hitungan "5 / 10" dengan skeleton' },
  },
  {
    id: 's10-koreksi',
    mulai: 90,
    selesai: 104,
    tata: 'split',
    tahap: TAHAP.sesiPenuh,
    judul: 'Koreksi form: bahu terangkat',
    kamera: slot(F.sesiLebar, 'kamera', REKAM.sesiLebar, 40),
    layar: slot(F.sesiLayar, 'layar', REKAM.sesiLayar, 40, 1),
    pemeran: true,
    teksLayar: { utama: 'Koreksi form saat bahu terangkat', en: 'Form correction when the shoulder rises' },
    sorot: { label: 'Koreksi form', ke: 0.7 },
    narasi: [
      {
        id: 'N10a',
        pembicara: 'Narator (voice-over)',
        teksId: 'Sekarang bahunya ikut terangkat.',
        teksEn: 'Now the shoulder hikes up.',
        mulai: 90.5,
        selesai: 92.8,
      },
      {
        id: 'N10-app',
        pembicara: 'Suara aplikasi (dari rekaman layar)',
        teksId: 'Rilekskan bahu, turunkan bahu Anda.',
        teksEn: '[App voice] Relax your shoulder, lower your shoulder.',
        mulai: 93.2,
        selesai: 97.4,
      },
      {
        id: 'N10b',
        pembicara: 'Narator (voice-over)',
        teksId: 'Aplikasi mengoreksi dengan suara dan teks besar, dalam Bahasa Indonesia.',
        teksEn: 'The app gives a form correction, by voice and in large text, in Indonesian.',
        mulai: 98,
        selesai: 103.4,
      },
    ],
    diLayar:
      'Pemeran mengangkat bahu secara alami; pesan koreksi "Rilekskan bahu, turunkan bahu Anda" muncul di atas skeleton dan terdengar suara aplikasi.',
    momen: { detik: 96, deskripsi: 'Pesan koreksi "Rilekskan bahu, turunkan bahu Anda" di atas skeleton' },
    catatan:
      'Adegan terpenting. Koreksi harus muncul alami dari gerakan pemeran (Bab 15), JANGAN menempel teks koreksi saat menyunting. Sesuaikan mulaiDi dan waktu N10-app dengan detik koreksi pada rekaman.',
  },
  {
    id: 's11-perbaiki',
    mulai: 104,
    selesai: 118,
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Pemeran memperbaiki, hitungan berlanjut',
    layar: slot(F.sesiLayar, 'layar', REKAM.sesiLayar, 54),
    teksLayar: { utama: 'Satu pesan pada satu waktu', en: 'One form correction at a time' },
    sorot: { label: 'Pesan koreksi', ke: 0.7 },
    narasi: [
      {
        id: 'N11',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Pemeran menurunkan bahunya, pesan menghilang, dan hitungan berlanjut. Hanya satu pesan pada satu waktu, supaya tidak membingungkan.',
        teksEn:
          'The performer lowers the shoulder, the message clears, and counting continues. Only one message at a time, so it never gets confusing.',
      },
    ],
    diLayar: 'Pesan koreksi hilang setelah bahu turun; hitungan repetisi bertambah lagi.',
  },
  {
    id: 's12-cara-gerak',
    mulai: 118,
    selesai: 130,
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Sesi berlanjut sampai 10 / 10',
    layar: slot(F.sesiLayar, 'layar', REKAM.sesiLayar, 68),
    teksLayar: { utama: 'Bukan sekadar menghitung', en: 'Not just counting: form correction' },
    sorot: { label: 'Hitungan repetisi', ke: 0.22 },
    narasi: [
      {
        id: 'N12',
        pembicara: 'Narator (voice-over)',
        teksId: 'Jadi bukan sekadar menghitung, melainkan menjaga cara geraknya, sampai repetisi kesepuluh.',
        teksEn: 'So it is not just counting: it guards how each movement is done, all the way to the tenth repetition.',
      },
    ],
    diLayar: 'Hitungan naik sampai 10 / 10 dan sesi berakhir.',
  },
  {
    id: 's13-ringkasan',
    mulai: 130,
    selesai: 150,
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Ringkasan Sesi: skor',
    layar: slot(F.ringkasan, 'layar', REKAM.ringkasan, 0),
    teksLayar: {
      utama: 'Skor dan ringkasan sederhana',
      en: 'A score and a simple summary',
      keterangan: 'Perlu Pendampingan · Berkembang · Baik · Sangat Baik',
    },
    sorot: { label: 'Skor sesi', ke: 0.3 },
    narasi: [
      {
        id: 'N13',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Di akhir sesi ada skor dan ringkasan sederhana: jumlah repetisi, durasi, dan satu saran. Labelnya mudah dipahami, mulai dari Perlu Pendampingan, Berkembang, Baik, sampai Sangat Baik.',
        teksEn:
          'At the end of the session there is a score and a simple summary: repetitions, duration and one tip. The labels are easy to read, from Needs Support and Improving to Good and Very Good.',
      },
    ],
    diLayar: 'Ringkasan Sesi: angka skor dengan label, repetisi 10, durasi, satu saran.',
    momen: { detik: 140, deskripsi: 'Skor sesi dengan label, repetisi, dan durasi' },
  },
  {
    id: 's14-batasan',
    mulai: 150,
    selesai: 162,
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Ringkasan Sesi: kalimat bukan diagnosis',
    layar: slot(F.ringkasan, 'layar', REKAM.ringkasan, 20),
    teksLayar: { utama: 'Bukan alat diagnosis', en: 'Not a diagnostic tool' },
    sorot: { label: 'Kalimat batasan', ke: 0.78 },
    narasi: [
      {
        id: 'N14',
        pembicara: 'Narator (voice-over)',
        teksId: 'Ringkasan ini bukan diagnosis. Kalimat batasan itu selalu tampil di setiap ringkasan sesi.',
        teksEn: 'This summary is not a diagnosis. That disclaimer appears on every session summary.',
      },
    ],
    diLayar: 'Gulir pelan ke kalimat batasan bukan diagnosis di bawah skor.',
    momen: { detik: 155, deskripsi: 'Skor sesi bersama kalimat bukan alat diagnosis' },
  },
  {
    id: 's15-tercatat',
    mulai: 162,
    selesai: 180,
    tata: 'ponsel',
    tahap: TAHAP.sesiPenuh,
    judul: 'Kembali ke Beranda: status selesai',
    layar: slot(F.ringkasan, 'layar', REKAM.ringkasan, 32),
    teksLayar: { utama: 'Latihan hari ini tercatat', en: "Today's exercise is recorded" },
    sorot: { label: 'Status hari ini', ke: 0.28 },
    narasi: [
      {
        id: 'N15',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Kembali ke Beranda, status hari ini sudah berubah menjadi selesai. Latihannya tercatat di ponsel, dan keluarga bisa melihatnya.',
        teksEn:
          "Back on the home screen, today's status has changed to done. The exercise is recorded on the phone, and the family can see it.",
      },
    ],
    diLayar: 'Ketuk Kembali ke Beranda; status hari ini berubah selesai; tombol Untuk Keluarga terlihat.',
  },
  {
    id: 's16-keluarga',
    mulai: 180,
    selesai: 195,
    tata: 'ponsel',
    tahap: TAHAP.keluarga,
    judul: 'Untuk Keluarga: grafik 7 hari dan tren',
    layar: slot(F.keluarga, 'layar', REKAM.keluarga, 0),
    teksLayar: { utama: 'Keluarga tidak lagi menebak', en: 'Caregivers no longer have to guess' },
    sorot: { label: 'Grafik 7 hari', ke: 0.4 },
    narasi: [
      {
        id: 'N16',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Keluarga tidak lagi menebak. Di halaman Untuk Keluarga, mereka melihat kepatuhan tujuh hari terakhir dan tren skor.',
        teksEn:
          'The family no longer has to guess. On the For Family page, the caregiver sees adherence over the last seven days and the score trend.',
      },
    ],
    diLayar: 'Halaman Untuk Keluarga: status hari ini, grafik kepatuhan 7 hari, tren skor.',
  },
  {
    id: 's17-tanda',
    mulai: 195,
    selesai: 210,
    tata: 'ponsel',
    tahap: TAHAP.keluarga,
    judul: 'Untuk Keluarga: red flag dan salin ringkasan',
    layar: slot(F.keluarga, 'layar', REKAM.keluarga, 15),
    teksLayar: { utama: 'Tanda bila latihan terhenti', en: 'A flag when exercise stops' },
    sorot: { label: 'Tanda perlu perhatian', ke: 0.6 },
    narasi: [
      {
        id: 'N17',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Bila latihan terhenti beberapa hari, muncul tanda yang jelas. Ringkasan mingguan bisa disalin dengan satu ketukan, siap dikirim ke terapis.',
        teksEn:
          'If exercise stops for several days, a clear flag appears. The weekly summary can be copied with one tap, ready to send to the therapist.',
      },
    ],
    diLayar:
      'Red flag "Minggu ini sempat 3 hari berturut-turut tanpa latihan", lalu ketuk Salin Ringkasan Mingguan dan konfirmasi tersalin tampil.',
    momen: { detik: 200, deskripsi: 'Grafik 7 hari dan red flag "Minggu ini sempat 3 hari berturut-turut tanpa latihan"' },
  },
  {
    id: 's18-afasia',
    mulai: 210,
    selesai: 222,
    tata: 'ponsel',
    tahap: TAHAP.keluarga,
    judul: 'Latihan Bicara: kata dan gambar',
    layar: slot(F.afasiaLayar, 'layar', REKAM.afasiaLayar, 0),
    teksLayar: { utama: 'Latihan bicara berbahasa Indonesia', en: 'Aphasia practice in Indonesian' },
    sorot: { label: 'Gambar dan kata', ke: 0.38 },
    narasi: [
      {
        id: 'N18',
        pembicara: 'Narator (voice-over)',
        teksId:
          'Untuk pasien dengan gangguan bicara atau afasia, ada Latihan Bicara berbahasa Indonesia, dengan kata yang dipakai di rumah setiap hari.',
        teksEn:
          'For patients with speech difficulties, or aphasia, there is Speech Practice in Indonesian, with words used at home every day.',
      },
    ],
    diLayar: 'Pilih kategori, lalu satu kata dengan emoji besar dan tombol Dengar.',
  },
  {
    id: 's19-sebut',
    mulai: 222,
    selesai: 240,
    tata: 'split',
    tahap: TAHAP.keluarga,
    judul: 'Pemeran menyebut kata, hasil Benar',
    kamera: slot(F.afasiaLebar, 'kamera', REKAM.afasiaLebar, 0, 1),
    layar: slot(F.afasiaLayar, 'layar', REKAM.afasiaLayar, 12),
    pemeran: true,
    teksLayar: { utama: 'Setiap kata dinilai', en: 'Every word attempt is scored' },
    sorot: { label: 'Hasil penilaian kata', ke: 0.62 },
    narasi: [
      {
        id: 'N19a',
        pembicara: 'Narator (voice-over)',
        teksId: 'Pemeran mendengarkan contoh, lalu menyebutkan katanya.',
        teksEn: 'The performer listens to the example, then says the word.',
        mulai: 222.5,
        selesai: 226.5,
      },
      {
        id: 'N19b',
        pembicara: 'Narator (voice-over)',
        teksId: 'Aplikasi mendengarkan dan menilai. Kata yang tepat dinilai Benar, dan skornya tercatat.',
        teksEn: 'The app listens and scores the attempt. A correct word is marked Correct, and the score is saved.',
        mulai: 231,
        selesai: 239.4,
      },
    ],
    diLayar: 'Pemeran mengucapkan kata; layar menampilkan hasil Benar dan skor kata.',
    momen: { detik: 235, deskripsi: 'Kata yang dinilai Benar beserta skornya' },
    catatan: 'Jeda 226,5-231 dibiarkan tanpa narasi agar suara pemeran menyebut kata terdengar jelas.',
  },
  ...(ADEGAN_TERAPIS === 'klinisi' ? ADEGAN_TERAPIS_KLINISI : ADEGAN_TERAPIS_STREAK),
  {
    id: 's22-penutup-dokter',
    mulai: 265,
    selesai: 290,
    tata: 'dokter',
    tahap: TAHAP.penutup,
    judul: 'Penutup dokter dengan ponsel di tangan',
    kamera: slot(F.dokterPenutup, 'kamera', REKAM.dokterPenutup, 0, 1),
    namaDokter: true,
    teksLayar: {
      utama: DOMAIN,
      en: 'Competition prototype · not a regulated medical device',
      keterangan: 'Prototype kompetisi · bukan alat kesehatan teregulasi',
      mulaiDi: 11.5,
    },
    narasi: [
      {
        id: 'N22a',
        pembicara: 'Dokter (di kamera)',
        teksId:
          'PULIHIN tidak menggantikan terapis. PULIHIN membantu memastikan yang diajarkan terapis benar-benar dilatih di rumah.',
        teksEn:
          'PULIHIN does not replace the therapist. It helps make sure that what the therapist teaches is truly practised at home.',
        mulai: 265.6,
        selesai: 275.5,
      },
      {
        id: 'N22b',
        pembicara: 'Dokter (di kamera)',
        teksId: 'Ini masih prototype untuk kompetisi, bukan alat kesehatan teregulasi. Silakan mencobanya di pulihinapp.id.',
        teksEn: 'This is still a competition prototype, not a regulated medical device. You can try it at pulihinapp.id.',
        mulai: 276.8,
        selesai: 287.5,
      },
    ],
    diLayar: 'Wajah dokter memegang ponsel berisi aplikasi; kartu pulihinapp.id dan penafian prototype.',
    momen: { detik: 280, deskripsi: 'Wajah dokter dengan ponsel di tangan dan kartu pulihinapp.id' },
  },
  {
    id: 's23-layar-penutup',
    mulai: 290,
    selesai: 298,
    tata: 'penutup',
    tahap: TAHAP.penutup,
    judul: 'Layar penutup',
    narasi: [],
    diLayar: `PULIHIN · ${DOMAIN} · ${SUBKATEGORI}, ${KATEGORI} · Tim: ${NAMA_TIM}`,
    momen: { detik: 294, deskripsi: 'Layar penutup: PULIHIN, pulihinapp.id, Health and Wellbeing, tim' },
  },
];

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

/** Nama berkas still untuk audit jeda: out/stills/t080-s09-lima.png. */
export const namaStill = (detik: number): string =>
  `t${String(Math.floor(detik)).padStart(3, '0')}-${adeganPada(detik).id}.png`;

/** Baris narasi yang dibacakan manusia (suara aplikasi tidak dihitung). */
export const dibacakan = (b: BarisNarasi): boolean => b.pembicara !== 'Suara aplikasi (dari rekaman layar)';
