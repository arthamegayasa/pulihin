import { ArrowCounterClockwise, CheckCircle, CircleHalf, Clock, House, Microphone, Sparkle } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { NonDiagnosisNote } from '@/components/NonDiagnosisNote';
import { PageHeader } from '@/components/PageHeader';
import { IkonBingkai, Ilustrasi, JudulBagian, KartuStat, Kerangka, KerangkaGrup, KerangkaKartu, Lencana } from '@/components/premium';
import { getSession } from '@/data/db';
import { useLiveQuery } from '@/data/useLiveQuery';
import { formatDurasi, formatTanggalPanjang } from '@/lib/date';
import { usePrefs } from '@/lib/prefs';
import { labelSkor } from '@/lib/score';
import { speak } from '@/lib/speak';
import { berandaUntukPeran, PATHS } from '@/router-paths';
import { GambarKata } from '@/features/speech/GambarKata';
import { pesanHangatAfasia } from '@/features/speech/pesanAfasia';
import type { Kata } from '@/features/speech/types';
import { getKata, getKategori } from '@/features/speech/wordBank';

export default function AfasiaRingkasan() {
  const { sessionId = '' } = useParams();
  const { role } = usePrefs();
  const { data: sesi, loading } = useLiveQuery(() => getSession(sessionId), [sessionId]);
  const sudahBicara = useRef(false);

  const ringkasan = sesi?.jenis === 'afasia' ? sesi.ringkasanAfasia : null;
  const pesan = sesi ? pesanHangatAfasia(sesi.skor) : '';

  useEffect(() => {
    if (!sesi || !ringkasan || sudahBicara.current) return;
    sudahBicara.current = true;
    speak(`Latihan bicara selesai. ${ringkasan.benar} kata benar. ${pesan}`);
  }, [sesi, ringkasan, pesan]);

  if (loading && !sesi) {
    return (
      <section>
        <PageHeader judul="Hasil Latihan Bicara" kembali={PATHS.afasia} />
        <KerangkaGrup label="Memuat hasil…" className="flex flex-col gap-3">
          <Kerangka bentuk="kotak" className="h-[12rem]" />
          <Kerangka bentuk="kotak" className="h-[6rem]" />
          <KerangkaKartu baris={2} />
        </KerangkaGrup>
      </section>
    );
  }

  if (!sesi || !ringkasan) {
    return (
      <section>
        <PageHeader judul="Hasil Latihan Bicara" kembali={PATHS.afasia} />
        <Card nada="peringatan">Hasil latihan ini tidak ditemukan di perangkat.</Card>
        <div className="mt-4">
          <BigLink to={PATHS.afasia} ikon={<Microphone weight="fill" aria-hidden />}>
            Ke Latihan Bicara
          </BigLink>
        </div>
      </section>
    );
  }

  const kataUlang = ringkasan.kataUlang.map((id) => getKata(id)).filter((k): k is Kata => k !== undefined);
  const namaSesi = sesi.kategoriKata ? (getKategori(sesi.kategoriKata)?.nama ?? 'Latihan Bicara') : 'Latihan Hari Ini';
  const jumlahKata = ringkasan.benar + ringkasan.hampir + ringkasan.belum;

  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <PageHeader
        judul="Hasil Latihan Bicara"
        sub={`${namaSesi} · ${formatTanggalPanjang(sesi.tanggal)}`}
        kembali={PATHS.afasia}
      />

      {/* Skor sorotan: angka di kiri, ilustrasi selebrasi di kanan (disembunyikan bila gagal dimuat). */}
      <div className="flex items-center gap-2 overflow-hidden rounded-kartu border border-primer-garis/70 bg-ilustrasi p-4 pr-0 shadow-sedang">
        <div className="min-w-0 flex-1">
          <p className="tipe-label text-primer">Skor latihan</p>
          <p className="tabular text-[4.25rem] leading-none font-extrabold tracking-[-0.03em] text-primer">{sesi.skor}</p>
          <p className="mt-1 tipe-subjudul text-teks">{labelSkor(sesi.skor)}</p>
          <Lencana nada="netral" ikon={<Clock weight="bold" />} className="mt-2">
            <span className="sr-only">Durasi </span>
            {formatDurasi(sesi.durasiDetik)}
          </Lencana>
        </div>
        <Ilustrasi
          jenis="momen"
          nama="selebrasi"
          prioritas
          bilaGagal="sembunyi"
          className="-my-4 block w-[min(46%,11rem)] shrink-0 self-end"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <KartuStat
          className="col-span-2"
          nada="sukses"
          label="Benar"
          nilai={ringkasan.benar}
          satuan={`dari ${jumlahKata} kata`}
          ikon={<CheckCircle weight="fill" />}
        />
        <KartuStat nada="aksen" label="Hampir" nilai={ringkasan.hampir} satuan="kata" ikon={<CircleHalf weight="fill" />} />
        <KartuStat label="Belum" nilai={ringkasan.belum} satuan="kata" ikon={<ArrowCounterClockwise weight="bold" />} />
      </div>

      <section aria-labelledby="judul-ulang" className="mt-5">
        <JudulBagian
          id="judul-ulang"
          judul="Kata untuk diulang besok"
          sub={kataUlang.length > 0 ? 'Akan muncul lagi di Latihan Hari Ini.' : undefined}
        />
        {kataUlang.length === 0 ? (
          <p className="flex items-center gap-2 rounded-kartu border border-garis-halus bg-permukaan p-4 font-semibold shadow-tipis">
            <CheckCircle size={24} weight="fill" className="shrink-0 text-sukses" aria-hidden />
            Semua kata sudah lancar hari ini.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {kataUlang.map((k) => (
              <li
                key={k.id}
                className="flex items-center gap-2.5 rounded-kontrol border border-garis-halus bg-permukaan py-1.5 pr-3.5 pl-1.5 shadow-tipis"
              >
                <GambarKata kata={k} ukuran="2.75rem" className="rounded-kecil" />
                <span lang="id" className="text-[1.15rem] font-bold">
                  {k.kata}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card nada="aksen" className="mt-5 flex items-start gap-3">
        <IkonBingkai nada="putih">
          <Sparkle weight="fill" className="text-aksen" />
        </IkonBingkai>
        <div className="min-w-0">
          <p className="tipe-subjudul text-teks">{pesan}</p>
          {sesi.saran && <p className="mt-1 text-teks">{sesi.saran}</p>}
        </div>
      </Card>

      <NonDiagnosisNote className="mt-4" />

      <div className="safe-bottom mt-auto flex flex-col gap-2 pt-5">
        <BigLink to={berandaUntukPeran(role)} ukuran="besar" ikon={<House weight="bold" aria-hidden />}>
          Kembali ke Beranda
        </BigLink>
        <BigLink to={PATHS.afasia} varian="garis" ikon={<Microphone weight="fill" aria-hidden />}>
          Latihan Lagi
        </BigLink>
      </div>
    </section>
  );
}
