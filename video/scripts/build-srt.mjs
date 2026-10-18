// Membangun dari src/timeline.ts (waktu = durasi audio narasi terukur + peristiwa aplikasi asli):
//   docs/video/subtitle-en.srt, docs/video/subtitle-id.srt,
//   docs/video/naskah-id.md (seluruhnya),
//   blok OTOMATIS di docs/video/shotlist.md (berkas, adegan, audit jeda 30 detik) dan docs/video/youtube.md.
// Gagal (exit 1) bila naskah > 650 kata, isyarat melanggar aturan keterbacaan, video > 300 detik, layar penutup
// < 5 detik, label AI hilang saat orang AI terlihat, narasi menimpa suara penting aplikasi/video AI, suara
// penting tanpa terjemahan, atau ada jendela 30 detik tanpa momen screenshot.
// Jalankan: npm run srt   (setelah npm run narasi dan npm run scan)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADEGAN,
  DOMAIN,
  DURASI_POV,
  FADE_FRAME,
  FPS,
  KATEGORI,
  LABEL_AI,
  NAMA_TIM,
  NARATOR,
  NARATOR_SUARA,
  OTOMATIS,
  SESI,
  SESI_TERUKUR,
  SUBKATEGORI,
  TOTAL_DETIK,
  butuhSampai,
  daftarSlot,
  namaStill,
  semuaSuaraPenting,
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
const totalKata = semua.reduce((s, b) => s + hitungKata(b.teksId), 0);
if (totalKata > BATAS_KATA) salah.push(`Naskah ${totalKata} kata > ${BATAS_KATA}`);
const detikBicara = semua.reduce((s, b) => s + (b.selesai - b.mulai), 0);
const belumTerukur = semua.filter((b) => !b.terukur);
if (belumTerukur.length) peringatan.push(`${belumTerukur.length} baris narasi belum punya audio terukur (npm run narasi && npm run scan): ${belumTerukur.map((b) => b.id).join(', ')}`);
if (!SESI_TERUKUR) peringatan.push('data/sesi-meta.json belum ada: adegan sesi kamera memakai PERKIRAAN (bukan versi final)');
const penutup = ADEGAN[ADEGAN.length - 1];
if (penutup.tata !== 'penutup' || penutup.selesai - penutup.mulai < 5) salah.push('Layar penutup harus adegan terakhir dan >= 5 dtk (Bab 14.3)');

// ---------- Kejujuran: label AI, narasi tidak menimpa suara penting, terjemahan ----------
const TANPA_ORANG = new Set(['ai-01-pagi.mp4']);
for (const a of ADEGAN) {
  const orangAi = (a.kamera?.jenis === 'ai' && !TANPA_ORANG.has(a.kamera.berkas)) || a.layar?.berkas === SESI.berkas.layar;
  if (orangAi && !a.ai) salah.push(`${a.id}: orang buatan AI terlihat tetapi label "${LABEL_AI}" tidak aktif`);
}
const penting = semuaSuaraPenting();
for (const s of penting) {
  if (!s.teksEn) salah.push(`${s.adeganId}: suara penting "${s.teks}" belum punya terjemahan (TERJEMAHAN_SUARA di timeline.ts)`);
  for (const n of semua) {
    const tumpang = Math.min(n.selesai, s.ucapan[1]) - Math.max(n.mulai, s.ucapan[0]);
    if (tumpang > 0.05) salah.push(`${n.id} menimpa suara penting "${s.teks}" di ${fmt(s.ucapan[0])} (${tumpang.toFixed(2)} dtk)`);
  }
}
// Titik ulang video POV di layar-02 tidak boleh terlihat di ponsel (termasuk pudar masuk/keluar blok ponsel).
const ULANG_POV = SESI.kameraMulaiDetik + DURASI_POV;
for (const a of ADEGAN) {
  if (!a.layar || a.layar.berkas !== SESI.berkas.layar || (a.tata !== 'ponsel' && a.tata !== 'split')) continue;
  const akhir = a.layar.mulaiDi + (a.selesai - a.mulai) + FADE_FRAME / FPS;
  if (ULANG_POV > a.layar.mulaiDi - FADE_FRAME / FPS && ULANG_POV < akhir) salah.push(`${a.id}: titik ulang video POV (${ULANG_POV.toFixed(2)} dtk di layar-02) terlihat`);
}
const klipAplikasi = ADEGAN.flatMap((a) => a.suara.filter((s) => s.sumber === 'aplikasi'));
if (klipAplikasi.length === 0) peringatan.push('Belum ada suara aplikasi tercatat (rekam ulang dengan npm run rekam-layar / rekam-sesi)');

