import { CheckCircle, Info } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export type NadaToast = 'sukses' | 'info';

/** Pesan singkat di bagian bawah layar; dibacakan pembaca layar lewat role="status". */
export function Toast({ pesan, nada = 'sukses', onTutup }: { pesan: string | null; nada?: NadaToast; onTutup: () => void }) {
  useEffect(() => {
    if (!pesan) return;
    const id = window.setTimeout(onTutup, 4500);
    return () => window.clearTimeout(id);
  }, [pesan, onTutup]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 safe-bottom" role="status" aria-live="polite">
      {pesan && (
        <button
          type="button"
          onClick={onTutup}
          className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-teks px-4 py-3 text-left text-white shadow-angkat"
        >
          {nada === 'sukses' ? (
            <CheckCircle size={26} weight="fill" className="mt-0.5 shrink-0 text-[#7fd49b]" aria-hidden />
          ) : (
            <Info size={26} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
          )}
          <span className="font-semibold">{pesan}</span>
        </button>
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
