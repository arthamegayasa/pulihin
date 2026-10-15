import type React from 'react';
import { useCurrentFrame } from 'remotion';
import { FPS, LEBAR } from '../timeline.ts';
import { FONT, WARNA } from '../theme.ts';
import { useMuncul } from './anim.ts';
import { titikLayar } from './Ponsel3D.tsx';

/**
 * Label penunjuk halus DI SAMPING ponsel 3D (tidak pernah di atas layar aplikasi). `ke` = posisi
 * vertikal 0..1 pada layar ponsel; titiknya diproyeksikan dari pose ponsel 3D pada detik global.
 */
export const MomentCallout: React.FC<{ label: string; ke: number; mulaiDetik?: number; detikAdegan: number }> = ({
  label,
  ke,
  mulaiDetik = 0.9,
  detikAdegan,
}) => {
  const frame = useCurrentFrame();
  const opasitas = useMuncul(Math.round(mulaiDetik * FPS), 16);
  const { x, y } = titikLayar(ke, detikAdegan + frame / FPS);
  const ujung = x - 16;
  const panjangGaris = 54;
  return (
    <div style={{ opacity: opasitas, fontFamily: FONT }}>
      <div
        style={{
          position: 'absolute',
          right: LEBAR - (ujung - panjangGaris - 10),
          top: y,
          transform: 'translateY(-50%)',
          whiteSpace: 'nowrap',
          backgroundColor: WARNA.putih,
          color: WARNA.teks,
          fontSize: 25,
          fontWeight: 700,
          lineHeight: 1.25,
          padding: '10px 18px',
          borderRadius: 14,
          border: `2px solid ${WARNA.aksen}`,
          boxShadow: '0 6px 18px rgba(26,43,46,0.10)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: 'absolute',
          left: ujung - panjangGaris,
          top: y - 1.5,
          width: panjangGaris,
          height: 3,
          borderRadius: 2,
          backgroundColor: WARNA.aksen,
        }}
      />
      <div style={{ position: 'absolute', left: ujung - 6, top: y - 6, width: 12, height: 12, borderRadius: 6, backgroundColor: WARNA.aksen }} />
    </div>
  );
};
