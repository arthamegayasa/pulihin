import { ArrowCounterClockwise, CheckCircle, CircleHalf, House, Microphone, Sparkle } from '@phosphor-icons/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { NonDiagnosisNote } from '@/components/NonDiagnosisNote';
import { PageHeader } from '@/components/PageHeader';
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

function Hitungan({ ikon, angka, label, nada }: { ikon: ReactNode; angka: number; label: string; nada: 'sukses' | 'peringatan' | 'putih' }) {
  return (
    <Card nada={nada} className="flex flex-col items-center gap-1 px-2 py-3 text-center">
      {ikon}
      <span className="tabular text-[2rem] font-extrabold leading-none">{angka}</span>
      <span className="font-semibold">{label}</span>
    </Card>
  );
}

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
        <p className="text-teks-2" aria-live="polite">
          Memuat hasil…
        </p>
      </section>
    );
  }

  if (!sesi || !ringkasan) {
    return (
      <section>
        <PageHeader judul="Hasil Latihan Bicara" kembali={PATHS.afasia} />
        <Card nada="peringatan">Hasil latihan ini tidak ditemukan di perangkat.</Card>
        <div className="mt-4">
          <BigLink to={PATHS.afasia} ikon={<Microphone size={26} weight="fill" aria-hidden />}>
            Ke Latihan Bicara
          </BigLink>
        </div>
      </section>
    );
  }

  const kataUlang = ringkasan.kataUlang.map((id) => getKata(id)).filter((k): k is Kata => k !== undefined);
  const namaSesi = sesi.kategoriKata ? (getKategori(sesi.kategoriKata)?.nama ?? 'Latihan Bicara') : 'Latihan Hari Ini';

  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <PageHeader
        judul="Hasil Latihan Bicara"
        sub={`${namaSesi} · ${formatTanggalPanjang(sesi.tanggal)}`}
        kembali={PATHS.afasia}
      />

      <Card nada="primer" className="text-center">
        <p className="font-semibold text-teks-2">Skor latihan bicara</p>
        <p className="tabular text-[4.5rem] font-extrabold leading-none text-primer">{sesi.skor}</p>
        <p className="mt-1 text-[1.3rem] font-bold">{labelSkor(sesi.skor)}</p>
        <p className="mt-1 text-[0.95rem] text-teks-2">Durasi {formatDurasi(sesi.durasiDetik)}</p>
      </Card>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Hitungan
          nada="sukses"
          angka={ringkasan.benar}
          label="Benar"
          ikon={<CheckCircle size={30} weight="fill" className="text-sukses" aria-hidden />}
        />
        <Hitungan
          nada="peringatan"
          angka={ringkasan.hampir}
          label="Hampir"
          ikon={<CircleHalf size={30} weight="fill" className="text-peringatan" aria-hidden />}
        />
        <Hitungan
          nada="putih"
          angka={ringkasan.belum}
          label="Belum"
          ikon={<ArrowCounterClockwise size={30} weight="bold" className="text-teks-2" aria-hidden />}
        />
      </div>

      <Card className="mt-3">
        <h2 className="text-[1.15rem] font-bold">Kata untuk diulang besok</h2>
        {kataUlang.length === 0 ? (
          <p className="mt-1 text-teks-2">Semua kata sudah lancar hari ini.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {kataUlang.map((k) => (
              <li key={k.id} className="flex items-center gap-2 rounded-xl bg-primer-terang py-1.5 pr-3 pl-1.5">
                <GambarKata kata={k} ukuran="2.2rem" />
                <span className="text-[1.15rem] font-bold">{k.kata}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card nada="aksen" className="mt-3 flex gap-3">
        <Sparkle size={30} weight="fill" className="mt-0.5 shrink-0 text-aksen" aria-hidden />
        <div>
          <p className="text-[1.1rem] font-bold">{pesan}</p>
          {sesi.saran && <p className="mt-1">{sesi.saran}</p>}
        </div>
      </Card>

      <NonDiagnosisNote className="mt-3" />

      <div className="safe-bottom mt-auto flex flex-col gap-2 pt-4">
        <BigLink to={berandaUntukPeran(role)} ukuran="besar" ikon={<House size={28} weight="bold" aria-hidden />}>
          Kembali ke Beranda
        </BigLink>
        <BigLink to={PATHS.afasia} varian="garis" ikon={<Microphone size={26} weight="fill" aria-hidden />}>
          Latihan Lagi
        </BigLink>
      </div>
    </section>
  );
}
