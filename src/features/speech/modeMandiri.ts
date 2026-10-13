import { useSyncExternalStore } from 'react';

/**
 * Pilihan manual "Mode Mandiri" (penilaian oleh pasien/pendamping, tanpa pengenal suara).
 * Disimpan terpisah dari prefs bersama agar kontrak prefs tidak berubah.
 */
const KUNCI = 'pulihin.afasia.modeMandiri.v1';
const pendengar = new Set<() => void>();
let nilai: boolean | null = null;

function baca(): boolean {
  if (nilai === null) {
    try {
      nilai = localStorage.getItem(KUNCI) === '1';
    } catch {
      nilai = false;
    }
  }
  return nilai;
}

export function setModeMandiriDipilih(aktif: boolean): void {
  nilai = aktif;
  try {
    if (aktif) localStorage.setItem(KUNCI, '1');
    else localStorage.removeItem(KUNCI);
  } catch {
    /* mode privat: pilihan tetap berlaku selama aplikasi terbuka */
  }
  pendengar.forEach((l) => l());
}

function langgan(l: () => void) {
  pendengar.add(l);
  return () => {
    pendengar.delete(l);
  };
}

export function useModeMandiriDipilih(): boolean {
  return useSyncExternalStore(langgan, baca, () => false);
}
