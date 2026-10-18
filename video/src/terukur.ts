// DIBUAT OTOMATIS oleh `npm run scan` (scripts/scan-footage.mjs). Jangan disunting.
// Durasi audio terukur (ffprobe), kekerasan musik/suara video AI (LUFS), data/sesi-meta.json, data/suara-aplikasi.json.
import type { KlipTercatat, SesiMeta } from './sesi-meta-tipe.ts';

export const DURASI_AUDIO: Record<string, number> = {
  "audio/aplikasi/0e4c9fa5de79-7bea7b.mp3": 2.168,
  "audio/aplikasi/272b34f0b556-723381.mp3": 1.019,
  "audio/aplikasi/40a13c0f62f6-900179.mp3": 1.698,
  "audio/aplikasi/4a9019e82a4e-712f08.mp3": 0.914,
  "audio/aplikasi/69234ae90aa5-bea565.mp3": 2.952,
  "audio/aplikasi/6a102d29c868-cfcc1e.mp3": 2.429,
  "audio/aplikasi/74c143a625fb-82bbf0.mp3": 0.653,
  "audio/aplikasi/81cc0f7859fb-d20f36.mp3": 0.601,
  "audio/aplikasi/a8408674c19e-bdae94.mp3": 0.549,
  "audio/aplikasi/b2b57c0f660d-4e5677.mp3": 1.411,
  "audio/aplikasi/b48eba6533e7-5b2b43.mp3": 6.87,
  "audio/aplikasi/c347fc36eb15-2bdb8b.mp3": 0.836,
  "audio/aplikasi/ecb381cfa2df-4918aa.mp3": 0.627,
  "audio/aplikasi/f3234ada1ffb-e76933.mp3": 0.94,
  "audio/aplikasi/fdd7ff23bbff-2b5132.mp3": 2.456,
  "audio/musik/latar-1.mp3": 181.42,
  "audio/narasi/N01.mp3": 6.243,
  "audio/narasi/N02.mp3": 5.381,
  "audio/narasi/N03.mp3": 8.255,
  "audio/narasi/N04.mp3": 5.355,
  "audio/narasi/N05.mp3": 8.647,
  "audio/narasi/N06.mp3": 9.091,
  "audio/narasi/N07.mp3": 9.3,
  "audio/narasi/N08.mp3": 9.352,
  "audio/narasi/N09a.mp3": 4.415,
  "audio/narasi/N09b.mp3": 4.362,
  "audio/narasi/N10.mp3": 2.456,
  "audio/narasi/N11a.mp3": 2.299,
  "audio/narasi/N11b.mp3": 4.415,
  "audio/narasi/N14.mp3": 7.758,
  "audio/narasi/N15.mp3": 7.915,
  "audio/narasi/N16.mp3": 7.34,
  "audio/narasi/N17.mp3": 6.191,
  "audio/narasi/N18.mp3": 7.628,
  "audio/narasi/N19.mp3": 6.896,
  "audio/narasi/N20a.mp3": 6.661,
  "audio/narasi/N20b.mp3": 2.351,
  "audio/narasi/N21.mp3": 6.74,
  "audio/narasi/N22.mp3": 7.184,
  "audio/narasi/N23.mp3": 5.982,
  "audio/narasi/N24a.mp3": 9.169,
  "audio/narasi/N24b.mp3": 7.497,
  "audio/sfx/berhasil.mp3": 1.646,
  "audio/sfx/ketuk.mp3": 0.522,
  "audio/sfx/repetisi.mp3": 1.045,
  "audio/sfx/suasana-rumah.mp3": 20.036,
  "audio/sfx/transisi.mp3": 1.228
};

export const KERAS_AUDIO: Record<string, number> = {
  "audio/musik/latar-1.mp3": -11.8,
  "footage/ai-07-bicara.wav": -11.4
};

export const SESI_META: SesiMeta | null = {
  "fps": 30,
  "durasiDetik": 49.257,
  "berkas": {
    "layar": "layar-02-sesi-tekuk-siku.mp4"
  },
  "kameraMulaiDetik": 6.846,
  "siapDetik": 8.05,
  "repetisiDetik": [
    10.668,
    13.259,
    16.608,
    20.608,
    24.103,
    26.905,
    32.614,
    36.066,
    40.805,
    43.42
  ],
  "koreksi": [
    {
      "teks": "Rilekskan bahu, turunkan bahu Anda",
      "mulaiDetik": 30.218,
      "selesaiDetik": 31.85
    }
  ],
  "selesaiDetik": 43.42,
  "ringkasanDetik": 45.253
};

