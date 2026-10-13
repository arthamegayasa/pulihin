import type React from 'react';
import { FPS, LEBAR } from '../timeline.ts';
import { FONT, PONSEL, WARNA } from '../theme.ts';
import { useMuncul } from './anim.ts';

/**
 * Label penunjuk halus DI SAMPING ponsel (tidak pernah di atas layar ponsel).
 * `ke` = posisi vertikal 0..1 pada layar ponsel yang ditunjuk.
 */
export const MomentCallout: React.FC<{ label: string; ke: number; mulaiDetik?: number }> = ({
  label,
  ke,
  mulaiDetik = 0.9,
}) => {
  const opasitas = useMuncul(Math.round(mulaiDetik * FPS), 16);
  const y = PONSEL.atas + PONSEL.bezel + ke * PONSEL.layarTinggi;
  const ujung = PONSEL.kiri - 14;
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
      <div
        style={{
          position: 'absolute',
          left: ujung - 6,
          top: y - 6,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: WARNA.aksen,
        }}
      />
    </div>
  );
};
