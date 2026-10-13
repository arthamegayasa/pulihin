import { ChatCircleText, DeviceMobile, Fire, PersonArmsSpread } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router';
import { BigButton, BigLink } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DemoBadge } from '@/components/DemoBadge';
import { NonDiagnosisNote } from '@/components/NonDiagnosisNote';
import { PageHeader } from '@/components/PageHeader';
import { StreakCalendar } from '@/components/StreakCalendar';
import { useToast } from '@/components/Toast';
import { TrendChart } from '@/components/TrendChart';
import { WeeklyChart } from '@/components/WeeklyChart';
import { EditorResep } from '@/components/klinisi/EditorResep';
import { PrototypeBadge } from '@/components/klinisi/PrototypeBadge';
import { KartuRedFlag, TanpaRedFlag } from '@/components/klinisi/RedFlagKlinisi';
import { usePasienKlinisi } from '@/components/klinisi/useDataKlinisi';
import { putProgram } from '@/data/db';
import { useSekarang } from '@/features/adherence/hooks';
import { ringkasPasien, sesiTerbaru } from '@/features/adherence/klinisi';
import { kataTren } from '@/features/adherence/laporan';
import { buatProgram, draftDariProgram, programSama, type DraftProgram } from '@/features/adherence/program';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { formatJam, formatTanggalPendek, namaHari, toISODate } from '@/lib/date';
import { setPrefs } from '@/lib/prefs';
import { labelSkor } from '@/lib/score';
import { PATHS } from '@/router-paths';
import type { Session } from '@/types';

/** Progres satu pasien + Resep Program (Bab 10.2). Halaman dibuat ulang per pasien agar draf tidak terbawa. */
export default function KlinisiPasien() {
  const { patientId = '' } = useParams();
  return <HalamanPasien key={patientId} patientId={patientId} />;
}

