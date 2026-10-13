import type React from 'react';
import { LABEL_PEMERAN } from '../timeline.ts';
import { FONT, WARNA } from '../theme.ts';

/** Label etika Bab 14.4/15.1: tampil setiap kali pemeran demo terlihat. */
export const PemeranLabel: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: 48,
      top: 44,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: FONT,
      fontSize: 24,
      fontWeight: 700,
      color: WARNA.teks,
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderRadius: 999,
      padding: '10px 22px 10px 16px',
      boxShadow: '0 4px 14px rgba(26,43,46,0.14)',
    }}
  >
    <span style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: WARNA.primer }} />
    {LABEL_PEMERAN}
    <span style={{ fontWeight: 500, color: '#4B5D60' }}>· Demonstration by a performer</span>
  </div>
);
