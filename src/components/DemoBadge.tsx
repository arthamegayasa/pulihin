/** Label "Demo" agar data contoh tidak disalahartikan sebagai data klinis (Bab 10.1). */
export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-aksen/40 bg-aksen-terang px-2.5 py-0.5 text-[0.75rem] font-bold uppercase tracking-wide text-[#8a4a12] ${className}`}
      title="Data contoh untuk peragaan, bukan data pasien asli"
    >
      Demo
    </span>
  );
}
