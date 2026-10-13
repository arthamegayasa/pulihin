import { CaretRight, Star } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { EXERCISES } from '@/features/pose/exerciseDefinitions';
import { LABEL_POSISI, labelSendi } from '@/features/pose/labels';
import { PATHS } from '@/router-paths';

/** Pustaka 10 latihan (Bab 6). Satu ketuk ke Detail Latihan. */
export default function DaftarLatihan() {
  return (
    <section>
      <PageHeader judul="Pustaka Latihan" sub="Pilih satu latihan untuk melihat contoh dan memulai." />
      <ul className="space-y-3">
        {EXERCISES.map((def, i) => (
          <li key={def.id}>
            <Link
              to={PATHS.detailLatihan(def.id)}
              className="flex items-center gap-3 rounded-kartu border border-garis bg-white p-4 shadow-tipis transition-colors hover:border-primer-garis hover:bg-primer-terang/40 active:bg-primer-terang"
            >
              <span className="tabular grid size-11 shrink-0 place-items-center rounded-xl bg-primer-terang text-[1.1rem] font-extrabold text-primer">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[1.15rem] font-bold leading-snug text-teks">{def.nama}</span>
                  {def.inti && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-aksen-terang px-2 py-0.5 text-[0.8rem] font-bold text-teks">
                      <Star size={14} weight="fill" className="text-aksen" aria-hidden />
                      Inti
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[0.95rem] text-teks-2">
                  {LABEL_POSISI[def.posisi]} · {labelSendi(def.sendiTarget)} · Target {def.targetRepetisiDefault} kali
                </span>
              </span>
              <CaretRight size={24} weight="bold" className="shrink-0 text-primer" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
