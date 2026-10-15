// Membangun dari src/timeline.ts (waktu = durasi audio narasi terukur + peristiwa sesi-meta.json):
//   docs/video/subtitle-en.srt, docs/video/subtitle-id.srt,
//   docs/video/naskah-id.md (seluruhnya),
//   blok OTOMATIS di docs/video/shotlist.md (berkas, adegan, audit jeda 30 detik).
// Gagal (exit 1) bila naskah > 650 kata, isyarat melanggar aturan keterbacaan, video > 300 detik,
// layar penutup < 5 detik, atau ada jendela 30 detik tanpa momen screenshot.
// Jalankan: npm run srt   (setelah npm run narasi dan npm run scan)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADEGAN,
  DARI_BLENDER,
  DOMAIN,
  FADE_FRAME,
  FPS,
  KATEGORI,
  LABEL_KARAKTER,
  NAMA_TIM,
  OTOMATIS,
  SESI,
  SESI_TERUKUR,
  SUBKATEGORI,
  TOTAL_DETIK,
  dibacakan,
  daftarSlot,
  namaStill,
} from '../src/timeline.ts';
import { buatIsyarat, keSrt, periksaIsyarat } from '../src/subtitle.ts';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(akar, '..', 'docs', 'video');
mkdirSync(docs, { recursive: true });

const BATAS_DETIK = 300;
const BATAS_KATA = 650;
const salah = [];
const peringatan = [];

const fmt = (detik) => {
  const m = Math.floor(detik / 60);
  const s = detik - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0').replace('.', ',')}`;
};
const rentang = (a, b) => `${fmt(a)}–${fmt(b)}`;

// ---------- SRT ----------
if (TOTAL_DETIK > BATAS_DETIK) salah.push(`Durasi ${TOTAL_DETIK} dtk > ${BATAS_DETIK} dtk`);
const ringkasSrt = {};
for (const bahasa of ['en', 'id']) {
  const isyarat = buatIsyarat(bahasa);
  for (const p of periksaIsyarat(isyarat, Math.min(TOTAL_DETIK, BATAS_DETIK))) salah.push(`SRT ${bahasa} ${p}`);
  writeFileSync(join(docs, `subtitle-${bahasa}.srt`), keSrt(isyarat));
  ringkasSrt[bahasa] = { jumlah: isyarat.length, akhir: isyarat[isyarat.length - 1]?.selesai ?? 0 };
}

// ---------- Kata, tempo, status pengukuran ----------
const hitungKata = (teks) => teks.split(/\s+/).filter((k) => /[\p{L}\p{N}]/u.test(k)).length;
const semua = ADEGAN.flatMap((a) => a.narasi);
const barisDibacakan = semua.filter(dibacakan);
const totalKata = barisDibacakan.reduce((s, b) => s + hitungKata(b.teksId), 0);
if (totalKata > BATAS_KATA) salah.push(`Naskah ${totalKata} kata > ${BATAS_KATA}`);
const detikBicara = barisDibacakan.reduce((s, b) => s + (b.selesai - b.mulai), 0);
const belumTerukur = semua.filter((b) => !b.terukur);
if (belumTerukur.length) peringatan.push(`${belumTerukur.length} baris narasi belum punya audio terukur (npm run narasi && npm run scan): ${belumTerukur.map((b) => b.id).join(', ')}`);
if (!SESI_TERUKUR) peringatan.push('sesi-meta.json belum ada: adegan sesi kamera memakai PERKIRAAN (bukan versi final)');
const penutup = ADEGAN[ADEGAN.length - 1];
if (penutup.tata !== 'penutup' || penutup.selesai - penutup.mulai < 5) salah.push('Layar penutup harus adegan terakhir dan >= 5 dtk (Bab 14.3)');
for (const a of ADEGAN) {
  if ((a.kamera?.jenis === 'render3d' || a.layar?.berkas === 'layar-02-sesi-tekuk-siku.mp4') && !a.karakter) {
    salah.push(`${a.id}: karakter 3D terlihat tetapi label "${LABEL_KARAKTER}" tidak aktif`);
  }
}

