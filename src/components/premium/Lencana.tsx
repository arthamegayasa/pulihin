import type { ReactNode } from 'react';

type Nada = 'netral' | 'primer' | 'sukses' | 'aksen' | 'peringatan';

// Teks kecil selalu berkontras >= 7:1 (teks gelap, primer, atau aksen-teks); warna status dibawa oleh ikon.
const NADA: Record<Nada, { latar: string; ikon: string }> = {
  netral: { latar: 'bg-cekung border-garis text-teks', ikon: 'text-teks-2' },
  primer: { latar: 'bg-primer-terang border-primer-garis text-primer', ikon: 'text-primer' },
  sukses: { latar: 'bg-sukses-terang border-sukses/30 text-teks', ikon: 'text-sukses' },
  aksen: { latar: 'bg-aksen-terang border-aksen/35 text-aksen-teks', ikon: 'text-aksen' },
  peringatan: { latar: 'bg-peringatan-terang border-peringatan/30 text-teks', ikon: 'text-peringatan' },
};

/**
 * Lencana pil kecil untuk status/hitungan (mis. streak "5 hari berturut-turut", "Selesai").
 * Bukan tombol. Selalu berisi kata; ikon opsional (Phosphor bold/fill, diseragamkan 18px).
 */
export function Lencana({ nada = 'netral', ikon, children, className = '' }: { nada?: Nada; ikon?: ReactNode; children: ReactNode; className?: string }) {
  const n = NADA[nada];
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-[10px] border px-2.5 py-0.5 text-[0.95rem] font-bold leading-snug ${n.latar} ${className}`}
    >
      {ikon && (
        <span aria-hidden className={`shrink-0 [&>svg]:size-[18px] ${n.ikon}`}>
          {ikon}
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </span>
  );
}
