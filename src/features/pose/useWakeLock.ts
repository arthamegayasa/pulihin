import { useEffect } from 'react';

/**
 * Jaga layar tetap menyala selama `aktif` (Screen Wake Lock API).
 * Browser melepas kunci saat tab tersembunyi, jadi kunci diminta ulang saat tab terlihat lagi.
 * Bila API tidak tersedia, tidak terjadi apa pun.
 */
export function useWakeLock(aktif: boolean): void {
  useEffect(() => {
    if (!aktif || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let kunci: WakeLockSentinel | null = null;
    let hidup = true;

    const minta = async () => {
      if (document.visibilityState !== 'visible' || (kunci && !kunci.released)) return;
      try {
        const k = await navigator.wakeLock.request('screen');
        if (hidup) kunci = k;
        else void k.release();
      } catch {
        /* hemat daya atau izin ditolak: layar mungkin meredup, sesi tetap berjalan */
      }
    };
    const saatTerlihat = () => {
      if (document.visibilityState === 'visible') void minta();
    };

    void minta();
    document.addEventListener('visibilitychange', saatTerlihat);
    return () => {
      hidup = false;
      document.removeEventListener('visibilitychange', saatTerlihat);
      if (kunci && !kunci.released) void kunci.release();
      kunci = null;
    };
  }, [aktif]);
}
