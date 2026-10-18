import type React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { DOMAIN, KATEGORI, NAMA_TIM, SUBKATEGORI } from '../timeline.ts';
import { FONT, WARNA } from '../theme.ts';

/** Pengungkapan produksi (juga di deskripsi YouTube). */
export const PENGUNGKAPAN = [
  'Adegan pasien & keluarga dibuat dengan AI (HeyGen), bukan pasien sungguhan',
  'Narasi: suara sintetis ElevenLabs Eleven v4 · Musik: AI Google Lyria 3 Pro',
  `Layar aplikasi: rekaman asli ${DOMAIN} · Suara aplikasi: klip suara aplikasi itu sendiri`,
];

/** Layar penutup (Bab 14.3/16, >= 5 dtk): nama produk, alamat aktif, kategori, tim, pengungkapan. */
export const ClosingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const muncul = (mulai: number) => {
    const p = interpolate(frame, [mulai, mulai + 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 1, 0.36, 1) });
    return { opacity: p, transform: `translateY(${(1 - p) * 14}px)` };
  };
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 40%, #FFFFFF 0%, #F3F8F6 55%, ${WARNA.latar} 100%)`,
        fontFamily: FONT,
        color: WARNA.teks,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 140, fontWeight: 800, color: WARNA.primer, letterSpacing: '0.04em', lineHeight: 1, ...muncul(4) }}>PULIHIN</div>
        <div style={{ marginTop: 18, fontSize: 34, fontWeight: 600, ...muncul(10) }}>Pendamping Rehabilitasi Stroke di Rumah</div>
        <div style={{ marginTop: 34, width: 80, height: 5, borderRadius: 3, backgroundColor: WARNA.aksen, ...muncul(14) }} />
        <div style={{ marginTop: 34, fontSize: 62, fontWeight: 750, color: WARNA.primer, ...muncul(18) }}>{DOMAIN}</div>
        <div
          style={{
            marginTop: 30,
            backgroundColor: WARNA.putih,
            border: '1px solid rgba(11,79,74,0.12)',
            borderRadius: 20,
            padding: '18px 38px',
            fontSize: 28,
            fontWeight: 600,
            lineHeight: 1.4,
            ...muncul(22),
          }}
        >
          {SUBKATEGORI} · {KATEGORI}
        </div>
        {/* Nama tim dari src/config/identitas.ts; tidak tampil selama belum diisi. */}
        {NAMA_TIM ? <div style={{ marginTop: 26, fontSize: 28, fontWeight: 600, ...muncul(24) }}>Tim: {NAMA_TIM}</div> : null}
        <div style={{ marginTop: 40, fontSize: 21, fontWeight: 500, color: WARNA.teksLembut, lineHeight: 1.55, ...muncul(30) }}>
          Prototype kompetisi, bukan alat kesehatan teregulasi · data Demo, nama samaran
          {PENGUNGKAPAN.map((p) => (
            <div key={p}>{p}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
