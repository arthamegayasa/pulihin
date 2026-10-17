import type { ReactNode } from 'react';

type Bentuk = 'teks' | 'judul' | 'kotak' | 'lingkaran' | 'tombol';

// Lebar bawaan = penuh (elemen blok); timpa dengan kelas lebar lewat `className` (mis. `w-1/2`).
const BENTUK: Record<Bentuk, string> = {
  teks: 'h-[1em] rounded-kecil',
  judul: 'h-[1.5rem] max-w-[66%] rounded-kecil',
  kotak: 'rounded-kartu',
  lingkaran: 'aspect-square rounded-full',
  tombol: 'h-[56px] rounded-kontrol',
};

/**
 * Satu bentuk kerangka memuat. Denyut pelan 1.8 detik (tidak berkedip cepat, Bab 12.3); diam saat gerak dikurangi.
 * Selalu bungkus beberapa bentuk dengan <KerangkaGrup> agar pembaca layar mendengar "Memuat ...".
 */
export function Kerangka({ bentuk = 'teks', className = '' }: { bentuk?: Bentuk; className?: string }) {
  return <span aria-hidden className={`block animate-denyut-pelan bg-cekung ${BENTUK[bentuk]} ${className}`} />;
}

/** Wadah status memuat: `role="status"` + label tersembunyi; isi visual dari <Kerangka>. */
export function KerangkaGrup({ label = 'Memuat...', className = '', children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Kerangka siap pakai seukuran kartu daftar: opsional bidang gambar, judul, dan beberapa baris. */
export function KerangkaKartu({ baris = 2, gambar = false, className = '' }: { baris?: number; gambar?: boolean; className?: string }) {
  return (
    <div aria-hidden className={`flex flex-col gap-3 rounded-kartu border border-garis-halus bg-permukaan p-4 shadow-tipis ${className}`}>
      {gambar && <Kerangka bentuk="kotak" className="aspect-[16/9]" />}
      <Kerangka bentuk="judul" />
      {Array.from({ length: baris }, (_, i) => (
        <Kerangka key={i} className={i === baris - 1 ? 'w-1/2' : ''} />
      ))}
    </div>
  );
}