// ---------- Naskah ----------
const NAMA_TATA = {
  data: 'Tipografi data bersumber di atas video AI tanpa orang',
  judul: 'Video AI + judul PULIHIN',
  broll: 'Video AI penuh layar + kalimat kunci',
  ponsel: 'Rekaman layar di ponsel 3D + kalimat kunci',
  desktop: 'Rekaman layar desktop dalam bingkai peramban (perspektif halus) + kalimat kunci',
  split: 'Video AI (kartu 16:9) + rekaman layar di ponsel 3D',
  'penutup-ai': 'Video AI penutup + kartu alamat',
  penutup: 'Layar penutup dengan pengungkapan',
};

const n = [];
n.push('# Naskah Narasi Final Video Demo PULIHIN');
n.push('');
n.push('> DIBUAT OTOMATIS dari `video/src/timeline.ts` oleh `npm run srt` (folder `video/`). Jangan disunting langsung: ubah teks di `timeline.ts`, lalu jalankan `npm run narasi && npm run scan && npm run srt`.');
n.push('');
n.push(`- Durasi: ${fmt(TOTAL_DETIK)} (batas 5:00), ${ADEGAN.length} adegan, 30 fps, 1920x1080.`);
n.push(`- **Jumlah kata narasi: ${totalKata} kata** (batas ${BATAS_KATA}). Suara aplikasi dan ucapan di video AI tidak dihitung.`);
n.push(`- Tempo: ${(totalKata / detikBicara).toFixed(2).replace('.', ',')} kata per detik bicara (${Math.round((totalKata / detikBicara) * 60)} kata per menit), tenang.`);
n.push(`- Waktu setiap baris = durasi audio terukur (${semua.length - belumTerukur.length}/${semua.length} baris terukur). Adegan sesi kamera: ${SESI_TERUKUR ? 'dijangkarkan pada peristiwa aplikasi asli di `video/data/sesi-meta.json` dan `video/data/suara-aplikasi.json`' : '**PERKIRAAN** (sesi-meta.json belum ada)'}: hitungan 5 pada detik ${SESI.repetisiDetik[4]} dan koreksi "${SESI.koreksi[0].teks}" pada detik ${SESI.koreksi[0].mulaiDetik} di dalam \`layar-02-sesi-tekuk-siku.mp4\`.`);
n.push('');
n.push('## Aturan');
n.push('');
n.push('- Video adalah bukti fungsi, bukan iklan (Bab 14). Setiap klaim yang diucapkan terlihat di layar dalam beberapa detik; kolom "Di layar" adalah buktinya.');
n.push(`- Adegan pasien dan keluarga = video AI (HeyGen). Label **${LABEL_AI}** tampil setiap kali orang AI terlihat, termasuk video kamera AI di layar ponsel. Tanpa dokter atau terapis rekaan, tanpa presenter AI.`);
n.push('- Layar aplikasi = rekaman ASLI aplikasi produksi. Sesi kamera: video POV AI diputar sebagai kamera Chrome; skeleton, hitungan, koreksi, dan skor dihasilkan aplikasi itu sendiri.');
n.push(`- Narasi: ElevenLabs Eleven v4 lewat OpenRouter, suara \`${NARATOR_SUARA}\` (dipilih lewat audisi banding), tag nada v4 di depan setiap baris. Suara aplikasi = klip ASLI aplikasi (Eleven v4, suara Matilda) yang diputar aplikasi saat direkam, dicampur pada detik yang tercatat, dengan warna speaker ponsel tipis. Narasi tidak pernah menimpa suara aplikasi yang penting (diperiksa \`npm run srt\`); hitungan repetisi boleh di bawah narasi dan dikecilkan.`);
n.push('- Angka hanya dari `docs/bahan-paper.md`, dengan label sumber di layar. Tanpa klaim diagnosis, prognosis, atau kesembuhan. PULIHIN adalah prototype kompetisi, bukan alat kesehatan teregulasi. "Pak Budi" dan "Rina" adalah nama samaran; semua data adalah data demo.');
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
    n.push(`**[${b.id}] ${NARATOR}** (${rentang(b.mulai, b.selesai)})`);
    n.push('');
    n.push(`> ${b.teksId}`);
    n.push('');
    n.push(`_Ucapan TTS:_ [${b.nada ?? 'warmly'}] ${b.ucapan}`, '');
    n.push(`_EN:_ ${b.teksEn}`);
    n.push('');
  }
  for (const s of a.suara) {
    const siapa = s.sumber === 'aplikasi' ? 'Suara aplikasi (klip asli)' : 'Ucapan di video AI';
    n.push(`- **${siapa}** ${fmt(s.ucapan[0])}: "${s.teks}"${s.penting ? '' : ' (hitungan, boleh di bawah narasi)'}`);
  }
  if (a.suara.length) n.push('');
  n.push(`- **Di layar:** ${a.diLayar}`);
  if (a.data) n.push(`- **Data:** ${a.data.keterangan} · ${a.data.sumber}`);
  if (a.teksLayar) n.push(`- **Teks penyunting:** "${a.teksLayar.utama}" / _${a.teksLayar.en}_${a.teksLayar.keterangan ? ` · ${a.teksLayar.keterangan}` : ''}`);
  if (a.sorot) n.push(`- **Label penunjuk di samping ponsel:** ${a.sorot.label}`);
  if (a.ai) n.push(`- **Label:** ${LABEL_AI}`);
  for (const s of [a.kamera, a.layar].filter(Boolean)) n.push(`- **Rekaman:** \`${s.berkas}\` mulai detik ${s.mulaiDi}${s.laju !== 1 ? `, laju ${s.laju}` : ''}`);
  if (a.momen) n.push(`- **Momen screenshot (${fmt(a.momen.detik)}):** ${a.momen.deskripsi}`);
  if (a.catatan) n.push(`- **Catatan:** ${a.catatan}`);
}
n.push('');
n.push('## Naskah utuh');
n.push('');
for (const b of semua) n.push(`${b.id}: ${b.teksId}`, '');
writeFileSync(join(docs, 'naskah-id.md'), `${n.join('\n').trimEnd()}\n`);

