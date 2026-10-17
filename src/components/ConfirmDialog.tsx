import { useEffect, useId, useRef, type ReactNode } from 'react';
import { BigButton } from '@/components/BigButton';

/**
 * Dialog konfirmasi modal (elemen <dialog> bawaan: fokus terkunci, tombol Kembali/Esc menutup).
 * Semua konfirmasi di aplikasi mengganti atau membuang data, jadi fokus awal selalu di tombol Batal:
 * tekan Enter/Spasi tanpa sengaja tidak pernah menjalankan tindakan yang tidak bisa dibatalkan.
 */
export function ConfirmDialog({
  buka,
  judul,
  children,
  labelYa,
  labelBatal = 'Batal',
  sibuk = false,
  onYa,
  onBatal,
}: {
  buka: boolean;
  judul: string;
  children: ReactNode;
  labelYa: string;
  labelBatal?: string;
  sibuk?: boolean;
  onYa: () => void;
  onBatal: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idJudul = useId();
  const idIsi = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (buka && !d.open) {
      d.showModal();
      d.querySelector<HTMLButtonElement>('[data-batal]')?.focus();
    }
    if (!buka && d.open) d.close();
  }, [buka]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!sibuk) onBatal();
      }}
      aria-labelledby={idJudul}
      aria-describedby={idIsi}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-panel border border-garis-halus bg-permukaan-naik p-5 text-teks shadow-mengambang open:animate-naik backdrop:bg-teks/55"
    >
      <h2 id={idJudul} className="text-[1.3rem] font-extrabold leading-tight tracking-[-0.01em] text-balance">
        {judul}
      </h2>
      <div id={idIsi} className="mt-2 space-y-2 text-teks-2">
        {children}
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <BigButton onClick={onYa} disabled={sibuk}>
          {sibuk ? 'Sedang diproses...' : labelYa}
        </BigButton>
        <BigButton varian="garis" onClick={onBatal} disabled={sibuk} data-batal="">
          {labelBatal}
        </BigButton>
      </div>
    </dialog>
  );
}
