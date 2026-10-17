import { ArrowClockwise } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { BigButton, BigLink } from '@/components/BigButton';
import { KeadaanKosong } from '@/components/premium';

const KUNCI_MUAT_ULANG = 'pulihin.muatUlangVersi';

/** Status koneksi peramban, diperbarui saat sambungan putus/kembali. */
function useDaring() {
  const [daring, setDaring] = useState(() => navigator.onLine);
  useEffect(() => {
    const ubah = () => setDaring(navigator.onLine);
    window.addEventListener('online', ubah);
    window.addEventListener('offline', ubah);
    return () => {
      window.removeEventListener('online', ubah);
      window.removeEventListener('offline', ubah);
    };
  }, []);
  return daring;
}

/**
 * Halaman kendala yang ramah, bukan halaman error teknis. Rincian teknis hanya ke console.
 * Bila penyebabnya potongan kode lama setelah versi baru dirilis, halaman dimuat ulang sekali secara otomatis.
 * Tanpa internet: ilustrasi luring dan penjelasan bahwa data tetap aman di ponsel.
 */
export function RouteError() {
  const err = useRouteError();
  const daring = useDaring();
  const versiBaru = err instanceof Error && /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(err.message);
  const luring = !daring;

  useEffect(() => {
    console.error('[PULIHIN] Kendala halaman:', err);
    if (versiBaru && daring && !sessionStorage.getItem(KUNCI_MUAT_ULANG)) {
      sessionStorage.setItem(KUNCI_MUAT_ULANG, '1');
      window.location.reload();
    }
  }, [err, versiBaru, daring]);

  let judul = 'Maaf, ada kendala kecil';
  let pesan = 'Halaman ini belum bisa ditampilkan. Data latihan Anda tetap aman di ponsel ini.';
  if (luring) {
    judul = 'Sedang tanpa internet';
    pesan = 'Halaman ini belum tersimpan di ponsel. Sambungkan internet, lalu muat ulang. Data latihan Anda tetap aman di ponsel ini.';
  } else if (versiBaru) {
    judul = 'PULIHIN baru saja diperbarui';
    pesan = 'Muat ulang halaman untuk memakai versi terbaru. Data latihan Anda tetap aman di ponsel ini.';
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-4 px-4 py-8">
      <KeadaanKosong
        as="h1"
        ilustrasi={luring ? 'luring' : 'kosong'}
        judul={judul}
        aksi={
          <div className="space-y-3">
            <BigButton onClick={() => window.location.reload()} ikon={<ArrowClockwise weight="bold" aria-hidden />}>
              Muat Ulang
            </BigButton>
            <BigLink to="/app" varian="garis">
              Ke Beranda
            </BigLink>
          </div>
        }
      >
        {pesan}
      </KeadaanKosong>
      {isRouteErrorResponse(err) && <p className="text-center tipe-keterangan text-teks-2">Kode halaman: {err.status}</p>}
    </main>
  );
}
