import type React from 'react';
import { Freeze, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { infoFootage } from '../footage.ts';
import { FPS, type SlotRekaman } from '../timeline.ts';
import { Placeholder, type TataPlaceholder } from './Placeholder.tsx';

/**
 * Satu slot rekaman (selalu tanpa suara: render 3D dan rekaman layar headless tidak bersuara;
 * suara aplikasi yang disuarakan ulang diputar terpisah di PulihinDemo). Bila berkas ada di manifest:
 * diputar mulai `slot.mulaiDi`; bila lebih pendek dari adegan, frame terakhir dibekukan.
 * Bila berkas belum ada: kartu PLACEHOLDER.
 */
export const Rekaman: React.FC<{
  slot: SlotRekaman;
  /** Panjang adegan (frame), tanpa overlap fade. */
  durasiFrame: number;
  /** cover untuk render 3D; contain untuk rekaman layar (tidak pernah ditarik). */
  fit: 'cover' | 'contain';
  /** Penempatan kartu placeholder bila rekaman belum ada. */
  tata: TataPlaceholder;
}> = ({ slot, durasiFrame, fit, tata }) => {
  const frame = useCurrentFrame();
  const info = infoFootage(slot.berkas);
  if (!info) return <Placeholder slot={slot} detik={durasiFrame / FPS} tata={tata} />;

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
        muted
        style={{ width: '100%', height: '100%', objectFit: fit, backgroundColor: '#000' }}
      />
    </Freeze>
  );
};
