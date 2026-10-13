import { Link } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { Logo } from '@/components/Logo';
import { PATHS } from '@/router-paths';

/** Ajakan penutup: juri dapat langsung mencoba tanpa akun karena data contoh sudah tersedia. */
export function AjakanCoba() {
  return (
    <section aria-labelledby="judul-coba" className="mx-auto max-w-6xl px-5 pb-16 md:px-8 lg:pb-20">
      <div className="rounded-kartu bg-primer-terang px-6 py-12 text-center ring-1 ring-primer-garis/60 lg:py-16">
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
      </div>
    </section>
  );
}

/** Catatan kaki wajib (Bab 13.1, 17.1). */
export function KakiLanding() {
  return (
    <footer className="border-t border-garis bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-[0.95rem] text-teks-2 md:grid-cols-12 md:px-8">
        <div className="space-y-3 md:col-span-8">
          <Logo className="h-7 w-auto" />
          <p className="max-w-[60ch]">
            Prototype lomba .id Developer Day Indonesia 2026, kategori Health and Wellbeing. Bukan alat kesehatan teregulasi.
          </p>
          <p className="max-w-[60ch]">
            Semua tangkapan layar diambil dari aplikasi ini dengan data contoh. Pak Budi adalah nama samaran.
          </p>
          <p>Tim: [DIISI]</p>
        </div>
        <div className="space-y-2 md:col-span-4 md:text-right">
          <p className="font-bold text-teks">pulihinapp.id</p>
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
