// Satu perintah per latihan: bangun adegan, render, encode aset aplikasi, lembar tinjauan.
//
//   node peraga3d/buat.mjs <id> [--uji] [--dasar] [--lewati-render] [--sampel N]
//   node peraga3d/buat.mjs <id> --kartu [--lewati-render] [--sampel N]
//
//   <id>              id latihan (src/features/pose/exerciseDefinitions.ts), modul peraga3d/latihan/<id_>.py
//   --uji             render cepat (sampel rendah, hanya frame strip/tengah/puncak + close-up otot) -> out/<id>/uji/,
//                     tanpa menulis public/peraga
//   --dasar           bangun ulang karakter dasar (out/dasar.blend; otomatis bila belum ada)
//   --lewati-render   pakai frame yang sudah ada di out/<id>/frames (encode ulang saja)
//   --kartu           gambar kecil daftar latihan dari adegan yang sudah ada (out/<id>/adegan.blend): satu frame
//                     puncak, sorot otot penuh, latar rata #EEF4F2, bingkai rapat (peraga3d/kartu.py)
//                     -> public/peraga/<id>-kartu.webp 256x256 <= 15 KB; video & poster tidak disentuh
//
// Keluaran penuh (kontrak src/features/pose/VideoPeraga.tsx):
//   public/peraga/<id>.mp4          720x720, 30 fps, satu siklus loop mulus, H.264 main yuv420p faststart tanpa audio, <= 400 KB
//   public/peraga/<id>-mulai.webp   frame 1, <= 40 KB
//   public/peraga/<id>-puncak.webp  tengah fase tahan, <= 40 KB
// Tinjauan: out/<id>/lembar.png (mulai | tengah naik | puncak | close-up sorot otot), out/<id>/strip.png (8 frame),
//           out/<id>/laporan.json (ukuran, crf/kualitas terpilih, waktu render, pemeriksaan sorot otot).
// Kartu: out/<id>/kartu/kartu.png (512 px), kartu.json (kamera, warna sudut), laporan-kartu.json.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BLENDER = process.env.BLENDER ?? 'D:/Tools/blender/blender.exe';
const DIR = import.meta.dirname;
const PUBLIK = join(DIR, '..', 'public', 'peraga');
const FONT = 'C\\:/Windows/Fonts/segoeui.ttf';
const BATAS_MP4 = 400 * 1024;
const BATAS_WEBP = 40 * 1024;
const BATAS_KARTU = 15 * 1024;
const SISI_KARTU = 256;

const argv = process.argv.slice(2);
const id = argv.find((a) => !a.startsWith('--'));
if (!id) throw new Error('pakai: node peraga3d/buat.mjs <id> [--uji | --kartu] [--dasar] [--lewati-render] [--sampel N]');
const uji = argv.includes('--uji');
const sampelIdx = argv.indexOf('--sampel');
const sampel = sampelIdx >= 0 ? ['--sampel', argv[sampelIdx + 1]] : [];
const AKAR = join(DIR, 'out', id);

