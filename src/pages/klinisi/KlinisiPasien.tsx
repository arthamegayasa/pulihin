import { CalendarCheck, ChatCircleText, DeviceMobile, Fire, PersonArmsSpread } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { AvatarInisial, PitaRingkasan } from '@/components/klinisi/PitaRingkasan';
import { PrototypeBadge } from '@/components/klinisi/PrototypeBadge';
import { KartuRedFlag, TanpaRedFlag } from '@/components/klinisi/RedFlagKlinisi';
import { usePasienKlinisi } from '@/components/klinisi/useDataKlinisi';
import { IkonBingkai, JudulBagian, KartuStat, KeadaanKosong, Kerangka, KerangkaGrup, KerangkaKartu } from '@/components/premium';
import { putProgram } from '@/data/db';
import type { PerbandinganSkor } from '@/features/adherence/adherence';
import { useSekarang } from '@/features/adherence/hooks';
import { ringkasPasien, sesiTerbaru } from '@/features/adherence/klinisi';
import { kataTren } from '@/features/adherence/laporan';
import { buatProgram, draftDariProgram, programSama, teksRentang, type DraftProgram } from '@/features/adherence/program';
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

  if (loading && !data) {
    return (
      <KerangkaGrup label="Memuat data pasien..." className="space-y-4">
        <Kerangka bentuk="judul" className="h-[3rem]" />
        <Kerangka bentuk="kotak" className="h-[15rem]" />
        <div className="grid gap-5 lg:grid-cols-2">
          <KerangkaKartu baris={4} />
          <KerangkaKartu baris={4} />
        </div>
      </KerangkaGrup>
    );
  }
  if (error) {
    return (
      <section className="space-y-4">
        <PageHeader judul="Data pasien" kembali={PATHS.klinisi} />
        <KeadaanKosong judul="Data pasien belum bisa dibaca">Coba muat ulang halaman. Data tetap tersimpan di perangkat ini.</KeadaanKosong>
      </section>
    );
  }
  if (!data || !ringkasan) {
    return (
      <section className="space-y-4">
        <PageHeader judul="Pasien tidak ditemukan" kembali={PATHS.klinisi} />
        <KeadaanKosong
          judul="Profil ini tidak ada di data demo"
          aksi={
            <BigLink to={PATHS.klinisi} varian="garis">
              Ke Daftar Pasien
            </BigLink>
          }
        >
          Kembali ke daftar pasien untuk memilih pasien lain.
        </KeadaanKosong>
      </section>
    );
  }

  const { profile, sessions } = data;
  const lap = ringkasan.laporan;
  const rentangKhusus = (tersimpan?.items ?? []).flatMap((i) => {
    const teks = teksRentang(i);
    return teks ? [{ nama: getExercise(i.latihanId)?.nama ?? i.latihanId, teks }] : [];
  });
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
    <section className="space-y-6">
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

      <PitaRingkasan
        idJudul="judul-ringkasan-pasien"
        gambarPonsel={false}
        depan={<AvatarInisial nama={profile.namaSamaran} ukuran="besar" />}
        label={`Program sejak ${formatTanggalPendek(profile.tanggalMulaiProgram)}`}
        judul={`${profile.usia} tahun, ${profile.keterangan.toLowerCase()}`}
        sub={
          rentangKhusus.length > 0 && (
            <p>
              <span className="font-bold text-teks">Target rentang khusus:</span>{' '}
              {rentangKhusus.map((r) => `${r.nama} (${r.teks.toLowerCase()})`).join(', ')}
            </p>
          )
        }
      >
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7.5rem),1fr))] gap-3" aria-label="Angka 7 hari terakhir">
          <li className="min-w-0">
            <KartuStat
              label="Kepatuhan"
              nilai={`${lap.kepatuhan.persen}%`}
              keterangan={`${lap.kepatuhan.selesai} dari ${lap.kepatuhan.target} sesi`}
              ikon={<CalendarCheck weight="bold" />}
              className="h-full"
            />
          </li>
          <li className="min-w-0">
            <KartuStat
              label="Beruntun"
              nilai={lap.streak.saatIni}
              satuan="hari"
              keterangan={`terpanjang ${lap.streak.terpanjang} hari`}
              ikon={<Fire weight="fill" className="text-aksen" />}
              className="h-full"
            />
          </li>
          <li className="min-w-0">
            <StatSkor label="Skor gerak" skor={lap.skorGerak} />
          </li>
          <li className="min-w-0">
            <StatSkor label="Skor bicara" skor={lap.skorAfasia} />
          </li>
        </ul>
        <BigButton
          varian="garis"
          onClick={lihatPasien}
          ikon={<DeviceMobile weight="bold" aria-hidden />}
          className="mt-4 bg-permukaan sm:w-auto"
        >
          Lihat sebagai pasien
        </BigButton>
      </PitaRingkasan>

      {/* Kolom eksplisit minmax(0,1fr) + min-w-0 pada setiap anak grid: isi kartu tidak boleh melebarkan halaman
          ponsel (360 px, Huruf Lebih Besar). */}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] [&>*]:min-w-0">
        <section className="space-y-6" aria-labelledby="judul-progres">
          <div className="space-y-3">
            <JudulBagian id="judul-progres" judul="Progres latihan" sub="Angka dan tanda dihitung sama dengan halaman Untuk Keluarga." />
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
          </div>

          <BagianGrafik
            id="judul-kepatuhan"
            judul="Kepatuhan 7 hari terakhir"
            sub={`${lap.kepatuhan.selesai} dari ${lap.kepatuhan.target} sesi terjadwal sudah dikerjakan.`}
          >
            <WeeklyChart data={lap.batang} className="mx-auto max-w-md" />
          </BagianGrafik>

          <BagianGrafik id="judul-tren" judul="Tren skor 14 hari" sub={<TeksTren gerak={lap.skorGerak} bicara={lap.skorAfasia} />}>
            <TrendChart data={lap.tren} />
          </BagianGrafik>

          <BagianGrafik
            id="judul-streak"
            judul={lap.streak.saatIni > 0 ? `${lap.streak.saatIni} hari berturut-turut berlatih` : 'Belum ada hari beruntun saat ini'}
            sub={`Paling lama ${lap.streak.terpanjang} hari berturut-turut.`}
          >
            <StreakCalendar hari={lap.kalender} />
          </BagianGrafik>

          <section aria-labelledby="judul-sesi">
            <JudulBagian id="judul-sesi" judul="5 sesi terakhir" as="h3" />
            <SesiTerakhir sessions={sessions} today={today} />
          </section>

          <NonDiagnosisNote />
        </section>

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

