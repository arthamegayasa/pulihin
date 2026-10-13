// Membangun dari src/timeline.ts:
//   docs/video/subtitle-en.srt, docs/video/subtitle-id.srt,
//   docs/video/naskah-id.md (seluruhnya),
//   blok OTOMATIS di docs/video/shotlist.md (tabel berkas, shot, audit jeda 30 detik).
// Gagal (exit 1) bila naskah > 650 kata, isyarat melanggar aturan keterbacaan,
// video > 300 detik, atau ada jendela 30 detik tanpa momen screenshot.
// Jalankan: npm run srt
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADEGAN,
  ADEGAN_TERAPIS,
  FADE_FRAME,
  FPS,
  LABEL_PEMERAN,
  TOTAL_DETIK,
  dibacakan,
  daftarSlot,
  namaStill,
} from '../src/timeline.ts';
import { buatIsyarat, keSrt, periksaIsyarat, rentangBicara } from '../src/subtitle.ts';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(akar, '..', 'docs', 'video');
mkdirSync(docs, { recursive: true });

const BATAS_DETIK = 300;
const BATAS_KATA = 650;
const salah = [];

// ---------- Waktu ----------
const fmt = (detik) => {
  const m = Math.floor(detik / 60);
  const s = detik - m * 60;
  const utuh = Math.abs(s - Math.round(s)) < 1e-9;
  const teks = utuh ? String(Math.round(s)).padStart(2, '0') : s.toFixed(1).padStart(4, '0').replace('.', ',');
  return `${m}:${teks}`;
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

// ---------- Hitung kata ----------
const hitungKata = (teks) => teks.split(/\s+/).filter((k) => /[\p{L}\p{N}]/u.test(k)).length;
const barisDibacakan = ADEGAN.flatMap((a) => a.narasi.filter(dibacakan));
const totalKata = barisDibacakan.reduce((s, b) => s + hitungKata(b.teksId), 0);
if (totalKata > BATAS_KATA) salah.push(`Naskah ${totalKata} kata > ${BATAS_KATA}`);
const kataPer = (p) =>
  barisDibacakan.filter((b) => b.pembicara === p).reduce((s, b) => s + hitungKata(b.teksId), 0);
const detikBicara = ADEGAN.reduce(
  (s, a) => s + a.narasi.filter(dibacakan).reduce((t, b) => {
    const [m, e] = rentangBicara(a, b);
    return t + (e - m);
  }, 0),
  0,
);

// Tempo per baris: peringatan bila terlalu cepat untuk dibaca tenang.
const peringatan = [];
for (const a of ADEGAN) {
  for (const b of a.narasi.filter(dibacakan)) {
    const [m, e] = rentangBicara(a, b);
    const tempo = hitungKata(b.teksId) / (e - m);
    if (tempo > 2.8) peringatan.push(`${b.id}: ${tempo.toFixed(2)} kata/dtk (terlalu cepat?)`);
  }
}

// ---------- Naskah ----------
const NAMA_TATA = {
  'judul-dokter': 'Talking head dokter + judul',
  dokter: 'Talking head dokter',
  broll: 'B-roll penuh layar + kalimat kunci',
  ponsel: 'Rekaman layar dalam bingkai ponsel + kalimat kunci',
  split: 'Shot lebar pemeran + rekaman layar dalam bingkai ponsel',
  penutup: 'Layar penutup statis',
};

const naskah = [];
naskah.push('# Naskah Narasi Final Video Demo PULIHIN');
naskah.push('');
naskah.push('> Berkas ini DIBUAT OTOMATIS dari `video/src/timeline.ts` oleh `npm run srt` (di folder `video/`). Jangan disunting langsung: ubah teks atau timecode di `timeline.ts`, lalu jalankan ulang.');
naskah.push('');
naskah.push(`- Durasi: ${fmt(TOTAL_DETIK)} (batas 5:00), ${ADEGAN.length} adegan, 30 fps, 1920x1080.`);
naskah.push(`- **Jumlah kata narasi: ${totalKata} kata** (batas ${BATAS_KATA}). Dokter ${kataPer('Dokter (di kamera)') + kataPer('Dokter (suara, di atas b-roll)')} kata, Narator ${kataPer('Narator (voice-over)')} kata. Baris "Suara aplikasi" tidak dihitung karena berasal dari rekaman aplikasi.`);
naskah.push(`- Tempo rata-rata: ${(totalKata / detikBicara).toFixed(2).replace('.', ',')} kata per detik bicara (${Math.round((totalKata / detikBicara) * 60)} kata per menit), sengaja tenang untuk penonton medis dan memberi ruang bagi suara aplikasi.`);
naskah.push(`- Adegan 4:00–4:25 memakai varian **${ADEGAN_TERAPIS}** (\`ADEGAN_TERAPIS\` di timeline.ts: \`klinisi\` bila dashboard klinisi P1 selesai, \`streak\` bila belum).`);
naskah.push('');
naskah.push('## Aturan baca');
naskah.push('');
naskah.push('- Video adalah bukti fungsi, bukan iklan (Bab 14). Setiap klaim yang diucapkan terlihat di layar dalam beberapa detik; kolom "Di layar" adalah buktinya. Bila rekaman tidak menampilkan hal itu, ubah narasinya, jangan menempel teks palsu.');
naskah.push('- Tanpa klaim diagnosis, prognosis, atau kesembuhan. PULIHIN adalah prototype kompetisi, bukan alat kesehatan teregulasi.');
naskah.push(`- Pasien demo "Pak Budi, 58 tahun" adalah nama samaran. Semua orang yang tampil sebagai pasien adalah pemeran: label **${LABEL_PEMERAN}** tampil di layar, diucapkan pada 0:50–1:02, dan ditulis di deskripsi YouTube.`);
naskah.push('- Pembicara: **Dokter (di kamera)** = talking head; **Dokter (suara, di atas b-roll)** = suara dokter direkam terpisah, diputar di atas b-roll; **Narator (voice-over)** = suara narator (boleh dokter yang sama atau anggota tim); **Suara aplikasi** = suara TTS aplikasi dari rekaman layar, tidak dibacakan.');
naskah.push('- Baca pelan dan hangat. Timecode bicara adalah target; setelah narasi direkam, isi `mulai`/`selesai` di timeline.ts agar subtitle mengikuti potongan final.');
naskah.push('');
naskah.push('## Naskah per adegan');
for (const a of ADEGAN) {
  naskah.push('');
  naskah.push(`### ${rentang(a.mulai, a.selesai)} · ${a.judul}`);
  naskah.push('');
  naskah.push(`\`${a.id}\` · Tahap: ${a.tahap} · Tata letak: ${NAMA_TATA[a.tata]}`);
  naskah.push('');
  if (a.narasi.length === 0) naskah.push('_(Tanpa narasi.)_');
  for (const b of a.narasi) {
    const [m, e] = rentangBicara(a, b);
    const ket = dibacakan(b) ? '' : ', tidak dibacakan';
    naskah.push(`**[${b.id}] ${b.pembicara}${ket}** (${rentang(m, e)})`);
    naskah.push('');
    naskah.push(`> ${b.teksId}`);
    naskah.push('');
    naskah.push(`_EN:_ ${b.teksEn}`);
    naskah.push('');
  }
  naskah.push(`- **Di layar:** ${a.diLayar}`);
  if (a.teksLayar) naskah.push(`- **Teks penyunting:** "${a.teksLayar.utama}" / _${a.teksLayar.en}_${a.teksLayar.keterangan ? ` · ${a.teksLayar.keterangan}` : ''}`);
  if (a.sorot) naskah.push(`- **Label penunjuk di samping ponsel:** ${a.sorot.label}`);
  if (a.pemeran) naskah.push(`- **Label:** ${LABEL_PEMERAN}`);
  if (a.momen) naskah.push(`- **Momen screenshot (${fmt(a.momen.detik)}):** ${a.momen.deskripsi}`);
  if (a.catatan) naskah.push(`- **Catatan:** ${a.catatan}`);
}
naskah.push('');
naskah.push('## Naskah utuh (untuk dibaca saat rekam suara)');
naskah.push('');
for (const a of ADEGAN) {
  for (const b of a.narasi.filter(dibacakan)) naskah.push(`${b.id} · ${b.pembicara}: ${b.teksId}`, '');
}
writeFileSync(join(docs, 'naskah-id.md'), `${naskah.join('\n').trimEnd()}\n`);

// ---------- Shotlist (blok otomatis) ----------
const tabelBerkas = [
  '| Berkas di `video/public/footage/` | Jenis | Dipakai di | Durasi minimal | Isi rekaman |',
  '|---|---|---|---|---|',
  ...daftarSlot().map((s) => {
    const butuh = Math.max(
      ...s.adegan.map((a) => {
        const sl = a.kamera?.berkas === s.berkas ? a.kamera : a.layar;
        return sl.mulaiDi + (a.selesai - a.mulai) + FADE_FRAME / FPS;
      }),
    );
    const jenis = s.slot.jenis === 'layar' ? 'Rekaman layar 1080x2400, tegak' : 'Kamera 1920x1080, mendatar';
    return `| \`${s.berkas}\` | ${jenis} | ${s.adegan.map((a) => rentang(a.mulai, a.selesai)).join(', ')} | ${Math.ceil(butuh)} dtk | ${s.slot.rekam} |`;
  }),
];

const tabelShot = [
  '| Waktu | Adegan | Tata letak | Rekaman (diambil mulai detik ke-) | Yang harus terlihat |',
  '|---|---|---|---|---|',
  ...ADEGAN.map((a) => {
    const rek = [a.kamera, a.layar]
      .filter(Boolean)
      .map((s) => `\`${s.berkas}\` @${s.mulaiDi}`)
      .join(' + ');
    return `| ${rentang(a.mulai, a.selesai)} | ${a.judul} | ${NAMA_TATA[a.tata]} | ${rek || '(dibuat di Remotion)'} | ${a.diLayar} |`;
  }),
];

const tabelAudit = [
  '| Jendela | Jeda di | Adegan | Yang harus terlihat saat dijeda | Still (`video/out/stills/`) | Lolos |',
  '|---|---|---|---|---|---|',
];
for (let w = 0; w < TOTAL_DETIK; w += 30) {
  const akhir = Math.min(w + 30, TOTAL_DETIK);
  const momen = ADEGAN.filter((a) => a.momen && a.momen.detik >= w && a.momen.detik < akhir);
  if (momen.length === 0) {
    salah.push(`Jendela ${rentang(w, akhir)} tanpa momen screenshot (Bab 14.2)`);
    tabelAudit.push(`| ${rentang(w, akhir)} | - | - | **TIDAK ADA MOMEN: perbaiki** | - | [ ] |`);
  }
  for (const a of momen) {
    tabelAudit.push(`| ${rentang(w, akhir)} | ${fmt(a.momen.detik)} | ${a.judul} | ${a.momen.deskripsi} | \`${namaStill(a.momen.detik)}\` | [ ] |`);
  }
}

const jalurShotlist = join(docs, 'shotlist.md');
if (existsSync(jalurShotlist)) {
  let isi = readFileSync(jalurShotlist, 'utf8');
  const ganti = (nama, baris) => {
    const pola = new RegExp(`(<!-- OTOMATIS:${nama} -->)[\\s\\S]*?(<!-- /OTOMATIS:${nama} -->)`);
    if (!pola.test(isi)) {
      salah.push(`shotlist.md tidak punya penanda <!-- OTOMATIS:${nama} -->`);
      return;
    }
    isi = isi.replace(pola, `$1\n${baris.join('\n')}\n$2`);
  };
  ganti('BERKAS', tabelBerkas);
  ganti('SHOT', tabelShot);
  ganti('AUDIT', tabelAudit);
  writeFileSync(jalurShotlist, isi);
} else {
  peringatan.push('docs/video/shotlist.md belum ada; blok otomatis dilewati');
}

// ---------- Laporan ----------
console.log(`Naskah: ${totalKata} kata (batas ${BATAS_KATA}) -> docs/video/naskah-id.md`);
for (const b of ['en', 'id']) {
  console.log(`SRT ${b}: ${ringkasSrt[b].jumlah} isyarat, terakhir berakhir ${fmt(ringkasSrt[b].akhir)} -> docs/video/subtitle-${b}.srt`);
}
console.log(`Durasi video: ${fmt(TOTAL_DETIK)}`);
for (const p of peringatan) console.log(`Peringatan: ${p}`);
if (salah.length) {
  console.error('\nGAGAL:');
  for (const s of salah) console.error(`  - ${s}`);
  process.exit(1);
}
console.log('Semua pemeriksaan lolos.');