const jalankan = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const blender = (...args) => jalankan(BLENDER, ['-b', '--python-exit-code', '1', ...args]);
const ffmpeg = (...args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const nomor = (f) => String(f).padStart(4, '0');
const kb = (p) => +(statSync(p).size / 1024).toFixed(1);

const t0 = Date.now();
const dasar = join(DIR, 'out', 'dasar.blend');
if (argv.includes('--dasar') || (!existsSync(dasar) && !(argv.includes('--kartu') && existsSync(join(AKAR, 'adegan.blend'))))) {
  blender('-P', join(DIR, 'dasar.py'));
}
if (argv.includes('--kartu')) {
  buatKartu();
  process.exit(0);
}
if (!argv.includes('--lewati-render')) {
  blender(dasar, '-P', join(DIR, 'adegan.py'), '--', '--id', id);
  blender(join(AKAR, 'adegan.blend'), '-P', join(DIR, 'render.py'), '--', '--id', id, ...(uji ? ['--uji'] : []), ...sampel);
}
const info = JSON.parse(readFileSync(join(AKAR, 'info.json'), 'utf8'));
const FR = join(AKAR, uji ? 'uji' : 'frames');
const frame = (f) => join(FR, `${nomor(f)}.png`);

// ---- lembar tinjauan ----
const sel = 360;
const label = (teks) => `drawtext=fontfile='${FONT}':text='${teks}':fontsize=22:fontcolor=0x1d2b2a:box=1:boxcolor=0xffffffcc:boxborderw=6:x=10:y=10`;
ffmpeg(
  '-i', frame(info.frameMulai), '-i', frame(info.frameTengah), '-i', frame(info.framePuncak), '-i', join(FR, 'otot.png'),
  '-filter_complex',
  [
    `[0:v]scale=${sel}:${sel},${label('Mulai (f' + info.frameMulai + ')')}[a]`,
    `[1:v]scale=${sel}:${sel},${label('Tengah naik (f' + info.frameTengah + ')')}[b]`,
    `[2:v]scale=${sel}:${sel},${label('Puncak (f' + info.framePuncak + ')')}[c]`,
    `[3:v]scale=${sel}:${sel},${label('Sorot otot (dekat)')}[d]`,
    '[a][b]hstack[ab];[c][d]hstack[cd];[ab][cd]vstack',
  ].join(';'),
  '-frames:v', '1', join(AKAR, uji ? 'lembar-uji.png' : 'lembar.png'),
);
ffmpeg(
  ...info.strip.flatMap((f) => ['-i', frame(f)]),
  '-filter_complex',
  info.strip.map((f, i) => `[${i}:v]scale=270:270,${label('f' + f).replace('fontsize=22', 'fontsize=18')}[s${i}]`).join(';') +
    ';' + info.strip.map((_, i) => `[s${i}]`).join('') + `xstack=inputs=8:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0`,
  '-frames:v', '1', join(AKAR, uji ? 'strip-uji.png' : 'strip.png'),
);

const laporan = { id, siklus: info.siklus, tempo: info.tempo, jumlahFrame: info.jumlahFrame, framePuncak: info.framePuncak };
const waktu = JSON.parse(readFileSync(join(FR, 'waktu.json'), 'utf8'));
const dtk = Object.values(waktu.frame);
laporan.render = {
  sampel: waktu.sampel,
  perangkat: waktu.perangkat,
  frame: dtk.length,
  totalDetik: waktu.totalDetik,
  detikPerFrameRerata: +(dtk.reduce((a, b) => a + b, 0) / dtk.length).toFixed(2),
  detikPerFrameMaks: Math.max(...dtk),
};
laporan.sorot = waktu.sorot;

if (!uji) {
  for (let f = info.frameMulai; f < info.frameMulai + info.jumlahFrame; f++) {
    if (!existsSync(frame(f))) throw new Error(`frame hilang: ${frame(f)}`);
  }
  mkdirSync(PUBLIK, { recursive: true });
  // MP4: crf terkecil (kualitas tertinggi) yang masih <= 400 KB.
  const mp4 = join(PUBLIK, `${id}.mp4`);
  let crf = 16;
  for (;; crf++) {
    ffmpeg(
      '-framerate', '30', '-start_number', String(info.frameMulai), '-i', join(FR, '%04d.png'), '-frames:v', String(info.jumlahFrame),
      '-c:v', 'libx264', '-preset', 'veryslow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-profile:v', 'main',
      '-g', String(info.jumlahFrame), '-movflags', '+faststart', '-an', mp4,
    );
    if (statSync(mp4).size <= BATAS_MP4 || crf >= 35) break;
  }
  if (statSync(mp4).size > BATAS_MP4) throw new Error(`${mp4} melebihi 400 KB`);
  laporan.mp4 = { kb: kb(mp4), crf };
  // Poster WebP: kualitas tertinggi yang <= 40 KB.
  for (const [nama, f] of [['mulai', info.frameMulai], ['puncak', info.framePuncak]]) {
    const keluar = join(PUBLIK, `${id}-${nama}.webp`);
    let q = 92;
    for (;; q -= 4) {
      ffmpeg('-i', frame(f), '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', '-preset', 'picture', keluar);
      if (statSync(keluar).size <= BATAS_WEBP || q <= 40) break;
    }
    if (statSync(keluar).size > BATAS_WEBP) throw new Error(`${keluar} melebihi 40 KB`);
    laporan[`webp_${nama}`] = { kb: kb(keluar), kualitas: q };
  }
  // Verifikasi kontrak dengan ffprobe.
  const probe = JSON.parse(
    execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4], { encoding: 'utf8' }),
  );
  const v = probe.streams.find((s) => s.codec_type === 'video');
  laporan.mp4.probe = {
    ukuran: `${v.width}x${v.height}`, codec: v.codec_name, profil: v.profile, pix: v.pix_fmt, fps: v.r_frame_rate,
    frame: +v.nb_frames, durasi: +probe.format.duration, audio: probe.streams.some((s) => s.codec_type === 'audio'),
  };
  if (v.width !== 720 || v.height !== 720 || v.profile !== 'Main' || v.pix_fmt !== 'yuv420p' || laporan.mp4.probe.audio) {
    throw new Error(`mp4 tidak sesuai kontrak: ${JSON.stringify(laporan.mp4.probe)}`);
  }
  rmSync(join(AKAR, 'uji'), { recursive: true, force: true });
}
laporan.totalDetikPipa = Math.round((Date.now() - t0) / 1000);
writeFileSync(join(AKAR, uji ? 'laporan-uji.json' : 'laporan.json'), JSON.stringify(laporan, null, 2));
console.log(JSON.stringify(laporan, null, 2));

