/** Label "Demo" agar data contoh tidak disalahartikan sebagai data klinis (Bab 10.1). Teks >= 0.95rem agar terbaca. */
export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-aksen/40 bg-aksen-terang px-2.5 text-[0.95rem] font-bold leading-snug text-[#8a4a12] ${className}`}
      title="Data contoh untuk peragaan, bukan data pasien asli"
    >
      Demo
    </span>
  );
}
