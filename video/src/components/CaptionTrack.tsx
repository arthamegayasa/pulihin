import type React from 'react';
import { useCurrentFrame } from 'remotion';
import { buatIsyarat, isyaratPada } from '../subtitle.ts';
import { FPS } from '../timeline.ts';
import { BAWAH_SUBTITLE, FONT, KIRI, LEBAR_KOLOM } from '../theme.ts';

const ISYARAT_EN = buatIsyarat('en');

/**
 * Subtitle Inggris tertanam, identik dengan docs/video/subtitle-en.srt.
 * Kiri bawah, jauh dari bingkai ponsel, sehingga tidak menutupi skor atau
 * pesan koreksi.
 */
export const CaptionTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const isyarat = isyaratPada(ISYARAT_EN, frame / FPS);
  if (!isyarat) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: KIRI,
        bottom: BAWAH_SUBTITLE,
        maxWidth: LEBAR_KOLOM,
        fontFamily: FONT,
        fontSize: 34,
        fontWeight: 550,
        lineHeight: 1.32,
        color: '#FFFFFF',
        backgroundColor: 'rgba(26, 43, 46, 0.86)',
        borderRadius: 14,
        padding: '12px 24px 14px',
      }}
    >
      {isyarat.baris.map((b) => (
        <div key={b}>{b}</div>
      ))}
    </div>
  );
};
