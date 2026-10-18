import type React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { infoFootage } from '../footage.ts';
import { DOMAIN, FPS, type Adegan, type SlotRekaman } from '../timeline.ts';
import { FONT, KIRI, LEBAR_KOLOM, LEBAR_KOLOM_DESKTOP, PANEL_KIRI, PERAMBAN, PONSEL, WARNA } from '../theme.ts';
import { BrowserFrame } from './BrowserFrame.tsx';
import { LabelAI } from './LabelAI.tsx';
import { MomentCallout } from './MomentCallout.tsx';
import { Placeholder } from './Placeholder.tsx';
import { Rekaman } from './Rekaman.tsx';
import { SideText } from './SideText.tsx';
import { TitleCard } from './TitleCard.tsx';
import { Wordmark } from './Wordmark.tsx';

interface PropsAdegan {
  adegan: Adegan;
  durasiFrame: number;
}

const PanelPonsel: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: PANEL_KIRI,
      top: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(ellipse at 60% 45%, #F3F8F6 0%, ${WARNA.latar} 55%, #DCE9E5 100%)`,
    }}
  />
);

/**
 * Video AI dengan grade sinematik yang sama di semua adegan: kontras sedikit naik, saturasi sedikit turun,
 * kehangatan tipis, vinyet lembut, dan butiran film halus; gerak kamera pelan (dorong `dorong` + geser
 * paralaks kecil) dengan easing lembut.
 */