/** Bagian grafik: judul + penjelasan di luar kartu, grafik di dalam kartu putih. */
function BagianGrafik({ id, judul, sub, children }: { id: string; judul: string; sub: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <JudulBagian id={id} judul={judul} sub={sub} as="h3" />
      {/* relative + overflow-hidden: tabel sr-only di dalam grafik tidak boleh melebarkan halaman ponsel. */}
      <Card className="relative overflow-hidden">{children}</Card>
    </section>
  );
}

function TeksTren({ gerak, bicara }: { gerak: PerbandinganSkor; bicara: PerbandinganSkor }) {
  return (
    <>
      {(
        [
          ['Gerak', gerak],
          ['Bicara', bicara],
        ] as const
      ).map(([nama, s]) => (
        <span key={nama} className="block">
          {nama} minggu ini:{' '}
          <span className="font-bold text-teks">{s.sekarang === null ? 'belum ada' : `${s.sekarang} (${labelSkor(s.sekarang)})`}</span>
          {s.sekarang !== null && `, ${kataTren(s)}`}
        </span>
      ))}
    </>
  );
}

function StatSkor({ label, skor }: { label: string; skor: PerbandinganSkor }) {
  if (skor.sekarang === null) {
    return <KartuStat label={label} nilai={<span aria-label="belum ada">-</span>} keterangan="belum ada sesi minggu ini" className="h-full" />;
  }
  return <KartuStat label={label} nilai={skor.sekarang} keterangan={labelSkor(skor.sekarang)} className="h-full" />;
}

function SesiTerakhir({ sessions, today }: { sessions: Session[]; today: string }) {
  const daftar = sesiTerbaru(sessions, 5);
  if (daftar.length === 0) {
    return (
      <KeadaanKosong judul="Belum ada sesi" as="h3">
        Sesi latihan pasien akan muncul di sini setelah selesai dikerjakan.
      </KeadaanKosong>
    );
  }
  return (
    <Card>
      <ul className="divide-y divide-garis-halus">
        {daftar.map((s) => {
          const gerak = s.jenis === 'gerak';
          const def = gerak && s.latihanId ? getExercise(s.latihanId) : undefined;
          const Ikon = gerak ? PersonArmsSpread : ChatCircleText;
          const waktu = s.selesaiAt ?? s.mulaiAt;
          const rentang = gerak ? teksRentang(s) : null;
          return (
            <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <IkonBingkai nada={gerak ? 'primer' : 'aksen'}>
                <Ikon weight="bold" />
              </IkonBingkai>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-tight text-teks">
                  {gerak ? (def?.nama ?? s.latihanId ?? 'Latihan gerak') : 'Latihan Bicara'}
                  {def && <span className="font-normal text-teks-2"> · {def.namaKlinis}</span>}
                </p>
                <p className="tipe-keterangan text-teks-2">
                  {s.tanggal === today ? 'Hari ini' : `${namaHari(s.tanggal)}, ${formatTanggalPendek(s.tanggal)}`} pukul {formatJam(waktu)} ·{' '}
                  {s.repetisiTercapai} dari {s.repetisiTarget} {gerak ? 'kali' : 'kata benar'}
                  {rentang && ` · ${rentang.toLowerCase()}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[1.3rem] font-extrabold leading-none text-primer tabular">{s.skor}</p>
                <p className="tipe-keterangan font-semibold text-teks-2">{labelSkor(s.skor)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
