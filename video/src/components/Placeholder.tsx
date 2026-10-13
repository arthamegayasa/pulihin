import type React from 'react';
import { AbsoluteFill } from 'remotion';
import type { SlotRekaman } from '../timeline.ts';
import { FONT, WARNA } from '../theme.ts';

/**
 * Di mana kartu placeholder ditempatkan agar tidak bertabrakan dengan teks
 * penyunting: 'layar' = di dalam layar ponsel, 'penuh' = setengah kanan
 * bingkai penuh (judul/lower third/subtitle ada di kiri), 'split' = area shot
 * lebar di bawah kartu kalimat kunci.
 */
export type TataPlaceholder = 'layar' | 'penuh' | 'split';

/**
 * Kartu pengganti untuk slot rekaman yang belum ada. Jelas berlabel
 * PLACEHOLDER dan tidak meniru isi aplikasi.
 */
export const Placeholder: React.FC<{ slot: SlotRekaman; detik: number; tata: TataPlaceholder }> = ({
  slot,
  detik,
  tata,
}) => {
  const sempit = tata === 'layar';
  const huruf = (n: number) => (sempit ? Math.round(n * 0.62) + 3 : n);
  const posisi: React.CSSProperties =
    tata === 'layar'
      ? { left: 30, right: 30, top: 0, bottom: 0, justifyContent: 'center' }
      : tata === 'penuh'
        ? { left: 1120, right: 100, top: 0, bottom: 0, justifyContent: 'center' }
        : { left: 120, width: 760, top: 300 };
  return (
    <AbsoluteFill style={{ backgroundColor: WARNA.latar, fontFamily: FONT, color: WARNA.teks }}>
      <div
        style={{
          position: 'absolute',
          inset: sempit ? 12 : 28,
          border: `3px dashed ${WARNA.primer}55`,
          borderRadius: sempit ? 40 : 24,
        }}
      />
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', gap: sempit ? 12 : 18, ...posisi }}>
        <div
          style={{
            alignSelf: 'flex-start',
            fontSize: huruf(22),
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: WARNA.putih,
            backgroundColor: WARNA.aksen,
            padding: sempit ? '4px 10px' : '6px 14px',
            borderRadius: 8,
          }}
        >
          PLACEHOLDER
        </div>
        <div style={{ fontSize: huruf(40), fontWeight: 700, lineHeight: 1.2 }}>
          {slot.jenis === 'layar' ? 'Rekaman layar belum ada' : 'Rekaman kamera belum ada'}
        </div>
        <div
          style={{
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: huruf(26),
            color: WARNA.primer,
            overflowWrap: 'anywhere',
          }}
        >
          public/footage/{slot.berkas}
        </div>
        <div style={{ fontSize: huruf(26), lineHeight: 1.45 }}>{slot.rekam}</div>
        <div style={{ fontSize: huruf(24), fontWeight: 600, color: WARNA.primer }}>
          Bagian ini: {Math.round(detik)} dtk, mulai detik {slot.mulaiDi} dari berkas
        </div>
      </div>
    </AbsoluteFill>
  );
};
