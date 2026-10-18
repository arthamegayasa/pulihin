import type React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { FPS, type Adegan } from '../timeline.ts';
import { FONT, KIRI, WARNA } from '../theme.ts';
import { VideoAI } from './Tata.tsx';

const formatAngka = (n: number, desimal: number, ribuan: boolean): string => {
  const teks = n.toFixed(desimal).replace('.', ',');
  return ribuan ? teks.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : teks;
};

/** Muncul naik pelan dengan fade (detik relatif adegan). */
const useNaik = (mulai: number, lama = 0.8) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [mulai * FPS, (mulai + lama) * FPS], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  return { opacity: p, transform: `translateY(${(1 - p) * 24}px)` };
};

/**
 * Tipografi data bersumber di atas video AI tanpa orang (ruang tamu pagi): angka besar yang menghitung naik,
 * keterangan, baris pendukung, dan label sumber yang selalu terlihat. Angka persen diberi cincin proporsi.
 * Video latar berjalan bersambung antar adegan data (slot 'lanjut'); teksnya parallax pelan.
 */
export const DataFakta: React.FC<{ adegan: Adegan; durasiFrame: number }> = ({ adegan, durasiFrame }) => {
  const frame = useCurrentFrame();
  const d = adegan.data!;
  const naik = interpolate(frame, [0.4 * FPS, 2.2 * FPS], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const nilai = d.nilai * naik;
  const persen = d.akhiran === '%';
  const geser = interpolate(frame, [0, durasiFrame], [0, -18], { extrapolateRight: 'clamp' });
  const angka = useNaik(0.3, 0.9);
  const ket = useNaik(0.9);
  const dukung = useNaik(1.6);
  const sumber = useNaik(1.2);
  const tahap = useNaik(0);
  const cincin = useNaik(0.2, 1.1);
  const r = 170;
  const keliling = 2 * Math.PI * r;
  return (
    <AbsoluteFill style={{ backgroundColor: WARNA.malam, fontFamily: FONT, color: WARNA.putih }}>
      {adegan.kamera ? <VideoAI slot={adegan.kamera} durasiFrame={durasiFrame} dorong={0.02} geser={6} /> : null}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(8,24,23,0.93) 0%, rgba(8,24,23,0.84) 46%, rgba(8,24,23,0.45) 78%, rgba(8,24,23,0.30) 100%)',
        }}
      />
      <AbsoluteFill style={{ transform: `translateX(${geser}px)` }}>
        <div
          style={{
            position: 'absolute',
            left: KIRI,
            top: 156,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: WARNA.aksenTerang,
            ...tahap,
          }}
        >
          <span style={{ width: 34, height: 3, borderRadius: 2, backgroundColor: WARNA.aksenTerang }} />
          {adegan.tahap}
        </div>
        <div
          style={{
            position: 'absolute',
            left: KIRI - 8,
            top: 236,
            fontSize: 290,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
            ...angka,
          }}
        >
          {formatAngka(nilai, d.desimal, d.pemisahRibuan ?? false)}
          <span style={{ fontSize: 160, marginLeft: 6, color: WARNA.aksenTerang }}>{d.akhiran}</span>
        </div>
        <div style={{ position: 'absolute', left: KIRI, top: 566, width: persen ? 1120 : 1500 }}>
          <div style={ket}>
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.14, letterSpacing: '-0.01em' }}>{d.keterangan}</div>
            <div style={{ marginTop: 12, fontSize: 27, fontWeight: 500, color: 'rgba(255,255,255,0.74)' }}>{d.keteranganEn}</div>
          </div>
          {d.pendukung ? <div style={{ marginTop: 26, fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,0.9)', ...dukung }}>{d.pendukung}</div> : null}
        </div>
        {persen ? (
          <svg width={420} height={420} style={{ position: 'absolute', left: 1360, top: 300, ...cincin }}>
            <circle cx={210} cy={210} r={r} fill="rgba(8,24,23,0.35)" stroke="rgba(255,255,255,0.16)" strokeWidth={22} />
            <circle
              cx={210}
              cy={210}
              r={r}
              fill="none"
              stroke={WARNA.aksenTerang}
              strokeWidth={22}
              strokeLinecap="round"
              strokeDasharray={`${(keliling * nilai) / 100} ${keliling}`}
              transform="rotate(-90 210 210)"
            />
          </svg>
        ) : null}
      </AbsoluteFill>
      {/* Label sumber: statis (tidak ikut gerak), selalu terbaca saat dijeda. */}
      <div
        style={{
          position: 'absolute',
          left: KIRI,
          top: 846,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 23,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.82)',
          ...sumber,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: WARNA.aksenTerang }} />
        {d.sumber}
      </div>
      <div style={{ position: 'absolute', right: 64, top: 60, fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>
        Video latar: AI · Background video: AI
      </div>
    </AbsoluteFill>
  );
};