function buatKartu() {
  const KR = join(AKAR, 'kartu');
  if (!argv.includes('--lewati-render')) {
    if (!existsSync(join(AKAR, 'adegan.blend'))) blender(dasar, '-P', join(DIR, 'adegan.py'), '--', '--id', id);
    blender(join(AKAR, 'adegan.blend'), '-P', join(DIR, 'kartu.py'), '--', '--id', id, ...sampel);
  }
  mkdirSync(PUBLIK, { recursive: true });
  const keluar = join(PUBLIK, `${id}-kartu.webp`);
  let q = 90;
  for (;; q -= 4) {
    ffmpeg(
      '-i', join(KR, 'kartu.png'), '-vf', `scale=${SISI_KARTU}:${SISI_KARTU}:flags=lanczos`,
      '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', '-preset', 'picture', keluar,
    );
    if (statSync(keluar).size <= BATAS_KARTU || q <= 40) break;
  }
  if (statSync(keluar).size > BATAS_KARTU) throw new Error(`${keluar} melebihi 15 KB`);
  // Verifikasi: ukuran 256x256 dan sudut kiri atas = latar #EEF4F2 (selisih <= 3 per kanal).
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', keluar], { encoding: 'utf8' }));
  const { width, height } = probe.streams[0];
  const sudut = execFileSync('ffmpeg', ['-v', 'error', '-i', keluar, '-vf', 'crop=4:4:2:2,scale=1:1:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  const latar = [...sudut.subarray(0, 3)];
  const selisih = Math.max(...latar.map((c, i) => Math.abs(c - [0xee, 0xf4, 0xf2][i])));
  if (width !== SISI_KARTU || height !== SISI_KARTU || selisih > 3) {
    throw new Error(`kartu tidak sesuai kontrak: ${width}x${height}, latar ${latar}`);
  }
  const laporan = { id, kb: kb(keluar), kualitas: q, ukuran: `${width}x${height}`, latarSudut: latar,
    render: JSON.parse(readFileSync(join(KR, 'kartu.json'), 'utf8')) };
  writeFileSync(join(AKAR, 'laporan-kartu.json'), JSON.stringify(laporan, null, 2));
  console.log(JSON.stringify(laporan, null, 2));
}
