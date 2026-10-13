import { useSyncExternalStore } from 'react';
import type { Role, SkenarioDemo } from '@/types';

/** Preferensi kecil di localStorage (Bab 10.3). Data sesi ada di IndexedDB. */
export interface Prefs {
  role: Role | null;
  /** Huruf Lebih Besar: memperbesar teks 20% (Bab 12.3). */
  hurufBesar: boolean;
  /** Petunjuk suara Bahasa Indonesia. */
  suaraAktif: boolean;
  /** Pasien demo yang sedang dipakai di tampilan pasien & keluarga. */
  activePatientId: string;
  skenarioDemo: SkenarioDemo;
  /** Sisi tubuh yang dilatih terakhir kali, dipakai sebagai bawaan. */
  sisiLatihan: 'kiri' | 'kanan';
}

const KEY = 'pulihin.prefs.v1';
export const DEFAULT_PREFS: Prefs = {
  role: null,
  hurufBesar: false,
  suaraAktif: true,
  activePatientId: 'budi',
  skenarioDemo: 'stagnasi',
  sisiLatihan: 'kanan',
};

let cache: Prefs | null = null;
const listeners = new Set<() => void>();

function read(): Prefs {
  if (cache) return cache;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    cache = raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : { ...DEFAULT_PREFS };
  } catch {
    cache = { ...DEFAULT_PREFS };
  }
  return cache;
}

export function getPrefs(): Prefs {
  return read();
}

export function setPrefs(patch: Partial<Prefs>): Prefs {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* penyimpanan penuh atau mode privat: preferensi tetap berlaku di sesi ini */
  }
  applyPrefsToDocument(cache);
  listeners.forEach((l) => l());
  return cache;
}

export function resetPrefs(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
  cache = { ...DEFAULT_PREFS };
  applyPrefsToDocument(cache);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, read, read);
}

export function applyPrefsToDocument(p: Prefs = read()): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.huruf = p.hurufBesar ? 'besar' : 'normal';
}
