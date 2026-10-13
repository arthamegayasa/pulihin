import type React from 'react';
import { BAYANGAN, PERAMBAN, WARNA } from '../theme.ts';

/**
 * Bingkai jendela peramban yang bersih untuk rekaman layar desktop (Dashboard Terapis).
 * Bilah atas hanya dekoratif (tanpa alamat atau teks rekaan); isi = rekaman 16:9 asli
 * (letterbox, tidak pernah ditarik) atau placeholder.
 */
export const BrowserFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: 'absolute',
      left: PERAMBAN.kiri,
      top: PERAMBAN.atas,
      width: PERAMBAN.lebar,
      height: PERAMBAN.bar + PERAMBAN.layarTinggi,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: WARNA.putih,
      boxShadow: `${BAYANGAN}, 0 0 0 1px rgba(26,43,46,0.10)`,
    }}
  >
    <div
      style={{
        height: PERAMBAN.bar,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '0 18px',
        backgroundColor: '#E4ECEA',
        borderBottom: '1px solid rgba(26,43,46,0.10)',
      }}
    >
      {['#E0675C', '#E3B341', '#5DB565'].map((w) => (
        <span key={w} style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: w }} />
      ))}
      <span
        style={{ marginLeft: 22, flex: 1, maxWidth: 560, height: 24, borderRadius: 12, backgroundColor: WARNA.putih }}
      />
    </div>
    <div style={{ position: 'relative', width: PERAMBAN.lebar, height: PERAMBAN.layarTinggi, backgroundColor: '#000' }}>
      {children}
    </div>
  </div>
);
