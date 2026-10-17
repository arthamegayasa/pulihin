import { CheckCircle, Info, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export type NadaToast = 'sukses' | 'info';

/** Cukup lama untuk dibaca pelan oleh lansia (>= 7 detik); tombol Tutup tersedia untuk menutup lebih awal. */
const DURASI_MS = 8000;

/** Pesan singkat di bagian bawah layar; dibacakan pembaca layar lewat role="status". */
export function Toast({ pesan, nada = 'sukses', onTutup }: { pesan: string | null; nada?: NadaToast; onTutup: () => void }) {
  useEffect(() => {
    if (!pesan) return;
    const id = window.setTimeout(onTutup, DURASI_MS);
    return () => window.clearTimeout(id);
  }, [pesan, onTutup]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 safe-bottom" role="status" aria-live="polite">
      {pesan && (
        <div className="pointer-events-auto flex w-full max-w-md animate-naik items-start gap-3 rounded-kartu bg-teks py-2 pl-4 pr-2 text-white shadow-mengambang ring-1 ring-white/10">
          {nada === 'sukses' ? (
            <CheckCircle size={26} weight="fill" className="mt-2.5 shrink-0 text-[#7fd49b]" aria-hidden />
          ) : (
            <Info size={26} weight="fill" className="mt-2.5 shrink-0" aria-hidden />
          )}
          <p className="min-w-0 flex-1 py-2 font-semibold">{pesan}</p>
          <button
            type="button"
            onClick={onTutup}
            className="grid size-12 shrink-0 place-items-center rounded-kontrol text-white hover:bg-white/10 active:bg-white/15"
            aria-label="Tutup pesan"
          >
            <X size={24} weight="bold" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

/** `const [toast, tampilkan] = useToast()` lalu render `{toast}` sekali di halaman. */
export function useToast(): [ReactNode, (pesan: string, nada?: NadaToast) => void] {
  const [state, setState] = useState<{ pesan: string; nada: NadaToast; n: number } | null>(null);
  const n = useRef(0);
  const tutup = useCallback(() => setState(null), []);
  const tampilkan = useCallback((pesan: string, nada: NadaToast = 'sukses') => setState({ pesan, nada, n: ++n.current }), []);
  return [<Toast key={state?.n ?? 0} pesan={state?.pesan ?? null} nada={state?.nada} onTutup={tutup} />, tampilkan];
}
