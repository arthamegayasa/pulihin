import { useEffect, useRef, useState, type DependencyList } from 'react';
import { onDataChange } from '@/data/db';

export interface LiveQuery<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
}

/**
 * Jalankan query IndexedDB dan ulangi otomatis setiap kali data berubah (dalam tab ini atau tab lain).
 * `deps` sama seperti useEffect: query dijalankan ulang saat salah satunya berubah.
 */
export function useLiveQuery<T>(query: () => Promise<T>, deps: DependencyList): LiveQuery<T> {
  const [state, setState] = useState<LiveQuery<T>>({ data: undefined, loading: true, error: null });
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    let alive = true;
    let seq = 0;
    const run = () => {
      const mine = ++seq;
      queryRef
        .current()
        .then((data) => {
          if (alive && mine === seq) setState({ data, loading: false, error: null });
        })
        .catch((error: unknown) => {
          if (alive && mine === seq)
            setState((s) => ({ ...s, loading: false, error: error instanceof Error ? error : new Error(String(error)) }));
        });
    };
    setState((s) => ({ ...s, loading: true }));
    run();
    const off = onDataChange(run);
    return () => {
      alive = false;
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
