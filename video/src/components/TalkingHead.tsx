import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { DOKTER_NAMA, DOKTER_PERAN, FPS, type Adegan } from '../timeline.ts';
import { FONT, KIRI, WARNA } from '../theme.ts';
import { useJendela } from './anim.ts';
import { Rekaman } from './Rekaman.tsx';
import { SideText } from './SideText.tsx';
import { TitleCard } from './TitleCard.tsx';

/** Lower third nama dokter, di atas zona subtitle (kiri bawah). */
const LowerThird: React.FC<{ opasitas: number }> = ({ opasitas }) => (
  <div
    style={{
      position: 'absolute',
      left: KIRI,
      bottom: 200,
      opacity: opasitas,
      fontFamily: FONT,
      display: 'flex',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(26,43,46,0.16)',
    }}
  >
    <div style={{ width: 10, backgroundColor: WARNA.primer }} />
    <div style={{ padding: '20px 32px 22px' }}>
      <div style={{ fontSize: 38, fontWeight: 750, color: WARNA.teks }}>{DOKTER_NAMA}</div>
      <div style={{ marginTop: 6, fontSize: 25, fontWeight: 600, color: WARNA.primer }}>{DOKTER_PERAN}</div>
    </div>
  </div>
);

/** Talking head dokter penuh layar + lower third (+ judul pada pembuka). */
export const TalkingHead: React.FC<{ adegan: Adegan; durasiFrame: number; bisu: boolean }> = ({
  adegan,
  durasiFrame,
  bisu,
}) => {
  const judul = useJendela(Math.round(0.5 * FPS), durasiFrame - Math.round(0.6 * FPS), 18);
  const nama = useJendela(Math.round(1.2 * FPS), Math.round(7 * FPS), 15);
  return (
    <AbsoluteFill style={{ backgroundColor: WARNA.teks }}>
      {adegan.kamera ? (
        <Rekaman slot={adegan.kamera} durasiFrame={durasiFrame} fit="cover" bisu={bisu} tata="penuh" />
      ) : null}
      {adegan.tata === 'judul-dokter' ? <TitleCard opasitas={judul} /> : null}
      {adegan.teksLayar ? <SideText teks={adegan.teksLayar} gaya="kartu" atas={110} /> : null}
      {adegan.namaDokter ? <LowerThird opasitas={nama} /> : null}
    </AbsoluteFill>
  );
};
