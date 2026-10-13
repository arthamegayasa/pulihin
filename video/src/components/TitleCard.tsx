import type React from 'react';
import { FONT, KIRI, WARNA } from '../theme.ts';

/** Judul pembuka: PULIHIN, Pendamping Rehabilitasi Stroke di Rumah. */
export const TitleCard: React.FC<{ opasitas: number }> = ({ opasitas }) => (
  <div
    style={{
      position: 'absolute',
      left: KIRI,
      top: 110,
      opacity: opasitas,
      fontFamily: FONT,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 28,
      padding: '44px 56px 48px',
      boxShadow: '0 16px 48px rgba(26,43,46,0.16)',
    }}
  >
    <div style={{ fontSize: 128, fontWeight: 800, color: WARNA.primer, letterSpacing: '0.02em', lineHeight: 1 }}>
      PULIHIN
    </div>
    <div style={{ marginTop: 22, width: 72, height: 6, borderRadius: 3, backgroundColor: WARNA.aksen }} />
    <div style={{ marginTop: 24, fontSize: 42, fontWeight: 650, color: WARNA.teks, lineHeight: 1.2 }}>
      Pendamping Rehabilitasi Stroke di Rumah
    </div>
    <div style={{ marginTop: 12, fontSize: 26, fontWeight: 500, color: '#4B5D60' }}>
      Home stroke rehabilitation companion
    </div>
  </div>
);
