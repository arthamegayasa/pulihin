import { DeviceMobile } from '@phosphor-icons/react';
import type { ExerciseDefinition } from './types';

/**
 * Ilustrasi letak ponsel per latihan, diturunkan dari definisi (bukan teks tetap):
 * - Tampak samping: tinggi ponsel (lantai/lutut/pinggang/dada, dibaca dari `posisiPonsel`) dan jaraknya ke pasien.
 * - Tampak atas: ponsel tepat di depan (`arahKamera` 'depan') atau serong ± 45° ('serong').
 * Teks `posisiPonsel` tetap ditampilkan utuh sebagai acuan utama.
 */

const PRIMER = '#0b4f4a';
const AKSEN = '#c46a1b';
const GARIS = '#9fb7b3';
const TANAH = '#c9dcd8';

type Tinggi = 'lantai' | 'lutut' | 'pinggang' | 'dada';

/** Y layar (viewBox samping) untuk tiap tinggi ponsel; lantai = 112. */
const Y_TINGGI: Record<Tinggi, number> = { lantai: 104, lutut: 86, pinggang: 72, dada: 56 };

function bacaTinggi(teks: string): Tinggi {
  const t = teks.toLowerCase();
  if (t.includes('lantai')) return 'lantai';
  if (t.includes('lutut')) return 'lutut';
  if (t.includes('pinggang')) return 'pinggang';
  return 'dada';
}