// ---------- Naskah ----------
const NAMA_TATA = {
  data: 'Tipografi data bersumber',
  judul: 'B-roll 3D + judul PULIHIN',
  broll: 'B-roll 3D penuh layar + kalimat kunci',
  ponsel: 'Rekaman layar di ponsel 3D + kalimat kunci',
  desktop: 'Rekaman layar desktop dalam bingkai peramban (perspektif halus) + kalimat kunci',
  split: 'Render 3D lebar + rekaman layar sinkron di ponsel 3D',
  'penutup-3d': 'Render 3D penutup + kartu alamat',
  penutup: 'Layar penutup statis',
};

const n = [];
n.push('# Naskah Narasi Final Video Demo PULIHIN');
n.push('');
n.push('> DIBUAT OTOMATIS dari `video/src/timeline.ts` oleh `npm run srt` (folder `video/`). Jangan disunting langsung: ubah teks di `timeline.ts`, lalu jalankan `npm run narasi && npm run scan && npm run srt`.');
n.push('');
n.push(`- Durasi: ${fmt(TOTAL_DETIK)} (batas 5:00), ${ADEGAN.length} adegan, 30 fps, 1920x1080.`);
n.push(`- **Jumlah kata narasi: ${totalKata} kata** (batas ${BATAS_KATA}). Baris "Suara aplikasi" tidak dihitung.`);
n.push(`- Tempo: ${(totalKata / detikBicara).toFixed(2).replace('.', ',')} kata per detik bicara (${Math.round((totalKata / detikBicara) * 60)} kata per menit), tenang.`);
n.push(`- Waktu setiap baris = durasi audio terukur (${semua.length - belumTerukur.length}/${semua.length} baris terukur). Adegan sesi kamera: ${SESI_TERUKUR ? 'ditempatkan pada peristiwa aplikasi asli di `video/blender/out/sesi-meta.json`' : '**PERKIRAAN** (sesi-meta.json belum ada)'}: hitungan 5/10 pada detik ${SESI.repetisiDetik[4]} dan koreksi "${SESI.koreksi[0].teks}" pada detik ${SESI.koreksi[0].mulaiDetik} di dalam \`layar-02-sesi-tekuk-siku.mp4\`.`);
n.push('');
n.push('## Aturan');
n.push('');
n.push('- Video adalah bukti fungsi, bukan iklan (Bab 14). Setiap klaim yang diucapkan terlihat di layar dalam beberapa detik; kolom "Di layar" adalah buktinya.');
n.push('- Tanpa rekaman manusia dan tanpa dokter. Pemeran pasien = karakter 3D (Blender) yang menggerakkan aplikasi ASLI lewat kamera palsu Chrome. Label **' + LABEL_KARAKTER + '** tampil setiap kali karakter terlihat.');
n.push('- Narasi: suara sintetis (Microsoft Azure neural, id-ID, `id-ID-ArdiNeural`). Suara aplikasi (TTS peramban, tidak terekam headless) disuarakan ulang dengan kata persis pada detik persis ketika aplikasi asli menampilkan pesannya, diberi warna speaker ponsel (`id-ID-GadisNeural`).');
n.push('- Angka hanya dari `docs/bahan-paper.md`, dengan label sumber di layar. Tanpa klaim diagnosis, prognosis, atau kesembuhan. PULIHIN adalah prototype kompetisi, bukan alat kesehatan teregulasi. "Pak Budi, 58 tahun" adalah nama samaran; semua data adalah data demo.');
n.push(`- Alamat yang disebut dan ditampilkan: **${DOMAIN}** (dari \`src/config/identitas.ts\`: domain final hanya bila \`urlPublik\` sudah mengarah ke sana).`);
n.push('- Kolom `ucapan` di timeline.ts = teks yang dibacakan TTS (angka dieja, "PULIHIN" ditulis "Pulihin" agar dibaca satu kata, "prototype" dibaca "prototipe").');
n.push('');
n.push('## Naskah per adegan');
for (const a of ADEGAN) {
  n.push('');
  n.push(`### ${rentang(a.mulai, a.selesai)} · ${a.judul}`);
  n.push('');
  n.push(`\`${a.id}\` · Tahap: ${a.tahap} · Tata letak: ${NAMA_TATA[a.tata]}`);
  n.push('');
  if (a.narasi.length === 0) n.push('_(Tanpa narasi.)_', '');
  for (const b of a.narasi) {
    n.push(`**[${b.id}] ${b.pembicara}** (${rentang(b.mulai, b.selesai)})`);
    n.push('');
    n.push(`> ${b.teksId}`);
    n.push('');
    if (b.ucapan !== b.teksId) n.push(`_Ucapan TTS:_ ${b.ucapan}`, '');
    n.push(`_EN:_ ${b.teksEn}`);
    n.push('');
  }
  n.push(`- **Di layar:** ${a.diLayar}`);
  if (a.data) n.push(`- **Data:** ${a.data.keterangan} · ${a.data.sumber}`);
  if (a.teksLayar) n.push(`- **Teks penyunting:** "${a.teksLayar.utama}" / _${a.teksLayar.en}_${a.teksLayar.keterangan ? ` · ${a.teksLayar.keterangan}` : ''}`);
  if (a.sorot) n.push(`- **Label penunjuk di samping ponsel:** ${a.sorot.label}`);
  if (a.karakter) n.push(`- **Label:** ${LABEL_KARAKTER}`);
  for (const s of [a.kamera, a.layar].filter(Boolean)) n.push(`- **Rekaman:** \`${s.berkas}\` mulai detik ${s.mulaiDi}`);
  if (a.momen) n.push(`- **Momen screenshot (${fmt(a.momen.detik)}):** ${a.momen.deskripsi}`);
  if (a.catatan) n.push(`- **Catatan:** ${a.catatan}`);
}
n.push('');
n.push('## Naskah utuh');
n.push('');
for (const b of barisDibacakan) n.push(`${b.id}: ${b.teksId}`, '');
writeFileSync(join(docs, 'naskah-id.md'), `${n.join('\n').trimEnd()}\n`);