export const SUARA_APLIKASI: Record<string, KlipTercatat[]> = {
 "layar-01-beranda-detail.mp4": [],
 "layar-02-sesi-tekuk-siku.mp4": [
  {
   "klip": "6a102d29c868-cfcc1e.mp3",
   "detik": 7.378,
   "mulaiKlip": 0,
   "lama": 0.662,
   "teks": "Posisikan tubuh Anda di dalam bingkai."
  },
  {
   "klip": "b48eba6533e7-5b2b43.mp3",
   "detik": 8.05,
   "mulaiKlip": 0,
   "lama": 6.897,
   "teks": "Tubuh terdeteksi. Ingat, berhenti bila terasa nyeri atau pusing. Silakan mulai pelan-pelan."
  },
  {
   "klip": "ecb381cfa2df-4918aa.mp3",
   "detik": 16.58,
   "mulaiKlip": 0,
   "lama": 0.667,
   "teks": "Tiga."
  },
  {
   "klip": "c347fc36eb15-2bdb8b.mp3",
   "detik": 20.588,
   "mulaiKlip": 0,
   "lama": 0.896,
   "teks": "Empat."
  },
  {
   "klip": "74c143a625fb-82bbf0.mp3",
   "detik": 24.078,
   "mulaiKlip": 0,
   "lama": 0.669,
   "teks": "Lima."
  },
  {
   "klip": "a8408674c19e-bdae94.mp3",
   "detik": 26.887,
   "mulaiKlip": 0,
   "lama": 0.56,
   "teks": "Enam."
  },
  {
   "klip": "69234ae90aa5-bea565.mp3",
   "detik": 30.225,
   "mulaiKlip": 0,
   "lama": 2.982,
   "teks": "Rilekskan bahu, turunkan bahu Anda."
  },
  {
   "klip": "81cc0f7859fb-d20f36.mp3",
   "detik": 33.219,
   "mulaiKlip": 0,
   "lama": 0.649,
   "teks": "Tujuh."
  },
  {
   "klip": "272b34f0b556-723381.mp3",
   "detik": 36.073,
   "mulaiKlip": 0,
   "lama": 1.064,
   "teks": "Delapan."
  },
  {
   "klip": "4a9019e82a4e-712f08.mp3",
   "detik": 40.807,
   "mulaiKlip": 0,
   "lama": 0.94,
   "teks": "Sembilan."
  },
  {
   "klip": "f3234ada1ffb-e76933.mp3",
   "detik": 43.423,
   "mulaiKlip": 0,
   "lama": 0.965,
   "teks": "Sepuluh."
  },
  {
   "klip": "0e4c9fa5de79-7bea7b.mp3",
   "detik": 44.402,
   "mulaiKlip": 0,
   "lama": 2.185,
   "teks": "Hebat! Target tercapai."
  }
 ],
 "layar-03-ringkasan-beranda.mp4": [],
 "layar-04-keluarga.mp4": [],
 "layar-05-afasia.mp4": [
  {
   "klip": "b2b57c0f660d-4e5677.mp3",
   "detik": 10.841,
   "mulaiKlip": 0,
   "lama": 1.688,
   "teks": "sabun"
  },
  {
   "klip": "40a13c0f62f6-900179.mp3",
   "detik": 12.537,
   "mulaiKlip": 0,
   "lama": 1.732,
   "teks": "Cuci tangan pakai sabun."
  },
  {
   "klip": "fdd7ff23bbff-2b5132.mp3",
   "detik": 20.339,
   "mulaiKlip": 0,
   "lama": 2.49,
   "teks": "Benar! Bagus sekali."
  }
 ],
 "layar-06-klinisi.mp4": []
};

export const KETUKAN: Record<string, number[]> = {"layar-01-beranda-detail.mp4":[10.31],"layar-02-sesi-tekuk-siku.mp4":[5],"layar-03-ringkasan-beranda.mp4":[21.403],"layar-04-keluarga.mp4":[20.409],"layar-05-afasia.mp4":[10.604,20.2,29.208],"layar-06-klinisi.mp4":[1.754,9.601,13.012,17.599]};

export const DURASI_FOOTAGE: Record<string, number> = {"ai-01-pagi.mp4":23.933,"ai-02-kertas.mp4":6.533,"ai-03-ragu.mp4":8,"ai-04-pasang-ponsel.mp4":8,"ai-05-latihan-lebar.mp4":16.633,"ai-06-rina.mp4":8,"ai-07-bicara.mp4":8,"ai-07-bicara.wav":8,"ai-08-penutup.mp4":20.2,"layar-01-beranda-detail.mp4":34.5,"layar-02-sesi-tekuk-siku.mp4":49.267,"layar-03-ringkasan-beranda.mp4":31,"layar-04-keluarga.mp4":25.5,"layar-05-afasia.mp4":32,"layar-06-klinisi.mp4":23,"pov-tekuk-siku.mp4":30.133};
