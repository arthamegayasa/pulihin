import { CalendarCheck, CaretRight, CheckCircle, Fire, Info, PersonArmsSpread, UsersThree, Warning } from '@phosphor-icons/react';
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { DemoBadge } from '@/components/DemoBadge';
import { KosongDemo } from '@/components/KosongDemo';
import { NonDiagnosisNote } from '@/components/NonDiagnosisNote';
import { PageHeader } from '@/components/PageHeader';
import { AvatarInisial, PitaRingkasan } from '@/components/klinisi/PitaRingkasan';
import { PrototypeBadge } from '@/components/klinisi/PrototypeBadge';
import { ChipRedFlag, TanpaRedFlag } from '@/components/klinisi/RedFlagKlinisi';
import { useDaftarPasienKlinisi } from '@/components/klinisi/useDataKlinisi';
import { JudulBagian, KartuStat, KeadaanKosong, Kerangka, KerangkaGrup, KerangkaKartu } from '@/components/premium';
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
  const sudahHariIni = pasien.filter((p) => p.laporan.hariIni.adaSesi).length;
  const rataKepatuhan = pasien.length > 0 ? Math.round(pasien.reduce((n, p) => n + p.laporan.kepatuhan.persen, 0) / pasien.length) : 0;

  return (
    <section className="space-y-6">
      <PageHeader
        judul="Dashboard Terapis"
        kembali={false}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <PrototypeBadge />
            <DemoBadge />
          </span>
        }
      />

      {loading && !data && (
        <KerangkaGrup label="Memuat daftar pasien..." className="space-y-4">
          <Kerangka bentuk="kotak" className="h-[17rem]" />
          <KerangkaKartu baris={3} />
          <KerangkaKartu baris={3} />
        </KerangkaGrup>
      )}
      {error && <KeadaanKosong judul="Data pasien belum bisa dibaca">Coba muat ulang halaman. Data tetap tersimpan di perangkat ini.</KeadaanKosong>}
      {data && pasien.length === 0 && <KosongDemo judul="Belum ada pasien di perangkat ini" />}

      {pasien.length > 0 && (
        <>
          <PitaRingkasan
            idJudul="judul-ringkasan"
            label="Minggu ini"
            judul={perluPerhatian > 0 ? `${perluPerhatian} pasien perlu perhatian` : 'Semua pasien berjalan baik'}
            sub={<span className="hidden lg:inline">Pantau latihan pasien di rumah dan atur program latihannya.</span>}
          >
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7.5rem),1fr))] gap-3" aria-label="Angka minggu ini">
              <Stat label="Pasien" nilai={pasien.length} ikon={<UsersThree weight="bold" />} />
              <Stat
                label="Perlu perhatian"
                nilai={perluPerhatian}
                ikon={perluPerhatian > 0 ? <Warning weight="fill" className="text-peringatan" /> : <CheckCircle weight="fill" className="text-sukses" />}
              />
              <Stat label="Latihan hari ini" nilai={sudahHariIni} satuan={`/ ${pasien.length}`} ikon={<PersonArmsSpread weight="bold" />} />
              <Stat label="Kepatuhan" nilai={`${rataKepatuhan}%`} keterangan="rata-rata 7 hari" ikon={<CalendarCheck weight="bold" />} />
            </ul>
          </PitaRingkasan>

          <section aria-labelledby="judul-pasien">
            <JudulBagian
              id="judul-pasien"
              judul="Pasien"
              sub={<span role="status">{perluPerhatian > 0 ? 'Yang perlu perhatian ditampilkan paling atas.' : 'Semua berjalan baik minggu ini.'}</span>}
            />
            <ul className="space-y-3" aria-label="Daftar pasien">
              {pasien.map((p) => (
                <BarisPasien key={p.profile.id} p={p} today={today} />
              ))}
            </ul>
          </section>
        </>
      )}

      <div className="space-y-2 rounded-kartu border border-garis-halus bg-permukaan p-4 tipe-keterangan text-teks-2 shadow-tipis">
        <p className="flex gap-2">
          <Info size={22} weight="bold" className="mt-0.5 shrink-0 text-primer" aria-hidden />
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

/** Satu angka di pita ringkasan. */
function Stat({ label, nilai, satuan, keterangan, ikon }: { label: string; nilai: ReactNode; satuan?: string; keterangan?: string; ikon: ReactNode }) {
  return (
    <li className="min-w-0">
      <KartuStat label={label} nilai={nilai} satuan={satuan} keterangan={keterangan} ikon={ikon} className="h-full" />
    </li>
  );
}

