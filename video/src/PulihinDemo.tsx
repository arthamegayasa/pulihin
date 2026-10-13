import type React from 'react';
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile } from 'remotion';
import { BrollScene, DesktopScene, PhoneScene, SplitScene } from './components/SplitScene.tsx';
import { CaptionTrack } from './components/CaptionTrack.tsx';
import { ClosingCard } from './components/ClosingCard.tsx';
import { TalkingHead } from './components/TalkingHead.tsx';
import { useMuncul } from './components/anim.ts';
import { ADA_MUSIK, ADA_NARASI_LENGKAP, adaAudio, adaNarasiUntuk } from './footage.ts';
import {
  ADEGAN,
  AUDIO_MUSIK,
  AUDIO_NARASI_LENGKAP,
  FADE_FRAME,
  JEDA_AUDIO_ADEGAN,
  TOTAL_FRAME,
  VOLUME_MUSIK,
  audioAdegan,
  keFrame,
  type Adegan,
} from './timeline.ts';
import { WARNA } from './theme.ts';

export interface PulihinDemoProps {
  /** Subtitle Inggris tertanam (kiri bawah). File SRT tetap dibuat terpisah. */
  subtitle: boolean;
  [key: string]: unknown;
}

const IsiAdegan: React.FC<{ adegan: Adegan; durasiFrame: number }> = ({ adegan, durasiFrame }) => {
  switch (adegan.tata) {
    case 'judul-dokter':
    case 'dokter':
      // Suara asli kamera dokter dibisukan bila narasi direkam terpisah (lav/voice-over).
      return <TalkingHead adegan={adegan} durasiFrame={durasiFrame} bisu={adaNarasiUntuk(adegan.id)} />;
    case 'broll':
      return <BrollScene adegan={adegan} durasiFrame={durasiFrame} />;
    case 'ponsel':
      return <PhoneScene adegan={adegan} durasiFrame={durasiFrame} />;
    case 'desktop':
      return <DesktopScene adegan={adegan} durasiFrame={durasiFrame} />;
    case 'split':
      return <SplitScene adegan={adegan} durasiFrame={durasiFrame} />;
    case 'penutup':
      return <ClosingCard />;
  }
};

/** Crossfade lembut: adegan berikut muncul di atas adegan sebelumnya (tanpa kedipan). */
const Lapisan: React.FC<{ adegan: Adegan; durasiFrame: number; pertama: boolean }> = ({
  adegan,
  durasiFrame,
  pertama,
}) => {
  const opasitas = useMuncul(0, pertama ? 15 : FADE_FRAME);
  return (
    <AbsoluteFill style={{ opacity: opasitas }}>
      <IsiAdegan adegan={adegan} durasiFrame={durasiFrame} />
    </AbsoluteFill>
  );
};

export const PulihinDemo: React.FC<PulihinDemoProps> = ({ subtitle }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.putih }}>
    {ADEGAN.map((a, i) => {
      const dari = keFrame(a.mulai);
      const durasiFrame = keFrame(a.selesai) - dari;
      const terakhir = i === ADEGAN.length - 1;
      return (
        <Sequence
          key={a.id}
          name={a.id}
          from={dari}
          durationInFrames={durasiFrame + (terakhir ? 0 : FADE_FRAME)}
          premountFor={30}
        >
          <Lapisan adegan={a} durasiFrame={durasiFrame} pertama={i === 0} />
        </Sequence>
      );
    })}

    {ADA_NARASI_LENGKAP ? (
      <Html5Audio src={staticFile(AUDIO_NARASI_LENGKAP)} />
    ) : (
      ADEGAN.filter((a) => adaAudio(audioAdegan(a.id))).map((a) => (
        <Sequence key={`audio-${a.id}`} name={`narasi ${a.id}`} from={keFrame(a.mulai + JEDA_AUDIO_ADEGAN)}>
          <Html5Audio src={staticFile(audioAdegan(a.id))} />
        </Sequence>
      ))
    )}

    {ADA_MUSIK ? (
      <Html5Audio
        src={staticFile(AUDIO_MUSIK)}
        loop
        volume={(f) =>
          VOLUME_MUSIK *
          interpolate(f, [0, 60, TOTAL_FRAME - 90, TOTAL_FRAME], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
    ) : null}

    {subtitle ? <CaptionTrack /> : null}
  </AbsoluteFill>
);
