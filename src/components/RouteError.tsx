import { ArrowClockwise } from '@phosphor-icons/react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { BigButton, BigLink } from '@/components/BigButton';

/** Halaman kendala yang ramah, bukan halaman error teknis. */
export function RouteError() {
  const err = useRouteError();
  const detail = isRouteErrorResponse(err) ? `${err.status}` : err instanceof Error ? err.message : '';
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-5 px-5">
      <h1 className="text-[1.6rem] font-extrabold">Maaf, ada kendala kecil</h1>
      <p className="text-teks-2">Halaman ini belum bisa ditampilkan. Data latihan Anda tetap aman di ponsel ini.</p>
      <BigButton onClick={() => window.location.reload()} ikon={<ArrowClockwise size={24} weight="bold" />}>
        Muat Ulang
      </BigButton>
      <BigLink to="/app" varian="garis">
        Ke Beranda
      </BigLink>
      {detail && <p className="text-[0.8rem] text-teks-2">Kode: {detail}</p>}
    </main>
  );
}
