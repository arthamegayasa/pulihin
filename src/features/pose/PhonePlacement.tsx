import { DeviceMobile } from '@phosphor-icons/react';
import type { Posisi } from './types';

/**
 * Ilustrasi sederhana posisi ponsel: ponsel berdiri di meja, pasien di depannya, jarak ditandai.
 * Jarak mengikuti kondisi uji Bab 11.1: duduk 0,8-1,2 m, berdiri 1,5-2,5 m.
 */
export function PhonePlacement({ posisi, teks }: { posisi: Posisi; teks: string }) {
  const berdiri = posisi !== 'duduk';
  const jarak = berdiri ? '± 2 meter' : '± 1 meter';
  const primer = '#0b4f4a';
  const garis = '#9fb7b3';
  // Figur pasien: berdiri atau duduk di kursi, menghadap ponsel (ke kiri).
  const xOrang = 196;
  return (
    <section className="rounded-kartu border border-garis bg-white p-4 shadow-tipis">
      <h2 className="mb-2 flex items-center gap-2 text-[1.15rem] font-bold">
        <DeviceMobile size={26} weight="bold" className="text-primer" aria-hidden />
        Letak ponsel
      </h2>
      <svg viewBox="0 0 240 120" className="h-auto w-full" role="img" aria-label={`Ponsel di meja, pasien sekitar ${jarak} di depannya`}>
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          <line x1={8} y1={112} x2={232} y2={112} stroke="#c9dcd8" strokeWidth={3} />
          {/* meja */}
          <line x1={14} y1={64} x2={62} y2={64} stroke={garis} strokeWidth={5} />
          <line x1={20} y1={64} x2={20} y2={112} stroke={garis} strokeWidth={5} />
          <line x1={56} y1={64} x2={56} y2={112} stroke={garis} strokeWidth={5} />
          {/* ponsel berdiri, kamera menghadap pasien */}
          <rect x={44} y={34} width={9} height={28} rx={2.5} fill={primer} />
          <circle cx={52} cy={39} r={1.6} fill="#c46a1b" />
          {/* garis pandang kamera */}
          <line x1={58} y1={48} x2={xOrang - 18} y2={48} stroke="#c46a1b" strokeWidth={2} strokeDasharray="5 5" />
          <polyline points={`${xOrang - 24},43 ${xOrang - 18},48 ${xOrang - 24},53`} stroke="#c46a1b" strokeWidth={2} />
          {berdiri ? (
            <g stroke={primer}>
              <circle cx={xOrang} cy={22} r={7} fill={primer} stroke="none" />
              <line x1={xOrang} y1={32} x2={xOrang} y2={68} strokeWidth={9} />
              <polyline points={`${xOrang},68 ${xOrang - 2},90 ${xOrang},110`} strokeWidth={7} />
              <polyline points={`${xOrang},36 ${xOrang - 4},56 ${xOrang - 2},72`} strokeWidth={6} />
            </g>
          ) : (
            <g>
              <polyline points={`${xOrang + 14},50 ${xOrang + 14},82 ${xOrang - 12},82`} stroke={garis} strokeWidth={4} />
              <line x1={xOrang + 12} y1={82} x2={xOrang + 12} y2={112} stroke={garis} strokeWidth={4} />
              <line x1={xOrang - 10} y1={82} x2={xOrang - 10} y2={112} stroke={garis} strokeWidth={4} />
              <g stroke={primer}>
                <circle cx={xOrang + 4} cy={34} r={7} fill={primer} stroke="none" />
                <line x1={xOrang + 4} y1={44} x2={xOrang + 4} y2={76} strokeWidth={9} />
                <polyline points={`${xOrang + 4},77 ${xOrang - 18},77 ${xOrang - 18},108`} strokeWidth={7} />
                <polyline points={`${xOrang + 4},48 ${xOrang},64 ${xOrang - 8},72`} strokeWidth={6} />
              </g>
            </g>
          )}
          {/* penanda jarak */}
          <line x1={58} y1={100} x2={xOrang - 22} y2={100} stroke={primer} strokeWidth={1.5} />
          <line x1={58} y1={96} x2={58} y2={104} stroke={primer} strokeWidth={1.5} />
          <line x1={xOrang - 22} y1={96} x2={xOrang - 22} y2={104} stroke={primer} strokeWidth={1.5} />
        </g>
        <text x={(58 + xOrang - 22) / 2} y={94} textAnchor="middle" fontSize={11} fontWeight={700} fill={primer}>
          {jarak}
        </text>
      </svg>
      <p className="mt-2">{teks}</p>
    </section>
  );
}
