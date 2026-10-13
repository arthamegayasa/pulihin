import { Flask } from '@phosphor-icons/react';

/** Label "Prototype" wajib di header dashboard klinisi (Bab 10.2): jelas terlihat, bukan sistem rekam medis. */
export function PrototypeBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-primer bg-white px-3 py-0.5 text-[0.85rem] font-extrabold uppercase tracking-wide text-primer ${className}`}
      title="Prototype untuk peragaan lomba, bukan sistem rekam medis"
    >
      <Flask size={18} weight="bold" aria-hidden />
      Prototype
    </span>
  );
}
