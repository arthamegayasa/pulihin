import { Flask } from '@phosphor-icons/react';

/** Label "Prototype" wajib di header dashboard klinisi (Bab 10.2): jelas terlihat, bukan sistem rekam medis. */
export function PrototypeBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-primer-garis bg-primer-terang px-2.5 py-px text-[0.95rem] font-extrabold leading-snug text-primer ${className}`}
      title="Prototype untuk peragaan lomba, bukan sistem rekam medis"
    >
      <Flask size={18} weight="bold" aria-hidden />
      Prototype
    </span>
  );
}
