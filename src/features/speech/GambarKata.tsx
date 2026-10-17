import { useState } from 'react';
import { Ilustrasi } from '@/components/premium/Ilustrasi';
import type { Kata } from './types';

/**
 * Gambar satu kata afasia: ilustrasi S2 `/ilustrasi/kata/<id>.webp` di ubin persegi berlatar #EEF4F2.
 * Bila berkas gagal dimuat (luring sebelum tersimpan di cache), ubin yang sama menampilkan emoji dari
 * bank kata, jadi latihan tetap bisa berjalan dan tata letak tidak bergeser.
 *
 * `ukuran`: panjang CSS sisi ubin (mis. '2.75rem' atau 'min(10rem, 24dvh)').
 * `prioritas`: kata yang sedang dilatih (muat segera); selainnya lazy.
 * `className`: radius dan transisi ubin (bawaan `rounded-kartu`).
 */
export function GambarKata({
  kata,
  ukuran,
  prioritas = false,
  className = 'rounded-kartu',
}: {
  kata: Kata;
  ukuran: string;
  prioritas?: boolean;
  className?: string;
}) {
  const [gagalId, setGagalId] = useState<string | null>(null);
  const alt = `Gambar ${kata.kata}`;
  const kotak = `inline-grid shrink-0 place-items-center overflow-hidden bg-ilustrasi ${className}`;

  if (gagalId === kata.id) {
    return (
      <span
        role="img"
        aria-label={alt}
        data-gambar-kata={kata.id}
        className={`${kotak} select-none leading-none`}
        style={{ width: ukuran, height: ukuran, fontSize: `calc(${ukuran} * 0.58)` }}
      >
        {kata.emoji}
      </span>
    );
  }

  return (
    <span data-gambar-kata={kata.id} className={kotak} style={{ width: ukuran, height: ukuran }}>
      <Ilustrasi
        jenis="kata"
        nama={kata.id}
        alt={alt}
        prioritas={prioritas}
        bilaGagal="sembunyi"
        onGagal={() => setGagalId(kata.id)}
        className="block size-full"
      />
    </span>
  );
}
