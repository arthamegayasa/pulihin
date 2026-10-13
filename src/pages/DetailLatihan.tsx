import { ShieldCheck, VideoCamera } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { PageHeader } from '@/components/PageHeader';
import { SafetyNotice } from '@/components/SafetyNotice';
import { ExerciseDemo } from '@/features/pose/ExerciseDemo';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { LABEL_POSISI, labelSendi } from '@/features/pose/labels';
import { PhonePlacement } from '@/features/pose/PhonePlacement';
import { preloadPoseEngine } from '@/features/pose/PoseEngine';
import { bacaTarget, urlSesi } from '@/features/pose/sesiParams';
import { setPrefs, usePrefs } from '@/lib/prefs';
import { PATHS } from '@/router-paths';
import type { Sisi } from '@/types';

/** Layar persiapan (Bab 5.1 langkah 2): contoh gerakan, posisi, langkah, letak ponsel, keselamatan, lalu Mulai. */
export default function DetailLatihan() {
  const { id = '' } = useParams();
  const [cari] = useSearchParams();
  const def = getExercise(id);
  const { sisiLatihan } = usePrefs();

  // Muat MediaPipe sejak layar ini dibuka agar skeleton langsung tampil saat kamera menyala (AC-F1-1).
  useEffect(() => {
    preloadPoseEngine().catch((e: unknown) => console.warn('Model pose belum termuat, dicoba lagi saat sesi dimulai', e));
  }, []);

  if (!def) {
    return (
      <section>
        <PageHeader judul="Latihan tidak ditemukan" kembali={PATHS.latihan} />
        <p className="mb-5 text-teks-2">Latihan ini tidak ada di pustaka. Silakan pilih dari daftar latihan.</p>
        <BigLink to={PATHS.latihan}>Lihat Daftar Latihan</BigLink>
      </section>
    );
  }

  const target = bacaTarget(cari.get('target'), def.targetRepetisiDefault);
  const pilihSisi = def.sisi === 'pilih';

  return (
    <section className="space-y-5">
      <PageHeader judul={def.nama} sub={`${LABEL_POSISI[def.posisi]} · ${labelSendi(def.sendiTarget)}`} />

      <ExerciseDemo exerciseId={def.id} nama={def.nama} sisi={pilihSisi ? sisiLatihan : undefined} />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-kartu border border-garis bg-white p-4 shadow-tipis">
          <p className="text-[0.95rem] text-teks-2">Posisi</p>
          <p className="text-[1.2rem] font-bold leading-snug">{LABEL_POSISI[def.posisi]}</p>
        </div>
        <div className="rounded-kartu border border-garis bg-white p-4 shadow-tipis">
          <p className="text-[0.95rem] text-teks-2">Target</p>
          <p className="text-[1.2rem] font-bold leading-snug">
            <span className="tabular">{target}</span> kali
          </p>
        </div>
      </div>

      {pilihSisi && <PilihSisi nilai={sisiLatihan} onPilih={(s) => setPrefs({ sisiLatihan: s })} />}

      <section>
        <h2 className="mb-2 text-[1.15rem] font-bold">Cara melakukan</h2>
        <ol className="space-y-2">
          {def.panduanLangkah.map((langkah, i) => (
            <li key={i} className="flex gap-3">
              <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-primer text-[0.95rem] font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{langkah}</span>
            </li>
          ))}
        </ol>
      </section>

      <PhonePlacement posisi={def.posisi} teks={def.posisiPonsel} />

      <SafetyNotice wajibBerpegangan={def.wajibBerpegangan} tambahan={def.peringatan} />

      <p className="flex gap-2 text-[0.95rem] text-teks-2">
        <ShieldCheck size={22} weight="bold" className="mt-0.5 shrink-0 text-primer" aria-hidden />
        <span>Gambar kamera hanya diproses di ponsel ini dan tidak dikirim ke mana pun.</span>
      </p>

      <div className="sticky bottom-0 -mx-4 border-t border-garis bg-latar/95 px-4 pt-3 safe-bottom">
        <BigLink
          to={urlSesi(def.id, target, sisiLatihan)}
          ukuran="besar"
          ikon={<VideoCamera size={30} weight="fill" aria-hidden />}
        >
          Mulai dengan Kamera
        </BigLink>
      </div>
    </section>
  );
}

function PilihSisi({ nilai, onPilih }: { nilai: Sisi; onPilih: (s: Sisi) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[1.15rem] font-bold">Sisi yang dilatih</legend>
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-primer-terang p-1.5" role="radiogroup">
        {(['kanan', 'kiri'] as const).map((s) => {
          const aktif = nilai === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={aktif}
              onClick={() => onPilih(s)}
              className={`min-h-[56px] rounded-xl text-[1.1rem] font-bold transition-colors ${
                aktif ? 'bg-primer text-white shadow-tipis' : 'text-primer hover:bg-white/70'
              }`}
            >
              {s === 'kanan' ? 'Kanan' : 'Kiri'}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