// ---------- Shotlist (blok otomatis) ----------
const manifest = JSON.parse(readFileSync(join(akar, 'src', 'footage-manifest.json'), 'utf8'));
const tabelBerkas = [
  '| Status | Berkas di `video/public/footage/` | Sumber | Dipakai di | Durasi minimal | Isi |',
  '|---|---|---|---|---|---|',
  ...daftarSlot().map((s) => {
    const butuh = Math.max(
      ...s.adegan.map((a) => {
        const sl = a.kamera?.berkas === s.berkas ? a.kamera : a.layar;
        return sl.mulaiDi + (a.selesai - a.mulai) + FADE_FRAME / FPS;
      }),
    );
    const info = manifest.footage[s.berkas];
    const status = info ? (info.durasi != null && info.durasi + 0.05 < butuh ? '[!] terlalu pendek' : '[x]') : '[ ]';
    const sumber = DARI_BLENDER[s.berkas] ? 'Blender3D' : OTOMATIS[s.berkas] ? '`npm run rekam-layar`' : '-';
    return `| ${status} | \`${s.berkas}\` | ${sumber} | ${s.adegan.map((a) => rentang(a.mulai, a.selesai)).join(', ')} | ${Math.ceil(butuh)} dtk | ${s.slot.rekam} |`;
  }),
];

const tabelShot = [
  '| Waktu | Adegan | Tata letak | Rekaman (mulai detik ke-) | Yang harus terlihat |',
  '|---|---|---|---|---|',
  ...ADEGAN.map((a) => {
    const rek = [a.kamera, a.layar]
      .filter(Boolean)
      .map((s) => `\`${s.berkas}\` @${s.mulaiDi}`)
      .join(' + ');
    return `| ${rentang(a.mulai, a.selesai)} | ${a.judul} | ${NAMA_TATA[a.tata]} | ${rek || '(dibuat di Remotion)'} | ${a.diLayar} |`;
  }),
];

const tabelAudit = ['| Jendela | Jeda di | Adegan | Yang harus terlihat saat dijeda | Still (`video/out/stills/`) |', '|---|---|---|---|---|'];
for (let w = 0; w < TOTAL_DETIK; w += 30) {
  const akhir = Math.min(w + 30, TOTAL_DETIK);
  const momen = ADEGAN.filter((a) => a.momen && a.momen.detik >= w && a.momen.detik < akhir);
  if (momen.length === 0) {
    salah.push(`Jendela ${rentang(w, akhir)} tanpa momen screenshot (Bab 14.2)`);
    tabelAudit.push(`| ${rentang(w, akhir)} | - | - | **TIDAK ADA MOMEN: perbaiki** | - |`);
  }
  for (const a of momen) tabelAudit.push(`| ${rentang(w, akhir)} | ${fmt(a.momen.detik)} | ${a.judul} | ${a.momen.deskripsi} | \`${namaStill(a.momen.detik)}\` |`);
}

