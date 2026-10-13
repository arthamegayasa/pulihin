/**
 * Privasi secara desain (Bab 17.3): PULIHIN tidak pernah butuh server lain selain domainnya sendiri.
 * Pustaka MediaPipe Tasks Vision mengirim log pemakaian ke odml.pa.googleapis.com tiap 60 detik dan tidak
 * menyediakan opsi untuk mematikannya. Penjaga ini menolak semua `fetch` lintas-origin di sisi aplikasi
 * (tanpa menyentuh jaringan), sehingga tab Network hanya berisi aset PULIHIN sendiri.
 * Lapisan kedua: header Content-Security-Policy `connect-src 'self'` di vercel.json.
 */
const hostTercatat = new Set<string>();
const fetchTerjaga = new WeakSet<typeof fetch>();

export function pasangPenjagaJaringan(target: typeof globalThis = globalThis): void {
  const sekarang = target.fetch;
  if (typeof sekarang !== 'function' || fetchTerjaga.has(sekarang)) return;
  const asli = sekarang.bind(target);
  const origin = target.location?.origin;

  const terjaga: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), origin);
    if (origin && url.origin !== origin) {
      if (!hostTercatat.has(url.host)) {
        hostTercatat.add(url.host);
        console.info(`[PULIHIN] Permintaan ke ${url.host} diblokir: data tidak dikirim ke luar perangkat.`);
      }
      return new Response(null, { status: 204, statusText: 'Diblokir PULIHIN' });
    }
    return asli(input, init);
  };
  fetchTerjaga.add(terjaga);
  target.fetch = terjaga;
}
