import type React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { infoFootage } from '../footage.ts';
import { DOMAIN, FPS, type Adegan, type SlotRekaman } from '../timeline.ts';
import { FONT, KIRI, LEBAR_KOLOM, LEBAR_KOLOM_DESKTOP, PANEL_KIRI, PERAMBAN, PONSEL, WARNA } from '../theme.ts';
import { useMuncul } from './anim.ts';
import { BrowserFrame } from './BrowserFrame.tsx';
import { KarakterLabel } from './KarakterLabel.tsx';
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
  <div style={{ position: 'absolute', left: PANEL_KIRI, top: 0, right: 0, bottom: 0, backgroundColor: WARNA.latar }} />
);

/**
 * Footage render 3D dengan grade yang sama di semua adegan (sedikit lebih hangat dan lembut) dan
 * gerak kamera sangat pelan (Ken Burns <= 3%).
 */
const Render3D: React.FC<{ slot: SlotRekaman; durasiFrame: number; dorong?: number }> = ({ slot, durasiFrame, dorong = 0.03 }) => {
  const frame = useCurrentFrame();
  const skala = interpolate(frame, [0, durasiFrame], [1.0, 1 + dorong], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: WARNA.teks }}>
      <AbsoluteFill style={{ transform: `scale(${skala})`, filter: 'saturate(0.96) contrast(1.03)' }}>
        <Rekaman slot={slot} durasiFrame={durasiFrame} fit="cover" tata="penuh" />
      </AbsoluteFill>
      {infoFootage(slot.berkas) ? (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(ellipse at 55% 45%, rgba(0,0,0,0) 55%, rgba(16,32,30,0.28) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

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
    {adegan.karakter ? <KarakterLabel kiri={KIRI} atas={130} /> : null}
    {adegan.teksLayar ? <SideText teks={adegan.teksLayar} tahap={adegan.tahap} /> : null}
    {adegan.sorot ? (
      <MomentCallout label={adegan.sorot.label} ke={adegan.sorot.ke} mulaiDetik={adegan.sorot.mulaiDi} detikAdegan={adegan.mulai} />
    ) : null}
  </AbsoluteFill>
);

/** Kartu 16:9 render 3D lebar di panel kiri (utuh, tidak dipotong: karakter dan ponsel di meja sama-sama terlihat). */
const KARTU_LEBAR = { kiri: 60, atas: 236, lebar: PANEL_KIRI - 120, tinggi: Math.round(((PANEL_KIRI - 120) * 9) / 16) };

/**
 * Render 3D lebar (kartu 16:9 di kiri) + rekaman layar sinkron di ponsel 3D (kanan), dengan label
 * karakter di pojok kartu dan kalimat kunci di atasnya.
 */
export const SplitScene: React.FC<PropsAdegan> = ({ adegan, durasiFrame }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.putih }}>
    <PanelPonsel />
    {adegan.teksLayar ? <SideText teks={adegan.teksLayar} gaya="ringkas" atas={92} /> : null}
    <div
      style={{
        position: 'absolute',
        left: KARTU_LEBAR.kiri,
        top: KARTU_LEBAR.atas,
        width: KARTU_LEBAR.lebar,
        height: KARTU_LEBAR.tinggi,
        borderRadius: 26,
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(11, 79, 74, 0.16), 0 4px 14px rgba(26, 43, 46, 0.08)',
      }}
    >
      {adegan.kamera ? <Render3D slot={adegan.kamera} durasiFrame={durasiFrame} dorong={0.02} /> : null}
      {adegan.karakter ? <KarakterLabel kiri={22} atas={22} ringkas /> : null}
    </div>
    {adegan.sorot ? (
      <MomentCallout label={adegan.sorot.label} ke={adegan.sorot.ke} mulaiDetik={adegan.sorot.mulaiDi} detikAdegan={adegan.mulai} />
    ) : null}
  </AbsoluteFill>
);

/** Selubung putih lembut di sisi kiri agar teks terbaca di atas render 3D. */
const SelubungKiri: React.FC<{ kuat?: number }> = ({ kuat = 0.86 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(90deg, rgba(255,255,255,${kuat}) 0%, rgba(255,255,255,${kuat * 0.72}) 34%, rgba(255,255,255,0) 62%)`,
    }}
  />
);

/** B-roll 3D penuh layar + kalimat kunci. */
export const BrollScene: React.FC<PropsAdegan> = ({ adegan, durasiFrame }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.teks }}>
    {adegan.kamera ? <Render3D slot={adegan.kamera} durasiFrame={durasiFrame} /> : null}
    <SelubungKiri />
    {adegan.karakter ? <KarakterLabel /> : null}
    {adegan.teksLayar ? <SideText teks={adegan.teksLayar} tahap={adegan.tahap} atas={300} /> : null}
  </AbsoluteFill>
);

/** B-roll 3D + judul PULIHIN. */
export const JudulScene: React.FC<PropsAdegan> = ({ adegan, durasiFrame }) => {
  const judul = useMuncul(Math.round(0.4 * FPS), 20);
  return (
    <AbsoluteFill style={{ backgroundColor: WARNA.teks }}>
      {adegan.kamera ? <Render3D slot={adegan.kamera} durasiFrame={durasiFrame} /> : null}
      <SelubungKiri kuat={0.9} />
      {adegan.karakter ? <KarakterLabel /> : null}
      <TitleCard opasitas={judul} />
    </AbsoluteFill>
  );
};

/** Render 3D penutup + kalimat penutup, lalu kartu alamat aktif saat narator menyebutnya. */
export const Penutup3DScene: React.FC<PropsAdegan> = ({ adegan, durasiFrame }) => {
  const baris = adegan.narasi.find((b) => b.id === 'N23b');
  const mulaiKartu = baris ? Math.round((baris.mulai - adegan.mulai) * FPS) : Math.round(durasiFrame * 0.5);
  const kartu = useMuncul(mulaiKartu, 18);
  return (
    <AbsoluteFill style={{ backgroundColor: WARNA.teks }}>
      {adegan.kamera ? <Render3D slot={adegan.kamera} durasiFrame={durasiFrame} dorong={0.035} /> : null}
      <SelubungKiri kuat={0.9} />
      {adegan.karakter ? <KarakterLabel /> : null}
      {adegan.teksLayar ? <SideText teks={adegan.teksLayar} tahap={adegan.tahap} atas={230} /> : null}
      <div
        style={{
          position: 'absolute',
          left: KIRI,
          top: 680,
          width: LEBAR_KOLOM,
          opacity: kartu,
          transform: `translateY(${(1 - kartu) * 18}px)`,
          fontFamily: FONT,
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 800, color: WARNA.primer, letterSpacing: '-0.01em' }}>{DOMAIN}</div>
        <div style={{ marginTop: 14, fontSize: 26, fontWeight: 600, color: WARNA.teks, lineHeight: 1.35 }}>
          Prototype kompetisi · bukan alat kesehatan teregulasi
          <br />
          <span style={{ fontWeight: 500, color: '#4B5D60' }}>Competition prototype · not a regulated medical device</span>
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
      <div style={{ position: 'absolute', left: PERAMBAN.kiri - 70, top: 0, right: 0, bottom: 0, backgroundColor: WARNA.latar }} />
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
