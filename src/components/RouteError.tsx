import { ArrowClockwise } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { BigButton, BigLink } from '@/components/BigButton';

const KUNCI_MUAT_ULANG = 'pulihin.muatUlangVersi';

/**
 * Halaman kendala yang ramah, bukan halaman error teknis. Rincian teknis hanya ke console.
 * Bila penyebabnya potongan kode lama setelah versi baru dirilis, halaman dimuat ulang sekali secara otomatis.
 */
export function RouteError() {
  const err = useRouteError();
  const versiBaru = err instanceof Error && /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(err.message);

  useEffect(() => {
    console.error('[PULIHIN] Kendala halaman:', err);
    if (versiBaru && !sessionStorage.getItem(KUNCI_MUAT_ULANG)) {
      sessionStorage.setItem(KUNCI_MUAT_ULANG, '1');
      window.location.reload();
    }
  }, [err, versiBaru]);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-5 px-5">
      <h1 className="text-[1.6rem] font-extrabold">Maaf, ada kendala kecil</h1>
      <p className="text-teks-2">
        {versiBaru
          ? 'PULIHIN baru saja diperbarui. Muat ulang halaman untuk memakai versi terbaru.'
          : 'Halaman ini belum bisa ditampilkan. Data latihan Anda tetap aman di ponsel ini.'}
      </p>
      <BigButton onClick={() => window.location.reload()} ikon={<ArrowClockwise size={24} weight="bold" />}>
        Muat Ulang
      </BigButton>
      <BigLink to="/app" varian="garis">
        Ke Beranda
      </BigLink>
      {isRouteErrorResponse(err) && <p className="text-[0.95rem] text-teks-2">Kode halaman: {err.status}</p>}
    </main>
  );
}
