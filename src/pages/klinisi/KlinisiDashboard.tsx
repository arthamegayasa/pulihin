import { CaretRight, Fire, Info } from '@phosphor-icons/react';
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { DemoBadge } from '@/components/DemoBadge';
import { KosongDemo } from '@/components/KosongDemo';
import { NonDiagnosisNote } from '@/components/NonDiagnosisNote';
import { PageHeader } from '@/components/PageHeader';
import { PrototypeBadge } from '@/components/klinisi/PrototypeBadge';
import { ChipRedFlag, TanpaRedFlag } from '@/components/klinisi/RedFlagKlinisi';
import { useDaftarPasienKlinisi } from '@/components/klinisi/useDataKlinisi';
import { useSekarang } from '@/features/adherence/hooks';
import { ringkasPasien, urutkanPerluPerhatian, type RingkasanPasienKlinisi } from '@/features/adherence/klinisi';
import { formatJam, formatTanggalPendek, namaHari, toISODate } from '@/lib/date';
import { labelSkor } from '@/lib/score';
import { PATHS } from '@/router-paths';

/** Dashboard Klinisi (Bab 10.2): daftar pasien demo, kepatuhan, skor, dan red flag yang sama dengan tampilan keluarga. */
export default function KlinisiDashboard() {
  const sekarang = useSekarang();
  const today = toISODate(sekarang);
  const { data, loading, error } = useDaftarPasienKlinisi();
  const pasien = useMemo(() => urutkanPerluPerhatian((data ?? []).map((d) => ringkasPasien(d, today))), [data, today]);
  const perluPerhatian = pasien.filter((p) => p.laporan.redFlags.length > 0).length;

  return (
    <section className="space-y-4">
      <PageHeader
        judul="Dashboard Terapis"
        kembali={false}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <PrototypeBadge />
            <DemoBadge />
            <span>Pantau latihan pasien di rumah dan atur program latihannya.</span>
          </span>
        }
      />

      {loading && !data && <p className="py-10 text-center text-teks-2">Memuat daftar pasien...</p>}
      {error && <p className="py-10 text-center text-teks-2">Data pasien belum bisa dibaca. Coba muat ulang halaman.</p>}
      {data && pasien.length === 0 && <KosongDemo />}

      {pasien.length > 0 && (
        <>
          <p className="text-[1rem] font-semibold text-teks-2" role="status">
            {pasien.length} pasien ·{' '}
            {perluPerhatian > 0 ? (
              <span className="font-bold text-teks">{perluPerhatian} perlu perhatian, ditampilkan paling atas</span>
            ) : (
              'semua berjalan baik minggu ini'
            )}
          </p>
          <ul className="space-y-3" aria-label="Daftar pasien">
            {pasien.map((p) => (
              <BarisPasien key={p.profile.id} p={p} today={today} />
            ))}
          </ul>
        </>
      )}

      <div className="space-y-2 rounded-kartu border border-garis bg-white p-4 text-[0.95rem] text-teks-2">
        <p className="flex gap-2">
          <Info size={22} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            Prototype untuk peragaan. Semua pasien adalah profil samaran berlabel Demo. Dashboard ini bukan rekam medis dan
            tidak memberi diagnosis. Angka dan tanda perlu perhatian dihitung sama persis dengan halaman Untuk Keluarga.
          </span>
        </p>
        <NonDiagnosisNote />
      </div>
    </section>
  );
}

function BarisPasien({ p, today }: { p: RingkasanPasienKlinisi; today: string }) {
  const { profile, laporan: lap, program, sesiTerakhir } = p;
  const k = lap.kepatuhan;
  const terakhir = !sesiTerakhir
    ? 'Belum ada'
    : sesiTerakhir.tanggal === today
      ? 'Hari ini'
      : `${namaHari(sesiTerakhir.tanggal)}, ${formatTanggalPendek(sesiTerakhir.tanggal)}`;
  return (
    <li>
      <Link
        to={PATHS.klinisiPasien(profile.id)}
        className="group block rounded-kartu border border-garis bg-white p-4 shadow-tipis transition-colors hover:border-primer hover:bg-primer-terang/40"
        aria-label={`${profile.namaSamaran}: buka progres dan resep program`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
          <div className="min-w-0 lg:w-60 lg:shrink-0">
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-[1.25rem] font-extrabold leading-tight text-teks">{profile.namaSamaran}</span>
              {profile.isDemo && <DemoBadge />}
            </p>
            <p className="text-[0.95rem] text-teks-2">
              {profile.usia} tahun · {profile.keterangan}
            </p>
            <p className="text-[0.9rem] text-teks-2">
              {program ? `${program.items.length} latihan, ${program.frekuensiPerMinggu} hari per minggu` : 'Belum ada resep program'}
            </p>
          </div>

          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)]">
            <Angka label="Kepatuhan 7 hari" nilai={`${k.persen}%`} keterangan={`${k.selesai} dari ${k.target} latihan`}>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-primer-terang" aria-hidden>
                <span className="block h-full rounded-full bg-primer" style={{ width: `${Math.min(100, k.persen)}%` }} />
              </span>
            </Angka>
            <Angka
              label="Hari beruntun"
              nilai={
                <span className="inline-flex items-center gap-1">
                  <Fire size={22} weight="fill" className="text-aksen" aria-hidden />
                  {lap.streak.saatIni} hari
                </span>
              }
              keterangan={`terpanjang ${lap.streak.terpanjang} hari`}
            />
            <Angka
              label="Latihan terakhir"
              nilai={terakhir}
              keterangan={sesiTerakhir ? `pukul ${formatJam(sesiTerakhir.selesaiAt ?? sesiTerakhir.mulaiAt)}` : undefined}
            />
            <div className="min-w-0">
              <dt className="text-[0.85rem] font-semibold text-teks-2">Rata-rata skor 7 hari</dt>
              <dd className="text-[0.95rem] leading-snug">
                {(
                  [
                    ['Gerak', lap.skorGerak],
                    ['Bicara', lap.skorAfasia],
                  ] as const
                ).map(([nama, s]) => (
                  <span key={nama} className="block">
                    {nama}: <span className="font-bold">{s.sekarang === null ? 'belum ada' : `${s.sekarang} (${labelSkor(s.sekarang)})`}</span>
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <CaretRight size={26} weight="bold" className="hidden shrink-0 self-center text-primer lg:block" aria-hidden />
        </div>

        <div className="mt-3 border-t border-garis pt-3">
          {lap.redFlags.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Tanda perlu perhatian">
              {lap.redFlags.map((f) => (
                <ChipRedFlag key={f.id} flag={f} />
              ))}
            </ul>
          ) : (
            <TanpaRedFlag />
          )}
          <span className="mt-3 flex min-h-12 items-center justify-center gap-1 rounded-xl border-2 border-primer font-bold text-primer group-hover:bg-white lg:hidden">
            Buka progres & resep
            <CaretRight size={20} weight="bold" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}

function Angka({ label, nilai, keterangan, children }: { label: string; nilai: ReactNode; keterangan?: string; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.85rem] font-semibold text-teks-2">{label}</dt>
      <dd>
        <span className="block text-[1.15rem] font-extrabold leading-tight text-teks tabular sm:text-[1.3rem]">{nilai}</span>
        {keterangan && <span className="block text-[0.85rem] text-teks-2">{keterangan}</span>}
        {children}
      </dd>
    </div>
  );
}
