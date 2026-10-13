import type React from 'react';
import { FPS, type TeksLayar } from '../timeline.ts';
import { FONT, KIRI, LEBAR_KOLOM, WARNA } from '../theme.ts';
import { useMuncul } from './anim.ts';

/**
 * Kalimat kunci Bahasa Indonesia (besar) + baris Inggris (kecil). Ini teks
 * penyunting, bukan isi aplikasi. Gaya: 'kolom' = kolom kiri samping ponsel;
 * 'kartu' = kartu putih di atas footage; 'ringkas' = kartu pendek di atas shot
 * lebar (menyisakan wajah pemeran).
 */
export const SideText: React.FC<{
  teks: TeksLayar;
  tahap?: string;
  gaya?: 'kolom' | 'kartu' | 'ringkas';
  atas?: number;
  /** Lebar kolom (bawaan LEBAR_KOLOM); kolom sempit (tata desktop) memakai huruf sedikit lebih kecil. */
  lebar?: number;
}> = ({ teks, tahap, gaya = 'kolom', atas = 250, lebar = LEBAR_KOLOM }) => {
  const ringkas = gaya === 'ringkas';
  const sempit = lebar < LEBAR_KOLOM;
  const opasitas = useMuncul(Math.round((teks.mulaiDi ?? 0.3) * FPS), 14);
  return (
    <div
      style={{
        position: 'absolute',
        left: KIRI,
        top: atas,
        width: lebar,
        fontFamily: FONT,
        color: WARNA.teks,
        opacity: opasitas,
        ...(gaya === 'kolom'
          ? {}
          : {
              width: 'auto',
              maxWidth: LEBAR_KOLOM,
              backgroundColor: 'rgba(255,255,255,0.94)',
              borderRadius: ringkas ? 18 : 24,
              padding: ringkas ? '16px 28px 18px' : '34px 44px 38px',
              boxShadow: '0 12px 40px rgba(26,43,46,0.18)',
            }),
      }}
    >
      {tahap ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 24,
            fontWeight: 700,
            color: WARNA.primer,
            letterSpacing: '0.04em',
            marginBottom: 26,
          }}
        >
          <span style={{ width: 34, height: 4, borderRadius: 2, backgroundColor: WARNA.aksen }} />
          {tahap}
        </div>
      ) : null}
      <div
        style={{
          fontSize: ringkas ? 40 : gaya === 'kartu' ? 56 : sempit ? 54 : 64,
          fontWeight: 750,
          lineHeight: 1.14,
          letterSpacing: '-0.01em',
        }}
      >
        {teks.utama}
      </div>
      <div
        style={{
          fontSize: ringkas ? 22 : 30,
          fontWeight: 500,
          lineHeight: 1.35,
          marginTop: ringkas ? 6 : 22,
          color: '#4B5D60',
        }}
      >
        {teks.en}
      </div>
      {teks.keterangan ? (
        <div
          style={{
            display: 'inline-block',
            marginTop: 26,
            fontSize: 25,
            fontWeight: 600,
            color: WARNA.primer,
            backgroundColor: WARNA.latar,
            borderRadius: 12,
            padding: '10px 18px',
          }}
        >
          {teks.keterangan}
        </div>
      ) : null}
    </div>
  );
};
