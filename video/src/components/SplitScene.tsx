import type React from 'react';
import { AbsoluteFill } from 'remotion';
import type { Adegan } from '../timeline.ts';
import { LEBAR_KOLOM_DESKTOP, PANEL_KIRI, PERAMBAN, WARNA } from '../theme.ts';
import { BrowserFrame } from './BrowserFrame.tsx';
import { MomentCallout } from './MomentCallout.tsx';
import { PemeranLabel } from './PemeranLabel.tsx';
import { PhoneFrame } from './PhoneFrame.tsx';
import { Rekaman } from './Rekaman.tsx';
import { SideText } from './SideText.tsx';
import { Wordmark } from './Wordmark.tsx';

const PanelPonsel: React.FC = () => (
  <div style={{ position: 'absolute', left: PANEL_KIRI, top: 0, right: 0, bottom: 0, backgroundColor: WARNA.latar }} />
);

const LayarPonsel: React.FC<{ adegan: Adegan; durasiFrame: number }> = ({ adegan, durasiFrame }) => (
  <PhoneFrame>
    {adegan.layar ? <Rekaman slot={adegan.layar} durasiFrame={durasiFrame} fit="contain" tata="layar" /> : null}
  </PhoneFrame>
);

/** Rekaman layar dalam bingkai ponsel + kalimat kunci di kiri + label penunjuk. */
export const PhoneScene: React.FC<{ adegan: Adegan; durasiFrame: number }> = ({ adegan, durasiFrame }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.putih }}>
    <PanelPonsel />
    <Wordmark />
    {adegan.teksLayar ? <SideText teks={adegan.teksLayar} tahap={adegan.tahap} /> : null}
    <LayarPonsel adegan={adegan} durasiFrame={durasiFrame} />
    {adegan.sorot ? <MomentCallout label={adegan.sorot.label} ke={adegan.sorot.ke} mulaiDetik={adegan.sorot.mulaiDi} /> : null}
  </AbsoluteFill>
);

/** Shot lebar pemeran (kiri) + rekaman layar sinkron dalam bingkai ponsel (kanan). */
export const SplitScene: React.FC<{ adegan: Adegan; durasiFrame: number }> = ({ adegan, durasiFrame }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.putih }}>
    <PanelPonsel />
    <div style={{ position: 'absolute', left: 0, top: 0, width: PANEL_KIRI, bottom: 0, overflow: 'hidden' }}>
      {adegan.kamera ? <Rekaman slot={adegan.kamera} durasiFrame={durasiFrame} fit="cover" tata="split" /> : null}
      {adegan.pemeran ? <PemeranLabel /> : null}
    </div>
    {adegan.teksLayar ? <SideText teks={adegan.teksLayar} gaya="ringkas" atas={108} /> : null}
    <LayarPonsel adegan={adegan} durasiFrame={durasiFrame} />
    {adegan.sorot ? <MomentCallout label={adegan.sorot.label} ke={adegan.sorot.ke} mulaiDetik={adegan.sorot.mulaiDi} /> : null}
  </AbsoluteFill>
);

/** B-roll penuh layar + kalimat kunci pada kartu. */
export const BrollScene: React.FC<{ adegan: Adegan; durasiFrame: number }> = ({ adegan, durasiFrame }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.teks }}>
    {adegan.kamera ? <Rekaman slot={adegan.kamera} durasiFrame={durasiFrame} fit="cover" tata="penuh" /> : null}
    {adegan.pemeran ? <PemeranLabel /> : null}
    {adegan.teksLayar ? <SideText teks={adegan.teksLayar} tahap={adegan.tahap} gaya="kartu" atas={300} /> : null}
  </AbsoluteFill>
);

/** Rekaman layar desktop (Dashboard Terapis) dalam bingkai peramban + kalimat kunci di kolom kiri. */
export const DesktopScene: React.FC<{ adegan: Adegan; durasiFrame: number }> = ({ adegan, durasiFrame }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.putih }}>
    <div
      style={{ position: 'absolute', left: PERAMBAN.kiri - 70, top: 0, right: 0, bottom: 0, backgroundColor: WARNA.latar }}
    />
    <Wordmark />
    {adegan.teksLayar ? <SideText teks={adegan.teksLayar} tahap={adegan.tahap} lebar={LEBAR_KOLOM_DESKTOP} /> : null}
    <BrowserFrame>
      {adegan.layar ? <Rekaman slot={adegan.layar} durasiFrame={durasiFrame} fit="contain" tata="desktop" /> : null}
    </BrowserFrame>
  </AbsoluteFill>
);
