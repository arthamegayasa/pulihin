import type React from 'react';
import { FONT, KIRI, WARNA } from '../theme.ts';

/** Judul pembuka di atas b-roll 3D: PULIHIN, Pendamping Rehabilitasi Stroke di Rumah. */
export const TitleCard: React.FC<{ opasitas: number }> = ({ opasitas }) => (
  <div
    style={{
      position: 'absolute',
      left: KIRI,
      top: 300,
      opacity: opasitas,
      transform: `translateY(${(1 - opasitas) * 22}px)`,
      fontFamily: FONT,
    }}
  >
    <div style={{ fontSize: 148, fontWeight: 800, color: WARNA.primer, letterSpacing: '0.02em', lineHeight: 1 }}>PULIHIN</div>
    <div style={{ marginTop: 26, width: 72, height: 6, borderRadius: 3, backgroundColor: WARNA.aksen }} />
    <div style={{ marginTop: 26, fontSize: 44, fontWeight: 700, color: WARNA.teks, lineHeight: 1.2 }}>
      Pendamping Rehabilitasi Stroke di Rumah
    </div>
    <div style={{ marginTop: 12, fontSize: 28, fontWeight: 500, color: '#4B5D60' }}>Home stroke rehabilitation companion</div>
  </div>
);
