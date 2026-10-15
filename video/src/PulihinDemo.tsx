import type React from 'react';
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile } from 'remotion';
import { CaptionTrack } from './components/CaptionTrack.tsx';
import { ClosingCard } from './components/ClosingCard.tsx';
import { DataFakta } from './components/DataFakta.tsx';
import { PanggungPonsel, blokPonsel } from './components/Ponsel3D.tsx';
import { BrollScene, DesktopScene, JudulScene, Penutup3DScene, PhoneScene, PlaceholderLayar, SplitScene } from './components/Tata.tsx';
import { useJendela, useMuncul } from './components/anim.ts';
import { adaAudio } from './footage.ts';
import { ADEGAN, FADE_FRAME, KETUKAN, SFX, VOLUME_SFX, audioBaris, keFrame, type Adegan } from './timeline.ts';
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
    case 'penutup-3d':
      return <Penutup3DScene adegan={adegan} durasiFrame={durasiFrame} />;
    case 'penutup':
      return <ClosingCard />;
  }
};

/** Crossfade lembut: adegan berikut muncul di atas adegan sebelumnya (tanpa kedipan). */
const Lapisan: React.FC<{ adegan: Adegan; durasiFrame: number; pertama: boolean }> = ({ adegan, durasiFrame, pertama }) => {
  const opasitas = useMuncul(0, pertama ? 15 : FADE_FRAME);
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

// ---------- Suara: narasi per baris, suara aplikasi, SFX ----------

interface Bunyi {
  id: string;
  src: string;
  dari: number;
  volume: number;
  /** Bila diisi: diputar berulang selama sekian frame dengan fade masuk/keluar. */
  lama?: number;
}

const ADEGAN_3D: Adegan['tata'][] = ['judul', 'broll', 'split', 'penutup-3d'];

const daftarBunyi = (): Bunyi[] => {
  const b: Bunyi[] = [];
  ADEGAN.forEach((a, i) => {
    for (const n of a.narasi) {
      if (adaAudio(audioBaris(n))) b.push({ id: `narasi-${n.id}`, src: audioBaris(n), dari: keFrame(n.mulai), volume: 1 });
    }
    // Ketukan pada waktu ketukan yang terekam di rekaman layar (hanya jendela adegan ini sendiri).
    if (a.layar) {
      for (const t of KETUKAN[a.layar.berkas] ?? []) {
        const rel = t - a.layar.mulaiDi;
        if (rel >= 0 && rel < a.selesai - a.mulai) b.push({ id: `ketuk-${a.id}-${t}`, src: SFX.ketuk, dari: keFrame(a.mulai + rel), volume: VOLUME_SFX.ketuk });
      }
    }
    if (i > 0 && ADEGAN[i - 1].tahap !== a.tahap) b.push({ id: `transisi-${a.id}`, src: SFX.transisi, dari: Math.max(0, keFrame(a.mulai - 0.3)), volume: VOLUME_SFX.transisi });
    // repetisi.mp3 hanya untuk tipografi data (bukan peristiwa aplikasi: aplikasi tidak berbunyi).
    if (a.tata === 'data') b.push({ id: `angka-${a.id}`, src: SFX.repetisi, dari: keFrame(a.mulai + 0.4), volume: VOLUME_SFX.repetisi });
    if (a.tata === 'penutup') b.push({ id: 'penutup', src: SFX.berhasil, dari: keFrame(a.mulai + 0.3), volume: VOLUME_SFX.berhasil });
  });
  // Suasana rumah yang sangat pelan di bawah adegan render 3D yang berurutan.
  let mulai: number | null = null;
  ADEGAN.forEach((a, i) => {
    const tiga = ADEGAN_3D.includes(a.tata);
    if (tiga && mulai === null) mulai = a.mulai;
    const akhirRun = tiga && (i === ADEGAN.length - 1 || !ADEGAN_3D.includes(ADEGAN[i + 1].tata));
    if (akhirRun && mulai !== null) {
      b.push({ id: `suasana-${a.id}`, src: SFX.suasana, dari: keFrame(mulai), volume: VOLUME_SFX.suasana, lama: keFrame(a.selesai) - keFrame(mulai) + FADE_FRAME });
      mulai = null;
    }
  });
  return b.filter((x) => adaAudio(x.src));
};

const BUNYI = daftarBunyi();
const BLOK_PONSEL = blokPonsel();

export const PulihinDemo: React.FC<PulihinDemoProps> = ({ subtitle }) => (
  <AbsoluteFill style={{ backgroundColor: WARNA.putih }}>
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
          loop={b.lama !== undefined}
          volume={
            b.lama === undefined
              ? b.volume
              : (f) =>
                  b.volume *
                  interpolate(f, [0, 24, b.lama! - 30, b.lama!], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          }
        />
      </Sequence>
    ))}

    {subtitle ? <CaptionTrack /> : null}
  </AbsoluteFill>
);
