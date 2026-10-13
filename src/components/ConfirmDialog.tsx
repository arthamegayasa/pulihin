import { useEffect, useRef, type ReactNode } from 'react';
import { BigButton } from '@/components/BigButton';

/** Dialog konfirmasi modal (elemen <dialog> bawaan: fokus terkunci, tombol Kembali/Esc menutup). */
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
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (buka && !d.open) d.showModal();
    if (!buka && d.open) d.close();
  }, [buka]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!sibuk) onBatal();
      }}
      aria-labelledby="judul-konfirmasi"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-kartu bg-white p-5 text-teks shadow-angkat backdrop:bg-teks/50"
    >
      <h2 id="judul-konfirmasi" className="text-[1.3rem] font-extrabold leading-tight">
        {judul}
      </h2>
      <div className="mt-2 space-y-2 text-teks-2">{children}</div>
      <div className="mt-5 flex flex-col gap-3">
        <BigButton onClick={onYa} disabled={sibuk}>
          {sibuk ? 'Sedang diproses...' : labelYa}
        </BigButton>
        <BigButton varian="garis" onClick={onBatal} disabled={sibuk}>
          {labelBatal}
        </BigButton>
      </div>
    </dialog>
  );
}
