import type React from 'react';
import { LABEL_KARAKTER, LABEL_KARAKTER_EN } from '../timeline.ts';
import { FONT, WARNA } from '../theme.ts';

/** Label kejujuran: tampil setiap kali karakter 3D terlihat (render 3D atau kamera aplikasi). */
export const KarakterLabel: React.FC<{ kiri?: number; atas?: number; kanan?: number; ringkas?: boolean }> = ({
  kiri = 48,
  atas = 44,
  kanan,
  ringkas = false,
}) => (
  <div
    style={{
      position: 'absolute',
      ...(kanan === undefined ? { left: kiri } : { right: kanan }),
      top: atas,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: FONT,
      fontSize: 22,
      fontWeight: 700,
      color: WARNA.teks,
      backgroundColor: 'rgba(255,255,255,0.93)',
      borderRadius: 999,
      padding: '9px 22px 9px 16px',
      boxShadow: '0 4px 14px rgba(26,43,46,0.12)',
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: WARNA.aksen }} />
    {LABEL_KARAKTER}
    {ringkas ? null : <span style={{ fontWeight: 500, color: '#4B5D60' }}>· {LABEL_KARAKTER_EN}</span>}
  </div>
);
