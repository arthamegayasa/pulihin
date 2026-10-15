import type React from 'react';
import { AbsoluteFill } from 'remotion';
import { DOMAIN, KATEGORI, LABEL_KARAKTER, NAMA_TIM, SUBKATEGORI } from '../timeline.ts';
import { FONT, WARNA } from '../theme.ts';
import { useMuncul } from './anim.ts';

/** Layar penutup statis (Bab 14.3/16, >= 5 dtk): nama produk, alamat aktif, kategori, tim. */
export const ClosingCard: React.FC = () => {
  const opasitas = useMuncul(4, 18);
  return (
    <AbsoluteFill
      style={{ backgroundColor: WARNA.putih, fontFamily: FONT, color: WARNA.teks, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
    >
      <div style={{ opacity: opasitas, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 150, fontWeight: 800, color: WARNA.primer, letterSpacing: '0.02em', lineHeight: 1 }}>PULIHIN</div>
        <div style={{ marginTop: 18, fontSize: 36, fontWeight: 600 }}>Pendamping Rehabilitasi Stroke di Rumah</div>
        <div style={{ marginTop: 40, width: 80, height: 6, borderRadius: 3, backgroundColor: WARNA.aksen }} />
        <div style={{ marginTop: 40, fontSize: 64, fontWeight: 750, color: WARNA.primer }}>{DOMAIN}</div>
        <div
          style={{ marginTop: 40, backgroundColor: WARNA.latar, borderRadius: 20, padding: '22px 40px', fontSize: 32, fontWeight: 600, lineHeight: 1.4 }}
        >
          {SUBKATEGORI}
          <br />
          {KATEGORI}
        </div>
        {/* Nama tim dari src/config/identitas.ts; tidak tampil selama belum diisi. */}
        {NAMA_TIM ? <div style={{ marginTop: 34, fontSize: 30, fontWeight: 600 }}>Tim: {NAMA_TIM}</div> : null}
        <div style={{ marginTop: 44, fontSize: 22, fontWeight: 500, color: '#4B5D60', lineHeight: 1.5 }}>
          Prototype kompetisi, bukan alat kesehatan teregulasi · data Demo · {LABEL_KARAKTER}
          <br />
          Narasi: suara sintetis · suara aplikasi disuarakan ulang
        </div>
      </div>
    </AbsoluteFill>
  );
};
