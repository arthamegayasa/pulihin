import {
  BellRinging,
  CaretRight,
  ChatCircleText,
  CheckCircle,
  Confetti,
  Fire,
  HandHeart,
  PersonArmsSpread,
  Play,
  SealCheck,
  type Icon,
} from '@phosphor-icons/react';
import { Link } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { KosongDemo } from '@/components/KosongDemo';
import type { InfoStreak } from '@/features/adherence/adherence';
import { useDataPasien, useLaporan, useSekarang } from '@/features/adherence/hooks';
import { latihanBerikutnya, statusProgramHariIni, teksProgresSet, teksSudahDicoba, teksTarget } from '@/features/adherence/program';
import { bannerPengingat, pengingatHariIni } from '@/features/adherence/reminders';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { formatTanggalPendek, namaHari, namaHariPendek, toISODate } from '@/lib/date';
import { usePrefs } from '@/lib/prefs';
import { PATHS } from '@/router-paths';

function salam(jam: number): string {
  if (jam < 11) return 'Selamat pagi';
  if (jam < 15) return 'Selamat siang';
  if (jam < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/** Nama ramah latihan dari pustaka; cadangan dari id bila pustaka belum memuatnya. */
function namaLatihan(id: string): string {
  const nama = getExercise(id)?.nama;
  if (nama) return nama;
  const teks = id.replace(/-/g, ' ');
  return teks[0].toUpperCase() + teks.slice(1);
}

/** Kalimat streak penyemangat yang pendek (muat di samping tanggal). */
function teksStreak(s: InfoStreak): string {
  if (s.saatIni === 0) return 'Ayo mulai hari ini';
  if (s.perluLanjutHariIni) return `${s.saatIni} hari, ayo lanjut`;
  return `${s.saatIni} hari beruntun`;
}

/** Beranda Pasien (Bab 13): salam, status hari ini, latihan hari ini, streak, pintu ke latihan bicara dan keluarga. */
export default function Beranda() {
  const sekarang = useSekarang();
  const { data, loading, error } = useDataPasien();
  const lap = useLaporan(data, sekarang);
  // Huruf Lebih Besar: salam & pengingat dipadatkan agar daftar latihan dan tombol Untuk Keluarga
  // tetap terlihat tanpa menggulir di HP 6 inci (360x740).
  const { hurufBesar: padat } = usePrefs();

  if (loading && !data) return <p className="py-10 text-center text-teks-2">Memuat latihan hari ini...</p>;
  if (error) return <p className="py-10 text-center text-teks-2">Data latihan belum bisa dibaca. Coba muat ulang halaman.</p>;
  if (!data?.profile || !lap) {
    return (
      <section className="space-y-4">
        <h1 className="text-[1.5rem] font-extrabold">{salam(sekarang.getHours())}</h1>
        <KosongDemo />
      </section>
    );
  }

  const { profile, program, schedule, sessions } = data;
  const today = toISODate(sekarang);
  const items = statusProgramHariIni(program?.items ?? [], sessions, today).map((s) => ({ ...s, nama: namaLatihan(s.latihanId) }));
  const afasiaSelesai = lap.hariIni.afasiaSelesai;
  // Hitungan "latihan" = butir daftar di layar ini (lihat adherence.ts: kepatuhan keluarga memakai "sesi terjadwal").
  const total = items.length + 1;
  const selesai = items.filter((i) => i.selesai).length + (afasiaSelesai ? 1 : 0);
  const berikut = latihanBerikutnya(items);
  const banner = bannerPengingat(pengingatHariIni(schedule, lap.hariIni, sekarang));
  const semuaSelesai = selesai === total;

  return (
    <section className={`flex flex-col ${padat ? 'gap-2' : 'gap-3'}`}>
      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h1 className={`font-extrabold leading-tight ${padat ? 'text-[1.25rem]' : 'text-[1.4rem]'}`}>
            {padat ? 'Halo' : salam(sekarang.getHours())}, {profile.namaSamaran}
          </h1>
          {padat && (
            <p className="text-[0.95rem] text-teks-2">
              {namaHariPendek(today)}, {formatTanggalPendek(today)}
            </p>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {!padat && (
            <p className="text-[0.95rem] text-teks-2">
              {namaHari(today)}, {formatTanggalPendek(today)}
            </p>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aksen-terang px-2.5 py-0.5 text-[0.95rem] font-bold text-teks">
            <Fire size={18} weight="fill" className="text-aksen" aria-hidden />
            {teksStreak(lap.streak)}
          </span>
        </div>
      </header>

      {banner && banner.nada !== 'sukses' && (
        <p
          role="status"
          className={`flex items-center gap-2 rounded-kartu border px-3 text-[0.95rem] font-bold leading-snug ${padat ? 'py-1' : 'py-2'} ${banner.nada === 'aksen' ? 'border-aksen/30 bg-aksen-terang' : 'border-primer-garis bg-primer-terang'}`}
        >
          <BellRinging size={22} weight="fill" className={`shrink-0 ${banner.nada === 'aksen' ? 'text-aksen' : 'text-primer'}`} aria-hidden />
          {banner.teks}
        </p>
      )}

      <div>
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2">
          <h2 className="text-[1.15rem] font-extrabold">Latihan Hari Ini</h2>
          <span className="inline-flex items-center gap-1 text-[0.95rem] font-bold text-primer">
            <SealCheck size={18} weight="fill" aria-hidden />
            {selesai} dari {total}
            {padat ? <span className="sr-only"> latihan selesai</span> : ' latihan selesai'}
          </span>
        </div>
        {items.length === 0 && (
          <Card className="mb-2 text-[0.95rem]">
            Belum ada program latihan gerak. Program disusun oleh terapis. Sementara itu, pilih latihan di{' '}
            <Link to={PATHS.latihan} className="font-bold text-primer underline">
              daftar latihan
            </Link>
            .
          </Card>
        )}
        {/* Tiap baris kartu terpisah berjarak 8px: target sentuh tidak bersentuhan (Bab 12.2). */}
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <BarisLatihan
              key={item.latihanId}
              to={`${PATHS.detailLatihan(item.latihanId)}?target=${item.targetRepetisi}`}
              Ikon={PersonArmsSpread}
              nama={item.nama}
              ukuran={teksTarget(item)}
              selesai={item.selesai}
              skor={item.skorTerakhir}
              progres={teksProgresSet(item) ?? teksSudahDicoba(item)}
              padat={padat}
            />
          ))}
          <BarisLatihan
            to={PATHS.afasia}
            Ikon={ChatCircleText}
            nama="Latihan Bicara"
            ukuran="10 kata"
            selesai={afasiaSelesai}
            skor={lap.hariIni.skorAfasiaTerakhir}
            padat={padat}
          />
        </ul>
      </div>

      {semuaSelesai ? (
        <Card nada="sukses" className="flex items-center gap-3">
          <Confetti size={32} weight="fill" className="shrink-0 text-sukses" aria-hidden />
          <p className="font-bold">Semua latihan hari ini selesai. Hebat, {profile.namaSamaran}! Istirahat yang cukup ya.</p>
        </Card>
      ) : berikut ? (
        <BigLink
          to={`${PATHS.detailLatihan(berikut.latihanId)}?target=${berikut.targetRepetisi}`}
          ukuran="besar"
          ikon={<Play size={28} weight="fill" aria-hidden />}
        >
          Mulai: {berikut.nama}
          {berikut.setSelesai > 0 && ` (set ${berikut.setSelesai + 1} dari ${berikut.set})`}
        </BigLink>
      ) : (
        <BigLink to={PATHS.afasia} ukuran="besar" ikon={<Play size={28} weight="fill" aria-hidden />}>
          Mulai: Latihan Bicara
        </BigLink>
      )}

      <BigLink to={PATHS.keluarga} varian="garis" ikon={<HandHeart size={26} weight="bold" aria-hidden />}>
        Untuk Keluarga
      </BigLink>
      <Link to={PATHS.latihan} className="self-center py-2 text-[0.95rem] font-bold text-primer underline underline-offset-4">
        Lihat semua latihan
      </Link>
    </section>
  );
}

function BarisLatihan({
  to,
  Ikon,
  nama,
  ukuran,
  selesai,
  skor,
  progres = null,
  padat,
}: {
  to: string;
  Ikon: Icon;
  nama: string;
  ukuran: string;
  selesai: boolean;
  skor: number | null;
  /** "1 dari 2 set" atau "Sudah dicoba: 3 dari 10" bila sudah dikerjakan sebagian. */
  progres?: string | null;
  padat: boolean;
}) {
  if (padat) {
    // Huruf Lebih Besar: satu baris nama + status pendek di kanan; jumlah repetisi ada di halaman detail.
    return (
      <li>
        <Link
          to={to}
          className={`flex min-h-[56px] items-center gap-2 rounded-kartu border bg-white px-3 py-1 shadow-tipis hover:bg-primer-terang ${selesai ? 'border-sukses/40' : 'border-garis'}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block font-bold leading-tight">{nama}</span>
            {!selesai && progres && <span className="block text-[0.95rem] font-bold leading-snug text-teks">{progres}</span>}
          </span>
          {selesai ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[0.95rem] font-bold text-sukses">
              Selesai
              <CheckCircle size={26} weight="fill" aria-hidden />
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[0.95rem] font-semibold text-teks-2">
              {!progres && 'Belum'}
              <CaretRight size={22} weight="bold" className="text-primer" aria-hidden />
            </span>
          )}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <Link
        to={to}
        className={`flex min-h-[56px] items-center gap-3 rounded-kartu border bg-white px-3 py-1.5 shadow-tipis hover:bg-primer-terang ${selesai ? 'border-sukses/40' : 'border-garis'}`}
      >
        <Ikon size={26} weight="bold" className="shrink-0 text-primer" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-tight">{nama}</span>
          <span className="block text-[0.95rem] leading-snug text-teks-2">
            {selesai ? (
              <>
                {ukuran} · <span className="font-bold text-sukses">Selesai{skor !== null && `, skor ${skor}`}</span>
              </>
            ) : progres ? (
              <span className="font-bold text-teks">{progres}</span>
            ) : (
              <>
                {ukuran} · <span className="font-semibold">Belum</span>
              </>
            )}
          </span>
        </span>
        {selesai ? (
          <CheckCircle size={28} weight="fill" className="shrink-0 text-sukses" aria-hidden />
        ) : (
          <CaretRight size={22} weight="bold" className="shrink-0 text-primer" aria-hidden />
        )}
      </Link>
    </li>
  );
}
