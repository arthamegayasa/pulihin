import type React from 'react';
import { FONT, KIRI, WARNA } from '../theme.ts';

/** Penanda kecil PULIHIN di kiri atas pada adegan rekaman layar. */
export const Wordmark: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: KIRI,
      top: 74,
      display: 'flex',
      alignItems: 'baseline',
      gap: 18,
      fontFamily: FONT,
    }}
  >
    <span style={{ fontSize: 32, fontWeight: 800, color: WARNA.primer, letterSpacing: '0.04em' }}>PULIHIN</span>
    <span style={{ fontSize: 20, fontWeight: 600, color: '#4B5D60' }}>Prototype · data Demo</span>
  </div>
);
