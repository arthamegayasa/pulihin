import { CaretRight, Hand, Microphone, ShieldCheck } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { PageHeader } from '@/components/PageHeader';
import { Toggle } from '@/components/Toggle';
import { IkonBingkai, Ilustrasi, JudulBagian, KartuHero } from '@/components/premium';
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
      <PageHeader judul="Latihan Bicara" />

      <KartuHero
        ilustrasi={{ jenis: 'momen', nama: 'bicara' }}
        judul="Sebut nama benda"
        sub="Lihat gambarnya, lalu ucapkan namanya."
        potong={{ samping: { x: 455, y: 90, w: 505, h: 330 }, tumpuk: { x: 455, y: 95, w: 505, h: 230 } }}
      />

      {/* Mode penilaian yang sedang berlaku + sakelarnya dalam satu kartu agar hubungannya jelas. */}
      <div className="mt-3 rounded-kartu border border-garis-halus bg-permukaan p-3 shadow-tipis">
        <div className="flex items-start gap-3 px-1 pt-1">
          <IkonBingkai nada={modeSuara ? 'primer' : 'aksen'}>
            {modeSuara ? <Microphone weight="fill" /> : <Hand weight="fill" />}
          </IkonBingkai>
          <p className="min-w-0 tipe-keterangan text-teks-2">
            <span className="block tipe-isi font-bold text-teks">{modeSuara ? 'Mode Suara' : 'Mode Latihan Mandiri'}</span>
            {modeSuara
              ? 'Aplikasi mendengarkan dan langsung menilai: Benar, Hampir, atau Coba Lagi.'
              : didukung
                ? 'Ucapkan kata dengan keras, lalu Anda atau pendamping menekan Sudah Benar atau Ulangi.'
                : 'Browser ini belum bisa mengenali suara. Ucapkan kata dengan keras, lalu tekan Sudah Benar atau Ulangi.'}
          </p>
        </div>
        {didukung && (
          <div className="mt-2 border-t border-garis-halus pt-1">
            <Toggle
              label="Pakai Mode Latihan Mandiri"
              keterangan="Tanpa pengenalan suara."
              aktif={mandiriDipilih}
              onUbah={setModeMandiriDipilih}
            />
          </div>
        )}
      </div>

      <section aria-labelledby="judul-kategori" className="mt-6">
        <JudulBagian id="judul-kategori" judul="Atau pilih kategori" sub={`${JUMLAH_KATA_SESI} kata per latihan`} />
        <ul className="flex flex-col gap-2.5">
          {KATEGORI.map((kat) => {
            const daftar = kataPerKategori(kat.id);
            const lancar = riwayat ? daftar.filter((k) => riwayat.kataBenar.has(k.id)).length : 0;
            return (
              <li key={kat.id}>
                <Link
                  to={PATHS.afasiaLatihan(kat.id)}
                  className="flex min-h-[88px] items-center gap-3 rounded-kartu border border-garis-halus bg-permukaan p-2.5 pr-3 shadow-tipis transition-colors hover:bg-primer-terang active:bg-primer-terang"
                >
                  <Ilustrasi
                    jenis="kategori"
                    nama={kat.id}
                    className="block size-[72px] shrink-0 rounded-kontrol"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block tipe-isi leading-tight font-bold">{kat.nama}</span>
                    <span className="mt-0.5 block tipe-keterangan text-teks-2">
                      <span className="tabular">{lancar}</span> dari <span className="tabular">{daftar.length}</span> kata lancar
                    </span>
                    <span
                      role="progressbar"
                      aria-label={`Kemajuan ${kat.nama}`}
                      aria-valuemin={0}
                      aria-valuemax={daftar.length}
                      aria-valuenow={lancar}
                      className="mt-1.5 block h-2 overflow-hidden rounded-full bg-cekung"
                    >
                      <span
                        className="block h-full rounded-full bg-sukses"
                        style={{ width: `${Math.round((lancar / daftar.length) * 100)}%` }}
                      />
                    </span>
                  </span>
                  <CaretRight size={24} weight="bold" className="shrink-0 text-primer" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-5 flex gap-2 tipe-keterangan text-teks-2">
        <ShieldCheck size={22} weight="bold" className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Di Chrome, suara dikenali lewat layanan cloud penyedia browser. PULIHIN tidak menyimpan rekaman suara, hanya
          hasil teks di perangkat ini.{' '}
          <Link to={PATHS.tentang} className="font-semibold text-primer underline underline-offset-2">
            Selengkapnya
          </Link>
        </span>
      </p>

      <div className="safe-bottom sticky bottom-0 -mx-4 mt-auto border-t border-garis-halus bg-latar px-4 pt-3 shadow-[0_-6px_16px_-10px_rgb(11_79_74/0.25)]">
        {jumlahUlang > 0 && (
          <p className="mb-2 text-center tipe-keterangan text-teks-2">
            Termasuk {Math.min(jumlahUlang, JUMLAH_KATA_SESI)} kata untuk diulang dari latihan terakhir.
          </p>
        )}
        <BigLink to={PATHS.afasiaLatihan()} ukuran="besar" ikon={<Microphone weight="fill" aria-hidden />}>
          Latihan Bicara Hari Ini ({JUMLAH_KATA_SESI} kata)
        </BigLink>
      </div>
    </section>
  );
}