function BarisPasien({ p, today }: { p: RingkasanPasienKlinisi; today: string }) {
  const { profile, laporan: lap, program, sesiTerakhir } = p;
  const k = lap.kepatuhan;
  const penting = p.jumlahPenting > 0;
  const terakhir = !sesiTerakhir
    ? 'Belum ada'
    : sesiTerakhir.tanggal === today
      ? 'Hari ini'
      : `${namaHari(sesiTerakhir.tanggal)}, ${formatTanggalPendek(sesiTerakhir.tanggal)}`;
  return (
    <li>
      <Link
        to={PATHS.klinisiPasien(profile.id)}
        className={`group block rounded-kartu border bg-permukaan p-4 shadow-tipis transition-[border-color,box-shadow] duration-(--durasi-sedang) hover:border-primer-garis hover:shadow-sedang lg:p-5 ${penting ? 'border-bahaya/35' : 'border-garis-halus'}`}
        aria-label={`${profile.namaSamaran}: buka progres dan resep program`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex min-w-0 items-center gap-3 lg:w-64 lg:shrink-0">
            <AvatarInisial nama={profile.namaSamaran} />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="tipe-subjudul text-teks">{profile.namaSamaran}</span>
                {profile.isDemo && <DemoBadge />}
              </p>
              <p className="tipe-keterangan text-teks-2">
                {profile.usia} tahun · {profile.keterangan}
              </p>
              <p className="tipe-keterangan text-teks-2">
                {program ? `${program.items.length} latihan, ${program.frekuensiPerMinggu} hari per minggu` : 'Belum ada resep program'}
              </p>
            </div>
          </div>

          <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-3 rounded-kontrol bg-latar p-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.4fr)] sm:gap-x-4 lg:bg-transparent lg:p-0">
            <Angka label={<>Kepatuhan<span className="hidden sm:inline"> 7 hari</span></>} nilai={`${k.persen}%`} keterangan={`${k.selesai} dari ${k.target} sesi`}>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-cekung" aria-hidden>
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
              lebarPonsel
              nilai={terakhir}
              keterangan={sesiTerakhir ? `pukul ${formatJam(sesiTerakhir.selesaiAt ?? sesiTerakhir.mulaiAt)}` : undefined}
            />
            {/* Ponsel: selebar kartu agar "Gerak: 56 (Berkembang)" muat satu baris. */}
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <dt className="tipe-keterangan font-semibold text-teks-2">Rata-rata skor 7 hari</dt>
              <dd className="tipe-keterangan text-teks">
                {(
                  [
                    ['Gerak', p.laporan.skorGerak],
                    ['Bicara', p.laporan.skorAfasia],
                  ] as const
                ).map(([nama, s]) => (
                  <span key={nama} className="block">
                    {nama}: <span className="font-bold tabular">{s.sekarang === null ? 'belum ada' : `${s.sekarang} (${labelSkor(s.sekarang)})`}</span>
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <span
            className="hidden size-[44px] shrink-0 place-items-center rounded-full bg-primer-terang text-primer transition-colors duration-(--durasi-sedang) group-hover:bg-primer group-hover:text-white lg:grid"
            aria-hidden
          >
            <CaretRight size={22} weight="bold" />
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-garis-halus pt-3 lg:flex-row lg:items-center lg:justify-between">
          {lap.redFlags.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Tanda perlu perhatian">
              {lap.redFlags.map((f) => (
                <ChipRedFlag key={f.id} flag={f} />
              ))}
            </ul>
          ) : (
            <TanpaRedFlag />
          )}
          <span className="flex min-h-[56px] items-center justify-center gap-1 rounded-kontrol border-2 border-primer font-bold text-primer transition-colors group-hover:bg-primer-terang lg:hidden">
            Buka progres & resep
            <CaretRight size={20} weight="bold" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}

function Angka({
  label,
  nilai,
  keterangan,
  lebarPonsel = false,
  children,
}: {
  label: ReactNode;
  nilai: ReactNode;
  keterangan?: string;
  /** Ponsel: selebar kartu (dua kolom) agar tanggal tidak terpotong menjadi beberapa baris. */
  lebarPonsel?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`min-w-0 ${lebarPonsel ? 'col-span-2 sm:col-span-1' : ''}`}>
      <dt className="tipe-keterangan font-semibold text-teks-2">{label}</dt>
      <dd>
        <span className="block text-[1.15rem] font-extrabold leading-tight text-teks tabular sm:text-[1.3rem]">{nilai}</span>
        {keterangan && <span className="block tipe-keterangan text-teks-2">{keterangan}</span>}
        {children}
      </dd>
    </div>
  );
}
