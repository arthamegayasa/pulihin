import type React from 'react';
import { LABEL_AI, LABEL_AI_EN } from '../timeline.ts';
import { FONT, WARNA } from '../theme.ts';

/**
 * Label kejujuran: tampil setiap kali orang buatan AI terlihat (video AI, atau video kamera AI di layar ponsel).
 * `gelap` = di atas footage (kaca gelap, teks putih); bawaan = di atas latar terang.
 */
export const LabelAI: React.FC<{ kiri?: number; atas?: number; kanan?: number; ringkas?: boolean; gelap?: boolean }> = ({
  kiri = 64,
  atas = 56,
  kanan,
  ringkas = false,
  gelap = false,
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
      fontSize: ringkas ? 20 : 22,
      fontWeight: 650,
      letterSpacing: '0.005em',
      color: gelap ? '#FFFFFF' : WARNA.teks,
      backgroundColor: gelap ? 'rgba(10, 26, 25, 0.58)' : 'rgba(255,255,255,0.94)',
      border: gelap ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(26,43,46,0.08)',
      backdropFilter: gelap ? 'blur(10px)' : undefined,
      borderRadius: 999,
      padding: ringkas ? '8px 18px 8px 14px' : '10px 24px 10px 16px',
      boxShadow: gelap ? '0 6px 24px rgba(0,0,0,0.22)' : '0 4px 14px rgba(26,43,46,0.10)',
      whiteSpace: 'nowrap',
    }}
  >
    <span
      style={{
        fontSize: ringkas ? 13 : 14,
        fontWeight: 800,
        letterSpacing: '0.08em',
        color: '#FFFFFF',
        backgroundColor: WARNA.aksen,
        borderRadius: 6,
        padding: '3px 7px',
      }}
    >
      AI
    </span>
    {LABEL_AI}
    {ringkas ? null : <span style={{ fontWeight: 500, opacity: 0.78 }}>· {LABEL_AI_EN}</span>}
  </div>
);
