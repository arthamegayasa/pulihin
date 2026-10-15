// DIBUAT OTOMATIS oleh `npm run scan` (scripts/scan-footage.mjs). Jangan disunting.
// Durasi audio terukur (ffprobe) dan isi video/blender/out/sesi-meta.json.
import type { SesiMeta } from './sesi-meta-tipe.ts';

export const DURASI_AUDIO: Record<string, number> = {
  "audio/aplikasi/N11-app.mp3": 3.291,
  "audio/narasi/N01.mp3": 5.616,
  "audio/narasi/N02.mp3": 4.598,
  "audio/narasi/N03.mp3": 7.419,
  "audio/narasi/N04.mp3": 2.821,
  "audio/narasi/N05.mp3": 5.512,
  "audio/narasi/N06.mp3": 7.549,
  "audio/narasi/N07.mp3": 9.639,
  "audio/narasi/N08.mp3": 8.411,
  "audio/narasi/N09.mp3": 9.796,
  "audio/narasi/N10.mp3": 2.534,
  "audio/narasi/N11a.mp3": 1.646,
  "audio/narasi/N11b.mp3": 4.859,
  "audio/narasi/N13.mp3": 5.538,
  "audio/narasi/N14.mp3": 9.117,
  "audio/narasi/N15.mp3": 6.87,
  "audio/narasi/N16.mp3": 7.732,
  "audio/narasi/N17.mp3": 8.673,
  "audio/narasi/N18.mp3": 6.975,
  "audio/narasi/N19.mp3": 7.68,
  "audio/narasi/N20a.mp3": 3.683,
  "audio/narasi/N20b.mp3": 7.811,
  "audio/narasi/N21.mp3": 6.217,
  "audio/narasi/N22.mp3": 5.616,
  "audio/narasi/N23a.mp3": 6.922,
  "audio/narasi/N23b.mp3": 6.87,
  "audio/sfx/berhasil.mp3": 1.646,
  "audio/sfx/ketuk.mp3": 0.522,
  "audio/sfx/repetisi.mp3": 1.045,
  "audio/sfx/suasana-rumah.mp3": 20.036,
  "audio/sfx/transisi.mp3": 1.228
};

export const SESI_META: SesiMeta | null = {
  "fps": 30,
  "durasiDetik": 46.654,
  "berkas": {
    "layar": "layar-02-sesi-tekuk-siku.mp4",
    "lebar": "kamera-sesi-lebar.mp4"
  },
  "siapDetik": 4.906,
  "repetisiDetik": [
    11.04,
    14.339,
    17.641,
    20.939,
    24.242,
    27.541,
    30.904,
    34.145,
    37.444,
    40.742
  ],
  "koreksi": [
    {
      "teks": "Rilekskan bahu, turunkan bahu Anda",
      "mulaiDetik": 29.842,
      "selesaiDetik": 31.339
    }
  ],
  "selesaiDetik": 40.742,
  "ringkasanDetik": 42.591,
  "ketukanDetik": [
    3.408
  ]
};
