import { WarningCircle } from '@phosphor-icons/react';

/** Peringatan keselamatan wajib sebelum setiap sesi gerak (Bab 17.2). */
export function SafetyNotice({ wajibBerpegangan = false, tambahan }: { wajibBerpegangan?: boolean; tambahan?: string }) {
  return (
    <div role="note" className="flex gap-3 rounded-kartu border border-peringatan/30 bg-peringatan-terang p-4 text-teks shadow-[0_1px_2px_rgb(11_79_74/0.04)]">
      <WarningCircle size={28} weight="fill" className="mt-px shrink-0 text-peringatan" aria-hidden />
      <div className="min-w-0 space-y-1.5">
        <p className="tipe-subjudul">Utamakan keselamatan</p>
        <p>
          Berhenti bila terasa nyeri, pusing, sesak, atau tidak enak badan, lalu hubungi tenaga kesehatan.
        </p>
        {wajibBerpegangan && (
          <p className="font-semibold">Selalu berpegangan pada kursi atau meja yang stabil selama latihan berdiri.</p>
        )}
        {tambahan && <p>{tambahan}</p>}
      </div>
    </div>
  );
}
