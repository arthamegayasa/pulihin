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
import { useDataPasien, useLaporan, useNotifikasiPengingat, useSekarang } from '@/features/adherence/hooks';
import { bannerPengingat, pengingatHariIni } from '@/features/adherence/reminders';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { formatTanggalPendek, namaHari, toISODate } from '@/lib/date';
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
  useNotifikasiPengingat(data, sekarang);

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
  const sesiHariIni = sessions.filter((s) => s.tanggal === today);
  const items = (program?.items ?? []).map((item) => {
    const selesai = sesiHariIni.filter((s) => s.jenis === 'gerak' && s.latihanId === item.latihanId);
    return { ...item, nama: namaLatihan(item.latihanId), skor: selesai.at(-1)?.skor ?? null };
  });
  const afasiaSelesai = lap.hariIni.afasiaSelesai;
  const total = items.length + 1;
  const selesai = items.filter((i) => i.skor !== null).length + (afasiaSelesai ? 1 : 0);
  const berikut = items.find((i) => i.skor === null);
  const banner = bannerPengingat(pengingatHariIni(schedule, lap.hariIni, sekarang));
  const semuaSelesai = selesai === total;

  return (
    <section className="flex flex-col gap-2.5">
      <header>
        <h1 className="text-[1.5rem] font-extrabold leading-tight">
          {salam(sekarang.getHours())}, {profile.namaSamaran}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[0.95rem] text-teks-2">
            {namaHari(today)}, {formatTanggalPendek(today)}
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aksen-terang px-2.5 py-0.5 text-[0.85rem] font-bold text-teks">
            <Fire size={18} weight="fill" className="text-aksen" aria-hidden />
            {teksStreak(lap.streak)}
          </span>
        </div>
      </header>

      {banner && banner.nada !== 'sukses' && (
        <p
          role="status"
          className={`flex items-center gap-2 rounded-kartu border px-3 py-2 text-[0.95rem] font-bold ${banner.nada === 'aksen' ? 'border-aksen/30 bg-aksen-terang' : 'border-primer-garis bg-primer-terang'}`}
        >
          <BellRinging size={22} weight="fill" className={`shrink-0 ${banner.nada === 'aksen' ? 'text-aksen' : 'text-primer'}`} aria-hidden />
          {banner.teks}
        </p>
      )}

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <h2 className="text-[1.15rem] font-extrabold">Latihan Hari Ini</h2>
          <span className="inline-flex items-center gap-1 text-[0.9rem] font-bold text-primer">
            <SealCheck size={18} weight="fill" aria-hidden />
            {selesai} dari {total} selesai
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
        <ul className="divide-y divide-garis overflow-hidden rounded-kartu border border-garis bg-white shadow-tipis">
          {items.map((item) => (
            <BarisLatihan
              key={item.latihanId}
              to={`${PATHS.detailLatihan(item.latihanId)}?target=${item.targetRepetisi}`}
              Ikon={PersonArmsSpread}
              nama={item.nama}
              ukuran={`${item.targetRepetisi} kali`}
              skor={item.skor}
            />
          ))}
          <BarisLatihan
            to={PATHS.afasia}
            Ikon={ChatCircleText}
            nama="Latihan Bicara"
            ukuran="10 kata"
            skor={afasiaSelesai ? lap.hariIni.skorAfasiaTerakhir : null}
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

function BarisLatihan({ to, Ikon, nama, ukuran, skor }: { to: string; Ikon: Icon; nama: string; ukuran: string; skor: number | null }) {
  const selesai = skor !== null;
  return (
    <li>
      <Link to={to} className="flex min-h-[56px] items-center gap-3 px-3 py-1.5 hover:bg-primer-terang">
        <Ikon size={26} weight="bold" className="shrink-0 text-primer" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-tight">{nama}</span>
          <span className="block text-[0.85rem] leading-snug text-teks-2">
            {ukuran} ·{' '}
            {selesai ? (
              <span className="font-bold text-sukses">Selesai, skor {skor}</span>
            ) : (
              <span className="font-semibold">Belum</span>
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