/** Ganti isi blok <!-- OTOMATIS:NAMA --> ... <!-- /OTOMATIS:NAMA --> di sebuah berkas docs/video. */
const isiBlok = (berkas, blok) => {
  const jalur = join(docs, berkas);
  if (!existsSync(jalur)) {
    salah.push(`docs/video/${berkas} tidak ada`);
    return;
  }
  let isi = readFileSync(jalur, 'utf8');
  for (const [nama, baris] of Object.entries(blok)) {
    const pola = new RegExp(`(<!-- OTOMATIS:${nama} -->)[\\s\\S]*?(<!-- /OTOMATIS:${nama} -->)`);
    if (!pola.test(isi)) {
      salah.push(`${berkas} tidak punya penanda <!-- OTOMATIS:${nama} -->`);
      continue;
    }
    isi = isi.replace(pola, `$1\n${baris.join('\n')}\n$2`);
  }
  writeFileSync(jalur, isi);
};
isiBlok('shotlist.md', { BERKAS: tabelBerkas, SHOT: tabelShot, AUDIT: tabelAudit });

// ---------- YouTube: durasi, deskripsi dengan pengungkapan, bab ----------
const mss = (d) => `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}`;
const bab = ADEGAN.filter((a, i) => i === 0 || ADEGAN[i - 1].tahap !== a.tahap).map((a, i) => `${i === 0 ? '0:00' : mss(a.mulai)} ${a.tahap}`);
isiBlok('youtube.md', {
  DURASI: [`Durasi: **${mss(TOTAL_DETIK)}** (${TOTAL_DETIK.toFixed(1).replace('.', ',')} dtk, dari \`npm run srt\`).`],
  DESKRIPSI: [
    '```',
    'PULIHIN adalah prototype aplikasi web pendamping rehabilitasi stroke di rumah. Kamera ponsel biasa menghitung repetisi latihan dan memberi koreksi gerakan dengan suara Bahasa Indonesia, diproses langsung di perangkat; keluarga melihat kepatuhan dan tren skor, dan pasien dengan afasia berlatih menyebut kata sehari-hari dalam Bahasa Indonesia.',
    '',
    `Kategori lomba: ${KATEGORI} - ${SUBKATEGORI}`,
    `Coba prototype: https://${DOMAIN}/app`,
    '',
    'Penafian dan keterbukaan:',
    '- Prototype kompetisi, bukan alat kesehatan teregulasi, bukan alat diagnosis, dan bukan pengganti terapis.',
    `- ${LABEL_KARAKTER}. Karakter dirender di Blender, lalu videonya diputar sebagai kamera ke aplikasi PULIHIN yang asli; skeleton, hitungan, dan pesan koreksi di layar dihasilkan aplikasi itu sendiri.`,
    '- Narasi: suara sintetis (Microsoft Azure neural, id-ID).',
    '- Suara aplikasi disuarakan ulang: pesan koreksi diucapkan ulang dengan kata dan waktu persis seperti yang tampil di aplikasi, karena suara peramban tidak ikut terekam.',
    '- Data demo: "Pak Budi, 58 tahun" adalah nama samaran, dan seluruh data yang tampil adalah data demo.',
    '- Angka di awal video: Kemenkes (rilis 25 Okt 2024), Survei Kesehatan Indonesia 2023, Profil Kesehatan Indonesia 2023.',
    '',
    'Bab video:',
    ...bab,
    '',
    'Subtitle Bahasa Inggris tersedia (CC).',
    ...(NAMA_TIM ? [`Tim: ${NAMA_TIM}`] : []),
    '```',
  ],
});

// ---------- Laporan ----------
console.log(`Naskah: ${totalKata} kata (batas ${BATAS_KATA}) -> docs/video/naskah-id.md`);
for (const b of ['en', 'id']) console.log(`SRT ${b}: ${ringkasSrt[b].jumlah} isyarat, terakhir berakhir ${fmt(ringkasSrt[b].akhir)} -> docs/video/subtitle-${b}.srt`);
console.log(`Durasi video: ${fmt(TOTAL_DETIK)}`);
for (const p of peringatan) console.log(`Peringatan: ${p}`);
if (salah.length) {
  console.error('\nGAGAL:');
  for (const s of salah) console.error(`  - ${s}`);
  process.exit(1);
}
console.log('Semua pemeriksaan lolos.');
