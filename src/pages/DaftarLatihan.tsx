import { CaretRight, Star } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { JudulBagian } from '@/components/premium';
import { ChipInfo, ChipPosisi } from '@/features/pasien/ChipLatihan';
import { PosterLatihan } from '@/features/pasien/PosterLatihan';
import { EXERCISES } from '@/features/pose/exerciseDefinitions';
import { labelSendi } from '@/features/pose/labels';
import type { ExerciseDefinition } from '@/features/pose/types';
import { PATHS } from '@/router-paths';

const INTI = EXERCISES.filter((d) => d.inti);
const LAINNYA = EXERCISES.filter((d) => !d.inti);

/** Pustaka 10 latihan (Bab 6), dikelompokkan: latihan inti dulu, lalu lainnya. Satu ketuk ke Detail Latihan. */
export default function DaftarLatihan() {
  return (
    <section>
      <PageHeader judul="Pustaka Latihan" sub="Ketuk satu latihan untuk melihat contohnya." />

      <section aria-labelledby="judul-inti">
        <JudulBagian
          id="judul-inti"
          judul={
            <span className="inline-flex items-center gap-1.5">
              <Star size={22} weight="fill" className="shrink-0 text-aksen" aria-hidden />
              Latihan inti
            </span>
          }
          sub="Hitungan kamera paling banyak diuji. Cocok untuk memulai."
        />
        <ul className="space-y-2.5">
          {INTI.map((def) => (
            <KartuLatihan key={def.id} def={def} prioritas />
          ))}
        </ul>
      </section>

      <section aria-labelledby="judul-lainnya" className="mt-7">
        <JudulBagian id="judul-lainnya" judul="Latihan lainnya" sub="Untuk lutut, pinggul, pergelangan kaki, dan badan." />
        <ul className="space-y-2.5">
          {LAINNYA.map((def) => (
            <KartuLatihan key={def.id} def={def} />
          ))}
        </ul>
      </section>
    </section>
  );
}

function KartuLatihan({ def, prioritas = false }: { def: ExerciseDefinition; prioritas?: boolean }) {
  return (
    <li>
      <Link
        to={PATHS.detailLatihan(def.id)}
        className="group flex min-h-[80px] items-center gap-2.5 rounded-kartu border border-garis-halus bg-permukaan p-2 pr-2 shadow-tipis transition-[border-color,box-shadow,background-color] hover:border-primer-garis hover:shadow-sedang active:bg-primer-terang"
      >
        <span className="relative shrink-0">
          <PosterLatihan latihanId={def.id} prioritas={prioritas} className="size-[56px]" />
          {/* Bintang = latihan inti; artinya tertulis di judul bagian "Latihan inti" (bentuk, bukan warna saja). */}
          {def.inti && (
            <span aria-hidden className="absolute -bottom-1 -left-1 grid size-[26px] place-items-center rounded-[9px] border border-aksen/35 bg-aksen-terang text-aksen shadow-tipis">
              <Star size={16} weight="fill" />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[1.1rem] font-extrabold leading-tight tracking-[-0.005em] text-teks">{def.nama}</span>
          <span className="sr-only">
            {def.inti && ', latihan inti'}, target {def.targetRepetisiDefault} kali
          </span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <ChipPosisi posisi={def.posisi} />
            <ChipInfo>{labelSendi(def.sendiTarget)}</ChipInfo>
          </span>
        </span>
        <CaretRight size={20} weight="bold" className="shrink-0 text-primer transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}
