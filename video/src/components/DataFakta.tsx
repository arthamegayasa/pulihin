import type React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { FPS, type Adegan } from '../timeline.ts';
import { FONT, KIRI, WARNA } from '../theme.ts';

const formatAngka = (n: number, desimal: number, ribuan: boolean): string => {
  const teks = n.toFixed(desimal).replace('.', ',');
  return ribuan ? teks.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : teks;
};

/** Muncul naik pelan dengan fade (detik relatif adegan). */
const useNaik = (mulai: number, lama = 0.7) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [mulai * FPS, (mulai + lama) * FPS], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return { opacity: p, transform: `translateY(${(1 - p) * 26}px)` };
};

/**
 * Tipografi data bersumber (0:00-0:30): angka besar yang menghitung naik, keterangan, baris pendukung,
 * dan label sumber singkat yang selalu terlihat. Angka persen diberi cincin proporsi yang tenang.
 */
export const DataFakta: React.FC<{ adegan: Adegan; durasiFrame: number }> = ({ adegan, durasiFrame }) => {
  const frame = useCurrentFrame();
  const d = adegan.data!;
  const naik = interpolate(frame, [0.35 * FPS, 1.9 * FPS], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const nilai = d.nilai * naik;
  const persen = d.akhiran === '%';
  // Gerak kamera tipografi: sangat pelan mendekat sepanjang adegan.
  const dorong = interpolate(frame, [0, durasiFrame], [1, 1.025], { extrapolateRight: 'clamp' });
  const angka = useNaik(0.3, 0.8);
  const ket = useNaik(0.8);
  const dukung = useNaik(1.5);
  const sumber = useNaik(1.1);
  const tahap = useNaik(0);
  const cincin = useNaik(0.2, 1);
  const r = 190;
  const keliling = 2 * Math.PI * r;
  return (
    <AbsoluteFill style={{ backgroundColor: '#F4F8F7', fontFamily: FONT, color: WARNA.teks }}>
      <AbsoluteFill style={{ transform: `scale(${dorong})`, transformOrigin: '30% 50%' }}>
        <div
          style={{
            position: 'absolute',
            left: KIRI,
            top: 150,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: WARNA.primer,
            ...tahap,
          }}
        >
          <span style={{ width: 34, height: 4, borderRadius: 2, backgroundColor: WARNA.aksen }} />
          {adegan.tahap}
        </div>
        <div
          style={{
            position: 'absolute',
            left: KIRI - 8,
            top: 240,
            fontSize: 300,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.035em',
            color: WARNA.primer,
            fontVariantNumeric: 'tabular-nums',
            ...angka,
          }}
        >
          {formatAngka(nilai, d.desimal, d.pemisahRibuan ?? false)}
          <span style={{ fontSize: 170, marginLeft: 8 }}>{d.akhiran}</span>
        </div>
        <div style={{ position: 'absolute', left: KIRI, top: 572, width: persen ? 1150 : 1650 }}>
          <div style={ket}>
            <div style={{ fontSize: 54, fontWeight: 750, lineHeight: 1.12, letterSpacing: '-0.01em' }}>{d.keterangan}</div>
            <div style={{ marginTop: 12, fontSize: 28, fontWeight: 500, color: '#4B5D60' }}>{d.keteranganEn}</div>
          </div>
          {d.pendukung ? (
            <div style={{ marginTop: 26, fontSize: 30, fontWeight: 600, color: WARNA.teks, ...dukung }}>{d.pendukung}</div>
          ) : null}
        </div>
        {persen ? (
          <svg width={460} height={460} style={{ position: 'absolute', left: 1330, top: 290, ...cincin }}>
            <circle cx={230} cy={230} r={r} fill="none" stroke="#DCE8E5" strokeWidth={26} />
            <circle
              cx={230}
              cy={230}
              r={r}
              fill="none"
              stroke={WARNA.aksen}
              strokeWidth={26}
              strokeLinecap="round"
              strokeDasharray={`${(keliling * nilai) / 100} ${keliling}`}
              transform="rotate(-90 230 230)"
            />
          </svg>
        ) : null}
      </AbsoluteFill>
      {/* Label sumber: statis (tidak ikut gerak), selalu terbaca saat dijeda. */}
      <div
        style={{
          position: 'absolute',
          left: KIRI,
          top: 842,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 24,
          fontWeight: 600,
          color: '#4B5D60',
          ...sumber,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: WARNA.primer }} />
        {d.sumber}
      </div>
    </AbsoluteFill>
  );
};
