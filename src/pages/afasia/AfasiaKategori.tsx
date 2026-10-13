import { CaretRight, Hand, Microphone, ShieldCheck } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { useLiveQuery } from '@/data/useLiveQuery';
import { usePrefs } from '@/lib/prefs';
import { PATHS } from '@/router-paths';
import { setModeMandiriDipilih, useModeMandiriDipilih } from '@/features/speech/modeMandiri';
import { isSpeechRecognitionSupported } from '@/features/speech/recognizer';
import { muatRiwayatAfasia } from '@/features/speech/riwayat';
import { JUMLAH_KATA_SESI } from '@/features/speech/pilihKata';
import { KATEGORI, kataPerKategori } from '@/features/speech/wordBank';

export default function AfasiaKategori() {
  const { activePatientId } = usePrefs();
  const [didukung] = useState(isSpeechRecognitionSupported);
  const mandiriDipilih = useModeMandiriDipilih();
  const { data: riwayat } = useLiveQuery(() => muatRiwayatAfasia(activePatientId), [activePatientId]);
  const modeSuara = didukung && !mandiriDipilih;
  const jumlahUlang = riwayat?.kataUlang.length ?? 0;

  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <PageHeader judul="Latihan Bicara" sub="Sebutkan nama benda dan kata sehari-hari." />

      <Card nada={modeSuara ? 'primer' : 'putih'} className="flex gap-3">
        {modeSuara ? (
          <Microphone size={30} weight="fill" className="mt-0.5 shrink-0 text-primer" aria-hidden />
        ) : (
          <Hand size={30} weight="fill" className="mt-0.5 shrink-0 text-primer" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="text-[1.1rem] font-bold">{modeSuara ? 'Mode suara' : 'Mode latihan mandiri'}</p>
          <p className="text-teks-2">
            {modeSuara
              ? 'Aplikasi mendengarkan ucapan Anda dan langsung menilainya.'
              : didukung
                ? 'Ucapkan kata dengan keras, lalu Anda atau pendamping menekan Sudah Benar atau Ulangi.'
                : 'Browser ini belum bisa mengenali suara. Ucapkan kata dengan keras, lalu tekan Sudah Benar atau Ulangi.'}
          </p>
        </div>
      </Card>

      {didukung && (
        <button
          type="button"
          role="switch"
          aria-checked={mandiriDipilih}
          onClick={() => setModeMandiriDipilih(!mandiriDipilih)}
          className="mt-2 flex min-h-[56px] w-full items-center gap-3 rounded-kartu px-2 text-left hover:bg-primer-terang"
        >
          <span className="flex-1 font-semibold">Pakai Mode Mandiri (dinilai sendiri)</span>
          <span
            aria-hidden
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${mandiriDipilih ? 'bg-primer' : 'bg-garis'}`}
          >
            <span
              className={`absolute top-1 size-6 rounded-full bg-white shadow-tipis transition-transform ${mandiriDipilih ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </span>
          <span className="w-10 text-right font-bold text-teks-2">{mandiriDipilih ? 'Ya' : 'Tidak'}</span>
        </button>
      )}

      <h2 className="mt-5 mb-2 text-[1.15rem] font-bold">Atau pilih kategori</h2>
      <ul className="flex flex-col gap-2">
        {KATEGORI.map((kat) => {
          const daftar = kataPerKategori(kat.id);
          const lancar = riwayat ? daftar.filter((k) => riwayat.kataBenar.has(k.id)).length : 0;
          const persen = Math.round((lancar / daftar.length) * 100);
          return (
            <li key={kat.id}>
              <Link
                to={PATHS.afasiaLatihan(kat.id)}
                className="flex min-h-[72px] items-center gap-3 rounded-kartu border border-garis bg-white p-3 shadow-tipis hover:bg-primer-terang"
              >
                <span role="img" aria-hidden className="w-12 shrink-0 text-center text-[2.4rem] leading-none">
                  {kat.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.1rem] font-bold leading-tight">{kat.nama}</span>
                  <span className="block text-[0.95rem] text-teks-2">
                    {daftar.length} kata · {lancar} sudah lancar
                  </span>
                  <span
                    role="progressbar"
                    aria-label={`Kemajuan ${kat.nama}`}
                    aria-valuemin={0}
                    aria-valuemax={daftar.length}
                    aria-valuenow={lancar}
                    className="mt-1.5 block h-2 overflow-hidden rounded-full bg-primer-terang"
                  >
                    <span className="block h-full rounded-full bg-sukses" style={{ width: `${persen}%` }} />
                  </span>
                </span>
                <CaretRight size={26} weight="bold" className="shrink-0 text-primer" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 flex gap-2 text-[0.95rem] text-teks-2">
        <ShieldCheck size={22} weight="bold" className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Di Chrome, suara dikenali lewat layanan cloud penyedia browser. PULIHIN tidak menyimpan rekaman suara, hanya
          hasil teks di perangkat ini.{' '}
          <Link to={PATHS.tentang} className="font-semibold text-primer underline underline-offset-2">
            Selengkapnya
          </Link>
        </span>
      </p>

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-auto bg-latar/95 px-4 pt-4">
        {jumlahUlang > 0 && (
          <p className="mb-2 text-center text-[0.95rem] text-teks-2">
            Termasuk {Math.min(jumlahUlang, JUMLAH_KATA_SESI)} kata untuk diulang dari latihan terakhir.
          </p>
        )}
        <BigLink to={PATHS.afasiaLatihan()} ukuran="besar" ikon={<Microphone size={28} weight="fill" aria-hidden />}>
          Latihan Hari Ini ({JUMLAH_KATA_SESI} kata)
        </BigLink>
      </div>
    </section>
  );
}
