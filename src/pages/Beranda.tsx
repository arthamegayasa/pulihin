import { BellRinging, Confetti, Fire, HandHeart, Play } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { KosongDemo } from '@/components/KosongDemo';
import { Kerangka, KerangkaGrup, KerangkaKartu, Lencana } from '@/components/premium';
import type { InfoStreak } from '@/features/adherence/adherence';
import { useDataPasien, useLaporan, useSekarang } from '@/features/adherence/hooks';
import { latihanBerikutnya, statusProgramHariIni, teksProgresSet, teksSudahDicoba, teksTarget, urlLatihanProgram } from '@/features/adherence/program';
import { bannerPengingat, pengingatHariIni } from '@/features/adherence/reminders';
import { BarisHariIni } from '@/features/pasien/BarisHariIni';
import { CincinHariIni } from '@/features/pasien/CincinHariIni';
import { IlustrasiPotong } from '@/features/pasien/IlustrasiPotong';
import { KartuSapa } from '@/features/pasien/KartuSapa';
import { PosterLatihan } from '@/features/pasien/PosterLatihan';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { prefetchAsetPose } from '@/features/pose/asetPose';
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
  const { hurufBesar: padat, role } = usePrefs();
  // Aset MediaPipe (~18 MB) hanya untuk jalur pasien: diunduh ke cache SW saat senggang agar sesi kamera bisa luring.
  useEffect(() => {
    if (role === 'pasien') prefetchAsetPose();
  }, [role]);

  if (loading && !data) {
    return (
      <KerangkaGrup label="Memuat latihan hari ini..." className={`flex flex-col ${padat ? 'gap-[8px]' : 'gap-2.5'}`}>
        <Kerangka bentuk="kotak" className={`rounded-kartu ${padat ? 'h-[112px]' : 'h-[153px]'}`} />
        <Kerangka bentuk="judul" className="w-1/2" />
        <KerangkaKartu baris={1} gambar />
        <KerangkaKartu baris={1} gambar />
        <Kerangka bentuk="tombol" />
      </KerangkaGrup>
    );
  }
  if (error) return <p className="py-10 text-center text-teks-2">Data latihan belum bisa dibaca. Coba muat ulang halaman.</p>;
  if (!data?.profile || !lap) {
    return (
      <section className="space-y-4">
        <h1 className="tipe-judul">{salam(sekarang.getHours())}</h1>
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
  const banner = bannerPengingat(pengingatHariIni(schedule, lap.hariIni, sekarang), sekarang);
  const semuaSelesai = selesai === total;
  const teksSalam = salam(sekarang.getHours());
  const streak = (
    <Lencana nada="aksen" ikon={<Fire weight="fill" />} className="max-w-none">
      {teksStreak(lap.streak)}
    </Lencana>
  );
  const pengingat = banner && banner.nada !== 'sukses' && (
    <p role="status" className="flex items-start gap-1.5 text-[0.95rem] font-bold leading-snug text-teks">
      <BellRinging size={20} weight="fill" className={`mt-px shrink-0 ${banner.nada === 'aksen' ? 'text-aksen' : 'text-primer'}`} aria-hidden />
      {banner.teks}
    </p>
  );

  return (
    <section className={`flex flex-col ${padat ? 'gap-[8px]' : 'gap-2.5'}`}>
      {padat ? (
        // Huruf Lebih Besar: sapaan ringkas dengan potongan wajah dari ilustrasi Beranda (kartu hero bertumpuk
        // terlalu tinggi; daftar latihan dan tombol Untuk Keluarga harus tetap terlihat tanpa menggulir).
        <header className="flex items-center gap-3">
          <IlustrasiPotong
            ilustrasi={{ jenis: 'momen', nama: 'beranda' }}
            potong={{ x: 548, y: 70, sisi: 170 }}
            prioritas
            className="size-[56px] rounded-full border-2 border-permukaan shadow-tipis"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.25rem] font-extrabold leading-tight tracking-[-0.01em]">Halo, {profile.namaSamaran}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-[0.95rem] text-teks-2">
                {namaHariPendek(today)}, {formatTanggalPendek(today)}
              </p>
              {streak}
            </div>
          </div>
        </header>
      ) : (
        <KartuSapa
          ilustrasi={{ jenis: 'momen', nama: 'beranda' }}
          label={<span aria-hidden>{teksSalam},</span>}
          judul={
            <>
              <span className="sr-only">{teksSalam}, </span>
              {profile.namaSamaran}
            </>
          }
          sub={`${namaHari(today)}, ${formatTanggalPendek(today)}`}
        >
          {streak}
        </KartuSapa>
      )}

      {padat && pengingat}

      <section aria-labelledby="judul-hari-ini">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3">
          <h2 id="judul-hari-ini" className="tipe-subjudul">
            Latihan Hari Ini
          </h2>
          <CincinHariIni selesai={selesai} total={total} kecil={padat} />
        </div>
        {!padat && pengingat && <div className="-mt-0.5 mb-1.5">{pengingat}</div>}
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
        <ul className="flex flex-col gap-[8px]">
          {items.map((item, i) => (
            <BarisHariIni
              key={item.latihanId}
              to={urlLatihanProgram(item)}
              // Huruf Lebih Besar: tanpa gambar kecil agar nama latihan tidak terpotong jadi tiga baris.
              gambar={padat ? undefined : <PosterLatihan latihanId={item.latihanId} prioritas={i < 3} />}
              nama={item.nama}
              ukuran={teksTarget(item)}
              selesai={item.selesai}
              skor={item.skorTerakhir}
              progres={teksProgresSet(item) ?? teksSudahDicoba(item)}
            />
          ))}
          <BarisHariIni
            to={PATHS.afasia}
            gambar={padat ? undefined : <IlustrasiPotong ilustrasi={{ jenis: 'momen', nama: 'bicara' }} potong={{ x: 500, y: 90, sisi: 270 }} className="size-[56px] rounded-[12px]" />}
            nama="Latihan Bicara"
            ukuran="10 kata"
            selesai={afasiaSelesai}
            skor={lap.hariIni.skorAfasiaTerakhir}
          />
        </ul>
      </section>

      {semuaSelesai ? (
        <div className="flex items-center gap-3 rounded-kartu border border-sukses/30 bg-sukses-terang px-4 py-3">
          <Confetti size={30} weight="fill" className="shrink-0 text-sukses" aria-hidden />
          <p className="leading-snug">
            <span className="font-extrabold">Hebat, {profile.namaSamaran}!</span> Semua latihan hari ini selesai.
          </p>
        </div>
      ) : berikut ? (
        <BigLink to={urlLatihanProgram(berikut)} ikon={<Play weight="fill" aria-hidden />}>
          Mulai: {berikut.nama}
          {berikut.setSelesai > 0 && ` (set ${berikut.setSelesai + 1} dari ${berikut.set})`}
        </BigLink>
      ) : (
        <BigLink to={PATHS.afasia} ikon={<Play weight="fill" aria-hidden />}>
          Mulai: Latihan Bicara
        </BigLink>
      )}

      <BigLink to={PATHS.keluarga} varian="garis" ikon={<HandHeart weight="bold" aria-hidden />}>
        Untuk Keluarga
      </BigLink>
      <Link to={PATHS.latihan} className="self-center py-2 tipe-label text-primer underline underline-offset-4">
        Lihat semua latihan
      </Link>
    </section>
  );
}
