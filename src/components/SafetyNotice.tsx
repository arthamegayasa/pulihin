import { WarningCircle } from '@phosphor-icons/react';

/** Peringatan keselamatan wajib sebelum setiap sesi gerak (Bab 17.2). */
export function SafetyNotice({ wajibBerpegangan = false, tambahan }: { wajibBerpegangan?: boolean; tambahan?: string }) {
  return (
    <div role="note" className="flex gap-3 rounded-kartu border border-peringatan/30 bg-peringatan-terang p-4 text-teks">
      <WarningCircle size={28} weight="fill" className="mt-0.5 shrink-0 text-peringatan" aria-hidden />
      <div className="space-y-1.5">
        <p className="font-bold">Utamakan keselamatan</p>
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
