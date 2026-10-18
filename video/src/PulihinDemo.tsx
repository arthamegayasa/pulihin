import type React from 'react';
import { AbsoluteFill, Html5Audio, Sequence, staticFile } from 'remotion';
import { CaptionTrack } from './components/CaptionTrack.tsx';
import { ClosingCard } from './components/ClosingCard.tsx';
import { DataFakta } from './components/DataFakta.tsx';
import { PanggungPonsel, blokPonsel } from './components/Ponsel3D.tsx';
import { BrollScene, DesktopScene, JudulScene, PenutupAIScene, PhoneScene, PlaceholderLayar, SplitScene } from './components/Tata.tsx';
import { useJendela, useMuncul } from './components/anim.ts';
import { BUNYI } from './suara.ts';
import { ADEGAN, FADE_FRAME, FPS, keFrame, type Adegan } from './timeline.ts';
import { WARNA } from './theme.ts';

export interface PulihinDemoProps {
  /** Subtitle Inggris tertanam (kiri bawah). File SRT tetap dibuat terpisah. */
  subtitle: boolean;
  [key: string]: unknown;
}

const IsiAdegan: React.FC<{ adegan: Adegan; durasiFrame: number }> = ({ adegan, durasiFrame }) => {
  switch (adegan.tata) {
    case 'data':
      return <DataFakta adegan={adegan} durasiFrame={durasiFrame} />;
    case 'judul':
      return <JudulScene adegan={adegan} durasiFrame={durasiFrame} />;
    case 'broll':
      return <BrollScene adegan={adegan} durasiFrame={durasiFrame} />;
    case 'ponsel':
      return <PhoneScene adegan={adegan} />;
    case 'split':
      return <SplitScene adegan={adegan} durasiFrame={durasiFrame} />;
    case 'desktop':
      return <DesktopScene adegan={adegan} durasiFrame={durasiFrame} />;
    case 'penutup-ai':
      return <PenutupAIScene adegan={adegan} durasiFrame={durasiFrame} />;
    case 'penutup':
      return <ClosingCard />;
  }
};

/** Crossfade lembut: adegan berikut muncul di atas adegan sebelumnya (tanpa kedipan). */
const Lapisan: React.FC<{ adegan: Adegan; durasiFrame: number; pertama: boolean }> = ({ adegan, durasiFrame, pertama }) => {
  const opasitas = useMuncul(0, pertama ? 24 : FADE_FRAME);
  return (
    <AbsoluteFill style={{ opacity: opasitas }}>
      <IsiAdegan adegan={adegan} durasiFrame={durasiFrame} />
    </AbsoluteFill>
  );
};

/** Ponsel 3D per blok adegan ponsel berurutan: fade masuk/keluar bersama crossfade adegan di sekitarnya. */
const OpasitasBlok: React.FC<{ lamaFrame: number; children: React.ReactNode }> = ({ lamaFrame, children }) => {
  const masuk = useJendela(0, lamaFrame, FADE_FRAME);
  return <AbsoluteFill style={{ opacity: masuk }}>{children}</AbsoluteFill>;
};

const BLOK_PONSEL = blokPonsel();

export const PulihinDemo: React.FC<PulihinDemoProps> = ({ subtitle }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.malam }}>
    {ADEGAN.map((a, i) => {
      const dari = keFrame(a.mulai);
      const durasiFrame = keFrame(a.selesai) - dari;
      const terakhir = i === ADEGAN.length - 1;
      return (
        <Sequence key={a.id} name={a.id} from={dari} durationInFrames={durasiFrame + (terakhir ? 0 : FADE_FRAME)} premountFor={30}>
          <Lapisan adegan={a} durasiFrame={durasiFrame} pertama={i === 0} />
        </Sequence>
      );
    })}

    {BLOK_PONSEL.map((blok) => {
      const dari = keFrame(blok[0].mulai);
      const sampai = keFrame(blok[blok.length - 1].selesai);
      return (
        <Sequence key={`ponsel-${blok[0].id}`} name={`ponsel 3D ${blok[0].id}`} from={dari} durationInFrames={sampai - dari + FADE_FRAME} premountFor={30}>
          <OpasitasBlok lamaFrame={sampai - dari + FADE_FRAME}>
            <PanggungPonsel blok={blok} />
            {/* Draf: kartu PLACEHOLDER di atas layar ponsel 3D untuk rekaman layar yang belum ada. */}
            {blok.map((a) =>
              a.layar ? (
                <Sequence key={a.id} from={keFrame(a.mulai) - dari} durationInFrames={keFrame(a.selesai) - keFrame(a.mulai)} layout="none">
                  <PlaceholderLayar slot={a.layar} durasiFrame={keFrame(a.selesai) - keFrame(a.mulai)} />
                </Sequence>
              ) : null,
            )}
          </OpasitasBlok>
        </Sequence>
      );
    })}

    {BUNYI.map((b) => (
      <Sequence key={b.id} name={b.id} from={b.dari} durationInFrames={b.lama} layout="none">
        <Html5Audio
          src={staticFile(b.src)}
          loop={b.loop}
          trimBefore={b.mulaiKlip ? Math.round(b.mulaiKlip * FPS) : undefined}
          volume={b.volume}
        />
      </Sequence>
    ))}

    {subtitle ? <CaptionTrack /> : null}
  </AbsoluteFill>
);
