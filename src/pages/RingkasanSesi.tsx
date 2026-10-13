import { ArrowCounterClockwise, CheckCircle, House, Lightbulb, Target as IkonTarget, XCircle } from '@phosphor-icons/react';
import { Navigate, useParams } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { NonDiagnosisNote } from '@/components/NonDiagnosisNote';
import { PageHeader } from '@/components/PageHeader';
import { ScoreRing } from '@/components/ScoreRing';
import { getSession, listRepLogs } from '@/data/db';
import { useLiveQuery } from '@/data/useLiveQuery';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { RENTANG_PENUH, urlDetail } from '@/features/pose/sesiParams';
import { ambangAtasRentang, normalisasiRentang } from '@/features/pose/tracker';
import { formatDurasi } from '@/lib/date';
import { usePrefs } from '@/lib/prefs';
import { clamp, labelSkor } from '@/lib/score';
import { berandaUntukPeran, PATHS } from '@/router-paths';
import type { Session, SkorKomponen } from '@/types';

/** Label sederhana untuk pasien; bobot perhitungan (Bab 5.3) tidak ditampilkan di layar pasien. */
const KOMPONEN: { kunci: keyof SkorKomponen; label: string }[] = [
  { kunci: 'repetisi', label: 'Jumlah gerakan' },
  { kunci: 'rentang', label: 'Rentang gerak' },
  { kunci: 'tempo', label: 'Irama gerakan' },
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
  const rentang = normalisasiRentang(sesi.rentangPersen);

  return (
    <section className="space-y-5">
      <PageHeader judul={judulHangat(sesi)} sub={`${nama}${namaSisi ? `, ${namaSisi}` : ''}`} kembali={false} />

      {!sesi.selesai && (
        <p className="rounded-kartu border border-peringatan/30 bg-peringatan-terang p-4">
          Sesi ini terhenti sebelum selesai, jadi belum dihitung sebagai latihan hari ini.
        </p>
      )}

      {rentang < RENTANG_PENUH && (
        <p className="flex items-center gap-3 rounded-kartu border border-primer-garis bg-primer-terang p-4 font-bold">
          <IkonTarget size={26} weight="bold" className="shrink-0 text-primer" aria-hidden />
          Target rentang dari terapis: {rentang}%
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
            {KOMPONEN.map(({ kunci, label }) => {
              const nilai = Math.round(clamp(sesi.skorKomponen![kunci], 0, 100));
              return (
                <li key={kunci}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="whitespace-nowrap font-semibold">{label}</span>
                    <span className="ml-auto font-bold text-primer">
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

      {def && <StripRepetisi sessionId={sesi.id} ambangAtas={ambangAtasRentang(def, sesi.rentangPersen)} satuan={def.satuan} rentang={rentang} />}

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
          // Ulangi lewat Detail Latihan: peringatan keselamatan & konfirmasi berpegangan selalu dilewati dulu.
          <BigLink
            to={urlDetail(def.id, sesi.repetisiTarget, sesi.sisi ?? undefined, rentang)}
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

/**
 * Jejak ukur per gerakan dari repLogs tersimpan: tinggi batang = nilai puncak metrik, garis putus = ambang hitung.
 * Terhitung / belum terhitung selalu ditulis dengan kata (bukan warna saja).
 */
function StripRepetisi({
  sessionId,
  ambangAtas,
  satuan,
  rentang,
}: {
  sessionId: string;
  /** Ambang hitung yang dipakai sesi ini (sudah disesuaikan target rentang terapis). */
  ambangAtas: number;
  satuan: '°' | '%';
  rentang: number;
}) {
  const { data: logs } = useLiveQuery(() => listRepLogs(sessionId), [sessionId]);
  if (!logs || logs.length === 0) return null;
  const terhitung = logs.filter((l) => l.dihitung).length;
  const skalaMaks = Math.max(ambangAtas * 1.15, ...logs.map((l) => l.sudutPuncak));
  const tinggiAmbang = (ambangAtas / skalaMaks) * 100;
  const label = satuan === '°' ? 'Sudut puncak tiap gerakan' : 'Nilai puncak tiap gerakan';
  return (
    <section className="rounded-kartu border border-garis bg-white p-5 shadow-tipis">
      <h2 className="text-[1.15rem] font-bold">{label}</h2>
      <p className="mb-3 text-[0.95rem] text-teks-2">
        Diukur kamera: {terhitung} dari {logs.length} gerakan terhitung. Garis putus-putus = batas hitung{' '}
        {Math.round(ambangAtas)}
        {satuan}
        {rentang < RENTANG_PENUH ? ` (target rentang dari terapis ${rentang}%)` : ''}.
      </p>
      <div className="overflow-x-auto pb-1">
        <ol className="relative flex min-w-max items-end gap-1.5 pt-6" aria-label={label}>
          {/* Di bawah batang: baris nomor (mt-1 + h-6) dan baris ikon (h-6) = 3,25rem. */}
          <li
            className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-aksen/70"
            style={{ bottom: `calc(3.25rem + ${tinggiAmbang / 100} * 8rem)` }}
            aria-hidden
          />
          {logs.map((l) => {
            const nilai = Math.round(l.sudutPuncak);
            return (
              <li
                key={l.nomor}
                className="flex w-10 flex-col items-center"
                aria-label={`Gerakan ${l.nomor}: puncak ${nilai}${satuan === '°' ? ' derajat' : ' persen'}, ${l.dihitung ? 'terhitung' : 'belum terhitung'}`}
              >
                <span className="tabular whitespace-nowrap text-[0.95rem] font-bold leading-tight text-teks-2" aria-hidden>
                  {nilai}
                  {satuan}
                </span>
                <div className="flex h-32 w-full items-end" aria-hidden>
                  <div
                    className={`w-full rounded-t-md ${l.dihitung ? 'bg-primer' : 'border-2 border-dashed border-teks-2/60 bg-primer-terang'}`}
                    style={{ height: `${Math.max(4, (clamp(l.sudutPuncak, 0, skalaMaks) / skalaMaks) * 100)}%` }}
                  />
                </div>
                <span className="tabular mt-1 h-6 text-[1rem] font-bold leading-6" aria-hidden>
                  {l.nomor}
                </span>
                <span className="grid h-6 place-items-center" aria-hidden>
                  {l.dihitung ? (
                    <CheckCircle size="1.25rem" weight="fill" className="text-primer" />
                  ) : (
                    <XCircle size="1.25rem" weight="bold" className="text-teks-2" />
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <ul className="mt-2 flex flex-col gap-1 text-[0.95rem]" aria-hidden>
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-3.5 shrink-0 rounded-sm bg-primer" />
          <CheckCircle size="1.25rem" weight="fill" className="shrink-0 text-primer" />
          Terhitung
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-3.5 shrink-0 rounded-sm border-2 border-dashed border-teks-2/60 bg-primer-terang" />
          <XCircle size="1.25rem" weight="bold" className="shrink-0 text-teks-2" />
          Belum terhitung (terlalu cepat atau kurang jauh)
        </li>
      </ul>
    </section>
  );
}
