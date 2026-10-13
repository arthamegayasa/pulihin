import type { ReactNode } from 'react';

/** Sakelar besar (seluruh baris dapat diketuk) dengan kata "Aktif"/"Mati", tidak bergantung pada warna. */
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
      className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-1 py-2 text-left hover:bg-primer-terang disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        {keterangan && <span className="block text-[0.9rem] text-teks-2">{keterangan}</span>}
      </span>
      <span className="text-[0.85rem] font-bold text-teks-2" aria-hidden>
        {aktif ? 'Aktif' : 'Mati'}
      </span>
      <span
        aria-hidden
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${aktif ? 'bg-primer' : 'border-2 border-teks-2/40 bg-garis'}`}
      >
        <span
          className={`absolute top-1/2 size-6 -translate-y-1/2 rounded-full bg-white shadow transition-[left] ${aktif ? 'left-[calc(100%-1.75rem)]' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}
