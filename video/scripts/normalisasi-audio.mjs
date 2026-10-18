// Normalisasi kenyaringan hasil render: -16 LUFS terintegrasi, linear (tanpa kompresi dinamika), puncak <= -1,5 dBTP.
// node scripts/normalisasi-audio.mjs out/pulihin-demo-final.mp4   (video disalin apa adanya, audio AAC 192 kbps 48 kHz)
import { spawnSync } from 'node:child_process';
import { renameSync } from 'node:fs';

const berkas = process.argv[2];
if (!berkas) throw new Error('pakai: node scripts/normalisasi-audio.mjs <video.mp4>');
const T = 'I=-16:TP=-1.5:LRA=11';

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg gagal (${r.status}): ${r.stderr.slice(-800)}`);
  return r.stderr;
}

// Lintasan 1: ukur.
const log = ffmpeg(['-i', berkas, '-af', `loudnorm=${T}:print_format=json`, '-f', 'null', '-']);
const m = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1));
// Lintasan 2: terapkan secara linear dengan nilai terukur.
const af =
  `loudnorm=${T}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}` +
  `:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const sementara = berkas.replace(/\.mp4$/, '.norm.mp4');
ffmpeg(['-y', '-i', berkas, '-c:v', 'copy', '-af', af, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', sementara]);
renameSync(sementara, berkas);
console.log(`${berkas}: ${m.input_i} LUFS -> -16 LUFS (puncak awal ${m.input_tp} dBTP)`);
