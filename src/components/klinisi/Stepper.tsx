import { Minus, Plus } from '@phosphor-icons/react';
import { useId } from 'react';
import type { Batas } from '@/features/adherence/program';

/** Pengatur angka dengan tombol - / + besar (56px), tanpa kolom isian kecil. */
export function Stepper({
  label,
  nilai,
  batas,
  satuan,
  onUbah,
}: {
  label: string;
  nilai: number;
  batas: Batas;
  /** Kata setelah angka, mis. "kali" atau "hari". */
  satuan: string;
  onUbah: (nilai: number) => void;
}) {
  const id = useId();
  const tombol =
    'grid size-14 shrink-0 place-items-center rounded-kontrol border-2 border-primer bg-permukaan text-primer shadow-tipis transition-[transform,background-color] duration-(--durasi-cepat) ease-tekan hover:bg-primer-terang active:translate-y-px active:shadow-none disabled:border-garis disabled:text-teks-2/50 disabled:shadow-none disabled:pointer-events-none';
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="mb-1 text-[0.95rem] font-bold text-teks-2">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={tombol}
          onClick={() => onUbah(nilai - 1)}
          disabled={nilai <= batas.min}
          aria-label={`Kurangi ${label.toLowerCase()}`}
        >
          <Minus size={26} weight="bold" aria-hidden />
        </button>
        <output className="min-w-[4.5rem] flex-1 text-center leading-none" aria-live="polite">
          <span className="block text-[1.6rem] font-extrabold tabular text-teks">{nilai}</span>
          <span className="text-[0.95rem] font-semibold text-teks-2">{satuan}</span>
        </output>
        <button
          type="button"
          className={tombol}
          onClick={() => onUbah(nilai + 1)}
          disabled={nilai >= batas.max}
          aria-label={`Tambah ${label.toLowerCase()}`}
        >
          <Plus size={26} weight="bold" aria-hidden />
        </button>
      </div>
    </div>
  );
}
