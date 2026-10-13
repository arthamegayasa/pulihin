import type React from 'react';
import { Freeze, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { infoFootage } from '../footage.ts';
import { FADE_FRAME, FPS, type SlotRekaman } from '../timeline.ts';
import { Placeholder, type TataPlaceholder } from './Placeholder.tsx';

/**
 * Satu slot rekaman. Bila berkas ada di manifest: diputar mulai `slot.mulaiDi`.
 * Bila rekaman lebih pendek dari adegan, frame terakhir dibekukan.
 * Bila berkas belum ada: kartu PLACEHOLDER.
 */
export const Rekaman: React.FC<{
  slot: SlotRekaman;
  /** Panjang adegan (frame), tanpa overlap fade. */
  durasiFrame: number;
  /** cover untuk kamera; contain untuk rekaman layar (tidak pernah ditarik). */
  fit: 'cover' | 'contain';
  bisu?: boolean;
  /** Penempatan kartu placeholder bila rekaman belum ada. */
  tata: TataPlaceholder;
}> = ({ slot, durasiFrame, fit, bisu = false, tata }) => {
  const frame = useCurrentFrame();
  const info = infoFootage(slot.berkas);
  if (!info) return <Placeholder slot={slot} detik={durasiFrame / FPS} tata={tata} />;

  const volumeDasar = bisu ? 0 : slot.volume;
  // Rekaman yang terlalu pendek tidak membuat render gagal: titik mulai dijepit ke
  // dalam durasi berkas dan frame terakhir dibekukan (scan-footage memberi peringatan).
  const durasiSumber = info.durasi ?? Infinity;
  const mulaiDi = Math.min(slot.mulaiDi, Math.max(0, durasiSumber - 0.2));
  const terakhir = Math.floor((durasiSumber - mulaiDi) * FPS) - 2;
  return (
    <Freeze frame={Math.max(0, terakhir)} active={frame > terakhir}>
      <OffthreadVideo
        src={staticFile(`footage/${slot.berkas}`)}
        trimBefore={Math.round(mulaiDi * FPS)}
        muted={volumeDasar === 0}
        volume={(f) =>
          volumeDasar *
          interpolate(f, [0, 6, durasiFrame, durasiFrame + FADE_FRAME], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
        style={{ width: '100%', height: '100%', objectFit: fit, backgroundColor: '#000' }}
      />
    </Freeze>
  );
};
