import { CheckCircle } from '@phosphor-icons/react';
import { BigLink } from '@/components/BigButton';
import { Ilustrasi } from '@/components/premium';
import { PATHS } from '@/router-paths';

const JAMINAN = ['Tanpa alat tambahan', 'Tanpa daftar akun', 'Data tetap di HP'] as const;

/**
 * Hero: ilustrasi S2 (pasien latihan tekuk siku di rumah, keluarga di dekatnya) dengan judul di sepertiga kiri
 * yang tenang (laptop), atau bertumpuk di ponsel: teks dulu, lalu ilustrasi dipotong ke subjeknya.
 * Ilustrasi adalah elemen LCP: dimuat segera dengan prioritas tinggi; width/height intrinsik + rasio tetap = tanpa CLS.
 */
export function Hero() {
  return (
    <section aria-labelledby="judul-hero" className="mx-auto max-w-6xl px-5 pb-16 pt-2 md:px-8 lg:pb-24">
      <div className="relative overflow-hidden rounded-panel bg-ilustrasi ring-1 ring-primer-garis/60 lg:shadow-sedang">
        <div className="relative z-10 px-6 pb-2 pt-9 sm:px-10 lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:w-[34%] lg:flex-col lg:justify-center lg:py-12 lg:pl-12 lg:pr-0">
          <p className="tipe-label text-primer">Rehabilitasi stroke di rumah</p>
          <h1
            id="judul-hero"
            className="mt-3 text-balance text-[2rem] font-extrabold leading-[1.08] tracking-[-0.02em] text-teks [overflow-wrap:break-word] sm:text-[2.6rem] lg:text-[2.35rem] xl:text-[2.85rem]"
          >
            Teman latihan pascastroke di rumah.
          </h1>
          <p className="mt-5 max-w-[34ch] text-[1.08rem] leading-relaxed text-teks-2 lg:max-w-none xl:text-[1.12rem]">
            Kamera HP biasa menghitung gerakan dan memberi arahan berbahasa Indonesia, sementara keluarga dan terapis ikut
            melihat kemajuannya.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <BigLink to={PATHS.app} penuh={false} className="px-8">
              Buka Aplikasi
            </BigLink>
            <a
              href="#cara-kerja"
              className="inline-flex min-h-[48px] items-center font-bold text-primer underline decoration-2 underline-offset-4 hover:text-primer-tua"
            >
              Lihat cara kerja
            </a>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem] font-semibold text-teks lg:flex-col" aria-label="Keunggulan singkat">
            {JAMINAN.map((j) => (
              <li key={j} className="flex items-center gap-1.5">
                <CheckCircle size={20} weight="fill" className="shrink-0 text-primer" aria-hidden />
                {j}
              </li>
            ))}
          </ul>
        </div>

        {/* Ponsel: dipotong persegi ke sisi kanan (subjek). Laptop: rasio 3:2 berjangkar bawah-kanan; sepertiga kiri
            gambar sengaja kosong sebagai tempat judul. */}
        <Ilustrasi
          jenis="landing"
          nama="hero"
          prioritas
          sizes="(min-width: 1024px) 1088px, 100vw"
          className="block aspect-square w-full object-cover object-[78%_100%] sm:aspect-[4/3] sm:object-[100%_100%] lg:aspect-[3/2]"
        />
      </div>
    </section>
  );
}
