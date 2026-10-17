import { CaretRight } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { Logo } from '@/components/Logo';
import { Ilustrasi } from '@/components/premium';
import { HOST_PUBLIK, IDENTITAS } from '@/config/identitas';
import { PATHS } from '@/router-paths';
import type { Role } from '@/types';

const PERAN: { peran: Role; label: string; sub: string }[] = [
  { peran: 'pasien', label: 'Pasien', sub: 'Latihan hari ini' },
  { peran: 'keluarga', label: 'Keluarga', sub: 'Ringkasan mingguan' },
  { peran: 'terapis', label: 'Terapis', sub: 'Dashboard dan resep' },
];

/** Ajakan penutup: juri dapat langsung mencoba tanpa akun karena data contoh sudah tersedia. */
export function AjakanCoba() {
  return (
    <section aria-labelledby="judul-coba" className="mx-auto max-w-6xl px-5 py-16 md:px-8 lg:py-20">
      <div className="rounded-panel bg-primer-terang px-6 py-12 text-center ring-1 ring-primer-garis/60 lg:px-12 lg:py-16">
        <h2 id="judul-coba" className="text-balance text-[1.75rem] font-extrabold leading-tight tracking-tight lg:text-[2.2rem]">
          Coba sekarang, tanpa daftar akun
        </h2>
        <p className="mx-auto mt-4 max-w-[48ch] text-teks-2">
          Pilih peran pasien, keluarga, atau terapis. Data contoh Pak Budi (nama samaran) sudah tersedia, jadi setiap layar
          langsung terisi.
        </p>
        <BigLink to={PATHS.app} penuh={false} className="mt-8 px-8">
          Buka Aplikasi
        </BigLink>
        <p className="mt-8 font-semibold text-teks-2">Atau langsung buka sebagai:</p>
        <ul className="mx-auto mt-4 grid max-w-3xl gap-3 sm:grid-cols-3">
          {PERAN.map((p) => (
            <li key={p.peran}>
              <Link
                to={`${PATHS.app}?peran=${p.peran}`}
                className="group flex min-h-[48px] items-center gap-3 rounded-kartu border border-garis-halus bg-permukaan p-3 text-left shadow-tipis transition-[border-color,box-shadow] duration-(--durasi-sedang) hover:border-primer-garis hover:shadow-sedang"
              >
                <Ilustrasi jenis="peran" nama={p.peran} bilaGagal="sembunyi" className="block size-16 shrink-0 rounded-kontrol" />
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold text-primer">{p.label}</span>
                  <span className="block text-[0.95rem] text-teks-2">{p.sub}</span>
                </span>
                <CaretRight size={22} weight="bold" className="shrink-0 text-primer" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Catatan kaki wajib (Bab 13.1, 17.1). */
export function KakiLanding() {
  return (
    <footer className="border-t border-garis-halus bg-permukaan">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-[0.95rem] text-teks-2 md:grid-cols-12 md:px-8">
        <div className="space-y-3 md:col-span-8">
          <Logo className="h-7 w-auto" />
          <p className="max-w-[60ch]">Prototype lomba {IDENTITAS.kategoriLomba}. Bukan alat kesehatan teregulasi.</p>
          <p className="max-w-[60ch]">
            Semua tangkapan layar diambil dari aplikasi ini dengan data contoh. Pak Budi adalah nama samaran. Ilustrasi adalah
            gambar buatan, bukan foto pasien.
          </p>
          {IDENTITAS.namaTim && <p>Tim: {IDENTITAS.namaTim}</p>}
          {IDENTITAS.narasumberKlinis && <p>Narasumber klinis: {IDENTITAS.narasumberKlinis}</p>}
        </div>
        <div className="space-y-2 md:col-span-4 md:text-right">
          <p className="font-bold text-teks">{HOST_PUBLIK}</p>
          {IDENTITAS.kontakPublik && <p>Kontak: {IDENTITAS.kontakPublik}</p>}
          <p>
            <Link to={PATHS.tentang} className="font-bold text-primer underline decoration-2 underline-offset-4 hover:text-primer-tua">
              Tentang dan privasi
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
