import { PersonArmsSpread } from '@phosphor-icons/react';
import { useState } from 'react';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { asetPeraga } from '@/features/pose/asetPose';

/** Gambar kecil peraga 3D berukuran 256x256 (`public/peraga/<id>-kartu.webp`, dibuat `node peraga3d/buat.mjs <id> --kartu`). */
const SISI_KARTU = 256;

/**
 * Gambar kecil latihan: peraga 3D pada pose puncak (otot kerja menyala), dibingkai rapat pada bagian tubuh yang
 * bergerak, di atas latar rata warna ilustrasi (#EEF4F2) sehingga menyatu dengan ubin ilustrasi lain. Dekoratif: nama
 * latihan selalu tertulis di sebelahnya. Ukuran ditentukan `className` (mis. `size-[56px]`). Di-precache service
 * worker (tersedia luring); berkas gagal → ubin ikon tenang seukuran bingkai.
 */
export function PosterLatihan({ latihanId, className = 'size-[56px]', prioritas = false }: { latihanId: string; className?: string; prioritas?: boolean }) {
  const def = getExercise(latihanId);
  const src = def ? asetPeraga(def.animasiAtauVideo).kartu : null;
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
    <span aria-hidden className={`${bingkai} bg-ilustrasi`}>
      <img
        src={src}
        width={SISI_KARTU}
        height={SISI_KARTU}
        alt=""
        loading={prioritas ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className="size-full object-cover select-none"
        onError={() => setGagal(src)}
      />
    </span>
  );
}
