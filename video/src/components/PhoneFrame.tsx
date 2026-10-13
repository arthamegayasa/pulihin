import type React from 'react';
import { BAYANGAN, PONSEL, WARNA } from '../theme.ts';

/**
 * Bingkai ponsel modern yang bersih, selalu di posisi yang sama (kanan),
 * sehingga crossfade antar adegan ponsel tidak membuat bingkai bergeser.
 * Isi layar: rekaman layar asli (letterbox, tidak ditarik) atau placeholder.
 */
export const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: 'absolute',
      left: PONSEL.kiri,
      top: PONSEL.atas,
      width: PONSEL.lebar,
      height: PONSEL.tinggi,
      borderRadius: 64,
      backgroundColor: WARNA.bezel,
      boxShadow: `${BAYANGAN}, inset 0 0 0 2px #2C3A3D`,
    }}
  >
    {/* Tombol samping (dekoratif, di luar area layar) */}
    <div style={{ position: 'absolute', right: -4, top: 190, width: 4, height: 92, borderRadius: 3, backgroundColor: '#2C3A3D' }} />
    <div style={{ position: 'absolute', right: -4, top: 310, width: 4, height: 56, borderRadius: 3, backgroundColor: '#2C3A3D' }} />
    <div
      style={{
        position: 'absolute',
        left: PONSEL.bezel,
        top: PONSEL.bezel,
        width: PONSEL.layarLebar,
        height: PONSEL.layarTinggi,
        borderRadius: 50,
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      {children}
    </div>
  </div>
);
