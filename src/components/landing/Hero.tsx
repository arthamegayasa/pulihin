import { BigLink } from '@/components/BigButton';
import { PATHS } from '@/router-paths';
import { AreaIntip, BingkaiPonsel } from './Bingkai';
import { LAYAR } from './tangkapanLayar';

/** Hero: nama + satu kalimat nilai produk + satu tindakan utama, dengan tangkapan layar Beranda asli. */
export function Hero() {
  return (
    <section
      aria-labelledby="judul-hero"
      className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 md:px-8 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-10"
    >
      <div className="lg:col-span-6">
        <h1
          id="judul-hero"
          className="text-balance text-[2.15rem] font-extrabold leading-[1.1] tracking-tight text-teks sm:text-[2.6rem] lg:text-[2.35rem] xl:text-[3rem]"
        >
          Teman latihan pascastroke di rumah.
        </h1>
        <p className="mt-5 max-w-[36ch] text-[1.1rem] leading-relaxed text-teks-2 lg:text-[1.2rem]">
          Kamera HP biasa menghitung gerakan dan memberi arahan berbahasa Indonesia, sementara keluarga dan terapis ikut
          melihat kemajuannya.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
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
      </div>

      <div className="lg:col-span-6">
        <div className="rounded-kartu bg-primer-terang px-5 pt-8 ring-1 ring-primer-garis/60 lg:pt-10">
          {/* Potongan dipilih agar Beranda terlihat sampai "Lihat semua latihan" tanpa ruang kosong di bawahnya. */}
          <AreaIntip tinggi="h-[25.5rem] sm:h-[28.5rem] lg:h-[33.5rem]">
            <BingkaiPonsel
              layar={LAYAR.beranda}
              prioritas
              className="absolute left-1/2 top-0 w-[15rem] -translate-x-1/2 sm:w-[16.75rem] lg:w-[19.5rem]"
            />
          </AreaIntip>
        </div>
      </div>
    </section>
  );
}
