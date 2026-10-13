import { ArrowCounterClockwise, House, Lightbulb } from '@phosphor-icons/react';
import { Navigate, useParams } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { NonDiagnosisNote } from '@/components/NonDiagnosisNote';
import { PageHeader } from '@/components/PageHeader';
import { ScoreRing } from '@/components/ScoreRing';
import { getSession } from '@/data/db';
import { useLiveQuery } from '@/data/useLiveQuery';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { urlSesi } from '@/features/pose/sesiParams';
import { formatDurasi } from '@/lib/date';
import { usePrefs } from '@/lib/prefs';
import { clamp, labelSkor } from '@/lib/score';
import { berandaUntukPeran, PATHS } from '@/router-paths';
import type { Session, SkorKomponen } from '@/types';

const KOMPONEN: { kunci: keyof SkorKomponen; label: string; bobot: string }[] = [
  { kunci: 'repetisi', label: 'Repetisi', bobot: '50%' },
  { kunci: 'rentang', label: 'Rentang gerak', bobot: '30%' },
  { kunci: 'tempo', label: 'Tempo', bobot: '20%' },
];

function judulHangat(s: Session): string {
  if (s.repetisiTercapai >= s.repetisiTarget) return 'Hebat, target latihan tercapai!';
  if (s.repetisiTercapai > 0) return 'Terima kasih sudah berlatih hari ini.';
  return 'Tidak apa-apa, besok kita coba lagi.';
}

/** Ringkasan sesi gerak (Bab 5.1 langkah 7, Bab 11 Ringkasan). Semua angka dibaca langsung dari catatan tersimpan. */
export default function RingkasanSesi() {
  const { sessionId = '' } = useParams();
  const { role } = usePrefs();
  const { data: sesi, loading } = useLiveQuery(() => getSession(sessionId), [sessionId]);

  if (loading && !sesi) {
    return (
      <section aria-busy="true">
        <PageHeader judul="Ringkasan Latihan" />
        <div className="mx-auto size-[184px] animate-pulse rounded-full bg-primer-terang" />
      </section>
    );
  }
  if (!sesi) {
    return (
      <section>
        <PageHeader judul="Ringkasan tidak ditemukan" />
        <p className="mb-5 text-teks-2">Catatan latihan ini tidak ada di ponsel ini.</p>
        <BigLink to={berandaUntukPeran(role)}>Kembali ke Beranda</BigLink>
      </section>
    );
  }
  if (sesi.jenis === 'afasia') return <Navigate to={PATHS.afasiaRingkasan(sesi.id)} replace />;

  const def = sesi.latihanId ? getExercise(sesi.latihanId) : undefined;
  const nama = def?.nama ?? 'Latihan gerak';
  const namaSisi = sesi.sisi === 'kanan' ? 'sisi kanan' : sesi.sisi === 'kiri' ? 'sisi kiri' : null;

  return (
    <section className="space-y-5">
      <PageHeader judul={judulHangat(sesi)} sub={`${nama}${namaSisi ? `, ${namaSisi}` : ''}`} kembali={false} />

      {!sesi.selesai && (
        <p className="rounded-kartu border border-peringatan/30 bg-peringatan-terang p-4">
          Sesi ini terhenti sebelum selesai, jadi belum dihitung sebagai latihan hari ini.
        </p>
      )}

      <div className="rounded-kartu border border-garis bg-white p-5 shadow-tipis">
        <ScoreRing skor={sesi.skor} />
        <p className="mt-1 text-center text-teks-2">Skor latihan</p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-primer-terang p-3">
            <dt className="text-[0.95rem] text-teks-2">Repetisi</dt>
            <dd className="tabular text-[1.6rem] font-extrabold text-teks">
              {sesi.repetisiTercapai}
              <span className="text-[1.1rem] font-bold text-teks-2"> / {sesi.repetisiTarget}</span>
            </dd>
          </div>
          <div className="rounded-xl bg-primer-terang p-3">
            <dt className="text-[0.95rem] text-teks-2">Durasi</dt>
            <dd className="text-[1.25rem] font-extrabold leading-tight text-teks">{formatDurasi(sesi.durasiDetik)}</dd>
          </div>
        </dl>
      </div>

      {sesi.skorKomponen && (
        <section className="rounded-kartu border border-garis bg-white p-5 shadow-tipis">
          <h2 className="mb-3 text-[1.15rem] font-bold">Rincian skor</h2>
          <ul className="space-y-4">
            {KOMPONEN.map(({ kunci, label, bobot }) => {
              const nilai = Math.round(clamp(sesi.skorKomponen![kunci], 0, 100));
              return (
                <li key={kunci}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">
                      {label} <span className="text-[0.85rem] font-normal text-teks-2">(bobot {bobot})</span>
                    </span>
                    <span className="font-bold text-primer">
                      {labelSkor(nilai)} <span className="tabular text-teks-2">· {nilai}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-primer-terang" aria-hidden>
                    <div className="h-full rounded-full bg-primer" style={{ width: `${nilai}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {sesi.saran && (
        <div className="flex gap-3 rounded-kartu border border-aksen/30 bg-aksen-terang p-4">
          <Lightbulb size={28} weight="fill" className="mt-0.5 shrink-0 text-aksen" aria-hidden />
          <div>
            <p className="font-bold">Saran untuk sesi berikutnya</p>
            <p>{sesi.saran}</p>
          </div>
        </div>
      )}

      <NonDiagnosisNote />

      <div className="space-y-3 pt-1">
        <BigLink to={berandaUntukPeran(role)} replace ikon={<House size={26} weight="fill" aria-hidden />}>
          Kembali ke Beranda
        </BigLink>
        {def && (
          <BigLink
            to={urlSesi(def.id, sesi.repetisiTarget, sesi.sisi ?? 'kanan')}
            varian="garis"
            ikon={<ArrowCounterClockwise size={24} weight="bold" aria-hidden />}
          >
            Ulangi Latihan
          </BigLink>
        )}
      </div>
    </section>
  );
}
