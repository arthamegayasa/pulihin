import type React from 'react';
import { FONT, KIRI, WARNA } from '../theme.ts';

/** Judul pembuka di atas video AI: PULIHIN, Pendamping Rehabilitasi Stroke di Rumah. */
export const TitleCard: React.FC<{ opasitas: number }> = ({ opasitas }) => (
  <div
    style={{
      position: 'absolute',
      left: KIRI,
      top: 330,
      opacity: opasitas,
      transform: `translateY(${(1 - opasitas) * 22}px)`,
      fontFamily: FONT,
      color: WARNA.putih,
      textShadow: '0 2px 30px rgba(0,0,0,0.35)',
    }}
  >
    <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1 }}>PULIHIN</div>
    <div style={{ marginTop: 30, width: 72, height: 5, borderRadius: 3, backgroundColor: WARNA.aksenTerang }} />
    <div style={{ marginTop: 28, fontSize: 44, fontWeight: 650, lineHeight: 1.2 }}>Pendamping Rehabilitasi Stroke di Rumah</div>
    <div style={{ marginTop: 12, fontSize: 27, fontWeight: 500, color: 'rgba(255,255,255,0.78)' }}>Home stroke rehabilitation companion</div>
  </div>
);
