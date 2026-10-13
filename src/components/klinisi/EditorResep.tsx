import { ArrowDown, ArrowUp, Check, FloppyDisk, Plus, Trash } from '@phosphor-icons/react';
import { BigButton } from '@/components/BigButton';
import { Stepper } from '@/components/klinisi/Stepper';
import {
  BATAS_FREKUENSI,
  BATAS_REPETISI,
  BATAS_SET,
  geserLatihan,
  hapusLatihan,
  MAKS_LATIHAN,
  tambahLatihan,
  teksTarget,
  ubahFrekuensi,
  ubahLatihan,
  type DraftProgram,
} from '@/features/adherence/program';
import { EXERCISES, getExercise } from '@/features/pose/exerciseDefinitions';
import { LABEL_POSISI } from '@/features/pose/labels';
import { formatJam, formatTanggalPendek, toISODate } from '@/lib/date';
import type { Program } from '@/types';

const TOMBOL_KECIL =
  'inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-[0.95rem] font-bold disabled:pointer-events-none disabled:opacity-40';

/**
 * Penyunting Resep Program (Bab 10.2): pilih latihan dari pustaka, target repetisi, set, dan frekuensi per minggu.
 * Hanya angka latihan; tidak ada kolom diagnosis atau catatan bebas.
 */
