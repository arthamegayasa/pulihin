import { PersonArmsSpread } from '@phosphor-icons/react';
import { useState } from 'react';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { asetPeraga } from '@/features/pose/asetPose';

/** Poster peraga 3D berukuran 720x720 (`public/peraga/<id>-mulai.webp`, satu cache dengan VideoPeraga). */
const SISI_POSTER = 720;

/**
 * Gambar kecil latihan dari poster peraga 3D (posisi awal). Dekoratif: nama latihan selalu tertulis di sebelahnya.
 * Ukuran ditentukan `className` (mis. `size-[56px]`); gambar sedikit diperbesar agar sosok mengisi bingkai.
 * Lazy bawaan; berkas gagal (luring sebelum tersimpan di cache) → ubin ikon tenang seukuran bingkai.
 */
export function PosterLatihan({ latihanId, className = 'size-[56px]', prioritas = false }: { latihanId: string; className?: string; prioritas?: boolean }) {
  const def = getExercise(latihanId);
  const src = def ? asetPeraga(def.animasiAtauVideo).mulai : null;
  const [gagal, setGagal] = useState<string | null>(null);
  const bingkai = `relative block shrink-0 overflow-hidden rounded-[12px] ${className}`;

  if (!src || gagal === src) {
    return (
      <span aria-hidden className={`${bingkai} grid place-items-center bg-primer-terang text-primer`}>
        <PersonArmsSpread weight="bold" className="size-[45%]" />
      </span>
    );
  }
  return (
    <span aria-hidden className={`${bingkai} bg-cekung`}>
      <img
        src={src}
        width={SISI_POSTER}
        height={SISI_POSTER}
        alt=""
        loading={prioritas ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className="size-full scale-[1.22] object-cover select-none"
        onError={() => setGagal(src)}
      />
    </span>
  );
}