export const VideoAI: React.FC<{
  slot: SlotRekaman;
  durasiFrame: number;
  dorong?: number;
  geser?: number;
  /** Bingkai ulang: perbesar dari titik `asal` (mis. memotong benda di tepi kanan). */
  bingkai?: { skala: number; asal: string };
}> = ({ slot, durasiFrame, dorong = 0.04, geser = 14, bingkai }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, durasiFrame], [0, 1], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin) });
  const ada = infoFootage(slot.berkas) !== undefined;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: WARNA.malam }}>
      <AbsoluteFill
        style={{
          transform: `scale(${(bingkai?.skala ?? 1) * (1.02 + dorong * t)}) translateX(${-geser * t}px)`,
          transformOrigin: bingkai?.asal,
          filter: ada ? 'contrast(1.06) saturate(0.9) brightness(0.97)' : undefined,
        }}
      >
        <Rekaman slot={slot} durasiFrame={durasiFrame} fit="cover" tata="penuh" />
      </AbsoluteFill>
      {ada ? (
        <>
          {/* Kehangatan tipis di sorotan, teal tipis di bayangan (selaras palet aplikasi). */}
          <AbsoluteFill style={{ background: 'linear-gradient(160deg, rgba(255,176,102,0.10), rgba(11,79,74,0.10))', mixBlendMode: 'soft-light' }} />
          <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 52% 46%, rgba(0,0,0,0) 52%, rgba(6,18,17,0.42) 100%)' }} />
          <AbsoluteFill
            style={{
              opacity: 0.06,
              mixBlendMode: 'overlay',
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              backgroundPosition: `${(frame * 37) % 240}px ${(frame * 53) % 240}px`,
            }}
          />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** Gradien gelap dari kiri agar teks putih terbaca di atas video AI. */
const SelubungKiri: React.FC<{ kuat?: number }> = ({ kuat = 0.82 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(90deg, rgba(8,24,23,${kuat}) 0%, rgba(8,24,23,${kuat * 0.7}) 36%, rgba(8,24,23,0) 68%)`,
    }}
  />
);

/** Kartu PLACEHOLDER di tempat layar ponsel 3D bila rekaman layar belum ada. */
export const PlaceholderLayar: React.FC<{ slot: SlotRekaman; durasiFrame: number }> = ({ slot, durasiFrame }) =>
  infoFootage(slot.berkas) ? null : (
    <div
      style={{
        position: 'absolute',
        left: PONSEL.kiri + PONSEL.bezel,
        top: PONSEL.atas + PONSEL.bezel,
        width: PONSEL.layarLebar,
        height: PONSEL.layarTinggi,
        borderRadius: 50,
        overflow: 'hidden',
      }}
    >
      <Placeholder slot={slot} detik={durasiFrame / FPS} tata="layar" />
    </div>
  );

/** Rekaman layar di ponsel 3D (kanvasnya di PulihinDemo) + kalimat kunci di kiri + label penunjuk. */
export const PhoneScene: React.FC<{ adegan: Adegan }> = ({ adegan }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.putih }}>
    <PanelPonsel />
    <Wordmark />
    {adegan.ai ? <LabelAI kiri={KIRI} atas={150} ringkas /> : null}
    {adegan.teksLayar ? <SideText teks={adegan.teksLayar} tahap={adegan.tahap} atas={adegan.ai ? 290 : 260} /> : null}
    {adegan.sorot ? (
      <MomentCallout label={adegan.sorot.label} ke={adegan.sorot.ke} mulaiDetik={adegan.sorot.mulaiDi} detikAdegan={adegan.mulai} />
    ) : null}
  </AbsoluteFill>
);

/** Kartu 16:9 video AI di panel kiri (utuh, tidak dipotong). */
const KARTU_LEBAR = { kiri: 60, atas: 250, lebar: PANEL_KIRI - 120, tinggi: Math.round(((PANEL_KIRI - 120) * 9) / 16) };

/** Video AI (kartu 16:9 di kiri, berlabel) + rekaman layar di ponsel 3D (kanan), kalimat kunci di atas kartu. */
export const SplitScene: React.FC<PropsAdegan> = ({ adegan, durasiFrame }) => {
  const frame = useCurrentFrame();
  const masuk = interpolate(frame, [0, 26], [0, 1], { extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 1, 0.36, 1) });
  return (
    <AbsoluteFill style={{ backgroundColor: WARNA.putih }}>
      <PanelPonsel />
      {adegan.teksLayar ? <SideText teks={adegan.teksLayar} gaya="ringkas" atas={96} /> : null}
      <div
        style={{
          position: 'absolute',
          left: KARTU_LEBAR.kiri,
          top: KARTU_LEBAR.atas,
          width: KARTU_LEBAR.lebar,
          height: KARTU_LEBAR.tinggi,
          borderRadius: 28,
          overflow: 'hidden',
          transform: `translateY(${(1 - masuk) * 16}px) scale(${0.985 + 0.015 * masuk})`,
          boxShadow: '0 30px 70px rgba(11, 79, 74, 0.20), 0 6px 18px rgba(26, 43, 46, 0.10)',
        }}
      >
        {adegan.kamera ? <VideoAI slot={adegan.kamera} durasiFrame={durasiFrame} dorong={0.03} geser={8} /> : null}
        {adegan.ai ? <LabelAI kiri={22} atas={22} ringkas gelap /> : null}
      </div>
      {adegan.sorot ? (
        <MomentCallout label={adegan.sorot.label} ke={adegan.sorot.ke} mulaiDetik={adegan.sorot.mulaiDi} detikAdegan={adegan.mulai} />
      ) : null}
    </AbsoluteFill>
  );
};

/** Video AI penuh layar + kalimat kunci putih. */
export const BrollScene: React.FC<PropsAdegan> = ({ adegan, durasiFrame }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.malam }}>
    {adegan.kamera ? <VideoAI slot={adegan.kamera} durasiFrame={durasiFrame} /> : null}
    <SelubungKiri />
    {adegan.ai ? <LabelAI gelap /> : null}
    {adegan.teksLayar ? <SideText teks={adegan.teksLayar} tahap={adegan.tahap} gaya="sinema" atas={330} /> : null}
  </AbsoluteFill>
);

/** Video AI + judul PULIHIN. */
export const JudulScene: React.FC<PropsAdegan> = ({ adegan, durasiFrame }) => {
  const frame = useCurrentFrame();
  const judul = interpolate(frame, [0.5 * FPS, 0.5 * FPS + 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  return (
    <AbsoluteFill style={{ backgroundColor: WARNA.malam }}>
      {adegan.kamera ? <VideoAI slot={adegan.kamera} durasiFrame={durasiFrame} dorong={0.05} /> : null}
      <SelubungKiri kuat={0.86} />
      {adegan.ai ? <LabelAI gelap /> : null}
      <TitleCard opasitas={judul} />
    </AbsoluteFill>
  );
};

/** Video AI penutup + kalimat penutup, lalu kartu alamat aktif saat narator menyebutnya. */
export const PenutupAIScene: React.FC<PropsAdegan> = ({ adegan, durasiFrame }) => {
  const frame = useCurrentFrame();
  const baris = adegan.narasi[adegan.narasi.length - 1];
  const mulaiKartu = baris ? Math.round((baris.mulai - adegan.mulai) * FPS) : Math.round(durasiFrame * 0.5);
  const kartu = interpolate(frame, [mulaiKartu, mulaiKartu + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  return (
    <AbsoluteFill style={{ backgroundColor: WARNA.malam }}>
      {/* ai-08: TV hitam di pojok kanan atas paruh kedua; bingkai ulang dari kiri bawah memotongnya. */}
      {adegan.kamera ? <VideoAI slot={adegan.kamera} durasiFrame={durasiFrame} dorong={-0.03} geser={-10} bingkai={{ skala: 1.14, asal: '0% 40%' }} /> : null}
      <SelubungKiri kuat={0.86} />
      {adegan.ai ? <LabelAI gelap /> : null}
      {adegan.teksLayar ? <SideText teks={adegan.teksLayar} tahap={adegan.tahap} gaya="sinema" atas={250} /> : null}
      <div
        style={{
          position: 'absolute',
          left: KIRI,
          top: 650,
          width: LEBAR_KOLOM,
          opacity: kartu,
          transform: `translateY(${(1 - kartu) * 18}px)`,
          fontFamily: FONT,
        }}
      >
        <div style={{ width: 64, height: 4, borderRadius: 2, backgroundColor: WARNA.aksenTerang, marginBottom: 26 }} />
        <div style={{ fontSize: 60, fontWeight: 800, color: WARNA.putih, letterSpacing: '-0.01em' }}>{DOMAIN}</div>
        <div style={{ marginTop: 14, fontSize: 26, fontWeight: 600, color: WARNA.putih, lineHeight: 1.4 }}>
          Prototype kompetisi · bukan alat kesehatan teregulasi
          <br />
          <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.78)' }}>Competition prototype · not a regulated medical device</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Rekaman layar desktop (Dashboard Terapis) dalam bingkai peramban dengan perspektif 3D halus. */
export const DesktopScene: React.FC<PropsAdegan> = ({ adegan, durasiFrame }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, durasiFrame], [0, 1], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin) });
  const sudut = -6 + 3 * t;
  return (
    <AbsoluteFill style={{ backgroundColor: WARNA.putih }}>
      <div
        style={{
          position: 'absolute',
          left: PERAMBAN.kiri - 70,
          top: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 60% 45%, #F3F8F6 0%, ${WARNA.latar} 60%, #DCE9E5 100%)`,
        }}
      />
      <Wordmark />
      {adegan.teksLayar ? <SideText teks={adegan.teksLayar} tahap={adegan.tahap} lebar={LEBAR_KOLOM_DESKTOP} /> : null}
      <AbsoluteFill style={{ perspective: 2400, perspectiveOrigin: '70% 45%' }}>
        <AbsoluteFill
          style={{
            transform: `rotateY(${sudut}deg) translateZ(${-10 + 10 * t}px)`,
            transformOrigin: `${PERAMBAN.kiri + PERAMBAN.lebar / 2}px 50%`,
          }}
        >
          <BrowserFrame>
            {adegan.layar ? <Rekaman slot={adegan.layar} durasiFrame={durasiFrame} fit="contain" tata="desktop" /> : null}
          </BrowserFrame>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
