import type { ReactNode } from 'react';
import { Ilustrasi, type RefIlustrasi } from '@/components/premium';

/**
 * Kartu sapaan Beranda: varian ringkas KartuHero (bahasa visual sama: latar ilustrasi, garis primer, shadow-sedang).
 * Tinggi kartu mengikuti teks (bukan rasio 16:9) dan ilustrasi momen ditempel utuh di kanan setinggi kartu,
 * sehingga sapaan + daftar Latihan Hari Ini + tombol Mulai + Untuk Keluarga muat di layar 360x740 (Bab 11).
 * Ilustrasi momen dibuat dengan sisi kiri ~45% kosong; teks berada di atas tirai warna latar (kontras >= 7:1).
 * Gambar gagal → kartu tenang berisi teks saja.
 */
export function KartuSapa({ ilustrasi, label, judul, sub, children }: { ilustrasi: RefIlustrasi; label: ReactNode; judul: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden rounded-kartu border border-primer-garis/70 bg-ilustrasi shadow-sedang">
      <Ilustrasi {...ilustrasi} prioritas bilaGagal="sembunyi" className="absolute inset-y-0 right-0 block h-full w-auto max-w-none" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[66%] bg-[linear-gradient(90deg,var(--color-ilustrasi)_0%,var(--color-ilustrasi)_70%,transparent_100%)]"
      />
      <div className="relative flex w-[62%] flex-col gap-0.5 px-4 py-3 [overflow-wrap:break-word]">
        <p className="tipe-label text-primer">{label}</p>
        <h1 className="tipe-judul text-teks">{judul}</h1>
        {sub && <p className="tipe-keterangan text-teks-2">{sub}</p>}
        {/* Lencana buram (berlatar sendiri) boleh melewati kolom teks ke atas gambar agar tetap satu baris. */}
        {children && <div className="mt-1.5 whitespace-nowrap">{children}</div>}
      </div>
    </header>
  );
}