export function EditorResep({
  namaPasien,
  draft,
  tersimpan,
  berubah,
  sibuk,
  onUbah,
  onSimpan,
  onBatalkan,
}: {
  namaPasien: string;
  draft: DraftProgram;
  tersimpan: Program | undefined;
  berubah: boolean;
  sibuk: boolean;
  onUbah: (d: DraftProgram) => void;
  onSimpan: () => void;
  onBatalkan: () => void;
}) {
  const penuh = draft.items.length >= MAKS_LATIHAN;
  const kosong = draft.items.length === 0;

  return (
    <section aria-labelledby="judul-resep" className="rounded-kartu border border-primer-garis bg-white shadow-tipis">
      <div className="space-y-5 p-4">
        <header>
          <h2 id="judul-resep" className="text-[1.3rem] font-extrabold leading-tight">
            Resep Program
          </h2>
          <p className="mt-1 text-[0.95rem] text-teks-2">
            Yang tersimpan di sini menjadi Latihan Hari Ini di ponsel {namaPasien}. Satu sesi kamera dihitung satu set.
          </p>
          {tersimpan && (
            <p className="mt-1 text-[0.9rem] text-teks-2">
              Disusun oleh <span className="font-bold text-teks">{tersimpan.dibuatOleh}</span>, diubah{' '}
              {formatTanggalPendek(toISODate(tersimpan.tanggalUbah))} pukul {formatJam(tersimpan.tanggalUbah)}.
            </p>
          )}
        </header>

        <div className="max-w-xs">
          <Stepper
            label="Hari latihan per minggu"
            nilai={draft.frekuensiPerMinggu}
            batas={BATAS_FREKUENSI}
            satuan="hari"
            onUbah={(n) => onUbah(ubahFrekuensi(draft, n))}
          />
        </div>

        <div>
          <h3 className="mb-2 text-[1.1rem] font-extrabold">
            Latihan dalam program{' '}
            <span className="font-semibold text-teks-2">
              ({draft.items.length} dari maksimal {MAKS_LATIHAN})
            </span>
          </h3>
          {kosong && (
            <p className="rounded-xl border border-dashed border-primer-garis bg-primer-terang p-3 text-[0.95rem]">
              Belum ada latihan. Tambahkan minimal satu latihan dari pustaka di bawah.
            </p>
          )}
          <ol className="space-y-3">
            {draft.items.map((item, i) => {
              const def = getExercise(item.latihanId);
              const nama = def?.nama ?? item.latihanId;
              return (
                <li key={item.latihanId} className="rounded-xl border border-garis bg-latar p-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primer text-[1rem] font-extrabold text-white tabular" aria-hidden>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[1.1rem] font-extrabold leading-tight">{nama}</p>
                      {def && (
                        <p className="text-[0.9rem] text-teks-2">
                          {def.namaKlinis} · {LABEL_POSISI[def.posisi]}
                        </p>
                      )}
                      <p className="mt-0.5 text-[0.9rem] font-bold text-primer">Target {teksTarget(item)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Stepper
                      label="Target repetisi"
                      nilai={item.targetRepetisi}
                      batas={BATAS_REPETISI}
                      satuan="kali per set"
                      onUbah={(n) => onUbah(ubahLatihan(draft, item.latihanId, { targetRepetisi: n }))}
                    />
                    <Stepper
                      label="Jumlah set"
                      nilai={item.set}
                      batas={BATAS_SET}
                      satuan="set per hari"
                      onUbah={(n) => onUbah(ubahLatihan(draft, item.latihanId, { set: n }))}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`${TOMBOL_KECIL} border-primer bg-white text-primer hover:bg-primer-terang`}
                      onClick={() => onUbah(geserLatihan(draft, item.latihanId, -1))}
                      disabled={i === 0}
                      aria-label={`Naikkan urutan ${nama}`}
                    >
                      <ArrowUp size={20} weight="bold" aria-hidden />
                      Naik
                    </button>
                    <button
                      type="button"
                      className={`${TOMBOL_KECIL} border-primer bg-white text-primer hover:bg-primer-terang`}
                      onClick={() => onUbah(geserLatihan(draft, item.latihanId, 1))}
                      disabled={i === draft.items.length - 1}
                      aria-label={`Turunkan urutan ${nama}`}
                    >
                      <ArrowDown size={20} weight="bold" aria-hidden />
                      Turun
                    </button>
                    <button
                      type="button"
                      className={`${TOMBOL_KECIL} ml-auto border-garis bg-white text-teks hover:bg-primer-terang`}
                      onClick={() => onUbah(hapusLatihan(draft, item.latihanId))}
                      aria-label={`Keluarkan ${nama} dari program`}
                    >
                      <Trash size={20} weight="bold" aria-hidden />
                      Keluarkan
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <h3 className="text-[1.1rem] font-extrabold">Pustaka latihan</h3>
          <p className="mb-2 text-[0.9rem] text-teks-2">
            {penuh ? `Program sudah berisi ${MAKS_LATIHAN} latihan, batas agar daftar di ponsel pasien muat satu layar.` : 'Pilih latihan untuk ditambahkan ke program.'}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {EXERCISES.map((def) => {
              const dipilih = draft.items.some((i) => i.latihanId === def.id);
              return (
                <li key={def.id} className="flex items-center gap-3 rounded-xl border border-garis bg-white p-2.5 pl-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-tight">{def.nama}</p>
                    <p className="text-[0.85rem] leading-snug text-teks-2">
                      {def.namaKlinis} · {LABEL_POSISI[def.posisi]}
                    </p>
                  </div>
                  {dipilih ? (
                    <span className="inline-flex min-h-12 shrink-0 items-center gap-1 px-2 text-[0.9rem] font-bold text-sukses">
                      <Check size={20} weight="bold" aria-hidden />
                      Dipilih
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={`${TOMBOL_KECIL} shrink-0 border-primer bg-white text-primer hover:bg-primer-terang`}
                      onClick={() => onUbah(tambahLatihan(draft, def.id, def.targetRepetisiDefault))}
                      disabled={penuh}
                      aria-label={`Tambah ${def.nama} ke program`}
                    >
                      <Plus size={20} weight="bold" aria-hidden />
                      Tambah
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Bilah simpan menempel di bawah layar selama penyunting terlihat. */}
      <div className="sticky bottom-0 rounded-b-kartu border-t border-garis bg-white/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <p className="mb-2 text-[0.85rem] font-semibold leading-snug text-teks-2" role="status">
          {kosong ? 'Pilih minimal satu latihan sebelum menyimpan.' : berubah ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan sudah tersimpan.'}
        </p>
        <div className="flex flex-row-reverse gap-2">
          <BigButton
            onClick={onSimpan}
            disabled={!berubah || kosong || sibuk}
            ikon={<FloppyDisk size={24} weight="bold" className="hidden sm:block" aria-hidden />}
            className="flex-1"
          >
            {sibuk ? 'Menyimpan...' : 'Simpan Resep'}
          </BigButton>
          {berubah && (
            <BigButton varian="garis" onClick={onBatalkan} disabled={sibuk} penuh={false} aria-label="Batalkan perubahan resep">
              Batalkan
            </BigButton>
          )}
        </div>
      </div>
    </section>
  );
}
