import { Link } from 'react-router';
import { Logo } from '@/components/Logo';
import { CaraKerja } from '@/components/landing/CaraKerja';
import { Hero } from '@/components/landing/Hero';
import { Keunggulan } from '@/components/landing/Keunggulan';
import { AjakanCoba, KakiLanding } from '@/components/landing/Penutup';
import { Privasi } from '@/components/landing/Privasi';
import { Teknologi } from '@/components/landing/Teknologi';
import { PATHS } from '@/router-paths';

const NAV = [
  { href: '#keunggulan', label: 'Keunggulan' },
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#privasi', label: 'Privasi' },
  { href: '#teknologi', label: 'Teknologi' },
] as const;

/**
 * Landing page di akar domain (Bab 13.1): wajah publik untuk juri. Statis tanpa animasi otomatis,
 * tangkapan layar asli, dan satu tindakan utama: Buka Aplikasi.
 */
export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-latar">
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-kartu focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-primer"
      >
        Langsung ke isi
      </a>

      <header className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
        <Logo className="h-7 w-auto" />
        <nav aria-label="Bagian halaman" className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="inline-flex min-h-[56px] items-center rounded-kontrol px-3 font-semibold text-teks-2 hover:bg-primer-terang hover:text-primer"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            to={PATHS.app}
            className="ml-2 inline-flex min-h-[56px] items-center whitespace-nowrap rounded-kontrol border-2 border-primer bg-permukaan px-3.5 text-[0.95rem] font-bold text-primer shadow-tipis transition-colors hover:bg-primer-terang active:translate-y-px sm:px-4 sm:text-base"
          >
            Buka Aplikasi
          </Link>
        </nav>
      </header>

      <main id="isi">
        <Hero />
        <Keunggulan />
        <CaraKerja />
        <Privasi />
        <Teknologi />
        <AjakanCoba />
      </main>

      <KakiLanding />
    </div>
  );
}