export function PhonePlacement({ def }: { def: Pick<ExerciseDefinition, 'posisi' | 'posisiPonsel' | 'arahKamera'> }) {
  const teks = def.posisiPonsel;
  const berdiri = def.posisi !== 'duduk';
  const angkaJarak = /(\d+(?:,\d+)?)\s*meter/.exec(teks)?.[1];
  const jarak = angkaJarak ? `${angkaJarak} m` : berdiri ? '± 2 m' : '± 1 m';
  const serong = def.arahKamera === 'serong';
  const tinggi = bacaTinggi(teks);
  const yPonsel = Y_TINGGI[tinggi];
  const xOrang = 198;
  const xPonsel = 50;
  const yMata = berdiri ? 30 : 46;
  // Tampak atas: ponsel di depan pasien, atau diputar 45° pada lingkaran berjari-jari sama (pusat = kepala).
  const sudutAtas = serong ? Math.PI / 4 : 0;
  const atas = {
    x: 60 + Math.sin(sudutAtas) * 70,
    y: 25 + Math.cos(sudutAtas) * 70,
    putar: (-sudutAtas * 180) / Math.PI,
    busurX: 60 + Math.sin(sudutAtas) * 47,
    busurY: 25 + Math.cos(sudutAtas) * 47,
  };

  return (
    <section className="rounded-kartu border border-garis bg-white p-4 shadow-tipis">
      <h2 className="mb-3 flex items-center gap-2 text-[1.15rem] font-bold">
        <DeviceMobile size={26} weight="bold" className="text-primer" aria-hidden />
        Letak ponsel
      </h2>
      {/* Isi aliran figure = SVG + padding bawah (ruang setengah label jarak), jadi posisi label dihitung dari koordinat SVG. Pojok kiri atas gambar selalu kosong. */}
      <figure className="relative pb-[0.9rem]">
        <figcaption className="absolute left-0 top-0 text-[0.95rem] font-bold leading-snug">Dari samping</figcaption>
        <svg viewBox="0 0 240 122" className="h-auto w-full" role="img" aria-label={`Tampak samping: ponsel setinggi ${tinggi}, sekitar ${jarak} dari pasien`}>
          <g strokeLinecap="round" strokeLinejoin="round" fill="none">
            <line x1={8} y1={112} x2={232} y2={112} stroke={TANAH} strokeWidth={3} />
            {/* penyangga ponsel setinggi yang diminta */}
            {tinggi !== 'lantai' && (
              <>
                <line x1={28} y1={yPonsel + 14} x2={66} y2={yPonsel + 14} stroke={GARIS} strokeWidth={5} />
                <line x1={33} y1={yPonsel + 14} x2={33} y2={112} stroke={GARIS} strokeWidth={4} />
                <line x1={61} y1={yPonsel + 14} x2={61} y2={112} stroke={GARIS} strokeWidth={4} />
              </>
            )}
            <rect x={xPonsel - 5} y={yPonsel - 13} width={10} height={26} rx={2.5} fill={PRIMER} />
            <circle cx={xPonsel + 3} cy={yPonsel - 8} r={1.6} fill={AKSEN} />
            {/* sudut pandang kamera */}
            <polygon points={`${xPonsel + 6},${yPonsel - 4} ${xOrang - 16},${yMata - 22} ${xOrang - 16},112`} fill={AKSEN} opacity={0.08} />
            <line x1={xPonsel + 6} y1={yPonsel - 4} x2={xOrang - 18} y2={yPonsel - 4} stroke={AKSEN} strokeWidth={2} strokeDasharray="5 5" />
            {berdiri ? (
              <g stroke={PRIMER}>
                <circle cx={xOrang} cy={18} r={7.5} fill={PRIMER} stroke="none" />
                <line x1={xOrang} y1={28} x2={xOrang} y2={66} strokeWidth={11} />
                <polyline points={`${xOrang},66 ${xOrang - 2},88 ${xOrang},108`} strokeWidth={8} />
                <polyline points={`${xOrang - 6},108 ${xOrang - 1},108`} strokeWidth={6} />
                <polyline points={`${xOrang},32 ${xOrang - 3},52 ${xOrang - 1},68`} strokeWidth={6.5} stroke="#0e6a63" />
              </g>
            ) : (
              <g>
                <rect x={xOrang + 12} y={46} width={6} height={42} rx={3} fill={GARIS} />
                <rect x={xOrang - 14} y={83} width={32} height={6} rx={3} fill={GARIS} />
                <line x1={xOrang + 14} y1={86} x2={xOrang + 14} y2={112} stroke={GARIS} strokeWidth={4} />
                <line x1={xOrang - 10} y1={86} x2={xOrang - 10} y2={112} stroke={GARIS} strokeWidth={4} />
                <g stroke={PRIMER}>
                  <circle cx={xOrang + 3} cy={33} r={7.5} fill={PRIMER} stroke="none" />
                  <line x1={xOrang + 3} y1={44} x2={xOrang + 3} y2={78} strokeWidth={11} />
                  <polyline points={`${xOrang + 3},79 ${xOrang - 18},79 ${xOrang - 18},106`} strokeWidth={8} />
                  <polyline points={`${xOrang - 24},107 ${xOrang - 17},107`} strokeWidth={6} />
                  <polyline points={`${xOrang + 3},48 ${xOrang},64 ${xOrang - 9},74`} strokeWidth={6.5} stroke="#0e6a63" />
                </g>
              </g>
            )}
            {/* penanda jarak */}
            <line x1={xPonsel + 8} y1={118} x2={xOrang - 24} y2={118} stroke={PRIMER} strokeWidth={1.5} />
            <line x1={xPonsel + 8} y1={114} x2={xPonsel + 8} y2={120} stroke={PRIMER} strokeWidth={1.5} />
            <line x1={xOrang - 24} y1={114} x2={xOrang - 24} y2={120} stroke={PRIMER} strokeWidth={1.5} />
          </g>
        </svg>
        {/* Label jarak sebagai teks HTML (>= 0,95rem, ikut Huruf Lebih Besar), tepat di tengah garis ukur y=118. */}
        <span
          className="tabular absolute whitespace-nowrap rounded-full border border-garis bg-white px-2.5 text-[1rem] font-extrabold leading-snug text-primer"
          style={{
            left: `${((xPonsel + 8 + xOrang - 24) / 2 / 240) * 100}%`,
            top: `calc((100% - 0.9rem) * ${(118 / 122).toFixed(4)})`,
            transform: 'translate(-50%, -50%)',
          }}
          aria-hidden
        >
          {jarak}
        </span>
      </figure>

      <figure className="mt-2 flex items-center gap-3 rounded-xl bg-primer-terang p-2">
        <svg viewBox="0 0 120 112" className="h-auto w-24 shrink-0" role="img" aria-label={serong ? 'Tampak atas: ponsel serong sekitar 45 derajat' : 'Tampak atas: ponsel tepat di depan'}>
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* pasien dari atas (bahu + kepala), menghadap ke bawah gambar */}
            {!berdiri && <rect x={42} y={6} width={36} height={22} rx={5} fill={GARIS} opacity={0.6} />}
            <ellipse cx={60} cy={24} rx={20} ry={7} fill={PRIMER} />
            <circle cx={60} cy={25} r={7} fill="#0e6a63" stroke="#ffffff" strokeWidth={1.5} />
            {/* garis arah hadap */}
            <line x1={60} y1={36} x2={60} y2={98} stroke={TANAH} strokeWidth={1.5} strokeDasharray="3 4" />
            <polygon points={`${atas.x},${atas.y} 42,30 78,30`} fill={AKSEN} opacity={0.12} />
            <line x1={atas.x} y1={atas.y} x2={60} y2={30} stroke={AKSEN} strokeWidth={2} strokeDasharray="4 4" />
            <rect x={atas.x - 9} y={atas.y - 3} width={18} height={6} rx={2} fill={PRIMER} transform={`rotate(${atas.putar} ${atas.x} ${atas.y})`} />
            {serong && <path d={`M60 72 A47 47 0 0 0 ${atas.busurX} ${atas.busurY}`} fill="none" stroke={AKSEN} strokeWidth={1.5} />}
          </g>
        </svg>
        <figcaption className="text-[0.95rem] leading-snug">
          <span className="block font-bold">Dari atas</span>
          {serong ? 'Ponsel serong ± 45° ke arah sisi yang dilatih.' : 'Ponsel tepat di depan Anda.'}
        </figcaption>
      </figure>
      <p className="mt-3">{teks}</p>
    </section>
  );
}