function HalamanPasien({ patientId }: { patientId: string }) {
  const sekarang = useSekarang();
  const today = toISODate(sekarang);
  const navigate = useNavigate();
  const { data, loading, error } = usePasienKlinisi(patientId);
  const [toast, tampilkanToast] = useToast();
  const [draft, setDraft] = useState<DraftProgram | null>(null);
  const [sibuk, setSibuk] = useState(false);
  /** "Lihat sebagai pasien" menunggu konfirmasi perubahan yang belum disimpan. */
  const lihatSebagaiPasien = useRef(false);

  const tersimpan = data?.program;
  const basis = useMemo(() => draftDariProgram(tersimpan), [tersimpan]);
  const aktif = draft ?? basis;
  const berubah = draft !== null && !programSama(draft, basis);
  const ringkasan = useMemo(() => (data ? ringkasPasien(data, today) : null), [data, today]);

  // Penjaga perubahan belum tersimpan: navigasi di dalam aplikasi dan menutup/memuat ulang tab.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => berubah && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!berubah) return;
    const cegah = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', cegah);
    return () => window.removeEventListener('beforeunload', cegah);
  }, [berubah]);

  if (loading && !data) return <p className="py-10 text-center text-teks-2">Memuat data pasien...</p>;
  if (error) return <p className="py-10 text-center text-teks-2">Data pasien belum bisa dibaca. Coba muat ulang halaman.</p>;
  if (!data || !ringkasan) {
    return (
      <section className="space-y-4">
        <PageHeader judul="Pasien tidak ditemukan" kembali={PATHS.klinisi} />
        <p className="text-teks-2">Profil ini tidak ada di data demo. Kembali ke daftar pasien untuk memilih pasien lain.</p>
        <BigLink to={PATHS.klinisi} varian="garis">
          Ke Daftar Pasien
        </BigLink>
      </section>
    );
  }

  const { profile, sessions } = data;
  const lap = ringkasan.laporan;
  const keBerandaPasien = () => setPrefs({ activePatientId: profile.id, role: 'pasien' });

  const simpan = async () => {
    const program = buatProgram(profile.id, aktif, Date.now());
    if (!program) return;
    setSibuk(true);
    try {
      await putProgram(program);
      setDraft(draftDariProgram(program));
      tampilkanToast(`Resep ${profile.namaSamaran} tersimpan. Latihan Hari Ini di ponsel pasien sudah ikut berubah.`);
    } catch {
      tampilkanToast('Resep belum tersimpan. Coba tekan Simpan sekali lagi.', 'info');
    } finally {
      setSibuk(false);
    }
  };

  const lihatPasien = () => {
    lihatSebagaiPasien.current = true;
    if (!berubah) keBerandaPasien();
    void navigate(PATHS.beranda);
  };

  return (
    <section className="space-y-4">
      <PageHeader
        judul={profile.namaSamaran}
        kembali={PATHS.klinisi}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <PrototypeBadge />
            {profile.isDemo && <DemoBadge />}
          </span>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.95rem] text-teks-2">
          {profile.usia} tahun · {profile.keterangan} · program sejak {formatTanggalPendek(profile.tanggalMulaiProgram)}
        </p>
        <BigButton varian="garis" onClick={lihatPasien} ikon={<DeviceMobile size={24} weight="bold" aria-hidden />} className="sm:w-auto">
          Lihat sebagai pasien
        </BigButton>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <h2 className="text-[1.3rem] font-extrabold leading-tight">Progres latihan</h2>

          {lap.redFlags.length > 0 ? (
            <div className="space-y-3" aria-label="Tanda perlu perhatian">
              {lap.redFlags.map((f) => (
                <KartuRedFlag key={f.id} flag={f} />
              ))}
            </div>
          ) : (
            <Card nada="sukses">
              <TanpaRedFlag />
            </Card>
          )}

          {/* relative + overflow-hidden: tabel sr-only di dalam grafik tidak boleh melebarkan halaman ponsel. */}
          <Card className="relative overflow-hidden">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[1.1rem] font-extrabold">Kepatuhan 7 hari terakhir</h3>
              <p className="text-[1.4rem] font-extrabold text-primer tabular">{lap.kepatuhan.persen}%</p>
            </div>
            <p className="mb-2 text-[0.95rem] text-teks-2">
              {lap.kepatuhan.selesai} dari {lap.kepatuhan.target} latihan terjadwal sudah dikerjakan.
            </p>
            <WeeklyChart data={lap.batang} className="mx-auto max-w-md" />
          </Card>

          <Card className="relative overflow-hidden">
            <h3 className="text-[1.1rem] font-extrabold">Tren skor 14 hari</h3>
            <ul className="mb-3 mt-1 space-y-0.5 text-[0.95rem]">
              {(
                [
                  ['Gerak', lap.skorGerak],
                  ['Bicara', lap.skorAfasia],
                ] as const
              ).map(([nama, s]) => (
                <li key={nama}>
                  {nama} minggu ini:{' '}
                  <span className="font-bold">{s.sekarang === null ? 'belum ada' : `${s.sekarang} (${labelSkor(s.sekarang)})`}</span>
                  {s.sekarang !== null && <span className="text-teks-2">, {kataTren(s)}</span>}
                </li>
              ))}
            </ul>
            <TrendChart data={lap.tren} />
          </Card>

          <Card>
            <div className="mb-3 flex items-start gap-3">
              <Fire size={30} weight="fill" className="shrink-0 text-aksen" aria-hidden />
              <div>
                <h3 className="text-[1.1rem] font-extrabold leading-tight">
                  {lap.streak.saatIni > 0 ? `${lap.streak.saatIni} hari berturut-turut berlatih` : 'Belum ada hari beruntun saat ini'}
                </h3>
                <p className="text-[0.95rem] text-teks-2">Paling lama {lap.streak.terpanjang} hari berturut-turut.</p>
              </div>
            </div>
            <StreakCalendar hari={lap.kalender} />
          </Card>

          <Card>
            <h3 className="text-[1.1rem] font-extrabold">5 sesi terakhir</h3>
            <SesiTerakhir sessions={sessions} today={today} />
          </Card>

          <NonDiagnosisNote />
        </div>

        <EditorResep
          namaPasien={profile.namaSamaran}
          draft={aktif}
          tersimpan={tersimpan}
          berubah={berubah}
          sibuk={sibuk}
          onUbah={setDraft}
          onSimpan={() => void simpan()}
          onBatalkan={() => setDraft(null)}
        />
      </div>

      <ConfirmDialog
        buka={blocker.state === 'blocked'}
        judul="Perubahan resep belum disimpan"
        labelYa="Tinggalkan tanpa menyimpan"
        labelBatal="Tetap di sini"
        onYa={() => {
          if (lihatSebagaiPasien.current) keBerandaPasien();
          blocker.proceed?.();
        }}
        onBatal={() => {
          lihatSebagaiPasien.current = false;
          blocker.reset?.();
        }}
      >
        <p>Bila halaman ini ditinggalkan, perubahan resep untuk {profile.namaSamaran} tidak tersimpan dan Latihan Hari Ini pasien tetap memakai resep lama.</p>
      </ConfirmDialog>
      {toast}
    </section>
  );
}

function SesiTerakhir({ sessions, today }: { sessions: Session[]; today: string }) {
  const daftar = sesiTerbaru(sessions, 5);
  if (daftar.length === 0) return <p className="mt-1 text-[0.95rem] text-teks-2">Belum ada sesi yang tercatat.</p>;
  return (
    <ul className="mt-1 divide-y divide-garis">
      {daftar.map((s) => {
        const gerak = s.jenis === 'gerak';
        const def = gerak && s.latihanId ? getExercise(s.latihanId) : undefined;
        const Ikon = gerak ? PersonArmsSpread : ChatCircleText;
        const waktu = s.selesaiAt ?? s.mulaiAt;
        return (
          <li key={s.id} className="flex items-center gap-3 py-2.5">
            <Ikon size={26} weight="bold" className="shrink-0 text-primer" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">
                {gerak ? (def?.nama ?? s.latihanId ?? 'Latihan gerak') : 'Latihan Bicara'}
                {def && <span className="font-normal text-teks-2"> · {def.namaKlinis}</span>}
              </p>
              <p className="text-[0.88rem] leading-snug text-teks-2">
                {s.tanggal === today ? 'Hari ini' : `${namaHari(s.tanggal)}, ${formatTanggalPendek(s.tanggal)}`} pukul {formatJam(waktu)} ·{' '}
                {s.repetisiTercapai} dari {s.repetisiTarget} {gerak ? 'kali' : 'kata benar'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[1.3rem] font-extrabold leading-none text-primer tabular">{s.skor}</p>
              <p className="text-[0.8rem] font-semibold text-teks-2">{labelSkor(s.skor)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
