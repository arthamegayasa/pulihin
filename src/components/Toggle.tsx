import type { ReactNode } from 'react';

/**
 * Sakelar besar (seluruh baris dapat diketuk) dengan kata "Aktif"/"Mati", tidak bergantung pada warna.
 * Keadaan mati: trek putih bergaris teks-2 dengan kenop teks-2 (kontras 7:1), bukan abu-abu pucat.
 */
export function Toggle({
  label,
  keterangan,
  aktif,
  onUbah,
  disabled = false,
}: {
  label: string;
  keterangan?: ReactNode;
  aktif: boolean;
  onUbah: (aktif: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={aktif}
      disabled={disabled}
      onClick={() => onUbah(!aktif)}
      className="flex min-h-[56px] w-full items-center gap-3 rounded-kontrol px-1 py-2 text-left transition-colors duration-(--durasi-cepat) hover:bg-primer-terang active:bg-primer-terang disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        {keterangan && <span className="block text-[0.95rem] text-teks-2">{keterangan}</span>}
      </span>
      {/* Sakelar (ukuran px) dengan kata keadaan di bawahnya: kolom kanan tetap sempit saat Huruf Lebih Besar. */}
      <span className="flex shrink-0 flex-col items-center gap-0.5" aria-hidden>
        <span
          className={`relative h-[32px] w-[56px] rounded-full border-2 transition-colors duration-(--durasi-sedang) ${aktif ? 'border-primer bg-primer' : 'border-teks-2 bg-white'}`}
        >
          {/* Kenop bergeser lewat transform (GPU), bukan `left`. */}
          <span
            className={`absolute left-[4px] top-1/2 size-[20px] -translate-y-1/2 rounded-full transition-[translate,background-color] duration-(--durasi-sedang) ease-lembut ${aktif ? 'translate-x-[24px] bg-white shadow-[0_1px_2px_rgb(8_59_55/0.35)]' : 'translate-x-0 bg-teks-2'}`}
          />
        </span>
        <span className="text-[0.95rem] font-bold leading-tight text-teks-2">{aktif ? 'Aktif' : 'Mati'}</span>
      </span>
    </button>
  );
}
