import type React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { FPS, type TeksLayar } from '../timeline.ts';
import { FONT, KIRI, LEBAR_KOLOM, WARNA } from '../theme.ts';

/**
 * Kalimat kunci Bahasa Indonesia (besar) + baris Inggris (kecil). Ini teks penyunting, bukan isi aplikasi.
 * Gaya: 'kolom' = kolom kiri samping ponsel (teks gelap); 'sinema' = di atas footage AI (teks putih, bayangan
 * lembut); 'ringkas' = kartu pendek di atas kartu video lebar.
 * Muncul naik pelan dengan easing lembut; baris Inggris menyusul sedikit kemudian.
 */
export const SideText: React.FC<{
  teks: TeksLayar;
  tahap?: string;
  gaya?: 'kolom' | 'sinema' | 'ringkas';
  atas?: number;
  /** Lebar kolom (bawaan LEBAR_KOLOM); kolom sempit (tata desktop) memakai huruf sedikit lebih kecil. */
  lebar?: number;
}> = ({ teks, tahap, gaya = 'kolom', atas = 250, lebar = LEBAR_KOLOM }) => {
  const frame = useCurrentFrame();
  const mulai = Math.round((teks.mulaiDi ?? 0.35) * FPS);
  const naik = (tunda: number) => {
    const p = interpolate(frame, [mulai + tunda, mulai + tunda + 22], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    return { opacity: p, transform: `translateY(${(1 - p) * 18}px)` };
  };
  const ringkas = gaya === 'ringkas';
  const sinema = gaya === 'sinema';
  const sempit = lebar < LEBAR_KOLOM;
  const bayangan = sinema ? '0 2px 24px rgba(0,0,0,0.35)' : undefined;
  return (
    <div
      style={{
        position: 'absolute',
        left: KIRI,
        top: atas,
        // Kolom samping ponsel dibatasi 780 px agar tidak menabrak label penunjuk di kiri ponsel.
        width: ringkas ? 'auto' : Math.min(lebar, 780),
        maxWidth: LEBAR_KOLOM,
        fontFamily: FONT,
        color: sinema ? WARNA.putih : WARNA.teks,
        ...(ringkas
          ? {
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 18,
              padding: '16px 28px 18px',
              boxShadow: '0 12px 40px rgba(26,43,46,0.14)',
            }
          : {}),
      }}
    >
      {tahap ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 22,
            fontWeight: 700,
            color: sinema ? WARNA.aksenTerang : WARNA.primer,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 28,
            ...naik(0),
          }}
        >
          <span style={{ width: 34, height: 3, borderRadius: 2, backgroundColor: sinema ? WARNA.aksenTerang : WARNA.aksen }} />
          {tahap}
        </div>
      ) : null}
      <div
        style={{
          fontSize: ringkas ? 38 : sinema ? 68 : sempit ? 44 : 58,
          fontWeight: 750,
          lineHeight: 1.12,
          letterSpacing: '-0.015em',
          textShadow: bayangan,
          textWrap: 'balance',
          ...naik(4),
        }}
      >
        {teks.utama}
      </div>
      <div
        style={{
          fontSize: ringkas ? 21 : 28,
          fontWeight: 500,
          lineHeight: 1.35,
          marginTop: ringkas ? 6 : 20,
          color: sinema ? 'rgba(255,255,255,0.82)' : WARNA.teksLembut,
          textShadow: bayangan,
          ...naik(10),
        }}
      >
        {teks.en}
      </div>
      {teks.keterangan ? (
        <div
          style={{
            display: 'inline-block',
            marginTop: 26,
            fontSize: 24,
            fontWeight: 600,
            color: WARNA.primer,
            backgroundColor: WARNA.latar,
            borderRadius: 12,
            padding: '10px 18px',
            ...naik(16),
          }}
        >
          {teks.keterangan}
        </div>
      ) : null}
    </div>
  );
};