// ---------- Shotlist (blok otomatis) ----------
const manifest = JSON.parse(readFileSync(join(akar, 'src', 'footage-manifest.json'), 'utf8'));
const tabelBerkas = [
  '| Status | Berkas di `video/public/footage/` | Sumber | Dipakai di | Durasi minimal | Isi |',
  '|---|---|---|---|---|---|',
  ...daftarSlot().map((s) => {
    const butuh = Math.max(...s.adegan.map((a) => butuhSampai(a, a.kamera?.berkas === s.berkas ? a.kamera : a.layar)));
    const info = manifest.footage[s.berkas];
    const status = info ? (info.durasi != null && info.durasi + 0.05 < butuh ? '[!] terlalu pendek' : '[x]') : '[ ]';
    const sumber = s.slot.jenis === 'ai' ? 'FootageAI (HeyGen)' : OTOMATIS[s.berkas] ? (s.berkas === SESI.berkas.layar ? '`npm run rekam-sesi`' : '`npm run rekam-layar`') : '-';
    return `| ${status} | \`${s.berkas}\` | ${sumber} | ${s.adegan.map((a) => rentang(a.mulai, a.selesai)).join(', ')} | ${Math.ceil(butuh)} dtk | ${s.slot.rekam} |`;
  }),
];

const tabelShot = [
  '| Waktu | Adegan | Tata letak | Rekaman (mulai detik ke-) | Yang harus terlihat |',
  '|---|---|---|---|---|',
  ...ADEGAN.map((a) => {
    const rek = [a.kamera, a.layar]
      .filter(Boolean)
      .map((s) => `\`${s.berkas}\` @${s.mulaiDi}${s.laju !== 1 ? ` ×${s.laju}` : ''}`)
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

const tabelSuara = [
  '| Waktu | Adegan | Sumber | Teks | Penting |',
  '|---|---|---|---|---|',
  ...ADEGAN.flatMap((a) =>
    a.suara.map((s) => `| ${fmt(s.ucapan[0])} | ${a.id} | ${s.sumber === 'aplikasi' ? `klip aplikasi \`${s.src.split('/').pop()}\`` : 'video AI ai-07'} | ${s.teks} | ${s.penting ? 'ya' : 'hitungan'} |`),
  ),
];

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
isiBlok('shotlist.md', { BERKAS: tabelBerkas, SHOT: tabelShot, SUARA: tabelSuara, AUDIT: tabelAudit });

// ---------- YouTube: durasi, deskripsi dengan pengungkapan, bab ----------
const mss = (d) => `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}`;
const bab = ADEGAN.filter((a, i) => i === 0 || ADEGAN[i - 1].tahap !== a.tahap).map((a, i) => `${i === 0 ? '0:00' : mss(a.mulai)} ${a.tahap}`);
isiBlok('youtube.md', {
  DURASI: [`Durasi: **${mss(TOTAL_DETIK)}** (${TOTAL_DETIK.toFixed(1).replace('.', ',')} dtk, dari \`npm run srt\`).`],
  DESKRIPSI: [
    '```',
    'PULIHIN adalah prototype aplikasi web pendamping rehabilitasi stroke di rumah: kamera ponsel biasa menghitung repetisi latihan dan memberi koreksi gerakan dengan suara Bahasa Indonesia, diproses langsung di perangkat. Keluarga melihat kepatuhan dan tren skor, terapis menyusun program dari dashboard, dan pasien dengan afasia berlatih menyebut kata sehari-hari.',
    '',
    `Kategori lomba: ${KATEGORI} - ${SUBKATEGORI}`,
    `Coba prototype: https://${DOMAIN}/app`,
    '',
    'Penafian dan keterbukaan:',
    '- Prototype kompetisi, bukan alat kesehatan teregulasi, bukan alat diagnosis, dan bukan pengganti terapis.',
    '- Adegan pasien dan keluarga (Pak Budi dan Rina) adalah video buatan AI (HeyGen), bukan pasien sungguhan; label di layar setiap kali tampil. Video kamera di layar ponsel saat sesi latihan juga dibuat dengan AI, lalu diputar sebagai kamera ke aplikasi PULIHIN yang asli; skeleton, hitungan, koreksi, dan skor dihasilkan aplikasi itu sendiri.',
    '- Narasi: suara sintetis ElevenLabs Eleven v4.',
    '- Musik latar: dibuat dengan AI, Google Lyria 3 Pro.',
    `- Semua layar aplikasi adalah rekaman asli aplikasi yang berjalan di ${DOMAIN}. Suara aplikasi di video adalah klip suara aplikasi itu sendiri, pada detik yang sama saat aplikasi memutarnya.`,
    '- Data demo: "Pak Budi" dan "Rina" adalah nama samaran, dan seluruh data yang tampil adalah data demo.',
    '- Angka di awal video: Kemenkes (rilis 25 Okt 2024), Survei Kesehatan Indonesia 2023, Profil Kesehatan Indonesia 2023.',
    '',
    'Bab video:',
    ...bab,
    '',
    'Subtitle Bahasa Inggris dan Indonesia tersedia (CC).',
    ...(NAMA_TIM ? [`Tim: ${NAMA_TIM}`] : []),
    '```',
  ],
});

// ---------- Laporan ----------
console.log(`Naskah: ${totalKata} kata (batas ${BATAS_KATA}) -> docs/video/naskah-id.md`);
for (const b of ['en', 'id']) console.log(`SRT ${b}: ${ringkasSrt[b].jumlah} isyarat, terakhir berakhir ${fmt(ringkasSrt[b].akhir)} -> docs/video/subtitle-${b}.srt`);
console.log(`Suara aplikasi: ${klipAplikasi.length} pemutaran klip asli, ${penting.length} suara penting tanpa tertimpa narasi.`);
console.log(`Durasi video: ${fmt(TOTAL_DETIK)} (${(TOTAL_DETIK * FPS).toFixed(0)} frame)`);
for (const p of peringatan) console.log(`Peringatan: ${p}`);
if (salah.length) {
  console.error('\nGAGAL:');
  for (const s of salah) console.error(`  - ${s}`);
  process.exit(1);
}
console.log('Semua pemeriksaan lolos.');
