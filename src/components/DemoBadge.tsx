/** Label "Demo" agar data contoh tidak disalahartikan sebagai data klinis (Bab 10.1). Teks >= 0.95rem agar terbaca. */
export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-aksen/35 bg-aksen-terang py-px pl-2 pr-2.5 text-[0.95rem] font-bold leading-snug tracking-[0.01em] text-aksen-teks ${className}`}
      title="Data contoh untuk peragaan, bukan data pasien asli"
    >
      <span aria-hidden className="size-[7px] shrink-0 rounded-full bg-aksen" />
      Demo
    </span>
  );
}
